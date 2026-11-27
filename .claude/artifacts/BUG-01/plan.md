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
- Comment (tracker): 59 comments over 3 pages, all framework-authored PR notices (recorded in `.claude/artifacts/BUG-01/decisions.md`) → not acted on because none carries a correction or amendment to the item.
- Merged since the last plan: n/a (fresh plan on plan base f664c826; no `[merged-since]` lines in the dispatch).
- Scope change (assumption, recorded per `user_story_alignment.md` Section 2 step 3): the item says "FEAT-1 is complete", and the tracker marks FEAT-1 `complete`, but on `main` at f664c826 `backend/app/routers/server_time.py` and `backend/app/schemas/server_time.py` do not exist and `backend/app/main.py` registers only the version, notes and health routers (verified by reading `main.py` and `git log -- backend/app/routers/server_time.py`: FEAT-1's code last landed in f293b277 and was removed by the sandbox resets since). Criterion 1 cannot be met on an endpoint that answers 404, so this plan restores `GET /api/time` to FEAT-1's own contract (`{"now": "<ISO 8601 UTC, +00:00 offset>", "timezone": "UTC"}`, Pydantic schema in `backend/app/schemas/`) and registers it in `main.py`. Nothing beyond FEAT-1's contract is added: no service layer (FEAT-1 had none and there is no business logic), no new fields, no caching configuration other than the one header.

## Plan Overview
Backend only. Restore the `GET /api/time` route FEAT-1 specified (router plus response schema, registered in the app factory) and make every response from it carry `Cache-Control: no-store`, so a CDN in front of the API does not cache it. The header is set on the route's own `Response`, not by a global middleware, so no other endpoint's caching behaviour changes. Tests: one integration module through the app's own test client (header, shape, per-request freshness) and one route-registration assertion in the existing app-factory unit test.

**`backend/app/main.py` is in this plan's File Manifest** (one import plus one `include_router` line). TEST-09 is being planned concurrently and plausibly edits the same file: serialize the two builds if TEST-09's manifest also lists `main.py`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time; every response carries `Cache-Control: no-store`.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time(response: Response) -> ServerTimeResponse` that sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=utc_now(), timezone="UTC")`. The clock read `utc_now()` (returns `datetime.now(UTC)`) is a module-level function so the integration test can substitute it; `now` is computed per request, never at import time.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (a naive datetime is rejected) and `timezone: Literal["UTC"]`, plus a `field_serializer("now")` returning `value.astimezone(UTC).isoformat()` so the JSON value ends in `+00:00`, never `Z` (Pydantic's JSON mode would otherwise emit `Z`). The header value `"no-store"` is a module constant in the router (`CACHE_CONTROL_NO_STORE`), not a deployment-dependent value: it is the same on every environment, so it does not go into `core/config.py`.
- App factory: `backend/app/main.py` imports `router as server_time_router` from `app.routers.server_time` and adds `app.include_router(server_time_router)` after the existing three; the module docstring gains one clause naming FEAT-1/BUG-01. The CORS middleware is untouched (a same-origin GET needs no change to it).
- Service layer: none. There is no business logic beyond reading the clock, and FEAT-1 placed none there either.
- Repository layer: none.
- Migrations: none.
- Docstrings: module docstring naming the work item, one-line docstring on every public function and class (`.claude/project-standards.md` Documentation convention and its `docstrings` gate row).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-27T15:30:01.123456+00:00", "timezone": "UTC"}
```

- Any other method on `/api/time`: 405 (FastAPI default, not specified further).

## Technology Selection
- `Cache-Control: no-store` on the response: chose FastAPI's own `Response` parameter on the handler (installed dependency) over a custom middleware or a new caching dependency, because one header on one route needs no new component.
- `ServerTimeResponse` schema: chose Pydantic's `AwareDatetime` and `field_serializer` (installed dependency) over a hand-written timestamp formatter, because Pydantic already validates awareness and only the offset spelling needs one line.
- Clock read `utc_now()`: chose the standard library `datetime.now(UTC)` over any time library; no alternative needed.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on every response; module-level `utc_now()`.
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now` aware UTC with `+00:00`, `timezone` literal `UTC`).
- [B] backend/tests/integration/test_server_time_integration.py: header, shape and per-request freshness through the app's test client.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: import and register `server_time_router`; docstring clause.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route`.

No lockfile changes: no dependency is added or removed. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the change adds one route and alters no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: route registration in the app factory (the only unit-level behaviour; there is no service logic to unit-test).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing `test_main_unit.py`)
- Integration tests: `GET /api/time` through the session `client` fixture: status 200, `Cache-Control: no-store` header, body shape and `+00:00` offset, and two calls with a substituted clock returning two distinct instants yield two distinct `now` values (per-request computation, no in-app caching). The freshness test monkeypatches `app.routers.server_time.utc_now` with two fixed aware datetimes; no `sleep`.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The item has no UI: no criterion involves navigation or interaction (`testing_standards.md` Section 6, fourth question, asked per criterion below). No spec file.
  - Directory: e2e/tests/
  - File: none
