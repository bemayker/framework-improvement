# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> Defect: On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
> Reproduction (deployed only): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` — expected two different `now` values, actual identical. Locally both calls differ, because nothing caches them.
> Notes: Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1 (done).

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback (if applicable)
- Comment (tracker): two framework PR-link notices from earlier runs, whose code was since reset off main (sandbox reset #83) → Addressed by: not acted on, because they are framework link notices and carry no feedback on the defect; no human feedback comments exist on the item.
- Assumption (no comment, recorded instead of a question): the CDN in front of the API honours an origin `Cache-Control: no-store` directive. If the CDN is configured to override origin directives, criterion 3 fails at verification and the remedy is CDN configuration, which is outside this repository and outside this item's scope.
- Assumption: `docs/DEVELOPMENT.md` → `## Test environments` has no rows, so the deployed environment is the one the item names (`https://<deployed-host>`); the verifier supplies the real host.

## Plan Overview
One-line backend change: the `GET /api/time` handler sets `Cache-Control: no-store` on its response, so no shared or private cache (the edge CDN included) stores it and every request reaches the origin, which already reads the clock per request (FEAT-1). The header is scoped to this one route only; no app-wide middleware, no other endpoint changes (scope containment: the item names only `/api/time`).

- Repro: deployed-only: `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` returns two identical `now` values before the fix and two different values after (source: item). Reason: the staleness needs the edge CDN that only the deployed environment has; locally nothing caches, so the two calls already differ before the fix. Environment: the deployed environment the item names (no `## Test environments` row exists). The locally automatable part, the header itself, is covered by the integration test of criterion 2.

Implementation shape (FastAPI idiom): add a `response: Response` parameter (from `fastapi`) to `get_server_time` and set `response.headers["Cache-Control"] = "no-store"` before returning the unchanged `ServerTimeResponse`. FastAPI merges headers set on the injected `Response` into the serialised JSON response, so `response_model` and the body contract are untouched. The existing unit tests call `get_server_time()` directly and are updated to pass a `Response()` instance.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` (existing, FEAT-1) — adds response header `Cache-Control: no-store`; body, status and schema unchanged.
- Service layer: none; the router keeps FEAT-1's planned deviation (no service layer for reading the clock). Setting a transport header is router concern.
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no parameters
- Response: 200, headers include `Cache-Control: no-store`; body unchanged from FEAT-1:
  `{"now": "2026-10-05T15:15:52.123456+00:00", "timezone": "UTC"}`

## Technology Selection
- No net-new component, module or dependency: the header is set through FastAPI's own injected `Response` object (installed dependency), chosen over a custom middleware or a hand-built `JSONResponse`, because the injected `Response` keeps `response_model` serialisation intact and touches one route only.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-01_server-time-edge-cache.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server-time-edge-cache_uat_script.md: manual UAT script expanded from the Manual verification plan, including the deployed-environment check for criterion 3
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/routers/server_time.py: inject `response: Response` and set `Cache-Control: no-store` on the response
- [B] backend/tests/integration/test_server_time_integration.py: add a test asserting `response.headers["cache-control"] == "no-store"` on a real HTTP request to `GET /api/time`
- [B] backend/tests/unit/test_server_time_unit.py: pass a `Response()` to the two direct handler calls, and add a test asserting the handler sets `Cache-Control: no-store` on the passed response

No dependency change, so no lockfile entry. No project structure, run configuration, dependency or test-infrastructure change, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. No E2E spec: the defect has no UI surface (see Criterion coverage).

## Testing Strategy
- Unit tests: the router handler sets `Cache-Control: no-store` on the injected `Response` (happy path), and the existing handler tests keep passing with a `Response()` passed in (the `now` contract is unchanged).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file `test_server_time_unit.py`)
- Integration tests: a real HTTP request through the TestClient to `GET /api/time` returns `Cache-Control: no-store` (criterion 1 and 2); the existing FEAT-1 integration tests keep passing (body unchanged). Error case already covered: `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. The endpoint has no UI surface and FEAT-1 shipped no browser spec for it; every criterion is covered at a cheaper tier or by the human deployed check (testing_standards.md Section 6, fourth question asked per criterion). E2E stays ENABLED in CLAUDE.md; this item simply has no criterion that needs a browser.
  - Directory: e2e/tests/ (no file for this item)
  - File: none
- UAT scenarios: one scenario per criterion plus an edge case (a second request within one second carries the header too), and the manual UAT script carrying the deployed check.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a response header on a router, asserted on a real HTTP request/response cycle |
| 2 | A test asserts the header on the response | Integration | the criterion is the test itself: the router integration test asserting the header on the HTTP response (plus a unit test on the handler) |
| 3 | After deploy, the reproduction returns two different values (verified by a human on the deployed environment) | Manual (deployed, human) | needs the edge CDN that only the deployed environment has; no local tier can reproduce it, and it involves no UI. Locally, criterion 1's header test is the automated proxy, and the UAT script carries the deployed check |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response header Cache-Control is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When it runs, Then the header test for GET /api/time passes |
| 3 | Deployed repro returns two different values | covered by the manual deployed check, see Criterion coverage | Given the fix is deployed behind the CDN, When two GET /api/time requests are sent one second apart, Then the two `now` values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Not verifiable through the UI: it is a response header. Observable check instead.
Prerequisites: the backend runs locally (for example `docker compose up` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`).
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line is `HTTP/1.1 200 OK` and the headers include `cache-control: no-store`.
2. Read the body on the same output → it is `{"now": "...+00:00", "timezone": "UTC"}`, unchanged from FEAT-1.

### Criterion 2: A test asserts the header on the response
Not verifiable through the UI: it is a test. Observable check instead.
1. From the repo root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` → all tests pass, including the new header tests.
2. Open `backend/tests/integration/test_server_time_integration.py` → one test asserts the `cache-control` header of the `GET /api/time` response equals `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable through the UI: it is an HTTP call against the deployed host. Observable check instead.
Prerequisites: the fix is merged and deployed to the deployed environment behind its CDN; you know its host (no row exists yet in `docs/DEVELOPMENT.md` → `## Test environments`, so take the host from whoever deploys).
1. Run `curl -si https://<deployed-host>/api/time` → `HTTP 200`, and the headers include `cache-control: no-store` (confirms the deployed build carries the fix).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ, the second later by about one second.
3. Repeat step 2 once more → the `now` values differ again (a CDN hit would repeat the earlier value). If they are identical, record the CDN's own cache header (for example `age:` or `x-cache: HIT`) from step 1 in the verification report: the CDN is overriding origin directives (see Re-Plan Feedback assumption).
