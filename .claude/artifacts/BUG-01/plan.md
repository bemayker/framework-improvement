# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). Its reproduction only runs on the deployed environment: locally there is no edge cache, so the bug cannot be seen. It exercises the `to_verify` route (merged, awaiting verification on the deployed environment).
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
- Comment (tracker): 7 comments read on ClickUp task 123k99cwybn, all mayker-dev PR notices from earlier runs (newest first, as relayed by the dispatching session). Addressed by: not acted on, because none states a requirement, a correction or an amendment to the description; they are link notices only.
- Merged since the last plan: n/a (fresh plan in this run, written against main at 68540ed; no `[merged-since]` lines were carried in the dispatch). Note for the reader: an earlier run (deliver-20261017T193219Z, PR 201, merge 3fefb2d) shipped this same fix, but the current `backend/app/routers/server_time.py` on main at 68540ed sets no header, so the fix is planned again in full rather than dropped.

## Plan Overview
One response header on one endpoint. The FastAPI handler `get_server_time` in `backend/app/routers/server_time.py` gains an injected `Response` parameter and sets `Cache-Control: no-store` on it, so every `GET /api/time` response tells the edge cache (and any browser or proxy) not to store it. The response body and schema are unchanged. Two existing test files gain assertions on the header (one integration test through the real HTTP cycle, one unit test calling the handler directly). Backend only; no frontend, no migration, no new module, no change to `backend/app/main.py`.

### Reproduction and defect classification (for /fix Section R1)
- Symptom: deployed-only. The stale `now` needs the CDN in front of the deployed API; locally nothing caches, so `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` returns two different values both before and after the fix. Earlier runs classified this item deployed-only, and this plan agrees.
- Root cause: locally observable. The missing directive is visible without a CDN: `curl -sI http://localhost:8010/api/time` (backend from `docker compose up`, port 8010) today shows no `Cache-Control` line. After the fix it shows `cache-control: no-store`. In the test client, `client.get("/api/time").headers.get("cache-control")` is `None` before the fix and `no-store` after; that assertion is the failing-first local test.
- Proposed classification: deployed-only symptom with a locally testable cause. Criteria 1 and 2 are verified locally and in CI; criterion 3 is a human check on the deployed environment after merge, which is what the `to_verify` route exists for.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders nothing).

## Backend Plan
- Endpoints: `GET /api/time` (existing, FEAT-1). Behaviour change only: every response carries the header `Cache-Control: no-store`. Status code, body and `response_model` are unchanged.
- Router: in `backend/app/routers/server_time.py`, import `Response` from `fastapi`, add a `response: Response` parameter to `get_server_time`, and set `response.headers["Cache-Control"] = "no-store"` before returning the `ServerTimeResponse`. Update the handler docstring to say why (the edge cache on the deployed environment served a stale `now`). FastAPI merges headers set on the injected `Response` into the serialized response, so the `response_model` path is untouched.
- Scope decision: the header is set on this one route only, not through app-wide middleware in `backend/app/main.py`. The criterion names `GET /api/time` alone, a global no-store would change caching for every other endpoint (gold plating, `user_story_alignment.md` Section 3), and `main.py` is being edited concurrently by TEST-09.
- Directive value: exactly `no-store`, as the criterion states. No `no-cache`, `private`, `max-age=0` or `Pragma` additions.
- Service layer: none. FEAT-1's documented deviation (no service layer for a clock read) stands; a header is transport, not business logic.
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no parameters.
- Response: `200 OK`, body unchanged from FEAT-1 (fields `now`, an ISO 8601 UTC timestamp ending `+00:00`, and `timezone`, the literal `UTC`). New response header: `Cache-Control: no-store`.
- Other methods: unchanged (`POST /api/time` stays `405`; the header is only promised on `GET`).

