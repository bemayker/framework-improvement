# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). Its reproduction only runs on the deployed environment: locally there is no edge cache, so the bug cannot be seen. It exercises the `to_verify` route (merged, awaiting verification on the deployed environment).
>
> Defect: on the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> Reproduction (deployed only): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`. Expected: two different `now` values. Actual: identical values. Locally both calls differ, because nothing caches them.
>
> Notes: Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Plan Overview
Backend only. Add `Cache-Control: no-store` to every `GET /api/time` response, set in the router for that one route, and assert it in an integration test through the app's own test client.

**Finding that shapes the plan: the endpoint this bug fixes does not exist on main.** FEAT-1 (ClickUp 123k99ctzxk) is `complete` in the tracker, but `backend/app/routers/server_time.py` is absent at the plan base 4e631128 and `backend/app/main.py` registers only the version, notes and health routers. Git history shows FEAT-1's code was removed by repeated sandbox resets (last FEAT-1 merge f293b277, removed by c5a6e64c and later resets). A `Cache-Control` header cannot be added to a route that returns 404, so this plan recreates the minimal server-time slice to FEAT-1's own acceptance criteria and adds the header to it.

Assumptions (recorded rather than blocking, `user_story_alignment.md` Section 4):
- A1. The `GET /api/time` contract is FEAT-1's: 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema in `backend/app/schemas/`. Nothing beyond FEAT-1's criteria is rebuilt (no query parameters, no other timezones).
- A2. The header is set on this route only, not app-wide: the item names `server_time.py` and only `/api/time`; a global middleware would change the version, notes and health responses, which no criterion asks for.
- A3. Criterion 3 is a human check on the deployed environment. `docs/DEVELOPMENT.md` -> `## Test environments` has no rows, so no URL can be named; the item's own wording ("the deployed environment") is the environment. Locally it is covered by the header test plus a per-request freshness test, which is the cheapest executed proxy for it.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time and sets `Cache-Control: no-store` on the response.
- Router (`backend/app/routers/server_time.py`): `APIRouter(prefix="/api", tags=["server-time"])`, one `@router.get("/time", response_model=ServerTimeResponse)` handler that takes FastAPI's injected `response: Response` parameter, sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=server_time_service.get_server_time(), timezone="UTC")`, calling the service through its module (as `routers/health.py` does) so a test can replace the clock.
- Service layer (`backend/app/services/server_time_service.py`): a public `utc_now() -> datetime` returning `datetime.now(UTC)`, and `get_server_time(clock: Callable[[], datetime] | None = None) -> datetime`, which calls `clock` or, when none is given, the module's `utc_now` looked up at call time (so a test can monkeypatch it), and returns the value converted with `.astimezone(UTC)`; a naive datetime from the clock raises `ValueError` so a naive value can never be serialised (FEAT-1: "never naive"). Called once per request, never cached at module level.
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (pydantic's aware-datetime type, serialised as ISO 8601 with `Z` or `+00:00`) and `timezone: Literal["UTC"]`.
- App factory (`backend/app/main.py`): import the router as `server_time_router` and `app.include_router(server_time_router)` after the existing three; extend the module docstring's registration list with BUG-01's server time router. No other change to `main.py` (CORS, lifespan untouched).
- Repository layer: none, no data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no query parameters
- Response: 200, headers include `Cache-Control: no-store`; body
  ```json
  {"now": "2026-11-24T10:14:11.123456Z", "timezone": "UTC"}
  ```
  `now` is ISO 8601 with an explicit UTC offset (`Z` or `+00:00`), never naive. Any other method on `/api/time` returns 405 (FastAPI default).

## Technology Selection
- Cache directive: chose FastAPI's injected `Response` parameter (installed dependency) setting one header over a custom middleware or a new caching library, because only one route needs it and the header is a single string.
- Current UTC time: chose the standard library `datetime.now(UTC)` over any date library (none needed).
- Aware-datetime validation in the schema: chose pydantic's built-in `AwareDatetime` (installed dependency) over a hand-written validator.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime`, `timezone: Literal["UTC"]`)
- [B] backend/app/services/server_time_service.py: `get_server_time(clock=None)` returning an aware UTC datetime per call, rejecting a naive clock value
- [B] backend/app/routers/server_time.py: `GET /api/time` router that sets `Cache-Control: no-store` and returns the schema
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (UTC aware, per-call freshness, naive clock rejected)
- [B] backend/tests/integration/test_server_time_integration.py: router tests through the test client (header, shape, offset, freshness, 405)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/main.py: import and register `server_time_router`; docstring names the BUG-01 registration
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is a custom route, following the existing version and health registration tests

No dependency changes, so no lockfile. No README.md or docs/DEVELOPMENT.md edit: the change adds one route and changes no project structure, run configuration, dependencies or test infrastructure.

## Testing Strategy
- Unit tests: `server_time_service.get_server_time` with an injected clock: returns an aware datetime with offset 0; two calls with a clock that advances by one second return different values (per-call, not cached); a clock returning a non-UTC aware time is converted to UTC; a naive clock value raises `ValueError`. Plus the app-factory registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_server_time_service_unit.py
- Integration tests: `GET /api/time` through the session `client` fixture in `backend/tests/conftest.py` (no database needed): status 200 and `Cache-Control: no-store`; body shape `{"now", "timezone"}` with `timezone == "UTC"`; `now` parses with `datetime.fromisoformat` to an aware value with `utcoffset() == timedelta(0)`; two requests return different `now` values with `app.services.server_time_service.utc_now` monkeypatched to a stub that advances one second between calls (no sleep, no reliance on clock resolution); `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E Tests is ENABLED, but no criterion involves navigation or interaction through the UI (the endpoint has no frontend consumer); every criterion is covered at integration or unit level per the table below.
  - Directory: e2e/tests/
  - File: none (would be BUG-01_server_time_edge_cache.spec.ts)
- UAT scenarios: one scenario per criterion plus the edge case "a POST to /api/time is rejected with 405"; scenarios are API-level Given/When/Then, not browser steps.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_returns_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header of a router behaviour |
| 2 | A test asserts the header on the response | Integration | `test_get_time_returns_cache_control_no_store` | the criterion is the existence of a test on the HTTP response, which is a router integration test by definition |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_time_returns_fresh_now_per_request`, `test_get_time_returns_cache_control_no_store` | no UI is involved; locally the proxy is per-request freshness plus the no-store header that stops the edge cache; the deployed check itself is the manual step below and the `mayker:to-verify` label |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response status is 200 and the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the header test passes |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the fix is deployed behind the edge cache, When two GET /api/time requests are sent one second apart, Then the two now values differ |
| edge | POST is rejected | covered at Integration | Given the API is running, When a client sends POST /api/time, Then the response status is 405 |

## Manual verification plan
None of the three criteria can be verified through the UI: `/api/time` has no frontend consumer. Each block below uses a terminal against the running API and names the observable header or body to read.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the backend runs locally (`docker compose up` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`), and its port is known (8000 below; substitute the port your stack publishes).
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the first line is `HTTP/1.1 200 OK`.
2. Read the response headers → a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body → it is one JSON object with exactly the keys `now` and `timezone`, `timezone` is `"UTC"`, and `now` ends in `Z` or `+00:00`.
4. Run `curl -si -X POST http://localhost:8000/api/time` → the status line reads `405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the feature branch, with `uv` installed.
1. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_returns_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.
2. From the repo root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` → the summary line reports no failed or errored test, and the command exits 0.

### Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: the merged change is deployed to the environment behind the edge cache, and you know its host (`docs/DEVELOPMENT.md` -> `## Test environments` has no row yet, so take the host from whoever operates the deployment).
1. Run `curl -si https://<deployed-host>/api/time` → status 200, and the headers include `cache-control: no-store` as served through the CDN (a CDN that strips or overrides it is a deployment finding, not a pass).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON lines are printed.
3. Compare the `now` value of the two lines → they differ by roughly one second; identical values mean the defect is still present.
4. When step 3 passes, remove the `mayker:to-verify` label from the item so it can move to done.
