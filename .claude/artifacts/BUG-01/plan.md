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
- Comment (tracker): bot "PR opened" comments from earlier runs → Addressed by: not acted on because they carry no feedback on scope or behaviour; they only record PRs of previous sandbox runs that a reset has since undone.
- Dispatch note (planning input, not a comment): FEAT-1 is complete in the tracker, but its code is absent from main. Verified at plan base cfa85c3953dc086c6b05c27c3937660e30237eed: `backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py` and `backend/app/services/server_time_service.py` do not exist, and `backend/app/main.py` registers only the version, notes and health routers; `git log` shows the last BUG-01 fix (2a70e94c, #985) was reverted by the reset commit cfa85c39. → Addressed by: this plan restores FEAT-1's endpoint (its contract taken from the FEAT-1 tracker item 123k99ctzxk) together with the fix, recorded as a scope change under `## Scope changes`.
- Merged since the last plan: n/a (fresh plan, branched from current main at cfa85c39).

## Plan Overview
Backend only. Restore the FEAT-1 server time endpoint `GET /api/time` in the project's router to service layering (router, Pydantic schema, service; no repository, no database) and register it in the app factory, with the BUG-01 fix built in: the router sets `Cache-Control: no-store` on every response so an edge cache in front of the API cannot serve one cached `now` to every caller. Tests: unit tests for the service and the schema, router integration tests through the shared `client` fixture asserting the header, the body shape, the explicit UTC offset and per-request freshness, and an app-factory unit test asserting the route is registered. No frontend, no E2E spec (no UI surface). The third criterion is verified by a human on the deployed environment after merge (the item carries the `mayker:to-verify` tag).

Assumption (recorded, not blocking): the restored FEAT-1 contract is exactly the FEAT-1 tracker item's: 200 with `now` as an ISO 8601 UTC timestamp with an explicit offset, computed per request, and `timezone` fixed to `"UTC"`, body defined by a Pydantic schema. Nothing beyond that contract and the header is added (no query parameters, no other cache headers such as `Pragma` or `Expires`).

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/time`, returns the current server time in UTC and sets the response header `Cache-Control: no-store`. Router `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, following the shape of `backend/app/routers/version.py`; the handler takes FastAPI's injected `Response` and sets the header on it, then returns the schema instance (so `response_model` serialisation is kept). Registered in `backend/app/main.py` with `app.include_router(server_time_router)` next to the existing routers, and the module docstring's list of registering features gains one clause for it.
- Service layer: `backend/app/services/server_time_service.py`, one public function `get_server_time() -> datetime` returning `datetime.now(UTC)` (timezone-aware, computed on every call). It exists as its own layer so tests can substitute the clock without patching `datetime`.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic rejects a naive datetime, so the "never naive" rule is enforced by the type) and `timezone: Literal["UTC"]`.
- Repository layer: none, no data access.
- Migrations: none.
- Docstrings: every new module carries a module docstring naming BUG-01 (and FEAT-1 for the restored contract) and the why; every public function and class a one-line docstring (`.claude/project-standards.md` documentation convention, checked by its `docstrings` gate row).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, `Content-Type: application/json`, body:

```json
{"now": "2026-11-24T20:31:56.123456Z", "timezone": "UTC"}
```

  `now` is Pydantic's serialisation of an aware UTC datetime (ISO 8601 with the explicit UTC designator `Z`, equivalent to `+00:00`); it is never naive. Any other method (for example POST) returns FastAPI's 405.

## Technology Selection
- Server clock (`server_time_service.get_server_time`): chose the standard library's `datetime.now(datetime.UTC)` over any third-party time library, because the stdlib returns an aware UTC datetime directly.
- Non-naive guarantee (`ServerTimeResponse.now`): chose Pydantic's installed `AwareDatetime` type over a hand-written validator, because the dependency the project already installs enforces it in one annotation.
- Cache header: chose setting the header on FastAPI's injected `Response` in the router over a new middleware or a caching dependency, because the fix is scoped to one route and the framework already provides the mechanism.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: router for `GET /api/time`, sets `Cache-Control: no-store`, returns `ServerTimeResponse` (restores FEAT-1, fixes BUG-01).
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime`, `timezone: Literal["UTC"]`).
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning the aware current UTC datetime per call.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service and the schema (aware UTC value, fresh per call, naive datetime rejected).
- [B] backend/tests/integration/test_server_time_integration.py: router integration tests (200 shape, explicit offset, per-request freshness, `Cache-Control: no-store`, 405 on POST).
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: import and register the server time router; extend the module docstring's registration list.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`.

