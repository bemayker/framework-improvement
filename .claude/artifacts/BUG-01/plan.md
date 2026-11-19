# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). **Its reproduction only runs on the deployed environment**: locally there is no edge cache, so the bug cannot be seen. It exercises the `to_verify` route (merged, awaiting verification on the deployed environment).
>
> **Defect.** On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> **Reproduction (deployed only).** 1. `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` 2. Expected: two different `now` values. Actual: identical values. Locally both calls differ, because nothing caches them.
>
> **Notes.** Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.
>
> (ClickUp task 123k99cwybn, defect item, tracker tag `mayker:to-verify`.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): none actionable. 0 actionable tracker comments, 52 bot notes dropped (run deliver-20261119T010710Z, recorded in `.claude/artifacts/BUG-01/decisions.md`). No PR comments: first plan of this run, no plan PR in autonomous mode.
- Merged since the last plan: n/a (fresh plan, plan base 2bf4ad079d19db0e416fa4aff46788ac52b5661c equals origin/main; no `[merged-since]` lines in the dispatch).
- Assumption (dependency code absent, verified on the tree, not assumed): on main at 2bf4ad07 there is no `GET /api/time` route. `backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py` and `backend/app/services/server_time_service.py` do not exist (`git ls-files backend` lists none; a grep of `backend/` and `frontend/src/` for `server_time`, `/time`, `Cache-Control` and `no-store` finds nothing), and `backend/app/main.py` registers only the version, notes and health routers. `git log -- backend/app/routers/server_time.py` shows the file was last removed by the sandbox reset 2bf4ad07 (#915), after BUG-01's previous fix dd171eb8 (#909). FEAT-1 is `complete` in the tracker, but its code is not on main. → Addressed by: this plan recreates FEAT-1's server-time slice (schema, service, router, registration in `main.py`) to FEAT-1's own acceptance criteria (read from ClickUp task 123k99ctzxk: 200 with `now` and `timezone`, `now` per request, aware UTC with an explicit offset, Pydantic schema in `backend/app/schemas/`), with the `no-store` directive this item asks for. This is the smallest change that can satisfy criterion 1: a header cannot be set on a route that does not exist. Nothing beyond FEAT-1's criteria and this item's is added.
- Assumption (`main.py`): this item genuinely edits `backend/app/main.py`, to import and `include_router` the recreated server-time router. TEST-09 (planned in parallel) may also edit `main.py`; the two builds must be serialized (see `shared_risks.md`).

## Plan Overview
Backend only. Recreate the `GET /api/time` endpoint that FEAT-1 delivered and the sandbox reset removed, following the existing version slice's layering (router, service, schema), and make the router set `Cache-Control: no-store` on every response so an edge cache in front of the API never stores it. Register the router in the app factory. Unit tests cover the service (aware UTC, zero offset, per-call freshness) and the schema (rejects a naive datetime); integration tests drive the real HTTP cycle through the app's TestClient and assert the header, the body shape and per-request freshness. No database, no frontend, no new dependency. Criterion 3 is a human check on the deployed environment after merge; locally its closest observable proxy (two requests return different `now`) is an integration test.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, with the response header `Cache-Control: no-store`. Router at `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time_endpoint(response: Response) -> ServerTimeResponse` that sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=get_server_time(), timezone="UTC")`, declared with `response_model=ServerTimeResponse`. The header is set in this router only, not as app-wide middleware: the item scopes the fix to this route, and BUG-06 separately owns the health route's header.
- Service layer: `backend/app/services/server_time_service.py`. `utc_now() -> datetime` returns `datetime.now(timezone.utc)` (the one clock seam); `get_server_time() -> datetime` returns `utc_now()`, looked up through the module's globals at call time so a test can replace the clock with `monkeypatch.setattr(server_time_service, "utc_now", ...)`. A module docstring naming FEAT-1 (recreated by BUG-01), one-line function docstrings (project standards: docstring rule on).
- Schema: `backend/app/schemas/server_time.py`. `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic rejects a naive datetime, which enforces FEAT-1's never-naive rule at the boundary) and `timezone: Literal["UTC"]`, plus a `field_serializer("now")` returning `value.isoformat()`, so the wire form carries the explicit `+00:00` offset rather than Pydantic's `Z`.
- App factory: `backend/app/main.py` imports `router as server_time_router` from `app.routers.server_time` and adds `app.include_router(server_time_router)` after the existing three; module docstring gains one clause naming the server-time router. No change to the CORS middleware (GET is already allowed).
- Repository layer: none, the endpoint touches no data.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-19T01:23:45.678901+00:00", "timezone": "UTC"}
```

- Any other method on `/api/time` returns 405 (FastAPI default), unchanged by this item.

## Technology Selection
- Current UTC time (`utc_now`): chose the standard library's `datetime.now(timezone.utc)` over adding a time library (no installed or new dependency needed; the stdlib returns an aware UTC datetime directly).
- Cache directive: chose FastAPI's injected `Response` parameter (`response.headers["Cache-Control"] = "no-store"`, a feature of the installed framework) over a custom middleware or a caching library, because one route needs one static header and the framework merges it into the response with a single line.
- Never-naive guarantee: chose Pydantic's `AwareDatetime` field type (installed with FastAPI) over a hand-written validator, because the installed library already rejects a naive datetime.
- Explicit `+00:00` offset on the wire: chose the stdlib `datetime.isoformat()` inside a Pydantic `field_serializer` over a custom JSON encoder, because Pydantic's default serializes UTC as `Z` and `isoformat()` gives the explicit offset in one call.
- Router, service and schema modules: no stdlib call, native platform feature or installed dependency provides a project endpoint, so they are built here, following the canonical version slice.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime` serialized with an explicit offset, `timezone: Literal["UTC"]`).
- [B] backend/app/services/server_time_service.py: `utc_now()` clock seam and `get_server_time()`, aware UTC computed per call.
- [B] backend/app/routers/server_time.py: `GET /api/time` router that sets `Cache-Control: no-store` and returns `ServerTimeResponse`.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC, zero offset, per-call freshness via a replaced clock) and for the schema (rejects a naive datetime, serializes `+00:00`).
- [B] backend/tests/integration/test_server_time_integration.py: integration tests through the app's TestClient: header, body shape, per-request freshness, 405 on POST.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the server-time router and register it with `app.include_router`; module docstring names it.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is a custom route.

