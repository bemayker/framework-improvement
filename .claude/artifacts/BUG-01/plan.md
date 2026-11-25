# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). **Its reproduction only runs on the deployed environment**: locally there is no edge cache, so the bug cannot be seen. It exercises the `to_verify` route (merged, awaiting verification on the deployed environment).
>
> ## Defect
>
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> ## Reproduction (deployed only)
>
> 1. `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`
> 2. Expected: two different `now` values. Actual: identical values.
>
> Locally both calls differ, because nothing caches them.
>
> ## Acceptance criteria
>
> 1. `GET /api/time` responses carry `Cache-Control: no-store`.
> 2. A test asserts the header on the response.
> 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
>
> ## Notes
>
> Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete.
>
> Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Plan Overview
Backend only. The item names `backend/app/routers/server_time.py` as the file to fix, but **that file does not exist on `main` at plan base `6bdffa31`**: `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, and `backend/app/main.py` registers only the version, notes and health routers. FEAT-1 is `complete` in the tracker, but its code is absent after the sandbox reset (the feature map's BUG-01 row says the same; verified here against the tree and `git log -- backend/app/routers/server_time.py`, whose last commits are resets). So `GET /api/time` currently returns 404, and there is no route to add a header to.

Assumption (recorded instead of blocking, per `user_story_alignment.md` Section 4): this item recreates FEAT-1's `GET /api/time` endpoint exactly to FEAT-1's own contract (`{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema in `backend/app/schemas/`), registers it in `backend/app/main.py`, and sets `Cache-Control: no-store` on its response. Recreating the endpoint is the precondition for criterion 1, not gold plating; nothing beyond FEAT-1's contract plus the header is added (no other route gets the header, no global middleware, no `Pragma` or `Expires` headers).

Layering follows the project's canonical modules (router, service, schema; `.claude/project-standards.md` Layout and Canonical modules): the router sets the header and builds the response, the service supplies the current UTC instant, the schema defines the body.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time, with response header `Cache-Control: no-store`. Router `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, same shape as `backend/app/routers/version.py`. The handler takes FastAPI's injected `Response` parameter and sets `response.headers["Cache-Control"] = CACHE_CONTROL_NO_STORE`, where `CACHE_CONTROL_NO_STORE = "no-store"` is a module constant (one value, one source; the tests import it rather than restating the literal). Returns `ServerTimeResponse(now=get_server_time(), timezone="UTC")` with `response_model=ServerTimeResponse`.
- Service layer: `backend/app/services/server_time_service.py`, `get_server_time() -> datetime` returning `datetime.now(UTC)` (timezone-aware, offset `+00:00`). Called inside the handler on every request, never at import or startup, which is what makes `now` per request. The call goes through a module-level name the tests can monkeypatch (for example `datetime.now` reached through the module, or a module-level `_utc_now` helper) so the freshness tests control the clock without sleeping.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` and `timezone: Literal["UTC"]`. `AwareDatetime` makes a naive datetime a validation error, so "never naive" is enforced by the type, not by a hand check. Serialised by Pydantic as ISO 8601 with an explicit offset (a UTC value serialises with `Z`; both `Z` and `+00:00` are explicit offsets under ISO 8601, and the tests parse the value rather than compare a string suffix).
- App factory: `backend/app/main.py` imports `router as server_time_router` from `app.routers.server_time` and adds `app.include_router(server_time_router)` after the existing three; the module docstring gains one sentence naming FEAT-1/BUG-01's server-time router. Nothing else in the factory changes (CORS `allow_methods` already includes `GET`).
- Repository layer: none, the endpoint reads no data.
- Migrations: none.
- Documentation convention (`.claude/project-standards.md`): each new Python module carries a module docstring naming the work item (`BUG-01`, recreating FEAT-1's endpoint); public functions and classes carry one-line docstrings saying why; the `docstrings` gate row (`ruff --select D101,D102,D103`) applies.

## Frontend Plan
No frontend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-25T08:32:05.123456Z", "timezone": "UTC"}
```

- Other methods on `/api/time` answer 405 (FastAPI default, no code).

