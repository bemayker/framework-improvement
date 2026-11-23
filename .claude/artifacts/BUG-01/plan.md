# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). **Its reproduction only runs on the deployed environment**: locally there is no edge cache, so the bug cannot be seen. It exercises the `to_verify` route (merged, awaiting verification on the deployed environment).
>
> **Defect.** On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> **Reproduction (deployed only).** 1. `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` 2. Expected: two different `now` values. Actual: identical values. Locally both calls differ, because nothing caches them.
>
> **Notes.** Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 54 comments read, all framework PR-opened notices from earlier runs → not acted on because none states a requirement, a correction or an amendment to the feature text.
- Comment (dispatch, orchestrator ingestion note): "FEAT-1 reads complete in the tracker but `backend/app/routers/server_time.py` was not found on main" → Verified: `git ls-files backend` on main (7c1e62b) lists no `server_time` router, schema, service or test, and `backend/app/main.py` registers only the version, notes and health routers. The feature map row for BUG-01 records the cause (the sandbox reset c5a6e64 removed FEAT-1's code). Assumption, recorded here instead of blocking: this item recreates the minimal `GET /api/time` slice FEAT-1 would have provided (router, schema, service, registration in `main.py`) with the fix applied, because criterion 1 cannot be met on an endpoint that does not exist. The response shape `{"now": <ISO 8601 UTC datetime>, "timezone": "UTC"}` is taken from this item's own last merged fix (035c4d4b), the only record of FEAT-1's contract in this repository. Nothing beyond that shape is added (no query parameters, no other timezones).

## Plan Overview
Backend only. Recreate the `GET /api/time` endpoint in the project's Router to Service to Schema layering (canonical modules `routers/version.py`, `services/version_service.py`, `schemas/version.py`), set `Cache-Control: no-store` on that route's response in the router, and register the router in `create_app()` in `backend/app/main.py`. The header is set per route, not as app-wide middleware, so no other endpoint's caching behaviour changes (scope containment). No database, no frontend, no external API, no new dependency.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; the item has no UI).

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time; every response carries `Cache-Control: no-store`.
- Service layer: `backend/app/services/server_time_service.py` with `SERVER_TIMEZONE = "UTC"` and `get_server_time() -> datetime`, returning `datetime.now(timezone.utc)` computed on every call, never memoised (a held value would be stale by construction).
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, handler `get_time(response: Response) -> ServerTimeResponse` that sets `response.headers["Cache-Control"] = "no-store"` and returns the schema. Module docstring names FEAT-1 and BUG-01 (project-standards Documentation convention); one-line docstring on every public function and class (ruff D101 to D103 gate).
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: str`.
- App factory: `backend/app/main.py` imports `server_time_router` and adds `app.include_router(server_time_router)` beside the existing three; the module docstring gains one clause naming the time router. CORS middleware untouched.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no parameters.
- Response: 200, `Content-Type: application/json`, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-23T20:14:21.123456Z", "timezone": "UTC"}
```

  `now` is an ISO 8601 timezone-aware UTC datetime as Pydantic serialises it (`Z` suffix). `POST /api/time` returns 405 (FastAPI default, not new code).

## Technology Selection
- `server_time_service.get_server_time`: chose the standard library `datetime.now(timezone.utc)` over any time library; the stdlib covers it fully.
- `Cache-Control: no-store` header: chose setting the header on FastAPI's injected `Response` in the route (an installed dependency, FastAPI) over a custom middleware or a new caching package, because one route needs one header and a middleware would widen the change to every endpoint.
- `ServerTimeResponse`: chose Pydantic `BaseModel` (installed with FastAPI) over a hand-written dict, matching the canonical `schemas/version.py`.
- No new dependency, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` route, sets `Cache-Control: no-store` on the response.
- [B] backend/app/services/server_time_service.py: `SERVER_TIMEZONE` and `get_server_time()` returning the current UTC datetime per call.
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` with `now` and `timezone`.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for `get_server_time` (UTC aware, fresh per call, timezone constant).
- [B] backend/tests/integration/test_server_time_integration.py: HTTP cycle tests for `GET /api/time` (200 body shape, `Cache-Control: no-store`, two calls differ, 405 on POST).
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: import and register the server time router in `create_app()`; docstring names it.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route`.

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the item adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `get_server_time` in the service layer: returns a timezone-aware datetime whose offset is zero (happy path), two successive calls return non-decreasing, distinct values with `datetime.now` patched to a sequence (edge case: no memoisation), `SERVER_TIMEZONE == "UTC"`. App factory: the `/api/time` route is registered.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the session `client` fixture (no database needed): 200 with `now` and `timezone` keys, `Cache-Control` header equal to `no-store`, two successive requests return different `now` (service patched to a two-value sequence so the test cannot flake on clock resolution), `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none. E2E is ENABLED in CLAUDE.md, but no criterion requires navigation or interaction through the UI (the endpoint has no frontend consumer), so per criterion the cheaper tiers cover everything; no spec file is produced.
  - Directory: e2e/tests/
  - File: not produced (no criterion's covering tier is E2E)
- UAT scenarios: one scenario per criterion plus one edge case (POST rejected), written against the API, not the browser.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_returns_no_store_cache_control`, `test_get_time_returns_200_with_utc_now` | verifying it needs no navigation or interaction: it is a response header on a router, asserted on the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | `test_get_time_returns_no_store_cache_control` | the criterion is the existence of the header assertion itself, which lives in the router integration test; no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Integration | `test_get_time_successive_requests_return_different_now`, `test_get_server_time_returns_fresh_value_per_call` | the edge cache exists only on the deployed environment, which no test tier reaches; the automated proxy asserts the app itself never repeats a value and the header that tells the CDN not to cache, and the deployed check stays a human `to_verify` step (Manual verification plan, criterion 3) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response status is 200 And the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then the run passes with no failed or errored test |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is human | Given the deployed environment, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion has no UI; the observable check is the response header.
Prerequisites: the backend runs locally (`docker compose up -d` from the repository root, or `uv run --directory backend uvicorn app.main:app --port 8000`), reachable at `http://localhost:8000`.
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers in the same output → a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body in the same output → a JSON object with `now` set to the current UTC time ending in `Z` and `timezone` set to `UTC`.
4. Run `curl -si http://localhost:8000/api/version` → no `cache-control: no-store` line, confirming the header is scoped to the time route only.

### Criterion 2: A test asserts the header on the response
This criterion has no UI; the observable check is the test run.
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_returns_no_store_cache_control` → it asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, two requests a second apart return different values
This criterion can only be verified on the deployed environment, by a human, after the merge (the item's `to_verify` route).
Prerequisites: this item is merged and deployed; you know the deployed host name.
1. In a terminal, run `curl -s https://{deployed-host}/api/time; sleep 1; curl -s https://{deployed-host}/api/time` → two JSON bodies are printed.
2. Compare the two `now` values → they differ, the second roughly one second later than the first.
3. Run `curl -sI https://{deployed-host}/api/time` → the headers include `cache-control: no-store`, and no CDN cache-hit header (for example `cf-cache-status: HIT` or `x-cache: HIT`) is present.
