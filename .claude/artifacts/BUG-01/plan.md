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
- Comment (tracker): all comments on ClickUp task 123k99cwybn are mayker-dev bot notes from earlier runs whose PRs were reset → not acted on because they are run bookkeeping, not requirements; no stakeholder comment changes the description.
- Merged since the last plan: n/a (fresh plan; no `feature/BUG-01-*` branch or plan exists on this checkout, and main == origin/main at 0418677).
- Assumption (dependency state): FEAT-1 is `complete` in the tracker, but its code is absent from main after the sandbox reset 0418677 ("reset Arm E code for release run 0.3.491 T8b"): `git ls-tree origin/main backend/app` lists no `routers/server_time.py`, `schemas/server_time.py` or `services/server_time_service.py`, and `backend/app/main.py` registers only the version, notes and health routers. A `Cache-Control` header cannot be added to an endpoint that does not exist, so this plan **recreates the `GET /api/time` endpoint to FEAT-1's contract** (200, `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema in `backend/app/schemas/`) and adds the `no-store` directive on it. The recreation is the minimum that makes the defect's criteria testable; nothing beyond FEAT-1's own contract is added.
- Assumption (header scope): the directive is set on `GET /api/time` only, not as a global middleware on every route. The defect and criterion 1 name this endpoint alone (`user_story_alignment.md` Section 3, no gold plating), and the version, health and notes responses are out of scope.
- Assumption (criterion 3): the deployed check cannot run in this repository (no deployed host is configured anywhere in `CLAUDE.md`). It is covered by the human step in `## Manual verification plan` after deploy (the `to_verify` route), and by an integration-tier proxy that asserts the two things the deployed result depends on: the response forbids storing, and `now` is computed per request.

## Plan Overview
Backend-only fix in the FastAPI app. Recreate the server-time slice in the project's Router to Service shape (as `version.py` and `version_service.py` already do): a schema `ServerTimeResponse`, a service function returning the current timezone-aware UTC time, and a router `GET /api/time` registered in `backend/app/main.py`. The router sets `Cache-Control: no-store` on its response, which is the actual defect fix: a CDN honouring that directive never stores the response, so each request reaches the API and gets a fresh `now`. No database, no frontend, no external API, no new dependency.

**Proposed reproduction class:** deployed-environment-only (environment-dependent, not locally reproducible). The stale value is produced by the edge cache in front of the deployed API, which the local stack does not have, so locally the bug never shows. The automated suite can only assert the cause (the missing directive) and per-request freshness; the symptom itself is verified by a human on the deployed environment after merge.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item)

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time and carries the response header `Cache-Control: no-store`. Registered in `backend/app/main.py` with `app.include_router(server_time_router)` next to the existing three, import `from app.routers.server_time import router as server_time_router`; the module docstring's list of registered routers gains one clause naming BUG-01's server-time router. No other change to `main.py`.
- Router (`backend/app/routers/server_time.py`): `router = APIRouter(prefix="/api", tags=["server-time"])`; handler `get_server_time(response: Response) -> ServerTimeResponse` declared with `@router.get("/time", response_model=ServerTimeResponse)`. It sets `response.headers["Cache-Control"] = "no-store"` (FastAPI merges headers set on the injected `Response` into the serialized reply) and returns `ServerTimeResponse(now=current_utc_time(), timezone="UTC")`. The header value lives in one module constant `CACHE_CONTROL_NO_STORE = "no-store"` so the test and the router cannot drift on spelling only by convention; the test still asserts the literal header value on the HTTP response, because that literal is what the CDN reads.
- Service layer (`backend/app/services/server_time_service.py`): `current_utc_time() -> datetime` returns `datetime.now(timezone.utc)`, called once per request (never cached at import or in a module-level variable), always timezone-aware.
- Schema (`backend/app/schemas/server_time.py`): `class ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"]`. Pydantic v2 serializes an aware UTC datetime as ISO 8601 with an explicit offset (`2026-11-13T10:15:30.123456Z`); the integration test asserts the parsed value is aware with a zero UTC offset rather than a particular suffix spelling.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, JSON body:

```json
{"now": "2026-11-13T10:15:30.123456Z", "timezone": "UTC"}
```

- Errors: a non-GET method returns FastAPI's default 405.

