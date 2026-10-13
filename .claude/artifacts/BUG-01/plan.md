# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> Reproduction (deployed only): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`. Expected: two different `now` values. Actual: identical values. Locally both calls differ, because nothing caches them.
>
> Notes: Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback (if applicable)
- Comment (tracker): three framework notes "mayker-dev: PR opened for BUG-01" linking PRs #67, #74 and #93 from earlier, reset runs → Not acted on: they are link notes, not feedback. Verified in the worktree at 366d535 that the fix is absent: `backend/app/routers/server_time.py` sets no response header and no file under `backend/` mentions `Cache-Control` or `no-store`.
- Assumption (no comment): the header is set only on `GET /api/time`, not app-wide. A global middleware would change every other endpoint's caching, which no criterion asks for (`user_story_alignment.md` Section 3).
- Assumption (no comment): the value is exactly `no-store`, nothing added (`no-cache`, `Pragma`, `Expires`). Criterion 1 names that value and `no-store` alone forbids shared caches from storing the response.
- Assumption (no comment): criterion 3 cannot be executed by the build, since no deployed host is configured in this repo. It is covered by the manual verification plan below and stays open for a human after merge (the item's `to_verify` route).

## Plan Overview
One-line backend fix: the FEAT-1 route handler takes FastAPI's injected `Response` and sets `Cache-Control: no-store` on it before returning the unchanged body. The response body, schema, status code and route registration in `backend/app/main.py` are untouched. One integration test asserts the header on a real request/response cycle. No frontend, no database, no dependency change.

Reproduction shape (for the /fix R1 classification): the defect is deployed-only. Locally the response is never cached, so the observable local symptom is the missing header, not a stale value: `curl -si http://localhost:8000/api/time` shows no `Cache-Control` line before the fix and `Cache-Control: no-store` after. The integration test in this plan is that local reproduction in executable form (it fails on 366d535, passes after the fix). The stale-value symptom itself only reproduces through the CDN on the deployed host.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item)

## Backend Plan
- Endpoints: `GET /api/time` (existing, FEAT-1). Handler signature gains `response: Response` (from `fastapi`); it sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse` as before. FastAPI merges headers set on the injected `Response` into the serialized response.
- Service layer: none (no business logic changes).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no parameters (unchanged)
- Response: 200, header `Cache-Control: no-store` (new), body unchanged, e.g. `{"now": "2026-10-13T08:00:00Z", "timezone": "UTC"}`

## Technology Selection
- Cache header on one route: chose FastAPI's injected `Response` parameter (installed dependency, rung 3) over a custom middleware or a new caching dependency, because setting one header on one route is a framework feature and a middleware would widen scope to every endpoint.
- No net-new component, module or dependency is introduced otherwise.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/routers/server_time.py: inject `Response` and set `Cache-Control: no-store` on `GET /api/time`
- [B] backend/tests/integration/test_server_time_integration.py: add a test asserting `Cache-Control: no-store` on the `GET /api/time` response

No dependency change, so no lockfile. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: not warranted. The change adds no service or utility logic, only a response header set by the framework; asserting it on a direct function call would test FastAPI, not this code.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: one new router test, `test_get_time_sets_cache_control_no_store`, in the existing FEAT-1 file: `client.get("/api/time")` returns 200 and `response.headers["cache-control"] == "no-store"`. Existing FEAT-1 tests in the file must still pass (body shape unchanged). Uses the existing `client` fixture, no database.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion requires navigation or interaction through the UI; the endpoint has no UI surface.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus one edge case (header present on two consecutive requests), validated for well-formedness, not executed.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header on a router, asserted on a real HTTP request/response cycle |
| 2 | A test asserts the header on the response | Integration | Satisfied by the integration test itself existing and passing; no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Manual (deployed environment) | Requires the deployed CDN, which no local or CI tier has; locally the value is never cached, so only the human deployed check covers it. Local proxy for it: criterion 1's integration test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Header `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running, When I GET /api/time, Then the response has header Cache-Control with value no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When I run the server time integration tests, Then 0 failed |
| 3 | Deployed reproduction returns two different values | covered by a human on the deployed environment | Given the fix is deployed behind the CDN, When I GET /api/time twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Not verifiable through the UI: it is a response header. Observable check instead:
Prerequisites: backend running locally (`docker compose up -d` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`).
1. Run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body with `now` ending in `Z` and `timezone` equal to `UTC`.
2. Run the same command a second time → the `cache-control: no-store` line is present again and `now` is later than in step 1.

### Criterion 2: A test asserts the header on the response
Prerequisites: repo checked out on the BUG-01 branch, uv installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → output ends with `0 failed` and lists `test_get_time_sets_cache_control_no_store` among the run tests when run with `-v`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["cache-control"] == "no-store"` on `GET /api/time`.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable through the UI and not locally: requires the deployed host behind its CDN.
Prerequisites: the fix merged and deployed; the deployed host name known (replace `<deployed-host>`).
1. Run `curl -si https://<deployed-host>/api/time` → `cache-control: no-store` in the headers; note the `now` value.
2. Wait one second, run `curl -s https://<deployed-host>/api/time` again → `now` differs from step 1 (later by about one second).
3. Optional: repeat steps 1 and 2 three times → every pair of `now` values differs; any identical pair means the CDN still caches and the item fails verification.
