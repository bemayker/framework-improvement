# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). Its reproduction only runs on the deployed environment: locally there is no edge cache, so the bug cannot be seen. It exercises the to_verify route (merged, awaiting verification on the deployed environment).
>
> Defect: on the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> Reproduction (deployed only):
> 1. `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`
> 2. Expected: two different `now` values. Actual: identical values.
>
> Locally both calls differ, because nothing caches them.
>
> Notes: backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 5 comments on the item, all framework PR-link comments from earlier runs → Addressed by: not acted on, because none carries a correction or requirement for this item (recorded in decisions.md, 0 actionable).
- Assumption (no comment): the edge cache is the only cache in front of the API, and `no-store` alone satisfies criterion 1; no `Pragma` or `Expires` header is added, since the criterion names exactly one header and anything more is gold plating.

## Plan Overview
Backend-only defect fix. The `GET /api/time` handler in `backend/app/routers/server_time.py` gains a FastAPI `Response` parameter and sets `Cache-Control: no-store` on it, so every 200 response tells the CDN not to store it. The response body, schema, route and status code are unchanged. The existing unit tests call the handler directly with no arguments, so they are updated to pass a `Response` and one unit test asserts the header is set; one integration test asserts the header on the real HTTP response (criterion 2).

Reproduction class: deployed-only (fix skill Section R1). The reported symptom (two curls a second apart returning the same `now`) needs the CDN, which exists only on the deployed environment: locally the two values already differ, so no local command fails before the fix. The environment is the deployed host the item names (`https://<deployed-host>`): `docs/DEVELOPMENT.md` Test environments has no row. The local header assertion is the before/after proxy for the cause, not a reproduction of the symptom. The PR therefore takes the `mayker:to-verify` label and criterion 3 stays with a human on the deployed environment.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` (existing, FEAT-1), modified only to add the response header `Cache-Control: no-store`. Path, method, status code, `response_model=ServerTimeResponse` and body are unchanged.
- Service layer: none. The handler keeps reading `datetime.now(timezone.utc)` per request; the header is HTTP transport metadata and stays in the router layer.
- Implementation: add a `response: Response` parameter (from `fastapi`) to `get_server_time` and set `response.headers["Cache-Control"] = "no-store"` before returning the `ServerTimeResponse`. Update the module and handler docstrings to say why (edge caching, BUG-01). FastAPI merges headers set on the injected `Response` into the serialized response, so `response_model` validation and the OpenAPI document are untouched.
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no query parameters (unchanged).
- Response: 200, body unchanged (`ServerTimeResponse`: `now` as ISO 8601 UTC with `+00:00` offset, `timezone` equal to `UTC`). New response header: `Cache-Control: no-store`.

## Technology Selection
- Cache-Control header on GET /api/time: chose FastAPI's injected `Response` parameter (an installed dependency, rung 3) over a custom middleware, a `JSONResponse` built by hand, or a caching library, because the parameter sets one header on one route in two lines and keeps `response_model` serialization intact; a middleware would widen the change to every route and a hand-built response would bypass the schema.
- No other net-new component, module or dependency: no new files of application code, no new package, so no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (the 405 on POST carries no requirement on the header, the GET always does); UAT Generation is ENABLED.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan` below, including the deployed-environment steps for criterion 3.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/routers/server_time.py: inject `response: Response` into `get_server_time` and set `Cache-Control: no-store` on it; docstrings name BUG-01 and the edge cache as the reason.
- [B] backend/tests/unit/test_server_time_router_unit.py: the three existing tests pass a fresh `fastapi.Response()` to `get_server_time`; one new test, `test_get_server_time_sets_cache_control_no_store`, asserts the passed response carries `Cache-Control` equal to `no-store` after the call.
- [B] backend/tests/integration/test_server_time_integration.py: one new test, `test_get_time_response_carries_cache_control_no_store`, asserting `GET /api/time` returns 200 with header `Cache-Control` exactly `no-store` through the shared `client` fixture.

No dependency changes, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: the fix changes no project structure, run configuration, dependency or test infrastructure. No E2E spec: no criterion needs the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: the router handler with the clock stubbed; the new test asserts the injected `Response` gets `Cache-Control: no-store`; existing tests adapted to the new parameter.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file test_server_time_router_unit.py)
- Integration tests: the real HTTP cycle asserts the header on the `GET /api/time` response.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. E2E is ENABLED, but no criterion involves navigation or interaction through the UI; the endpoint has no frontend consumer in this item.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus one edge case, validated for well-formedness.
  - Directory: e2e/uat/scenarios/
- Reproduction (fix skill Section R1): class deployed-only. Before/after proxy run locally: `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py -k cache_control` fails before the router change (header absent) and passes after. The symptom itself is verified on the deployed host only.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/time responses carry Cache-Control: no-store | Integration | It is an HTTP response header on an API route; no UI navigation or interaction can observe it better than the real request/response cycle. |
| 2 | A test asserts the header on the response | Integration and Unit | The criterion is satisfied by the tests themselves: the integration test asserts the header on the real response, the unit test on the handler; no UI is involved. |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Manual on the deployed environment, cause covered at Integration | The symptom needs the CDN, which no local tier and no browser test against the local stack can reach; the integration test covers the cause (the header) and a human runs the curl reproduction after deploy. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/time responses carry Cache-Control: no-store | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response is 200 and carries Cache-Control: no-store |
| 2 | A test asserts the header on the response | covered at Integration and Unit, see Criterion coverage | Given the backend test suite, When the server time unit and integration tests run, Then the cache-control tests pass with 0 failed |
| 3 | After deploy, two calls a second apart return different values | covered manually on the deployed environment, see Criterion coverage | Given the fix is deployed behind the CDN, When two requests to /api/time are made a second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: GET /api/time responses carry Cache-Control: no-store
Prerequisites: the stack is running locally with `docker compose up -d --build` from the repo root, backend on http://localhost:8010 (the compose port; a handover rebuild on free ports prints its own port, use that one).
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the response headers in the same output → a line `cache-control: no-store` is present (header names may print in lower case).
3. Read the body below the headers → a JSON object with `now` ending in `+00:00` and `timezone` equal to `UTC`, as before the fix.
This criterion has no UI: the header is the observable check.

### Criterion 2: a test asserts the header on the response
Prerequisites: the backing database is up per CLAUDE.md Backing Services.
1. From the repo root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_router_unit.py` → the run ends with `0 failed`.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py -k cache_control` → exactly the test `test_get_time_response_carries_cache_control_no_store` is selected and the run ends with `0 failed`.
3. Run `uv run --directory backend pytest -q tests/unit/test_server_time_router_unit.py -k cache_control` → `test_get_server_time_sets_cache_control_no_store` is selected and the run ends with `0 failed`.

### Criterion 3: after deploy, the reproduction returns two different values
Prerequisites: the fix is merged and deployed behind the CDN; the deployed host is the one the item names (`https://<deployed-host>`), since docs/DEVELOPMENT.md Test environments has no row. Not runnable locally: the local stack has no edge cache.
1. Run `curl -si https://<deployed-host>/api/time` → 200, and the headers include `cache-control: no-store` (a CDN cache-status header, if the CDN sends one, reads a miss or bypass, never a hit).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ, the second at least one second later.
3. If the two values are identical, the fix did not hold: leave the `mayker:to-verify` label in place and run `/fix BUG-01`; if they differ, remove the label and move the item to Done.