No lockfile changes: this item adds and changes no dependency (stdlib, FastAPI and Pydantic are already installed), so `backend/pyproject.toml` and `backend/uv.lock` are untouched.
No README.md or docs/DEVELOPMENT.md change: the item adds one endpoint inside the existing backend layout and changes no project structure, run configuration, dependency or test infrastructure.
No E2E spec: no acceptance criterion needs navigation or interaction through a UI (the item has none).

## Testing Strategy
- Unit tests: `backend/app/services/server_time_service.py` and `backend/app/schemas/server_time.py`. Cases: `test_get_server_time_returns_timezone_aware_utc` (happy path: tzinfo set, `utcoffset()` is zero), `test_get_server_time_is_computed_per_call` (edge case: replace `utc_now` with a clock yielding two different instants via `monkeypatch.setattr`, two calls return the two instants), `test_server_time_response_rejects_naive_datetime` (error case: `ServerTimeResponse(now=datetime(2026, 11, 19, 1, 0), timezone="UTC")` raises `ValidationError`), `test_server_time_response_serializes_explicit_utc_offset` (`model_dump(mode="json")["now"]` ends with `+00:00`). Plus `test_create_app_registers_time_route` in the existing app-factory unit file.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_service_unit.py`; `test_main_unit.py` extended)
- Integration tests: `GET /api/time` through the session `client` fixture from `backend/tests/conftest.py` (no database needed; the app's lifespan only warns when `DATABASE_URL` is unset). Cases: `test_get_time_sets_cache_control_no_store` (the response's `cache-control` header equals exactly `no-store`), `test_get_time_returns_200_with_utc_now_and_timezone` (status 200, keys exactly `now` and `timezone`, `timezone == "UTC"`, `datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)` and the string ends with `+00:00`), `test_get_time_now_is_computed_per_request` (replace `server_time_service.utc_now` with a clock yielding two different instants, two GETs return two different `now` values: the local form of the item's reproduction, with the header test as its cause), `test_post_time_returns_405_method_not_allowed` (the endpoint's only reachable error case).
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (`test_server_time_integration.py`)
- E2E tests: not warranted. The item is backend only and no criterion requires navigation or interaction through the UI (`testing_standards.md` Section 6, asked per criterion below). E2E is ENABLED in CLAUDE.md; this item simply has no criterion at that tier.
  - Directory: e2e/tests/
  - File: none for this item (would be `BUG-01_server_time_edge_cache.spec.ts`)
- UAT scenarios: one scenario per criterion plus one edge case (a POST returns 405 and is not a server-time response), using HTTP steps against the running backend, without duplicating the integration assertions' internals.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | `test_get_time_sets_cache_control_no_store`, `test_get_time_returns_200_with_utc_now_and_timezone` | Verifying it needs no navigation or interaction: it is a response header of a router endpoint, read off the real HTTP cycle. |
| 2 | A test asserts the header on the response. | Integration | `test_get_time_sets_cache_control_no_store` | Verifying it needs no navigation or interaction: the criterion is satisfied by the router integration test that asserts the header on the HTTP response. |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration | `test_get_time_now_is_computed_per_request`, `test_get_server_time_is_computed_per_call` | Verifying it needs no navigation or interaction: it is an HTTP call on the deployed host. The edge cache exists only there, so the deployed check is the human step in the Manual verification plan; locally the tests cover per-request freshness and criterion 1's header covers the cause. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the response status is 200 And the Cache-Control header is no-store |
| 2 | A test asserts the header on the response. | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the run passes with no failed or errored test |
| 3 | After deploy, the reproduction above returns two different values. | covered at Integration, see Criterion coverage; deployed check is manual | Given the fix is deployed behind the edge cache, When a client calls GET /api/time twice a second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`.
Prerequisites: the stack is up with `docker compose up -d` from the repository root on the BUG-01 branch, and the backend answers on `http://localhost:8010` (no database row or seed data is needed). This criterion has no UI: it is a response header, read with curl.
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK`.
2. In the same output, read the headers → a line `cache-control: no-store` is present (header names may print lower-case).
3. In the same output, read the body → JSON of the form `{"now":"2026-11-19T01:23:45.678901+00:00","timezone":"UTC"}`: `now` ends with `+00:00` and `timezone` is `UTC`.
4. Run `curl -si -X POST http://localhost:8010/api/time` → the first line reads `HTTP/1.1 405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response.
Prerequisites: a checkout of the BUG-01 branch with `uv` installed; no database is needed for these two files.
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_sets_cache_control_no_store` → it sends `GET /api/time` and asserts the response's `cache-control` header equals `no-store`.

### Criterion 3: After deploy, the reproduction above returns two different values.
Prerequisites: the merged fix is deployed to the deployed environment behind its edge cache (no row exists yet in `docs/DEVELOPMENT.md` → Test environments, so use the deployed host the item refers to as `<deployed-host>`). This cannot be verified locally, because nothing caches the response there.
1. Run `curl -si https://<deployed-host>/api/time` → status 200, and a `cache-control: no-store` header is present (the edge has not replaced it).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies print, and their `now` values differ by about one second (for example `...T01:23:45.1+00:00` then `...T01:23:46.1+00:00`). Identical values mean the edge still caches the response and the item is not verified.
3. If the edge exposes a cache status header (for example `cf-cache-status`, `x-cache` or `age`), read it on the response from step 1 → it does not report a cache hit, and `age` is absent or `0`.
4. Only after steps 1 to 3 hold, remove the `mayker:to-verify` label so the item can move from To verify to Done.
