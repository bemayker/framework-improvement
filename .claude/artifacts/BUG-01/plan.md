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
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): none actionable. The item's comments are earlier runs' bot PR notices only (dispatch note), so no comment changes this plan.
- Merged since the last plan: n/a (fresh plan on a branch not yet created; plan base is main at 64dae872f765e6a62b6dd6388ddf3e1e76326829).
- Assumption (dependency state): FEAT-1 is `complete` in ClickUp (task 123k99ctzxk), but its code is not on main at 64dae87. `backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py` and `backend/app/services/server_time_service.py` do not exist (only stale `__pycache__/server_time.*.pyc` files remain), and `backend/app/main.py` registers only the version, notes and health routers. The sandbox reset `448324b` removed the code an earlier BUG-01 merge (`5f90f89`) had added. BUG-01's criterion 1 cannot be met on an endpoint that does not exist, so this plan recreates the `GET /api/time` endpoint, **bounded strictly to FEAT-1's own acceptance criteria** (200 with `{"now", "timezone": "UTC"}`, per-request `now`, timezone-aware UTC never naive, Pydantic schema in `backend/app/schemas/`, unit and integration tests for shape, offset and freshness), and adds the BUG-01 header on top. Nothing beyond FEAT-1's and BUG-01's criteria is added.
- Assumption (offset spelling): FEAT-1 asks for "ISO 8601 UTC with explicit offset". Pydantic v2 serializes a timezone-aware UTC `datetime` with the ISO 8601 UTC designator `Z` (e.g. `2026-11-06T16:44:29.123456Z`). `Z` is an explicit UTC offset under ISO 8601, so no custom serializer is added. Tests assert that the parsed value is timezone-aware with `utcoffset() == timedelta(0)`, and accept either `Z` or `+00:00`, rather than pinning a literal.
- Scheduler note answered: **yes, BUG-01 modifies `backend/app/main.py`** (one import line and one `app.include_router(server_time_router)` line). Serialize its build with TEST-09 when TEST-09's manifest also lists `main.py`.

