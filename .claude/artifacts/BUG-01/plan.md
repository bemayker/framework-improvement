# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> Reproduction (deployed only): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`. Expected: two different `now` values. Actual: identical values. Locally both calls differ, because nothing caches them.
>
> Notes: Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.
>
> (ClickUp task 123k99cwybn, tag `mayker:to-verify`.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 15 comments read on the item, all framework PR notices from earlier runs → Addressed by: not acted on because none states a requirement or a correction; none overrides the description.
- Assumption (dependency state): FEAT-1 is `complete` in the tracker, but `GET /api/time` does not exist on main at plan base 379b0a5. Verified in the repo: `backend/app/main.py` registers only the version, notes and health routers, no `server_time` file exists under `backend/app/routers/` or `backend/app/schemas/`, and the last commit touching `backend/app/routers/server_time.py` is the sandbox reset 379b0a5, which removed it. Criterion 1 cannot hold for an endpoint that does not exist, so this plan recreates the FEAT-1 slice (router, Pydantic schema, registration in `main.py`) to FEAT-1's own contract (tracker task 123k99ctzxk: 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, schema in `backend/app/schemas/`) and adds the `Cache-Control: no-store` fix on top. This is the minimum needed to satisfy the criteria, not gold plating; it is listed in the PR description as an assumption.

## Plan Overview
Backend only. Recreate `GET /api/time` (FEAT-1's contract, absent from main after the sandbox reset) as a router plus a Pydantic response schema, register it in `create_app()`, and set `Cache-Control: no-store` on every response from the route handler so no shared cache (the CDN) or browser stores it. Unit and integration tests assert the header, the response shape and the per-request freshness. Criterion 3 is a human check on the deployed environment after merge; the item's `mayker:to-verify` tag routes it there.

Why `no-store` and not `no-cache` or `max-age=0`: the criterion names `no-store` exactly, and it is the only directive that forbids a cache from storing the response at all.

Why set it in the handler and not in a middleware: only this route is affected and the criterion scopes the header to `GET /api/time`; a global middleware would change the caching of every other endpoint, which no criterion asks for.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders no UI)

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time with header `Cache-Control: no-store`.
- Router (`backend/app/routers/server_time.py`): `APIRouter(prefix="/api", tags=["server-time"])`, same shape as `backend/app/routers/version.py`. Handler takes FastAPI's `Response` parameter, sets `response.headers["Cache-Control"] = "no-store"` (module constant with a one-line why-comment naming the CDN), and returns the schema. `response_model=ServerTimeResponse`.
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"] = "UTC"`. A validator rejects a naive datetime and normalises to UTC; a serializer renders `now` with `datetime.isoformat()` so the offset is `+00:00` (Pydantic's default would render `Z`). A classmethod `now_utc()` reads the clock through a module-level `_utc_now()` function on every call, never at import, so tests can step the clock without sleeping.
- Service layer: none. Reading the clock is one stdlib call; a service module would be an abstraction with nothing in it (coding_standards.md Section 1, KISS).
- Repository layer: none. No database access; the endpoint must answer with `DATABASE_URL` unset, like `/api/version`.
- Migrations: none.
- App factory (`backend/app/main.py`): import the router and add `app.include_router(server_time_router)` after the existing three; update the module docstring's list of registered routers. Nothing else in the factory changes.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no parameters.
- Response: 200, `Content-Type: application/json`, `Cache-Control: no-store`. Body:

```json
{"now": "2026-10-29T19:36:02.123456+00:00", "timezone": "UTC"}
```

- `now` is computed per request, timezone-aware, serialised with an explicit `+00:00` offset, never naive.
- `POST /api/time` returns 405 (FastAPI default; read-only endpoint).

## Technology Selection
- Current time: chose the standard library `datetime.now(UTC)` over any time library, because the stdlib covers a timezone-aware UTC timestamp completely.
- Cache directive: chose a plain response header set in the handler through FastAPI's `Response` parameter (already installed) over a caching middleware or a new dependency, because one header on one route is a single assignment.
- Response schema: chose Pydantic (already installed with FastAPI) over a bare dict, as FEAT-1's contract requires a schema in `backend/app/schemas/`.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on every response.
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (aware UTC `now`, `timezone` literal, `+00:00` serialisation, `now_utc()` factory).
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (offset serialisation, naive datetime rejected, non-UTC aware input normalised, `now_utc()` reads the clock per call).
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests: 200 with shape and `Cache-Control: no-store`, two calls with a stepped clock return different `now`, answers with `DATABASE_URL` unset, POST returns 405.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: import and register the server_time router in `create_app()`; docstring lists it.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom routes.

No lockfile changes: no dependency is added or removed. No `README.md` or `docs/DEVELOPMENT.md` change: the item changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API endpoints.

## Testing Strategy
- Unit tests: `ServerTimeResponse` behaviour, isolated (clock patched via `app.schemas.server_time._utc_now`): serialises `now` with `+00:00`; rejects a naive datetime (`ValidationError`); normalises a non-UTC aware datetime (e.g. `+02:00`) to UTC; `now_utc()` calls the clock on each invocation. Plus the `create_app()` route-registration test.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full request/response cycle through the shared `client` fixture: `Cache-Control` header equals `no-store` exactly; status 200 and body keys `now` and `timezone` with `timezone == "UTC"` and `now` parsing to an aware datetime with zero offset; two calls with the clock stepped (monkeypatch `_utc_now`, no sleep) return different `now` values; a fresh app with `DATABASE_URL` unset still answers 200 with the header; `POST /api/time` returns 405. No database is needed, so these run without the backing service.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion requires navigation or interaction through the UI (this item has no UI); see Criterion coverage.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (the header is present on a second, later request too), validated for well-formedness only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header of a router, asserted on the real HTTP cycle. |
| 2 | A test asserts the header on the response | Integration | It is satisfied by the integration test itself (`test_get_time_sets_cache_control_no_store`), which runs in the pytest suite; no UI is involved. |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration (local proxy) plus manual deployed check | The defect needs the deployed CDN, which no local tier has; the integration test covers the two inputs the fix controls (the no-store header and per-request `now`), and the human check on the deployed host is the criterion's own verification. A browser test would exercise neither the CDN nor anything the integration test does not. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response has status 200 And header Cache-Control is "no-store" |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server_time integration tests run, Then 0 tests fail And one of them asserts Cache-Control "no-store" |
| 3 | Deployed reproduction returns two different values | covered at Integration (proxy) plus manual deployed check | Given the fix is deployed behind the CDN, When GET /api/time is requested twice one second apart, Then the two "now" values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the local stack is running (`docker compose up -d` from the repository root), backend reachable on http://localhost:8010.
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the response headers of the same output → a line `cache-control: no-store` is present (header names may be lowercase).
3. Read the body of the same output → JSON shaped like `{"now":"2026-10-29T19:36:02.123456+00:00","timezone":"UTC"}`, with `now` ending in `+00:00`.
4. Run `curl -i http://localhost:8010/api/time` again → the header `cache-control: no-store` is present again and `now` is later than in step 3.

### Criterion 2: A test asserts the header on the response
Not a UI behaviour; the observable check is the test run.
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["Cache-Control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable locally: there is no edge cache in the local stack, so both calls already differ there. The observable check is on the deployed environment, after the fix is merged and deployed.
Prerequisites: the merged fix is deployed; you know the deployed API host (`<deployed-host>`).
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and header `cache-control: no-store` in the output.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (the second is about one second later).
3. If the CDN adds an age or cache-status header (for example `age` or `cf-cache-status`), read it on the step 1 output → it does not report a cache hit.
4. Record the result on the work item; on success it leaves `to_verify`.
