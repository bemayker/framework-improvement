# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> **Defect.** On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> **Reproduction (deployed only).** Curl the deployed `/api/time` twice a second apart. Expected: two different `now` values. Actual: identical. Locally both calls differ because nothing caches them.
>
> **Acceptance criteria**
>
> 1. `GET /api/time` responses carry `Cache-Control: no-store`.
> 2. A test asserts the header on the response.
> 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
>
> **Notes.** Backend only, `backend/app/routers/server_time.py`. Keep it there (a router-level header), not an app-wide middleware in main.py, unless the code makes that impossible: the scheduler relies on BUG-01 not touching main.py.
>
> Depends on FEAT-1 (complete). Branch `feature/BUG-01-server-time-edge-cache`. Wave 3.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction (two curls of the deployed `/api/time` a second apart) returns two different `now` values, verified by a human on the deployed environment.

## Re-Plan Feedback
- Comment (tracker, 4 comments): bot notices of earlier unmerged PRs for this item → Not acted on, because they are link records of plans or PRs that never merged and ask for nothing (the dispatch reports all four as non-actionable).
- Merged since the last plan: n/a (fresh plan, branched from current main at 183fb15, which already carries FEAT-1 as a40e653).
- Assumption (notes, "router-level header"): the header is set inside `backend/app/routers/server_time.py` by the handler, through an injected FastAPI `Response` parameter, rather than through a router-wide dependency or an app-wide middleware. The router module holds exactly one route, so a handler-level header and a router-level one cover the same responses; the handler form is the smaller and more explicit of the two. `backend/app/main.py` is not touched, as the notes and the scheduler require. Nothing in the code makes the router-local form impossible.
- Assumption (the value): exactly `no-store` and nothing else (no `no-cache`, `private`, `max-age=0`, `Pragma` or `Expires`). Criterion 1 names that one directive, `no-store` alone forbids any cache, shared or private, from storing the response, and adding the others would be scope the item does not ask for (`user_story_alignment.md` Section 3).
- Assumption (scope of "responses"): criterion 1 is read as the endpoint's 200 response, its only response the code produces. The endpoint takes no parameters, so it has no validation error path; a framework-produced 405 for a non-GET method is not a response of `GET /api/time` and is out of scope.
- Assumption (criterion 3, the deployed environment): `CLAUDE.md` records no deployed URL for this sandbox, so the manual verification plan names it as the deployed API base URL the verifier already uses for the reproduction. It is verified by a human after deploy and cannot be executed by any build or CI tier; the automated stand-in is the header assertion of criterion 2.

## Plan Overview
Backend only, one file of application code. The `GET /api/time` handler in `backend/app/routers/server_time.py` gains a FastAPI `Response` parameter and sets `Cache-Control: no-store` on it before returning the unchanged `ServerTimeResponse`. That is the directive the edge cache was missing: a CDN may not store a `no-store` response, so every request reaches the API and reads the clock afresh, which is what FEAT-1 already does per request. No change to `backend/app/main.py`, to the schema, to any other router, or to the frontend; no middleware, no new module, no dependency. Tests: one integration test through the real HTTP cycle asserting the header value exactly (criterion 2), added to the existing `backend/tests/integration/test_server_time_integration.py`. Criterion 3 is a human check on the deployed environment, written out in the Manual verification plan. Not the scaffold item (TEST-01 is, and it is done), so no Infrastructure Scaffolding section.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders nothing).

