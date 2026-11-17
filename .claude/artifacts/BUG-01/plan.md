# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> **Defect.** On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> **Reproduction (deployed only):** `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`. Expected: two different `now` values. Actual: identical values. Locally both calls differ, because nothing caches them.
>
> **Notes:** Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.
>
> (ClickUp task 123k99cwybn, status "to do", tag `mayker:to-verify`.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): about 46 comments on the item, all mayker-dev's own "PR opened" notes from earlier runs → not acted on because none carries stakeholder feedback, a correction or an amendment to the feature text (dispatch prompt, confirmed by the item description being the only requirement source).
- Merged since the last plan: n/a (fresh plan, branched from current main e8e068c64eb9385afb433092f283436926bfbcbc; no previous plan of this item exists on main).
- Assumption (scope change, recorded per `user_story_alignment.md` Section 4): the item says "FEAT-1 is complete", and FEAT-1 is `complete` in the tracker, but its code is **absent from main**: there is no `backend/app/routers/server_time.py`, no schema, no service, and `backend/app/main.py` registers only the version, notes and health routers (verified on main at the plan base commit; the map row for BUG-01 records the same, after the sandbox reset). A `Cache-Control` header cannot be set on a route that does not exist, so this plan **recreates FEAT-1's `GET /api/time` endpoint exactly to FEAT-1's own acceptance criteria** (200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request and never naive, body defined by a Pydantic schema in `backend/app/schemas/`) and adds the `no-store` directive on it. Nothing beyond FEAT-1's contract plus this item's header is added: no app-wide cache middleware, no other route gets the header.

## Plan Overview
Backend only. Recreate the `GET /api/time` slice (router, schema, service) following the existing router/service/schema layering of `backend/app/` (`.claude/project-standards.md` Layout and Canonical modules), register its router in `backend/app/main.py`, and set `Cache-Control: no-store` on that route's response only. Tests: a service unit test, a router integration test that asserts the header (criterion 2) plus FEAT-1's shape/offset/freshness, and a `create_app` registration unit test. Criterion 3 is a human check on the deployed environment, carried by the manual verification plan; locally it is backed by the per-request freshness test.

Design decision: the header is set on this route through the injected `Response` (`response.headers["Cache-Control"] = "no-store"`), not through an app-wide middleware, because the criterion names `GET /api/time` only and widening the directive to every route is gold plating (`user_story_alignment.md` Section 3).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time with `Cache-Control: no-store`. Router `backend/app/routers/server_time.py`, `router = APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time(response: Response) -> ServerTimeResponse` with `response_model=ServerTimeResponse`. The handler sets `response.headers["Cache-Control"]` to a module constant `NO_STORE = "no-store"`, then returns `ServerTimeResponse(now=server_time_service.get_current_utc_time(), timezone=server_time_service.UTC_TIMEZONE_NAME)`. Import the service **as a module** (`from app.services import server_time_service`, the same shape `routers/health.py` uses) so tests can monkeypatch the clock on the service module.
- Service layer: `backend/app/services/server_time_service.py`, `UTC_TIMEZONE_NAME = "UTC"` and `get_current_utc_time() -> datetime` returning `datetime.now(timezone.utc)`, read on every call, never cached at import.
- Schema: `backend/app/schemas/server_time.py`, `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (pydantic rejects a naive value at construction) and `timezone: Literal["UTC"]`. Pydantic serialises an aware UTC datetime with an explicit offset (`Z`), which satisfies FEAT-1's "explicit offset" rule.
- App registration: `backend/app/main.py` imports `from app.routers.server_time import router as server_time_router` and adds `app.include_router(server_time_router)` after the existing three; update the module docstring's list of registering features to name FEAT-1/BUG-01. No change to the CORS middleware (it already allows `GET`).
- Repository layer: none, the endpoint touches no database.
- Migrations: none.
- Conventions the gate enforces (`.claude/project-standards.md`): every new module carries a module docstring naming the work item and the design reason (the no-store reason goes on the router module), and every public class and function a one-line docstring (`uv run ruff check --select D101,D102,D103`), plus `uv run ruff check`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `Content-Type: application/json`, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-17T18:52:14.123456Z", "timezone": "UTC"}
```

- `now`: ISO 8601, UTC, explicit offset (never naive), a fresh value per request. `timezone`: always the literal `"UTC"`.
- Other methods (for example `POST /api/time`): 405, FastAPI's default.