## Plan Overview
A backend-only fix. It recreates FEAT-1's `GET /api/time` endpoint in the project's Router to Service shape (as the version endpoint does: `routers/version.py`, `services/version_service.py`, `schemas/version.py`) and registers it in `create_app()`. On top of that it sets `Cache-Control: no-store` on every `GET /api/time` response, so the CDN in front of the deployed API stops storing it. There is no repository layer, no database access, no migration and no frontend change. The header is set on this route only, so `/api/version`, `/api/health` and the notes routes keep their current headers.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/time` returns the current server time in UTC and always carries the response header `Cache-Control: no-store`. A `fastapi.APIRouter(prefix="/api", tags=["time"])` in `backend/app/routers/server_time.py` is registered in `backend/app/main.py` `create_app()` next to the existing `include_router` calls, and the factory is otherwise unchanged. The handler takes FastAPI's injected `Response` and sets `response.headers["Cache-Control"]` from a module-level constant (`NO_STORE_CACHE_CONTROL = "no-store"`) with a one-line "why" comment naming the CDN. Do not use a global middleware: the criterion is scoped to this endpoint, and a middleware would change every route's headers.
- Service layer: `backend/app/services/server_time_service.py` → `get_current_utc_time() -> datetime` returns `datetime.now(timezone.utc)`, computed on every call and never cached or memoised.
- Schema: `backend/app/schemas/server_time.py` → `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: str`. The router returns `ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")` with `response_model=ServerTimeResponse`.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: `200 OK`, `Content-Type: application/json`, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-06T16:44:29.123456Z", "timezone": "UTC"}
```

- `now`: ISO 8601, timezone-aware, UTC offset zero (`Z`, or `+00:00` if the serializer emits that), computed per request.
- Errors: `POST /api/time` (and any other method) returns FastAPI's default `405 Method Not Allowed`. No other error path exists because the endpoint takes no input.

## Technology Selection
- Current UTC instant (`server_time_service.get_current_utc_time`): chose the standard library's `datetime.now(timezone.utc)` over any third-party time library (none installed, none needed), because stdlib gives a timezone-aware UTC value directly.
- Response schema (`ServerTimeResponse`): chose Pydantic `BaseModel` with a `datetime` field, already installed via FastAPI. Its built-in ISO 8601 serialization is used instead of a hand-written formatter or a custom `field_serializer`.
- `Cache-Control` header: chose FastAPI's native injected `Response.headers` on the one handler over a custom middleware or a new caching dependency, because the platform covers a single per-route header in one line.
- Router module: no stdlib call, native platform feature or installed dependency replaces a route module. It is built on the installed FastAPI `APIRouter`, following `routers/version.py`.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response and returns `ServerTimeResponse`.
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: datetime`, `timezone: str`).
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` returning a timezone-aware UTC `datetime`, computed per call.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC, zero offset, per-call value with a patched clock, never naive).
- [B] backend/tests/integration/test_server_time_integration.py: router tests over the real HTTP cycle (200 shape, `Cache-Control: no-store`, UTC offset and not naive, two sequential calls differ, `POST` returns 405, answers with `DATABASE_URL` unset).
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature writes alongside it.

### Modified files
- [B] backend/app/main.py: import `router as server_time_router` from `app.routers.server_time` and add `app.include_router(server_time_router)` in `create_app()`. Update the module docstring's list of registered routers. Nothing else in the factory changes.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the custom route paths, following the existing version and health route tests.
- [Docs] docs/DEVELOPMENT.md: one paragraph in `## Testing`, after the `BUILD_COMMIT` paragraph, saying `GET /api/time` sends `Cache-Control: no-store` on that route only because the deployed CDN caches responses without a directive, and that nothing local shows the effect, so the header must not be removed as redundant. This counts as a run-configuration change: the header exists only for the deployed environment's infrastructure.

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `package-lock.json`) is regenerated. `README.md` needs no edit: project structure, run commands and test infrastructure are unchanged.

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time`. Happy path: returns an aware `datetime` with `utcoffset() == timedelta(0)`. Edge case: two calls with a patched clock (monkeypatch the module's `datetime` reference) return the two patched instants, which proves there is no caching. Error/robustness case: the result is never naive (`tzinfo is not None`). Also `test_main_unit.py` asserts route registration.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the session `client` fixture from `backend/tests/conftest.py` (no database needed). Cases: 200 with exactly the keys `now` and `timezone` and `timezone == "UTC"`; `response.headers["cache-control"] == "no-store"` (criterion 2); `now` parses with `datetime.fromisoformat`, is aware and has zero offset; two sequential calls return different `now` values (microsecond resolution, no sleep); `POST /api/time` returns 405; a fresh `create_app()` with `DATABASE_URL` deleted still answers 200 with the header (same pattern as `test_version_integration.py`).
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py
- E2E tests: none for this item. E2E Tests is ENABLED, but no criterion is verified through navigation or interaction in the UI (the endpoint has no UI consumer), so no spec is warranted; see Criterion coverage.
  - Directory: e2e/tests/
  - File: none generated (would be BUG-01_server_time_edge_cache.spec.ts)
- UAT scenarios: one scenario per criterion plus one edge case (`POST /api/time` is 405 and the GET header is unaffected by other routes). Criterion 3's scenario is tagged as deployed-only, and its Background must not force a localhost base URL onto it.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | A response header on a router, read off the real HTTP cycle; no UI navigation or interaction exists or is needed. |
| 2 | A test asserts the header on the response. | Integration | Met by the integration test itself (`test_get_time_response_carries_cache_control_no_store`); it is a router behaviour with no UI. |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment). | Manual (deployed environment), with Integration for the local half | The cause is the deployed CDN, which no local tier contains. The integration test proves the header is sent and that two local calls differ; the deployed check is the human step the `mayker:to-verify` label tracks. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/time, Then the response status is 200 and the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When I run the server time integration tests, Then 0 failed and the header test is among them |
| 3 | Deployed reproduction returns two different values | covered by a manual deployed-environment check, see Criterion coverage | Given the fix is deployed behind the CDN, When I request GET /api/time twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the backend is running locally, either at the backend URL the PR's handover section names or at `http://localhost:8000` via `uv run --directory backend uvicorn app.main:app --port 8000`. No database is needed for this endpoint.
1. Run `curl -si http://localhost:8000/api/time` (substitute the handover backend URL if you use that stack) → the status line reads `HTTP/1.1 200 OK`.
2. Read the response headers → a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body → JSON with exactly two keys: `now`, an ISO 8601 timestamp ending in `Z` or `+00:00`, and `timezone` equal to `"UTC"`.
4. Run `curl -si http://localhost:8000/api/version` → it answers 200 and carries no `cache-control: no-store` line, which confirms the header is scoped to `/api/time`.

### Criterion 2: A test asserts the header on the response
Prerequisites: the repository checkout on this branch, with `uv` installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_response_carries_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
This cannot be verified locally: there is no edge cache in front of a local backend, so two local calls differ with or without the fix. `docs/DEVELOPMENT.md` → `## Test environments` has no row yet, so the environment is the deployed environment the item names, behind its CDN.
Prerequisites: this PR is merged and deployed to the deployed environment; you know its host (`<deployed-host>`).
1. Run `curl -si https://<deployed-host>/api/time` → 200, and the headers include `cache-control: no-store`.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ, the second roughly one second later than the first.
3. If the two `now` values are identical, the fix did not hold: leave the `mayker:to-verify` label on and run `/fix BUG-01`. If they differ, remove the `mayker:to-verify` label from the item.