## Backend Plan
- Endpoints: `GET /api/time`, unchanged path, method, tag and `response_model=ServerTimeResponse`. The handler signature becomes `get_server_time(response: Response) -> ServerTimeResponse`, with `Response` imported from `fastapi` beside `APIRouter`. Its body sets `response.headers["Cache-Control"] = "no-store"` and then returns `ServerTimeResponse(now=datetime.now(UTC), timezone="UTC")` exactly as today. FastAPI merges headers set on an injected `Response` into the response it builds from the return value, so the body, the status and the `response_model` serialisation do not change.
- The header value is a module-level constant, `NO_STORE = "no-store"`, beside the router, with a one-line comment saying why it exists (an edge cache in front of the API otherwise stores the response and serves a stale `now`). The comment explains the why, per `coding_standards.md` Section 1.
- The module docstring gains one sentence naming BUG-01 and the header, so the reason for the parameter is visible where the code is.
- Registration: none. `backend/app/main.py` is not modified; the router is already registered by FEAT-1.
- Service layer: none, unchanged from FEAT-1 (its planned deviation stands; a response header is transport, not business logic).
- Repository layer: none. Migrations: none.
- Error responses: none specific; the endpoint takes no parameters.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time` (backend at http://localhost:8010 under `docker compose`)
- Request: no query parameters, no body, no headers beyond the defaults.
- Response 200: unchanged body, `ServerTimeResponse` with exactly the two keys `now` (ISO 8601 UTC ending in `Z`) and `timezone` (the string `UTC`), as FEAT-1 defined it.
- Response headers: `Cache-Control: no-store` is new and present on every 200 response. `content-type: application/json` is unchanged.
- Errors: none specific to this endpoint.

## Technology Selection
- Setting the response header: chose FastAPI injected `Response` parameter (installed) over a Starlette middleware in `backend/app/main.py`, a router-wide dependency, or returning a `JSONResponse` by hand, because it scopes the header to this route alone, keeps `response_model` serialisation and the OpenAPI document unchanged, and leaves `main.py` untouched as the item requires.
- The cache directive: chose the standard HTTP `Cache-Control: no-store` directive over a CDN-specific header or purge configuration, because criterion 1 names it and every standards-conforming shared cache honours it.
- No net-new module, component or dependency: the change is one parameter and one constant in an existing router, and one test in an existing test file.

## File Manifest
### New files
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus the edge case that the body is unchanged when the header is added (UAT Generation ENABLED)
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/routers/server_time.py: import `Response`, add the `response: Response` parameter, set `Cache-Control` to the `NO_STORE` constant before returning, one docstring sentence naming BUG-01 (criterion 1)
- [B] backend/tests/integration/test_server_time_integration.py: add `test_get_server_time_sets_cache_control_no_store` asserting the header value exactly (criterion 2)

No lockfile changes: the item adds no dependency, so `backend/uv.lock` and `frontend/package-lock.json` are untouched.
No documentation edit: `README.md` and `docs/DEVELOPMENT.md` list no individual endpoints or headers, and this item changes no project structure, run configuration, dependency or test infrastructure, so build-feature Section 15 has nothing to update.
No E2E spec file: no criterion is assigned to the E2E tier (see Criterion coverage).
`backend/app/main.py` is deliberately absent: the item forbids touching it and the scheduler relies on that.

## Testing Strategy
- Unit tests: none added. The change adds no business logic, validator or transformation (`testing_standards.md` Section 6, first question); it is a router response header, which the integration tier covers through the real request/response cycle. The existing `backend/tests/unit/test_server_time_unit.py` stays green unchanged: its stubbed-clock test calls the route through `TestClient(create_app())`, and the added `Response` parameter is injected by FastAPI, so no test signature changes.
  - Directory: backend/tests/unit/ (unchanged by this item)
  - Naming: test_module_unit.py per CLAUDE.md
- Integration tests: one new test in the existing file, using the shared session-scoped `client` fixture from `backend/tests/conftest.py`; the endpoint touches no database, so no database fixture is requested.
  - `test_get_server_time_sets_cache_control_no_store` (criteria 1 and 2): `client.get("/api/time")` returns 200 and `response.headers["cache-control"]` equals exactly `no-store` (an equality, not a substring check, so a widened or altered directive fails the test).
  - The four FEAT-1 integration tests in the same file stay as they are and keep proving the body is unchanged.
  - Directory: backend/tests/integration/
  - Naming: test_module_integration.py per CLAUDE.md, here the existing `test_server_time_integration.py`
- E2E tests: no criterion is assigned to E2E. No screen calls `/api/time`, so no criterion needs navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, asked per criterion). No spec file is written.
  - Directory: e2e/tests/ (unused by this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (the body keeps exactly the keys `now` and `timezone` with the header present), phrased as HTTP requests and responses because there is no UI. The criterion 3 scenario is phrased against the deployed environment and is validated for well-formedness only, like every scenario (`testing_standards.md` Section 1.4).
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/time responses carry Cache-Control: no-store | Integration | A response-header property of a router with no UI consumer; the HTTP cycle reads the header directly, and a browser test would have to bypass the UI to see it |
| 2 | A test asserts the header on the response | Integration | It is a criterion about the test suite itself, satisfied by `test_get_server_time_sets_cache_control_no_store` through the real HTTP cycle, not by a user interaction |
| 3 | After deploy, two curls a second apart return different now values | Manual (human, deployed environment), backed by Integration for criterion 1 | The defect exists only behind the deployed CDN, which no local or CI tier runs; it involves no UI navigation either, so a browser test could not reproduce it. The integration header assertion is the automated proxy for the cause; the human check after deploy confirms the effect |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/time responses carry Cache-Control: no-store | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/time, Then the status is 200 and the Cache-Control header is exactly no-store |
| 2 | A test asserts the header on the response | covered at Integration, see Criterion coverage | Given the repository, When I run the server time integration test file, Then the run reports 0 failed and includes the Cache-Control assertion |
| 3 | After deploy, two calls a second apart return different now values | covered manually on the deployed environment, see Criterion coverage | Given the fix is deployed behind the CDN, When I request the deployed GET /api/time twice one second apart, Then the two now values differ and each response carries Cache-Control no-store |

## Manual verification plan
No screen of the task-notes app calls this endpoint, and the criterion is a response header, so every block is verified against the HTTP response with curl rather than through the UI.

### Criterion 1: GET /api/time responses carry Cache-Control: no-store
Prerequisites: on branch `feature/BUG-01-server-time-edge-cache` (or `main` once merged), from the repository root run `docker compose up -d --build`, then `docker compose ps` until `backend` reports running. The backend answers on http://localhost:8010. A terminal with `curl`.
1. Run `curl -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK`, and among the headers is the line `cache-control: no-store` (header names are case-insensitive; the value is exactly `no-store`, with no other directive beside it).
2. Read the body of step 1 → unchanged from FEAT-1: exactly the two keys `now` (a timestamp ending in `Z`, such as `2026-10-16T04:40:12.345678Z`) and `timezone` with the value `UTC`.
3. Run `curl -s -D - -o /dev/null http://localhost:8010/api/health` → its headers carry no `cache-control: no-store` line, which shows the header is scoped to `/api/time` and was not added app-wide.

