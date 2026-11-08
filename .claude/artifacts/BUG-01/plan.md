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
- Comment (tracker): none actionable. Every comment on ClickUp task 123k99cwybn is a framework PR notice from an earlier run; none changes scope → Addressed by: not acted on because none carries a requirement.
- Assumption (verified against the code, not a comment): the dispatch and `feature_map.md` warn that FEAT-1's `/api/time` code may be absent from main after the sandbox reset. Verified at plan base `main` @ 81e1e8fa4bd74ad5b468f0d1aa5a2cd63e71b393: `backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py` and `backend/app/services/server_time_service.py` do not exist, `backend/app/main.py` registers only the version, notes and health routers, and no file under `backend/` mentions `/api/time`. Criterion 1 cannot be met on an endpoint that does not exist, so this plan recreates FEAT-1's endpoint exactly to FEAT-1's own acceptance criteria (ClickUp task 123k99ctzxk: 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema in `backend/app/schemas/`) and adds the `Cache-Control: no-store` header. Recreating the dependency is not gold plating (`user_story_alignment.md` Section 3): nothing beyond FEAT-1's criteria and this item's criteria is built. To be logged in the PR description per `user_story_alignment.md` Section 4.
- Merged since the last plan: n/a (fresh plan, branched from current main @ 81e1e8f; prior BUG-01 builds 74cdc92 and c81fd09 were reset off main by 81e1e8f and are not reused).

## Plan Overview
Backend only. Recreate the `GET /api/time` slice (router, response schema, service) following the existing version slice's layering (`backend/app/routers/version.py`, `schemas/version.py`, `services/version_service.py`), register the router in `backend/app/main.py`, and set `Cache-Control: no-store` on every `GET /api/time` response from the router so the CDN in front of the deployed API never caches it. Unit tests cover the service (aware UTC, explicit offset, per-call freshness); integration tests cover the HTTP cycle including the header (criterion 2). Criterion 3 is a human verification on the deployed environment after merge; the item keeps its `mayker:to-verify` tag for that route.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time with `Cache-Control: no-store`.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, one handler `get_server_time(response: Response) -> ServerTimeResponse` with `response_model=ServerTimeResponse`. The handler sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")`. The header is set in the router, scoped to this one endpoint, not as app-wide middleware: the defect and its criterion are about `/api/time` only, and caching policy of the other endpoints is out of scope. Keep the header value in a module-level constant (`CACHE_CONTROL_NO_STORE = "no-store"`) so the router and its test name one value.
- Service layer: `backend/app/services/server_time_service.py`, `get_current_utc_time() -> datetime` returning `datetime.now(timezone.utc)`, evaluated per call (never a module-level value or cached call; that would reintroduce the same stale-value defect inside the app).
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"]`. Pydantic serialises an aware UTC datetime as ISO 8601 with an explicit offset (`...Z` form); the integration test asserts the parsed value is offset-aware with a zero UTC offset rather than a literal string suffix, so it passes for either `Z` or `+00:00`.
- Registration: `backend/app/main.py` imports the router and adds `app.include_router(server_time_router)` beside the existing three; update the module docstring's list of registered routers by one clause. No change to the lifespan or the CORS middleware (GET is already allowed).
- Repository layer: none, no database access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-08T02:30:15.123456Z", "timezone": "UTC"}
```

- Errors: a non-GET method returns 405 (FastAPI default); no other error path, the endpoint takes no input and needs no database.

## Technology Selection
- Current time in UTC: chose the standard library `datetime.now(timezone.utc)` over any time library, because stdlib covers aware UTC time completely.
- Cache directive: chose FastAPI's own `Response` parameter (installed dependency) to set the header in the handler over a custom middleware or a new caching dependency, because one header on one endpoint needs no new component.
- Response schema: chose Pydantic `BaseModel` (installed with FastAPI) over a bare dict, as FEAT-1's criteria require.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response.
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now`, `timezone`).
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()`, aware UTC time computed per call.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware, zero offset, per-call freshness via a monkeypatched clock, never a cached value).
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests: 200 and body shape, `Cache-Control: no-store` header present (criterion 2), two calls with a patched clock return different `now`, 405 on POST.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature writes alongside it.

### Modified files
- [B] backend/app/main.py: import and register the server time router; one docstring clause.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom routes.

No dependency changes, so no lockfile is touched. `README.md` and `docs/DEVELOPMENT.md` need no edit: this item changes no project structure, run configuration, dependency or test infrastructure, and neither file lists API endpoints.

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time` (happy path: returns an aware datetime with `utcoffset() == timedelta(0)`; edge case: two calls with a monkeypatched clock return the two different values, proving no caching; error case: the result is never naive, asserted with `tzinfo is not None`). `create_app` registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the session `client` fixture from `backend/tests/conftest.py`: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` parses as an aware ISO 8601 datetime with zero offset; `response.headers["cache-control"] == "no-store"`; two requests with a monkeypatched service clock return different `now` values; `POST /api/time` returns 405. No database needed, so these run without `DATABASE_URL`.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No acceptance criterion involves navigation or interaction through the UI, and no frontend calls `/api/time` (`testing_standards.md` Section 6, fourth question asked per criterion below).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (POST is rejected and carries no cached body), and the manual script expanded from the plan below.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | Verifying it needs no navigation or interaction: it is a response header of a router, read off the HTTP response. |
| 2 | A test asserts the header on the response. | Integration | The criterion is itself the integration test asserting the header; there is no UI path to the endpoint. |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment). | Integration | No UI is involved and no local edge cache exists; the integration test asserts the cause (the no-store header) and per-request freshness, and the deployed check is the human manual verification step below, tracked by the `mayker:to-verify` tag. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running When a client sends GET /api/time Then the response status is 200 And the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite When the server time integration tests run Then the header assertion passes |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed API behind the CDN When two GET /api/time requests are sent one second apart Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the backend is running locally (`docker compose up` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`), reachable at `http://localhost:8000`.
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the response headers → a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body → JSON with exactly two keys, `now` (an ISO 8601 timestamp ending in `Z` or `+00:00`) and `timezone` with the value `UTC`.
4. Run `curl -si -X POST http://localhost:8000/api/time` → status `405 Method Not Allowed`.
This criterion has no UI: the endpoint is backend only and no screen calls it, so the observable check is the response header above.

### Criterion 2: A test asserts the header on the response
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the run ends with `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: the fix is merged and deployed; you know the deployed API host (replace `<deployed-host>` below). This is verified by a human on the deployed environment only; locally there is no edge cache to reproduce against.
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header (if the CDN adds an `age:` or cache-hit header such as `x-cache: HIT`, note it; it should read as a miss or be absent).
2. Wait one second, then run `curl -s https://<deployed-host>/api/time` twice with `sleep 1` between (`curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`) → the two printed `now` values differ, by about one second.
3. Record the two values and the date in the item's verification note; when they differ, the `mayker:to-verify` item can be confirmed done. When they are identical, the CDN is ignoring the header: reopen with the response headers from step 1 attached.
