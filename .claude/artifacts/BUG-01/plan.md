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
- [ ] `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] A test asserts the header on the response.
- [ ] After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
<!--
  First plan. The tracker item carries 8 comments, all mayker-dev PR notes from
  earlier runs; none is feedback on the item's scope, so none is acted on.
  No merged-since notice was passed (fresh plan, base 775ade54b713c5663b70f1d2ba3017075807676b).
-->
- Comment (tracker): 8 comments read, all mayker-dev PR notes posted by earlier runs → not acted on because none states a requirement, correction or amendment to the item; the description above is the whole scope.
- Assumption (no comment, recorded per agents/planner.md item 4): criterion 3 is deployed-only and cannot be executed by any automated tier here; the build delivers the header and its tests, and the item goes to the `to_verify` route for the human check. The plan does not invent a deployed environment, a CDN configuration or a smoke job.

## Plan Overview
Backend-only, one-line behavioural fix. The `GET /api/time` handler in `backend/app/routers/server_time.py` sets `Cache-Control: no-store` on its response, using FastAPI's injected `Response` parameter, so the CDN in front of the deployed API stops caching it. The response body (`now`, `timezone`) and status code are unchanged. Scope is the time endpoint only: no global middleware, no other endpoint gets the header (`user_story_alignment.md` Section 3). Tests: one integration test asserts the header on a real HTTP response through the app; the existing unit test that calls the handler directly is updated for the new parameter and asserts the header the handler set. Criterion 3 is verified by a human after deploy.

Not a scaffold item: `backend/` and `frontend/` exist and TEST-01 (the scaffold) is done.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/time` (existing, FEAT-1). Behaviour change only: every 200 response carries the header `Cache-Control: no-store`. Path, method, response model and body are unchanged; `POST /api/time` still returns 405.
- Service layer: none. FEAT-1's documented deviation stands (reading the clock is not business logic), and setting a response header is HTTP-layer concern, so it belongs in the router.
- Implementation: change the handler signature to `def get_server_time(response: Response) -> ServerTimeResponse:` (`from fastapi import APIRouter, Response`), set `response.headers["Cache-Control"] = "no-store"`, and return the same `ServerTimeResponse` as today. FastAPI merges headers set on the injected `Response` into the serialized response, so `response_model` validation and the `+00:00` serializer are untouched. Update the module docstring to name BUG-01 and say why the header exists (the CDN cached the response because it carried no cache directive).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no parameters.
- Response: 200, headers include `Cache-Control: no-store`; body unchanged from FEAT-1:

```json
{"now": "2026-10-22T03:15:03.123456+00:00", "timezone": "UTC"}
```

## Technology Selection
- Response header on one endpoint: chose FastAPI's injected `Response` parameter (an installed dependency, rung 3) over a custom middleware or returning a hand-built `JSONResponse`, because the parameter sets the header without bypassing `response_model` serialization and a middleware would widen the change to every endpoint, which no criterion asks for.
- No other net-new component, module or dependency: the fix adds no file to the application and no package.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script, expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/routers/server_time.py: handler takes the injected `Response` and sets `Cache-Control: no-store`; docstring names BUG-01 and the reason.
- [B] backend/tests/integration/test_server_time_integration.py: new test asserting `Cache-Control` equals `no-store` on a `GET /api/time` response, and that the 200 body is still exactly `now` and `timezone`.
- [B] backend/tests/unit/test_server_time_unit.py: `test_handler_reads_clock_on_every_call` passes a `fastapi.Response()` to the new parameter; new unit test asserts the handler sets `Cache-Control` to `no-store` on the response it is given.

No dependency changes, so no lockfile is regenerated. No project structure, run configuration, dependency or test infrastructure changes, so neither README.md nor docs/DEVELOPMENT.md needs an edit. No E2E spec: no criterion requires UI navigation or interaction (see Criterion coverage).

## Testing Strategy
- Unit tests: the router handler sets `Cache-Control: no-store` on the injected response (happy path); the existing clock-per-call test keeps passing with the new parameter (edge case: two calls, two readings, header set on each). Error case for the handler is unchanged from FEAT-1 (schema rejects naive and non-UTC input, already covered).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file `test_server_time_unit.py`)
- Integration tests: `GET /api/time` through the app's TestClient returns 200 with header `Cache-Control: no-store` and an unchanged body; the existing per-request test (`test_get_time_is_computed_per_request`) remains the local stand-in for the reproduction. Suggested name: `test_get_time_response_carries_cache_control_no_store`.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The endpoint has no UI, and no criterion involves navigation or interaction (`testing_standards.md` Section 6, fourth question asked per criterion). Calling the API from a browser spec would be a router integration test in the wrong tier (Section 5).
  - Directory: e2e/tests/ (no spec this item)
  - File: none
- UAT scenarios: one scenario per criterion plus one edge case (POST still 405, or the header present on two consecutive responses).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | verifying it needs no navigation or interaction: it is a response header on a router, read off a real HTTP response through the app |
| 2 | A test asserts the header on the response. | Integration | verifying it needs no navigation or interaction: the integration test above is the assertion; the unit test on the handler backs it |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment). | Integration (local stand-in) plus manual deployed check | no UI is involved and no automated tier can reach the deployed CDN; locally `test_get_time_is_computed_per_request` plus the header test cover the mechanism, and the deployed result is the human check in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response status is 200 And the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration and unit tests run, Then they report 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration locally plus manual deployed check | Given the fix is deployed behind the CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
<!--
  No criterion is verifiable through the UI: the endpoint has no screen. Each
  block gives the observable check (a response header, a body value, a test run)
  instead of a click path.
-->
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the backend is running locally (`docker compose up` from the repo root, API on the port docker-compose.yml publishes for the backend service, 8010, so http://localhost:8010; a handover rebuild on free ports may move it, in which case use the port the handover reports).
1. Run `curl -sS -D - -o /dev/null http://localhost:8010/api/time` in a terminal → the printed headers include `HTTP/1.1 200 OK` and the line `cache-control: no-store`.
2. Run `curl -sS http://localhost:8010/api/time` → the body is a JSON object with exactly `now` (ending `+00:00`) and `timezone` equal to `UTC`, unchanged from FEAT-1.

### Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the branch, uv installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` → the run ends with `0 failed`, and the output lists the new header test in the integration file.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test sends `GET /api/time` and asserts the `Cache-Control` response header equals `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable through the UI and not locally: there is no edge cache outside the deployed environment. The observable check is the item's own reproduction, run by a human against the deployed host after the merge reaches it.
Prerequisites: the merge is deployed; the deployed host name is known (written below as `<deployed-host>`).
1. Run `curl -sS -D - -o /dev/null https://<deployed-host>/api/time` → the headers include `cache-control: no-store` (proves the fix is what the CDN now sees; a missing header means the deploy has not landed or the CDN strips it).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ, the second about one second later than the first.
3. Repeat step 2 once more → the `now` values differ again (rules out a single lucky cache miss).
