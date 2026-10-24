# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> ## Defect
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
> ## Reproduction (deployed only)
> 1. `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`
> 2. Expected: two different `now` values. Actual: identical values.
> Locally both calls differ, because nothing caches them.
> ## Acceptance criteria
> 1. `GET /api/time` responses carry `Cache-Control: no-store`.
> 2. A test asserts the header on the response.
> 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
> ## Notes
> Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] A test asserts the header on the response.
- [ ] After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 11 comments on ClickUp task 123k99cwybn (0 threaded replies), all framework run notes left by earlier, reverted runs → Addressed by: not acted on because none states a requirement, a correction or an amendment to the description; the description above is the whole scope.
- Assumption (no comment; recorded per `user_story_alignment.md` Section 4, autonomous mode): criterion 3 is deployed-only. No local tier can reproduce the CDN, so the build cannot execute it; it is covered by the header assertion as the cause-level proxy and verified by a human after deploy (`## Manual verification plan`, Criterion 3). The PR body must list it as a post-deploy check, not as a verified criterion.
- Assumption: the header is set on the `GET /api/time` response only, in the router, as the item's Notes direct. A global middleware in `backend/app/main.py` is out of scope (no other endpoint is named, `user_story_alignment.md` Section 3) and would collide with TEST-06 and TEST-09, which edit `main.py` concurrently.

## Plan Overview
One-line backend fix: the `GET /api/time` handler in `backend/app/routers/server_time.py` sets `Cache-Control: no-store` on its response, so the CDN (and any intermediate cache) stops storing it. The response body and schema are unchanged. Integration tests assert the exact header value on the HTTP response. No frontend, no schema, no migration, no `main.py` change.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` (existing, FEAT-1). Change: `get_server_time` takes FastAPI's injected `response: Response` parameter and sets `response.headers["Cache-Control"] = "no-store"` before returning the unchanged `ServerTimeResponse`. `response_model=ServerTimeResponse` stays, so the body shape and the existing FEAT-1 tests are unaffected. Add one docstring clause saying why (edge caches must not store a per-request clock value).
- Service layer: none (no business logic; the endpoint has no service, as in FEAT-1).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no parameters (unchanged).
- Response: 200, header `Cache-Control: no-store` (new); body unchanged, e.g. `{"now": "2026-10-24T05:00:00+00:00", "timezone": "UTC"}`.

## Technology Selection
- Cache-Control header: chose FastAPI's own `Response` parameter injection (`fastapi.Response`, an installed dependency) over a custom middleware or a new caching dependency, because the framework already sets a per-response header in one line and no stdlib or native feature is needed.
- No other net-new component, module or dependency is introduced.

## File Manifest
### New files
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan, including the post-deploy check for criterion 3
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/routers/server_time.py: inject `response: Response` into `get_server_time` and set `Cache-Control: no-store` on it; docstring clause for BUG-01
- [B] backend/tests/integration/test_server_time_integration.py: add `test_get_time_response_carries_cache_control_no_store` (200 response, header `cache-control` equals exactly `no-store`) and `test_get_time_cache_control_is_set_on_every_request` (two consecutive calls, both carry it)

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: none added. The change is a response header set in the router, with no service or utility logic, so `testing_standards.md` Section 6's first question is no. The existing `backend/tests/unit/test_server_time_unit.py` stays untouched and passing.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: header assertions on the real HTTP request/response cycle through the shared `client` fixture (`backend/tests/conftest.py`), added to the existing `backend/tests/integration/test_server_time_integration.py`; the existing FEAT-1 tests there keep passing (body unchanged).
  - Directory: backend/tests/integration/
- E2E tests: none for this item. No criterion requires navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion, is no for all three), so no spec is written.
  - Directory: e2e/tests/
  - File: none (no criterion is assigned to E2E)
- UAT scenarios: one scenario per criterion plus an edge case (the header is present on a second consecutive call); criterion 3's scenario is tagged as a post-deploy manual check.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a router response header, read off the HTTP response |
| 2 | A test asserts the header on the response | Integration | the criterion is the integration test itself; its execution in the test gate is the coverage |
| 3 | After deploy, the reproduction above returns two different values (human-verified on the deployed environment) | Integration | the CDN exists only on the deployed environment, so no browser or local tier can reproduce it; the integration header assertion covers the cause, and the effect is a human post-deploy check (Manual verification plan, Criterion 3) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When I request GET /api/time, Then the response has header Cache-Control with value no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When I run the server time integration tests, Then 0 failed and the cache-control tests are among them |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; post-deploy human check | Given the fix is deployed behind the CDN, When I request GET /api/time twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally at `http://localhost:8000` (for example `uv run --directory backend uvicorn app.main:app --port 8000`, or the compose stack).
1. In a terminal, run `curl -sS -D - -o /dev/null http://localhost:8000/api/time` → the status line reads `200 OK` and the header block contains the line `cache-control: no-store`.
2. Run `curl -sS http://localhost:8000/api/time` → the body is still `{"now":"<ISO 8601 ending +00:00>","timezone":"UTC"}`, unchanged from FEAT-1.
3. Open `http://localhost:8000/api/time` in a browser with DevTools open, Network tab, click the `time` request, Headers panel → Response Headers lists `cache-control: no-store`.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the BUG-01 branch, uv installed.
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → expected `0 failed`, and the run includes `test_get_time_response_carries_cache_control_no_store` and `test_get_time_cache_control_is_set_on_every_request`.
2. Open `backend/tests/integration/test_server_time_integration.py` and read `test_get_time_response_carries_cache_control_no_store` → it asserts the response header `cache-control` equals exactly `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion cannot be verified locally or by any test tier: the stale value comes from the CDN in front of the deployed API, which exists only on the deployed environment. It is a human check after the fix is deployed.
Prerequisites: the BUG-01 change is merged and deployed; you know the deployed host name (`<deployed-host>`).
1. In a terminal, run `curl -sS -D - -o /dev/null https://<deployed-host>/api/time` → the header block contains `cache-control: no-store` (if the CDN adds its own cache status header, such as `x-cache` or `cf-cache-status`, it reads a miss, bypass or dynamic value, not a hit).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies are printed and their `now` values differ, the second about one second later than the first.
3. Repeat step 2 once more → the `now` values differ again. If they are identical, the CDN may still hold an entry cached before the deploy: purge the CDN cache for `/api/time`, repeat step 2, and record the result on the item.
