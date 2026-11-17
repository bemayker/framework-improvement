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
  First plan. No PR review comments exist, and no merged-since check applies
  (fresh plan, branched from current main at 8df9812e).
-->
- Comment (tracker): every comment on the task is a framework "PR opened" notice from earlier runs (as relayed by the dispatching session) → Addressed by: not acted on because none states a requirement or a correction; earlier runs' merges of this item were reset off main by #827, so this plan starts from main as it stands.
- Merged since the last plan: n/a (fresh plan, branched from current main at 8df9812ed349fa26e4e14c316bc61757340b04ef; no previous plan artifact exists).

## Plan Overview
Backend only. Make `GET /api/time` send `Cache-Control: no-store` so the edge cache in front of the deployed API stops storing it.

**Verified against the code, and the reason this plan is larger than a one-line header fix:** the dependency FEAT-1 is `complete` in the tracker, but its code is not on main. `backend/app/routers/` holds `health.py`, `notes.py` and `version.py` only; `backend/app/main.py` registers the version, notes and health routers only; a repository-wide search for `server_time`, `api/time` and `Cache-Control` across `backend/`, `frontend/src/` and `e2e/` finds nothing. The feature-map row for BUG-01 records the same (FEAT-1's code removed by the sandbox reset). Criterion 1 cannot be met on a route that does not exist, so this plan recreates the FEAT-1 endpoint to FEAT-1's own acceptance criteria and adds the header in the same change.

Assumption (scope change, recorded here per `user_story_alignment.md` Section 4): recreating FEAT-1's endpoint is the minimum needed for BUG-01's criteria, not gold plating. It is rebuilt to FEAT-1's tracker contract exactly (`{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, a Pydantic schema in `backend/app/schemas/`) and nothing more. Its layer split follows the existing version slice (router, service, schema), which the BUG text and FEAT-1 both name as the shape (`backend/app/routers/server_time.py`, registered in `backend/app/main.py`).

The header is set on this one route only, inside its router, never as an app-wide middleware: the defect is about this endpoint, and a global `no-store` would change caching for every other route (BUG-06 handles `/api/health` separately).

Criterion 3 is a deployed-environment human check and cannot be executed locally (no edge cache exists here). It is covered locally by the integration tests that assert the header the CDN honours and the per-request freshness of `now`; the deployed reproduction is the item's `to_verify` step after merge.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, with response header `Cache-Control: no-store`. Router `backend/app/routers/server_time.py` with `APIRouter(prefix="/api", tags=["time"])` and one handler `get_server_time(response: Response) -> ServerTimeResponse` declared with `response_model=ServerTimeResponse`. The handler sets `response.headers["Cache-Control"] = "no-store"` on FastAPI's injected `Response` and returns the schema instance, so the body stays schema-defined and the header is attached to the same response. The header value is a module-level constant (`NO_STORE = "no-store"`) so the tests import it rather than retyping it.
- Registration: `backend/app/main.py` imports `router as server_time_router` from `app.routers.server_time` and adds `app.include_router(server_time_router)` after the existing three; the module docstring gains one clause naming FEAT-1/BUG-01's server-time router. No change to the CORS middleware or the lifespan.
- Service layer: `backend/app/services/server_time_service.py`, `get_current_utc_time() -> datetime` returning `datetime.now(timezone.utc)` (timezone-aware, never naive), called once per request so two calls differ. `UTC_TIMEZONE_NAME = "UTC"` constant for the `timezone` field.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's aware-datetime type, so a naive value is rejected at construction) and `timezone: Literal["UTC"]`. Pydantic serialises an aware UTC datetime as ISO 8601 with the `Z` designator, which is an explicit UTC offset; the tests assert the parsed value is aware with a zero offset rather than one literal spelling.
- Repository layer: none (no data access).
- Migrations: none.
- No database needed: the endpoint answers when `DATABASE_URL` is unset, as `/api/version` does.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `Content-Type: application/json`, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-17T02:03:10.123456Z", "timezone": "UTC"}
```

- `now`: ISO 8601, UTC, explicit offset (`Z`), computed per request.
- Other methods on the path (e.g. POST): 405, FastAPI's default.

## Technology Selection
- Current UTC time: chose the standard library `datetime.now(timezone.utc)` over any time library, because the stdlib covers an aware UTC timestamp completely.
- Cache directive on one route: chose FastAPI's injected `Response` parameter (installed dependency) over a custom middleware or a new dependency, because a header on one route needs no app-wide machinery and a middleware would widen `no-store` to every route.
- Aware-datetime validation: chose Pydantic's built-in `AwareDatetime` (installed) over a hand-written validator, because it already rejects naive datetimes.
- Router, service and schema modules: no stdlib call, native platform feature or installed dependency replaces the project's own layering, so they are built here following the version slice.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime`, `timezone: Literal["UTC"]`).
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` returning an aware UTC datetime per call, and the `UTC_TIMEZONE_NAME` constant.
- [B] backend/app/routers/server_time.py: `GET /api/time` handler that sets `Cache-Control: no-store` and returns `ServerTimeResponse`; exports `NO_STORE`.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC, per-call freshness) and the schema (naive datetime rejected).
- [B] backend/tests/integration/test_server_time_integration.py: router tests through the real HTTP cycle (200 shape, offset, `Cache-Control: no-store`, two calls differ, no database needed, POST 405).
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import and register `server_time_router`; one docstring clause naming it.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`.