## Technology Selection
- `Cache-Control: no-store` directive: chose setting the header on FastAPI's injected `Response` in the one handler over a custom middleware, a CDN-side configuration, or a caching library, because the framework already installed exposes response headers directly and the defect is scoped to one endpoint; no new dependency.
- Current-time source (`server_time_service.py`): chose the standard library `datetime.now(timezone.utc)` over any time library (none is installed, and none is needed for a single aware UTC timestamp).
- Response schema (`schemas/server_time.py`): chose Pydantic `BaseModel` with `datetime` and `typing.Literal`, both already installed (Pydantic ships with FastAPI) and already the project's schema convention (`schemas/version.py`).
- Router (`routers/server_time.py`): no stdlib call, native platform feature or installed dependency replaces an endpoint, so it is built here on the already-installed FastAPI `APIRouter`.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response and returns `ServerTimeResponse`
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: datetime`, `timezone: Literal["UTC"]`)
- [B] backend/app/services/server_time_service.py: `current_utc_time()` returning a timezone-aware UTC datetime computed per call
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for `current_utc_time()` (aware, UTC offset zero, computed per call)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time` (status, shape, offset, `Cache-Control: no-store`, per-request freshness, 405)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature writes alongside it

### Modified files
- [B] backend/app/main.py: import and `include_router` the server-time router; docstring names BUG-01's router
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the app's custom routes

No lockfile changes: this item adds no dependency, so `backend/uv.lock`, `package-lock.json` and every other lockfile stay untouched.
No `README.md` or `docs/DEVELOPMENT.md` edit: the item adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `current_utc_time()` in the service layer. Happy path (returns an aware datetime with `utcoffset() == timedelta(0)`), edge case (two calls with a monkeypatched clock return the two distinct values the clock produced, proving nothing is cached at module level), error case (the result is never naive: `tzinfo is not None`). Plus the app-factory registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the session `client` fixture in `backend/tests/conftest.py` (no database needed): 200 and body shape, `now` parses as ISO 8601 with a zero UTC offset, `Cache-Control` header equals `no-store`, two requests return different `now` (the router module's `current_utc_time` is monkeypatched to yield two fixed distinct datetimes, so the test is deterministic and needs no sleep), and POST returns 405.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The item has no UI: no criterion requires navigation or interaction through the browser (`testing_standards.md` Section 6, fourth question asked per criterion), so no spec is written and Phase D has no work.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus one edge case (POST is rejected with 405), API-level Given/When/Then; criterion 3's scenario states it runs against the deployed host.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header of a router, read off the HTTP cycle |
| 2 | A test asserts the header on the response. | Integration | `test_get_time_sets_cache_control_no_store` | this criterion is satisfied by the existence of the router-level test itself; there is no UI to drive |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration | `test_get_time_returns_fresh_now_per_request`, `test_get_time_sets_cache_control_no_store` | the symptom only exists behind the deployed CDN and is checked by a human with curl (Manual verification plan); the automated proxy is router behaviour (per-request `now` plus the no-store directive), with no UI involved |

Supporting tests the builder also writes, not the sole cover of any criterion: `test_get_time_returns_200_with_utc_now_and_timezone`, `test_post_time_returns_405_method_not_allowed`, `test_current_utc_time_returns_aware_utc_datetime`, `test_current_utc_time_is_computed_per_call`, `test_current_utc_time_is_never_naive`, `test_create_app_registers_server_time_route`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response has header Cache-Control with value no-store |
| 2 | A test asserts the header on the response. | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the header test passes with 0 failed |
| 3 | After deploy, the reproduction returns two different values. | covered at Integration (proxy) plus a human check on the deployed host, see Criterion coverage | Given the fix is deployed behind the CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Not verifiable through the UI: the item has no screen. The observable check is the response header.
Prerequisites: backend running locally, e.g. `uv run --directory backend uvicorn app.main:app --port 8000` (no database needed for this endpoint).
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK` and the headers include the line `cache-control: no-store`.
2. Read the body printed after the headers → it is JSON shaped `{"now":"2026-...Z","timezone":"UTC"}`, with `now` ending in `Z` or `+00:00`.

### Criterion 2: A test asserts the header on the response
Not verifiable through the UI: it is a property of the test suite. The observable check is the test run.
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_sets_cache_control_no_store` → it asserts `response.headers["cache-control"] == "no-store"` on the `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable through the UI and not verifiable locally (there is no edge cache locally). The observable check is two curl calls against the deployed host, run by a human after the fix is deployed (the item's `to_verify` step).
Prerequisites: this fix is merged and deployed; you know the deployed host name (`<deployed-host>` below); the CDN in front of the API is active.
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header (if a CDN status header such as `x-cache` or `cf-cache-status` is present, it does not read `HIT`).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies are printed and their `now` values differ (the second is about one second later than the first).
3. Repeat step 2 once more → the `now` values again differ, confirming the first result was not a cache miss by chance.
