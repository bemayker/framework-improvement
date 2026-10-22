# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> Defect: On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> Reproduction (deployed only): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` — expected two different `now` values, actual identical. Locally both calls differ, because nothing caches them.
>
> Notes: Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): none actionable. The item carried only prior run PR notices (`decisions.md`, 6.1: 0 actionable tracker comments) → Addressed by: nothing to act on; recorded so the count is checkable.
- Merged since the last plan: n/a (fresh plan, plan base 7273cd49f917861d391dd9a8fc2ca60c95398762 is current `main`).
- Assumption (scope): the fix is the header on `GET /api/time` only. No global cache middleware and no header on other endpoints, because the item names one endpoint and one file and `user_story_alignment.md` Section 3 forbids widening it. `no-store` alone is the directive; `no-cache`, `private`, `max-age=0` or `Pragma` are not added, because criterion 1 names exactly `no-store`, which already forbids any shared cache from storing the response.
- Assumption (criterion 3): the deployed-environment check cannot be executed by CI or by the build; it is a manual post-deploy step in `## Manual verification plan`. The executed test that stands behind it is criterion 1's header assertion, which removes the cause the defect names.

## Plan Overview
One backend change in the existing FEAT-1 router: `get_server_time` takes FastAPI's injected `Response` parameter and sets `Cache-Control: no-store` on it, so the header is merged into the JSON response FastAPI builds from `response_model=ServerTimeResponse`. The return type, schema, OpenAPI declaration and body stay exactly as FEAT-1 shipped them. One integration test asserts the header through the shared `client` fixture. No frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` (existing, FEAT-1). Behaviour change: every 200 response carries the header `Cache-Control: no-store`.
- Router (`backend/app/routers/server_time.py`): import `Response` from `fastapi` beside `APIRouter`; change the signature to `def get_server_time(response: Response) -> ServerTimeResponse:`; set `response.headers["Cache-Control"] = "no-store"` before returning `ServerTimeResponse(now=current_utc_time())`. A one-line comment says why (the response is a per-request clock reading, and a CDN in front of the API caches responses without a directive). Keep `response_model=ServerTimeResponse` and the returned model unchanged, so the body serialisation (the pinned `Z` suffix) and the OpenAPI schema FEAT-1's unit test asserts are untouched. Do not switch to returning a `JSONResponse`: that bypasses `response_model` serialisation.
- Header value as a module-level constant is not needed: one literal at its single use site (KISS, `coding_standards.md` Section 1).
- Service layer: none (no business logic changes).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no parameters, no body.
- Response: 200, `Content-Type: application/json`, **new header `Cache-Control: no-store`**, body unchanged: `{"now": "2026-10-22T17:29:35.123456Z", "timezone": "UTC"}`.

## Technology Selection
- Cache directive on the response: chose FastAPI's injected `Response` parameter (an installed dependency, rung 3) with the standard HTTP `Cache-Control: no-store` header (a native platform feature, rung 2) over a custom middleware or a new caching library, because a per-route header on one endpoint needs neither. No net-new module, component or dependency is introduced.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/routers/server_time.py: inject `response: Response`, set `Cache-Control: no-store` on it, comment why; return value and `response_model` unchanged.
- [B] backend/tests/integration/test_server_time_integration.py: add the header tests described in Testing Strategy.

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: none added. The change is a router-layer response header with no service or utility logic (`testing_standards.md` Section 6, first question: no). The existing `backend/tests/unit/test_server_time_unit.py` must stay green, in particular `test_openapi_declares_server_time_response_fields`, which proves the response model is unchanged.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests (router, real HTTP request/response cycle through the session-scoped `client` fixture in `backend/tests/conftest.py`), added to `backend/tests/integration/test_server_time_integration.py`:
  - `test_get_time_sets_cache_control_no_store`: `client.get("/api/time")` returns 200 and `response.headers["cache-control"] == "no-store"` (exact value, not a substring, so a weaker directive such as `no-cache` fails).
  - `test_get_time_sets_cache_control_on_every_call`: two consecutive calls each carry `Cache-Control: no-store` (the header is set per request, not only on a first response).
  - Existing tests in the file stay unchanged and green, including the body shape and freshness tests.
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion involves navigation or interaction through the UI, and calling the API directly from a browser spec is a router integration test (`testing_standards.md` Section 5). No `e2e/tests/` file is produced.
  - Directory: e2e/tests/
  - File: not produced for this item
- UAT scenarios: one per criterion plus one edge case (header value is exactly `no-store` on repeated calls).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header on a router, asserted through the HTTP test client. |
| 2 | A test asserts the header on the response | Integration | The criterion is satisfied by the integration test itself (`test_get_time_sets_cache_control_no_store`); there is no UI involved. |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | The deployed CDN cannot be reached by any test tier; the executed test covering it is the header assertion that removes the cause, and the deployed check itself is the manual step in `## Manual verification plan`. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests `GET /api/time`, Then the response has header `Cache-Control` equal to `no-store` |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then they report 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the fix is deployed behind the CDN, When `GET /api/time` is requested twice a second apart, Then the two `now` values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Not verifiable through the UI: it is a response header. The observable check is the header in a raw HTTP response.
Prerequisites: the backend is running locally (`docker compose up` or `uv run --directory backend uvicorn app.main:app --port 8000`), reachable at `http://localhost:8000`.
1. Run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body with `now` ending in `Z` and `timezone` equal to `UTC`.
2. Run the same command a second time → `cache-control: no-store` is present again.

### Criterion 2: a test asserts the header on the response
Prerequisites: the backend dependencies are installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the run includes `test_get_time_sets_cache_control_no_store` and `test_get_time_sets_cache_control_on_every_call`, and reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: after deploy, the reproduction returns two different values
Not verifiable locally or through the UI: only the deployed environment has the CDN. The observable check is two responses from the deployed host.
Prerequisites: the fix is merged and deployed; you know the deployed host name (for example `tasknotes.example.com`; substitute the real one).
1. Run `curl -si https://tasknotes.example.com/api/time` → `200`, a `cache-control: no-store` header line, and note the `now` value (for example `2026-10-22T18:01:12.345678Z`).
2. Wait one second, then run the same command again → a different `now` value, at least one second later than the first. If the CDN adds an `age:` or cache-status header (such as `x-cache: HIT`), it must not report a hit.
3. Repeat steps 1 and 2 once more → the two `now` values differ again, confirming the result was not a one-off cache miss.