- UAT scenarios: one scenario per criterion plus one edge case (a POST to `/api/time` answers 405 and carries no cached body).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header on a router, read through the test client |
| 2 | A test asserts the header on the response. | Integration | `test_get_time_sets_cache_control_no_store` | the criterion is the existence of that test; the integration test above is it |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration | `test_get_time_two_calls_return_different_now`, `test_get_time_sets_cache_control_no_store`, `test_get_time_returns_200_with_utc_now_and_timezone` | there is no UI and no edge cache locally; the integration tests prove the app computes `now` per request and sends the directive the CDN obeys, and the deployed check itself is the human step in the Manual verification plan (the item is tagged `mayker:to-verify`) |

Supporting test (restored FEAT-1 contract): `test_create_app_registers_time_route` (unit).

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | covered at Integration, see Criterion coverage | Given the API is running, When I GET `/api/time`, Then the response has status 200 and header `Cache-Control: no-store` |
| 2 | A test asserts the header on the response. | covered at Integration, see Criterion coverage | Given the backend test suite, When I run `backend/tests/integration/test_server_time_integration.py`, Then the run passes including `test_get_time_sets_cache_control_no_store` |
| 3 | After deploy, two calls a second apart return different `now`. | covered at Integration, see Criterion coverage; deployed check is manual | Given the fix is deployed behind the CDN, When I GET `/api/time` twice one second apart, Then the two `now` values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion has no UI; the observable check is the response header.
Prerequisites: backend running locally on port 8000 (`uv run --directory backend uvicorn app.main:app --port 8000`); no database needed for this route.
1. In a terminal run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`, the headers include `cache-control: no-store`, and the body looks like `{"now":"2026-11-27T15:30:01.123456+00:00","timezone":"UTC"}` with `now` ending in `+00:00`.
2. Run `curl -si http://localhost:8000/api/version` → that response carries no `cache-control` header (the directive is scoped to `/api/time` only).

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the BUG-01 branch; `uv` installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_sets_cache_control_no_store` → it asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion can only be verified on the deployed environment (no edge cache exists locally; `docs/DEVELOPMENT.md` → Test environments has no row yet, so use the host the team deploys to).
Prerequisites: the BUG-01 merge is deployed behind the CDN; you know the deployed host name.
1. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies print, and their `now` values differ (the second is about one second later).
2. Run `curl -sI https://<deployed-host>/api/time` → the headers include `cache-control: no-store`, and any CDN cache-status header (for example `cf-cache-status` or `x-cache`) does not read `HIT`.
3. If both steps hold, remove the `mayker:to-verify` label from the item; if step 1 shows identical values, the item stays in verification and the CDN's own cache rules are the next thing to inspect.