No dependency manifest changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the item adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `server_time_service.get_server_time` returns an aware datetime whose UTC offset is zero (happy path); two calls with a substituted clock return the two different values (edge case: computed per call, not cached at import); `ServerTimeResponse` rejects a naive datetime with a validation error (error case). App factory: the `/api/time` route is registered.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_service_unit.py`; `test_main_unit.py` extended)
  - Test ids: `test_get_server_time_returns_aware_utc_datetime`, `test_get_server_time_returns_fresh_value_per_call`, `test_server_time_response_rejects_naive_datetime`, `test_create_app_registers_server_time_route`
- Integration tests: through the shared session-scoped `client` fixture (`backend/tests/conftest.py`), no database needed. `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`; `test_get_time_returns_200_with_utc_now_and_timezone` asserts status 200, exactly the keys `now` and `timezone`, `timezone == "UTC"`, and that `datetime.fromisoformat(body["now"])` is aware with a zero UTC offset; `test_get_time_computes_now_per_request` substitutes `server_time_service.get_server_time` with `monkeypatch` to return two distinct aware datetimes in sequence and asserts two calls return two different `now` values each carrying the header (no sleep, deterministic); `test_post_time_returns_405_method_not_allowed` is the error case.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (`test_server_time_integration.py`)
- E2E tests: not warranted. The item has no UI surface; no criterion needs navigation or interaction (testing_standards.md Section 6, asked per criterion below). No spec file under e2e/tests/.
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge case (a POST to `/api/time` is refused), phrased as API and deployed-environment checks, not browser interactions.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | `test_get_time_sets_cache_control_no_store`, `test_get_time_computes_now_per_request` | verifying it needs no navigation or interaction: it is a response header of a router, read in the HTTP request/response cycle |
| 2 | A test asserts the header on the response. | Integration | `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: the criterion is satisfied by the existence and pass of that router integration test |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration | `test_get_time_computes_now_per_request`, `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction, and no local test can reproduce an edge cache: the integration tests cover the two preconditions (fresh `now` per request, and the no-store directive the CDN honours); the final confirmation is the human deployed check in `## Manual verification plan` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the response status is 200 and its Cache-Control header is no-store |
| 2 | A test asserts the header on the response. | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then the run passes including the header test |
| 3 | After deploy, the reproduction above returns two different values. | covered at Integration, see Criterion coverage; final check is human on the deployed host | Given the fix is deployed behind the CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
This item has no UI. Every criterion is verified through HTTP requests or test runs, which is the observable check a person reads instead of a click path.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`.
Prerequisites: the backend runs locally from the feature branch, started with `uv run --directory backend uvicorn app.main:app --port 8000` (no database is needed for this endpoint).
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the first line reads `HTTP/1.1 200 OK`, the headers include `cache-control: no-store`, and the body has the shape `{"now":"2026-11-24T20:31:56.123456Z","timezone":"UTC"}` (with the current time, ending in `Z`).
2. Run `curl -si -X POST http://localhost:8000/api/time` → the first line reads `HTTP/1.1 405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response.
Prerequisites: the feature branch is checked out and backend dependencies are installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → the test `test_get_time_sets_cache_control_no_store` asserts the `cache-control` header equals `no-store`.

### Criterion 3: After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
Prerequisites: the fix is merged and deployed; you know the deployed API host (shown here as `<deployed-host>`). This cannot be verified locally, because locally nothing caches the response.
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header (if the CDN adds an `age` or cache-hit header, it must not show a hit).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ by roughly one second, for example `2026-11-24T21:00:00.120000Z` then `2026-11-24T21:00:01.135000Z`.
3. Repeat step 2 once more → the values differ again; identical values on either attempt mean the edge cache still serves the response and the item fails verification.

## Scope changes

- 2026-11-24 Restore the FEAT-1 server time endpoint alongside the BUG-01 fix: create backend/app/routers/server_time.py, backend/app/schemas/server_time.py, backend/app/services/server_time_service.py, backend/tests/unit/test_server_time_service_unit.py and backend/tests/integration/test_server_time_integration.py, and register the router in backend/app/main.py with its test in backend/tests/unit/test_main_unit.py. Reason: FEAT-1 is complete in the tracker but its code is absent from main at plan base cfa85c39 after the sandbox reset, so the route BUG-01 fixes does not exist; the restored contract is FEAT-1's own and nothing beyond it is added.
