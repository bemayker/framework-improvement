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
- Comment (tracker): 10 comments read, all notices of earlier runs' PRs (an earlier run's merge was reverted by #283, so nothing of it is on main) → not acted on because none carries a correction or amendment to the feature text; the plan is written from the description alone against main at bb7416043dd481128848954f188f1466d06e4b36.
- Assumption (no comment, recorded per `user_story_alignment.md` Section 4): "`GET /api/time` responses" is read as every response the `GET /api/time` handler returns (the 200). The 405 on other methods and framework-generated errors are not in scope: the defect is a cached successful time reading, and widening the header to the whole app or to error responses would be gold plating (`user_story_alignment.md` Section 3).

## Plan Overview
Backend-only, one-line behavioural fix in the existing FEAT-1 router. `get_server_time` in `backend/app/routers/server_time.py` takes FastAPI's injected `Response` and sets `Cache-Control: no-store` on it before returning the unchanged `ServerTimeResponse` body. No schema, service, repository, migration, frontend or configuration change. The header is asserted by a router integration test (real HTTP request/response cycle through the TestClient, no database needed). Criterion 3 is a deployed-environment check a human performs after deploy; locally it is proxied by the header test, since the defect needs a CDN that the local stack does not have.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` (existing, FEAT-1): unchanged path, status and body; adds the response header `Cache-Control: no-store`.
- Service layer: none. The route has no service layer today (it reads the clock through the module-level `current_utc_time()`), and a header directive is HTTP transport concern, so it stays in the router (`coding_standards.md`: KISS).
- Router change: add a `response: Response` parameter (from `fastapi`) to `get_server_time` and set `response.headers["Cache-Control"] = "no-store"`. Keep `response_model=ServerTimeResponse` and the return of the pydantic model as is, so the OpenAPI document and the body are byte-identical to FEAT-1. Put the directive value in one module-level constant (e.g. `NO_STORE = "no-store"`) only if the test imports it; otherwise the literal stays inline once. A one-line comment says why (the CDN in front of the deployed API caches responses that carry no directive).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: none
- Response: 200, body unchanged from FEAT-1, plus header `Cache-Control: no-store`

```
HTTP/1.1 200 OK
content-type: application/json
cache-control: no-store

{"now": "2026-10-22T17:29:35.123456Z", "timezone": "UTC"}
```

## Technology Selection
- `Cache-Control` header on the time response: chose FastAPI's injected `Response` parameter (an installed dependency, rung 3; the header itself is the native HTTP mechanism, rung 2) over a custom middleware, a new caching or headers library, or wrapping the body in a hand-built `JSONResponse`, because a single route needs a single header and the injected `Response` keeps `response_model` serialization and the OpenAPI schema unchanged.
- No net-new module, component or dependency is introduced.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/routers/server_time.py: inject `Response` into `get_server_time` and set `Cache-Control: no-store` on every `GET /api/time` response
- [B] backend/tests/integration/test_server_time_integration.py: add router tests asserting the header on the 200 response, on two consecutive calls, and that the body contract is unchanged
No lockfile changes: no dependency is added or changed.
No README.md or docs/DEVELOPMENT.md changes: the fix changes no project structure, run configuration, dependency or test infrastructure.
No E2E spec: no acceptance criterion requires navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: none added. The change is a header set inside the router handler, with no service or utility logic to isolate; testing it without the HTTP cycle would assert a mock rather than the response (`testing_standards.md` Section 6: the unit question is NO for this change). Existing unit tests in `backend/tests/unit/test_server_time_unit.py` must keep passing, including the OpenAPI contract test.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: router tests in the existing FEAT-1 module, through the session `client` fixture (no database needed):
  - `test_get_time_sets_cache_control_no_store`: `GET /api/time` returns 200 and `response.headers["cache-control"] == "no-store"` (exact value, not a substring, so a later `public, max-age=…` added beside it fails the test).
  - `test_get_time_sets_cache_control_no_store_on_every_call`: two consecutive calls (clock patched one second apart, as the existing freshness test does) each carry `no-store` and return different `now` values: the local stand-in for the deployed reproduction.
  - Existing tests (happy path body, freshness, 405) stay unchanged and must keep passing, which covers "body contract unchanged".
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The fix has no UI surface and no criterion requires navigation or interaction through the UI (`testing_standards.md` Section 6); calling the API from Playwright would be a router integration test in the wrong tier (Section 5).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge case (the header holds on a second, consecutive request), in `BUG-01_server_time_edge_cache.feature`; criterion 3's scenario is a deployed-environment scenario a human runs.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | Verifying it needs no navigation or interaction: it is a response header of a router, asserted on the real HTTP request/response cycle |
| 2 | A test asserts the header on the response. | Integration | The criterion is the existence of the test itself: `test_get_time_sets_cache_control_no_store` in the router integration module, executed by the gate command |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration (local proxy) plus manual check on the deployed environment | No UI is involved and the defect needs the deployed CDN, which no local tier has: locally `test_get_time_sets_cache_control_no_store_on_every_call` proves both calls carry `no-store` and differ; the deployed outcome is the human check in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response status is 200 And the Cache-Control header is "no-store" |
| 2 | A test asserts the header on the response. | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then the header test passes with 0 failed |
| 3 | After deploy, the reproduction above returns two different values. | covered at Integration (local proxy) plus manual deployed check, see Criterion coverage | Given the fix is deployed behind the CDN, When GET /api/time is requested twice a second apart, Then the two now values differ |

## Manual verification plan
<!--
  This feature has no UI surface: every criterion is verified with curl or the test runner.
-->
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`.
Prerequisites: the backend runs locally (`docker compose up` from the repository root, or `uv run --directory backend uvicorn app.main:app --port 8000`), reachable at `http://localhost:8000`. This criterion has no UI: the observable check is the response header.
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers printed above the body → one line reads `cache-control: no-store` (header names are case-insensitive), with no other cache directive beside it.
3. Read the body → it is `{"now":"<an ISO 8601 instant ending in Z>","timezone":"UTC"}`, the same shape as before the fix.

### Criterion 2: A test asserts the header on the response.
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` → the run ends with `0 failed`, and `test_get_time_sets_cache_control_no_store` and `test_get_time_sets_cache_control_no_store_on_every_call` are among the tests run (add `-v` to see the names).

### Criterion 3: After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
Prerequisites: the fix is merged and deployed; you know the deployed host name (the one the CDN fronts). This cannot be verified locally or through the UI: locally nothing caches the response.
1. Run `curl -si https://<deployed-host>/api/time` → status `200`, and the headers include `cache-control: no-store`.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies are printed.
3. Compare the two `now` values → they differ (the second is about one second later). Identical values mean the CDN still caches the response: record it as a failure, with both bodies and the headers from step 1.