## Technology Selection
- Cache directive on `GET /api/time`: chose FastAPI's own injected `Response` parameter (an installed dependency, already used by the router) setting one header, over a new caching or middleware dependency and over app-wide `@app.middleware("http")` in `main.py`, because one header on one route needs no library and a global middleware would widen the change beyond the criterion.
- No net-new component, module or dependency is introduced: no new files of application code, no `pyproject.toml` change, no lockfile change.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (POST /api/time still 405), UAT Generation is ENABLED.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/routers/server_time.py: inject `Response` into `get_server_time` and set `Cache-Control: no-store`; docstring states why.
- [B] backend/tests/integration/test_server_time_integration.py: add `test_get_time_sets_cache_control_no_store` asserting the header on a real `GET /api/time` response through the `client` fixture.
- [B] backend/tests/unit/test_server_time_unit.py: add `test_handler_sets_cache_control_no_store_on_response`, calling `server_time.get_server_time` with a `fastapi.Response` instance and asserting its `Cache-Control` header is exactly `no-store`; update the existing `test_handler_reads_clock_on_every_call` to pass a `Response` for the new parameter.
No dependency changes, so no lockfile entry. No E2E spec, because no criterion is covered at E2E (see Criterion coverage). Neither README.md nor docs/DEVELOPMENT.md needs an edit: the change alters no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the router handler sets `Cache-Control: no-store` on the injected `Response` (happy path); the existing clock-per-call test keeps passing with the new parameter (edge case). No new error path exists: the handler has no input to reject.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file `test_server_time_unit.py`)
- Integration tests: a real `GET /api/time` through the session `client` fixture carries `cache-control: no-store` and still returns 200 with the unchanged body; the existing 405 test for POST stays. No database is involved.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6), and an E2E test that only calls the API would be a router integration test (Section 5). No spec file is written.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST still 405, so the change did not widen the route), validated for well-formedness by CI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header on a router, read from the real HTTP cycle; a unit test on the handler backs it. |
| 2 | A test asserts the header on the response | Integration | It is satisfied by the integration test itself (and the unit test), which exists and runs in the pre-push gate and the CI integration and unit jobs; nothing in the UI shows a header. |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Integration (local proxy: the header test of row 1) plus a manual check on the deployed environment | The symptom needs the deployed CDN, which neither a browser test nor any local tier can reach; the executed test covers the cause (the directive is sent), and the human runs the reproduction after deploy on the to_verify route. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response status is 200 and its Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration and unit tests run, Then they report 0 failed and include the Cache-Control assertion |
| 3 | Deployed reproduction returns two different values | covered at Integration (proxy) plus manual deployed check, see Criterion coverage | Given the fix is deployed behind the edge cache, When GET /api/time is requested twice one second apart, Then the two now values differ |
| edge | POST /api/time unchanged | covered at Integration (existing 405 test) | Given the API is running, When a client sends POST /api/time, Then the response status is 405 |

## Manual verification plan
No criterion is visible in the UI: the change is a response header on an API route. Each block below gives the observable check to run instead, from a terminal.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the stack is up from the repo root with `docker compose up -d --build`, and the backend answers on http://localhost:8010.
1. Run `curl -sI http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and the headers include the line `cache-control: no-store` (header names are case-insensitive).
2. Run `curl -s -D - http://localhost:8010/api/time` → the same `cache-control: no-store` line appears above a JSON body with exactly the fields `now` (a timestamp ending `+00:00`) and `timezone` with the value `UTC`, unchanged from FEAT-1.
3. Run `curl -s -i -X POST http://localhost:8010/api/time` → the status line reads `HTTP/1.1 405 Method Not Allowed`, so the route was not widened.

### Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the branch with backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` → the summary line reports `0 failed`, and `test_get_time_sets_cache_control_no_store` and `test_handler_sets_cache_control_no_store_on_response` are among the collected tests (add `-v` to see their names marked PASSED).
2. Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_sets_cache_control_no_store` → it asserts that the `cache-control` header of the `GET /api/time` response equals `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable locally (nothing caches locally, so two local calls differ before and after the fix). The observable check is on the deployed environment, by a human, after the merge lands the item in to_verify.
Prerequisites: the merge is deployed; you know the deployed host name.
1. Run `curl -sI https://DEPLOYED-HOST/api/time` (replace DEPLOYED-HOST) → the headers include `cache-control: no-store`; if the CDN adds an age or cache-status header, it reports a miss or bypass, not a hit.
2. Run `curl -s https://DEPLOYED-HOST/api/time; sleep 1; curl -s https://DEPLOYED-HOST/api/time` → two JSON bodies whose `now` values differ (the second is about one second later). Identical values mean the defect persists: record both bodies on the item and leave it in to_verify.
