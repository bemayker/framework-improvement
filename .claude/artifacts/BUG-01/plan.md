# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). Its reproduction only runs on the deployed environment: locally there is no edge cache, so the bug cannot be seen. It exercises the to_verify route (merged, awaiting verification on the deployed environment).
>
> Defect: On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> Reproduction (deployed only): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`. Expected: two different `now` values. Actual: identical values. Locally both calls differ, because nothing caches them.
>
> Notes: Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 6 comments on the item, all mayker-dev PR notices from earlier runs (decisions.md, step 6.1) → Addressed by: not acted on because none states a requirement or a correction; none overrides the description.
- Prior attempt: an earlier run fix was reverted by commit eed558f (sandbox reset) → Addressed by: planned fresh against current main at eed558f; `server_time.py` currently sets no header, so the whole fix is still due.
- Merged since the last plan: n/a (fresh plan, branched from current main eed558f).
- Assumption: criterion 3 is a deployed-only, human check. No deployed host is configured in this sandbox, so the plan covers its precondition (header present, value computed per request) with executed tests and records the deployed curl as the manual step. The item is expected to land in `to_verify` rather than Done until a human runs it.
- Assumption: only `GET /api/time` gets the header (the criterion names that route). No global middleware and no header on other routes: that would be gold plating (`user_story_alignment.md` Section 3).

## Plan Overview
One-line backend fix in the FastAPI router for `GET /api/time`: the handler takes FastAPI injected `Response` parameter and sets `Cache-Control: no-store` on it, so the response model, schema and body stay unchanged. Tests: one integration test asserting the header over a real HTTP cycle (criterion 2), and the existing unit tests for the handler updated for the new parameter plus one unit assertion on the header. No frontend, no database, no new dependency. UAT artifacts (Gherkin plus manual script) per the toggles.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` (existing, FEAT-1). Behaviour change: every response carries the header `Cache-Control: no-store`. Status code, response model (`ServerTimeResponse`) and body are unchanged.
- Router (`backend/app/routers/server_time.py`): add `Response` to the `fastapi` import; change the handler signature to `get_server_time(response: Response) -> ServerTimeResponse` and set `response.headers["Cache-Control"] = "no-store"` before returning. Keep `response_model=ServerTimeResponse` on the decorator. Add a one-line comment saying why (an edge cache in front of the API otherwise serves a stale `now`).
- Service layer: none (the handler has no service; this is a transport concern, so it stays in the router).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no parameters (unchanged).
- Response: 200, JSON body unchanged from FEAT-1: an object with `now` (ISO 8601 UTC string ending `+00:00`) and `timezone` (the string `UTC`). New: response header `Cache-Control: no-store` on every response.

## Technology Selection
- Cache directive on the response: chose FastAPI own injected `Response` parameter (an installed dependency) over a new caching or headers middleware package and over a hand-built `JSONResponse`, because the injected parameter sets one header while keeping `response_model` validation and the OpenAPI schema intact. No net-new module or dependency is introduced.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/routers/server_time.py: inject `Response` and set `Cache-Control: no-store` on the GET /api/time response
- [B] backend/tests/integration/test_server_time_integration.py: add a test asserting the `Cache-Control: no-store` header on a real GET /api/time response
- [B] backend/tests/unit/test_server_time_router_unit.py: pass a `Response` to the handler in the existing tests and add one test asserting the handler sets the header

No dependency changes, so no lockfile entry. No E2E spec: no criterion needs the UI (see Criterion coverage). README.md and docs/DEVELOPMENT.md need no edit: no change to project structure, run configuration, dependencies or test infrastructure.

## Testing Strategy
- Unit tests: router handler `get_server_time` with the clock stubbed: called with a fresh `fastapi.Response`, it sets `Cache-Control` to `no-store` (happy path); the existing three tests keep passing with the new parameter (edge: two calls still yield two different `now` values, each with the header set).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file `test_server_time_router_unit.py`)
- Integration tests: real HTTP cycle through the TestClient: `GET /api/time` returns 200 with header `cache-control` equal to `no-store`; the existing tests (two calls a second apart differ, 405 on POST) stay green.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. Enabled per CLAUDE.md, but no acceptance criterion involves navigation or interaction through the UI (backend response header only), so no spec and no edge-case spec (`testing_standards.md` Section 6, fourth question asked per criterion).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a second request a second later also carries the header and a later `now`).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/time responses carry Cache-Control: no-store | Integration | A response header on a router; verifying it needs no navigation or interaction, a real HTTP request/response cycle reads it directly |
| 2 | A test asserts the header on the response | Integration | Satisfied by the integration test of criterion 1 itself (plus the unit test on the handler); no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | Its precondition (header present, `now` computed per request, two calls a second apart differ) is an existing router test; the edge cache exists only on the deployed host, so the final check is the manual deployed curl, which no browser test could reach either |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Header Cache-Control: no-store on GET /api/time | covered at Integration, see Criterion coverage | Given the API is running, When I GET /api/time, Then the response has header Cache-Control no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When I run the server time integration tests, Then 0 failed and the header test is among them |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; final check manual on the deployed host | Given the fix is deployed, When I GET /api/time twice a second apart, Then the two now values differ |

## Manual verification plan
None of the three criteria can be verified through the UI: the change is a response header on a backend endpoint. Each block gives the observable check to read instead.

### Criterion 1: GET /api/time responses carry Cache-Control: no-store
Prerequisites: the stack is running locally (`docker compose up -d --build` from the repo root), backend reachable at http://localhost:8010.
1. In a terminal, run `curl -s -D - -o /dev/null http://localhost:8010/api/time` → the printed headers start with `HTTP/1.1 200 OK` and include the line `cache-control: no-store`.
2. Run `curl -s http://localhost:8010/api/time` → the body is unchanged from FEAT-1: a JSON object with `now` (a UTC timestamp ending `+00:00`) and `timezone` equal to `UTC`.

### Criterion 2: A test asserts the header on the response
Prerequisites: backend dependencies installed (`uv sync --directory backend`), Postgres reachable per CLAUDE.md Backing Services.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_router_unit.py` → expected result `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test sends GET /api/time and asserts the `cache-control` header equals `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: the fix is merged and deployed; you know the deployed host name (no deployed host is configured in this sandbox, so this step runs wherever the app is deployed behind its CDN).
1. Run `curl -s -D - -o /dev/null https://<deployed-host>/api/time` → the headers include `cache-control: no-store` (the CDN passes it through).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ, the second about one second later than the first.
3. If the two `now` values are identical, the edge cache is still serving a stored copy: record the response headers (including any `age` or `x-cache` header) and mark the criterion failed.