## Technology Selection
- Server clock: chose the standard library's `datetime.now(timezone.utc)` over any time library, because the stdlib covers an aware UTC timestamp fully.
- Naive-datetime guard: chose pydantic's `AwareDatetime` (pydantic is already installed via FastAPI) over a hand-written validator, because the installed type rejects a naive value on its own.
- Cache directive: chose setting the header on the injected FastAPI `Response` (installed dependency) over a custom middleware or a new caching library, because one route needs one header.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router, sets `Cache-Control: no-store` on the response
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` pydantic schema (`now: AwareDatetime`, `timezone: Literal["UTC"]`)
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` and `UTC_TIMEZONE_NAME`
- [B] backend/tests/unit/test_server_time_service_unit.py: service and schema unit tests
- [B] backend/tests/integration/test_server_time_integration.py: router integration tests, including the `Cache-Control: no-store` assertion
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server-time router, docstring names FEAT-1/BUG-01
- [B] backend/tests/unit/test_main_unit.py: add the `/api/time` route registration test

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the item adds one route inside the existing layout and changes no project structure, run configuration, dependency or test infrastructure. No E2E spec is planned: no criterion requires navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: service layer `get_current_utc_time` (aware, UTC offset, fresh per call) and the schema's naive-datetime rejection; `create_app` registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_service_unit.py`; the registration test joins the existing `test_main_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/time` through the session `client` fixture in `backend/tests/conftest.py`: 200 with the `Cache-Control: no-store` header, body shape and explicit offset, per-request freshness (monkeypatch `server_time_service.get_current_utc_time` to return two distinct aware datetimes in turn, never a real `sleep`), and 405 on `POST`. No database is needed.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E Tests is ENABLED, but no criterion needs the browser: the header and the freshness are HTTP behaviours, and the deployed reproduction is a human `curl` check against an edge cache that does not exist locally or in CI.
  - Directory: e2e/tests/ (no spec added)
  - File: none
- UAT scenarios: one scenario per criterion plus one edge case (a non-GET method), in Gherkin.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_server_time_returns_no_store_cache_control`, `test_create_app_registers_server_time_route` | verifying it needs no navigation or interaction: it is a response header on a router, read from the HTTP response |
| 2 | A test asserts the header on the response | Integration | `test_get_server_time_returns_no_store_cache_control` | the criterion is that test itself, a router-level HTTP assertion with no UI involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Integration | `test_get_server_time_returns_fresh_now_per_request`, `test_get_server_time_returns_200_with_utc_now_and_explicit_offset`, `test_get_current_utc_time_returns_fresh_value_per_call` | the edge cache exists only on the deployed environment, so no local tier can reproduce it; the executed tests prove the origin returns a fresh, offset-carrying `now` per request, and the deployed check itself is the human step in the Manual verification plan |

Further unit tests the builder writes (Section 1.1 minimum cases, not tied to one row): `test_get_current_utc_time_returns_timezone_aware_utc`, `test_server_time_response_rejects_naive_datetime`; and integration `test_post_server_time_returns_405_method_not_allowed`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response has status 200 and header Cache-Control no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the no-store header test passes |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage (deployed check is manual) | Given the deployed API behind its CDN, When GET /api/time is requested twice a second apart, Then the two now values differ |
| edge | Non-GET method | covered at Integration | Given the API is running, When a client sends POST /api/time, Then the response status is 405 |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion is a response header, not visible in the UI; the observable check is the header in a `curl` response.
Prerequisites: the backend runs locally (for example `uv run --directory backend uvicorn app.main:app --port 8000`) on the BUG-01 branch.
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`, the headers include `cache-control: no-store`, and the body looks like `{"now":"2026-11-17T18:52:14.123456Z","timezone":"UTC"}`.
2. Check the `now` value from step 1 → it ends in `Z` (or `+00:00`), never a bare time with no offset, and `timezone` is `UTC`.
3. Run `curl -si http://localhost:8000/api/health` → its headers carry no `cache-control: no-store` added by this item (the directive is on `/api/time` only).

### Criterion 2: A test asserts the header on the response
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_server_time_returns_no_store_cache_control` asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion is verifiable only on the deployed environment, behind its CDN; there is no UI step. The observable check is two `curl` bodies.
Prerequisites: the BUG-01 change is merged and deployed; you know the deployed host name.
1. In a terminal, run `curl -si https://<deployed-host>/api/time` → status 200, a `cache-control: no-store` header is present in the response the CDN returns, and the body carries a `now` value.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (the second is about one second later than the first).
3. If the two `now` values are identical, record the CDN's cache-status header from step 1 (for example `cf-cache-status` or `x-cache`) on the item: a `HIT` means the CDN is still caching despite the directive, and the item stays unverified.

## Scope changes

- 2026-11-17 Removed the unused `import os` from backend/app/main.py. Reason: the commit gate's `uv run ruff check` row refuses any touched file with a lint error, and the pre-existing F401 sat in a file this item must modify.