No dependency is added or changed, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the change adds one route and alters no project structure, run configuration, dependency or test infrastructure. No E2E spec: no criterion requires navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time` (returns an aware datetime with zero UTC offset; two calls are not equal across a monkeypatched clock; never naive) and `ServerTimeResponse` (rejects a naive datetime with a validation error); `create_app` registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_service_unit.py`, existing `test_main_unit.py`)
- Integration tests: `GET /api/time` through `TestClient` using the shared `client` fixture from `backend/tests/conftest.py`: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with zero offset, response header `Cache-Control` equals `no-store` (imported `NO_STORE`), two consecutive calls return different `now` values (the service's clock monkeypatched to two distinct instants so the test never sleeps), the endpoint answers with `DATABASE_URL` unset, POST returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E is ENABLED, but no criterion involves navigation or interaction through the UI (backend only, no frontend surface), so per `testing_standards.md` Section 6 the tier is not warranted.
  - Directory: e2e/tests/
  - File: none (would be `BUG-01_server_time_edge_cache.spec.ts`; not created)
- UAT scenarios: one scenario per criterion (header present; header asserted by tests; deployed freshness) plus one edge case (POST is rejected with 405 and does not serve a cached body).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | `test_get_server_time_sets_cache_control_no_store`, `test_get_server_time_returns_200_with_utc_now_and_timezone` | verifying it needs no navigation or interaction: it is a response header of a router endpoint, read off the HTTP cycle |
| 2 | A test asserts the header on the response. | Integration | `test_get_server_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: the criterion is satisfied by the router test itself existing and passing |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration | `test_get_server_time_returns_fresh_now_per_request`, `test_get_server_time_sets_cache_control_no_store`, `test_get_current_utc_time_returns_new_value_per_call` | no UI is involved and the edge cache exists only on the deployed environment; locally the tests assert the two causes (the no-store directive the CDN honours and per-request computation), and the deployed reproduction is the human `to_verify` check in the Manual verification plan |

Supporting tests that keep FEAT-1's recreated contract honest (not mapped to a BUG-01 criterion): `test_get_server_time_answers_when_database_url_is_unset`, `test_post_server_time_returns_405_method_not_allowed`, `test_get_current_utc_time_returns_aware_utc_datetime`, `test_server_time_response_rejects_naive_datetime`, `test_create_app_registers_server_time_route`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response status is 200 and the Cache-Control header is no-store |
| 2 | A test asserts the header on the response. | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the run passes including the Cache-Control assertion |
| 3 | After deploy, the reproduction above returns two different values. | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed environment behind its edge cache, When GET /api/time is requested twice a second apart, Then the two now values differ |

## Manual verification plan
<!--
  No criterion has a UI surface: every step below reads an HTTP response or a
  test run. Criterion 3 runs on the deployed environment only.
-->
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`.
Prerequisites: the stack is running locally with `docker compose up -d --build` from the repository root (backend on port 8010).
1. Run `curl -i http://localhost:8010/api/time` → status line `HTTP/1.1 200 OK`.
2. Read the response headers → a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body → JSON of the form `{"now":"2026-11-17T02:03:10.123456Z","timezone":"UTC"}`, with `now` ending in `Z` (or `+00:00`) and `timezone` exactly `UTC`.

### Criterion 2: A test asserts the header on the response.
Prerequisites: backend dependencies installed (`uv sync --directory backend`); a database is not required for these files.
1. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_server_time_sets_cache_control_no_store` asserts the response's `Cache-Control` header equals `no-store`.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.

### Criterion 3: After deploy, the reproduction above returns two different values.
Prerequisites: this item's PR is merged and deployed; you know the deployed API host (substitute it for `<deployed-host>`).
1. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies are printed.
2. Compare the two `now` values → they differ (the second is about one second later than the first).
3. Run `curl -sI https://<deployed-host>/api/time` → the headers include `cache-control: no-store`, and any CDN cache-status header (for example `cf-cache-status` or `x-cache`) does not report a HIT.
4. Repeat step 1 twice more → every pair differs; a single identical pair means the edge cache still stores the response and the item fails verification.