### Criterion 2: a test asserts the header on the response
1. Open `backend/tests/integration/test_server_time_integration.py` → it contains `test_get_server_time_sets_cache_control_no_store`, which requests `/api/time` and asserts the `cache-control` header equals `no-store`.
2. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` → the summary line reports `0 failed`, and `test_get_server_time_sets_cache_control_no_store` is among the tests run (add `-v` to see it listed as PASSED).
3. Optional negative check: temporarily delete the line that sets the header in `backend/app/routers/server_time.py`, re-run the command from step 2 → `test_get_server_time_sets_cache_control_no_store` fails; restore the line and re-run → `0 failed`.

### Criterion 3: after deploy, the reproduction returns two different values
This criterion exists only behind the CDN of the deployed environment, so it is checked there by a human after the fix is deployed; no local step can reproduce it.
Prerequisites: the merged fix is deployed. The deployed API base URL is the one the defect reproduction used (it is not recorded in `CLAUDE.md`); below it is written DEPLOYED_BASE, for example `https://api.example.com`. A terminal with `curl`.
1. Run `curl -s -D - DEPLOYED_BASE/api/time` → the response headers include `cache-control: no-store`; note the `now` value of the body, for example `2026-10-16T09:00:00.123456Z`.
2. Wait one second, then run the same command again → the new `now` is one second or more later than the value noted in step 1, so the two values differ. Before the fix, both calls returned the identical `now`.
3. If the CDN exposes a cache status header (such as `cf-cache-status`, `x-cache` or `age`), read it on the step 2 response → it reports a miss, bypass or dynamic response, never a hit, and `age` is absent or `0`.