## Technology Selection
- `Cache-Control: no-store` on the response: chose FastAPI's injected `Response` parameter (an installed dependency, rung 3) over a custom middleware or a `JSONResponse` built by hand, because the header is scoped to this one route and the injected parameter keeps `response_model` serialisation intact.
- UTC timestamp: chose the standard library's `datetime.now(UTC)` (rung 1) over any date library; no dependency is added.
- "Never naive" guarantee: chose Pydantic's built-in `AwareDatetime` field type (installed dependency, rung 3) over a hand-written validator.
- `timezone` field: chose `typing.Literal["UTC"]` (standard library, rung 1) over a free string plus a check.
- No new dependency, so no lockfile change.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router, sets `Cache-Control: no-store`, exports `CACHE_CONTROL_NO_STORE`
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` with `now: AwareDatetime` and `timezone: Literal["UTC"]`
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning the current timezone-aware UTC instant, per call
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service and the schema (UTC-aware value, per-call value, naive datetime rejected)
- [B] backend/tests/integration/test_server_time_integration.py: router tests through the app's own test client (header, body shape and offset, per-request freshness, 405)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import and register `server_time_router`; one docstring sentence
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is a custom route

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. No E2E spec: no criterion needs navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: service and schema, in isolation, no app and no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_server_time_service_unit.py`
  - `test_get_server_time_returns_utc_aware_datetime` (happy path): `tzinfo` is set and `utcoffset()` is zero.
  - `test_get_server_time_returns_a_new_value_per_call` (edge case): with the module's clock patched to yield two different instants, two calls return those two instants, so nothing is memoised.
  - `test_server_time_response_rejects_naive_datetime` (error case): constructing `ServerTimeResponse` with a naive datetime raises `pydantic.ValidationError`.
  - In `backend/tests/unit/test_main_unit.py`: `test_create_app_registers_server_time_route`, same shape as the existing `test_create_app_registers_health_route`.
- Integration tests: the router through the real HTTP request/response cycle, using the session `client` fixture from `backend/tests/conftest.py` (the endpoint needs no database; the app lifespan already skips schema setup when `DATABASE_URL` is unset).
  - Directory: backend/tests/integration/
  - `test_get_server_time_sets_cache_control_no_store`: `response.headers["cache-control"] == CACHE_CONTROL_NO_STORE`, the constant imported from the router (asserts the wiring, not a literal).
  - `test_get_server_time_returns_200_with_utc_now_and_timezone`: 200, `timezone == "UTC"`, `datetime.fromisoformat(now)` is aware with zero offset.
  - `test_get_server_time_returns_fresh_now_per_request`: patch the service clock to yield two distinct instants, make two requests, assert the two bodies carry the two different `now` values and both carry the header. This is the local, deterministic form of the item's reproduction (no edge cache exists locally, so the header is what keeps a cache from collapsing the two values).
  - `test_post_server_time_returns_405_method_not_allowed` (error case).
- E2E tests: none. Enabled per CLAUDE.md, but warranted for no criterion: the endpoint has no UI and no criterion involves navigation or interaction (`testing_standards.md` Section 6, asked per criterion).
  - Directory: e2e/tests/ (no file for this item)
  - File: none
- UAT scenarios: one scenario per criterion plus one edge case (another method on `/api/time` answers 405), written as API-level Given/When/Then since the feature has no UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_server_time_sets_cache_control_no_store`, `test_get_server_time_returns_fresh_now_per_request` | verifying it needs no navigation or interaction: it is a response header of a router, read through the app's test client |
| 2 | A test asserts the header on the response | Integration | `test_get_server_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: the criterion is the existence of a router-level test asserting the header |
| 3 | After deploy, the reproduction returns two different values (verified by a human on the deployed environment) | Integration | `test_get_server_time_returns_fresh_now_per_request`, `test_get_server_time_returns_200_with_utc_now_and_timezone` | verifying it needs no navigation or interaction: locally it is per-request computation plus the no-store header on both responses; the deployed half is a human curl check against the CDN (Manual verification plan, criterion 3), which no local tier can reach |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response status is 200 and the Cache-Control header is no-store |
| 2 | A test asserts the header on the response | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the run passes with the header test included |
| 3 | After deploy, the reproduction returns two different values | covered at Integration locally; deployed half is manual, see Criterion coverage | Given the fix is deployed behind the CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally on port 8000 (for example `uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this endpoint.
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the response headers of the same output → a line `cache-control: no-store` is present.
3. Read the body of the same output → it is JSON with a `now` value ending in `Z` or `+00:00` and `"timezone":"UTC"`.
4. Run `curl -si -X POST http://localhost:8000/api/time` → the status line reads `405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository root checked out on the fix branch, `uv` installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → `test_get_server_time_sets_cache_control_no_store` asserts the `cache-control` response header against `CACHE_CONTROL_NO_STORE` imported from `app.routers.server_time`.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion cannot be verified locally (there is no edge cache locally; both calls already differ before the fix). It is verified by a human on the deployed environment after the merge; `docs/DEVELOPMENT.md` → Test environments has no row yet, so the deployed host is the one the item refers to.
Prerequisites: the fix is merged and deployed; you know the deployed API host (written `<deployed-host>` below).
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header (the CDN may add its own headers such as `age` or `x-cache`; an `x-cache: HIT` here means the CDN still caches and the check fails).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ by about one second.
3. If the values are identical, record the full headers of both responses in the verification note and leave the `mayker:to-verify` label in place; if they differ, the item is verified and the label can be removed.
