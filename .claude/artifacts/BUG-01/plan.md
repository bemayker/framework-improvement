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
- Comment (tracker): 51 comments read by the dispatching session, all framework "PR opened" notices from earlier runs → Addressed by: not acted on because none carries a correction or amendment to the feature text.
- Merged since the last plan: n/a (fresh plan, no existing plan.md for BUG-01; plan base a8ddc5f92463cb360ea81c79469513653d8201d1 is current main).
- Assumption (scope change, recorded per `user_story_alignment.md` Section 4): the feature says "FEAT-1 is complete", but at plan base a8ddc5f the endpoint it fixes does not exist. `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, `backend/app/main.py` registers only those three routers, and no file in `backend/` mentions `server_time` or `/api/time` (FEAT-1's code was removed by the sandbox reset c5a6e64, per the feature map's shared-risk note). Criterion 1 cannot be met on a route that does not exist, so this plan recreates `GET /api/time` to FEAT-1's own contract, taken from the FEAT-1 tracker item's acceptance criteria (response `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema in `backend/app/schemas/`), and adds the header on it. Nothing beyond FEAT-1's contract plus the header is added. The PR body must state this assumption.

## Plan Overview
Backend only. Recreate the FEAT-1 server time slice in the existing Router to Service to Schema layering (the same shape as the TEST-02 health and TEST-05 version slices), register it in `backend/app/main.py`, and set `Cache-Control: no-store` on every `GET /api/time` response so the edge cache in front of the deployed API stops serving a stored copy.

- The header is set in the router on the injected `Response` object, the FastAPI-native way to add a header to a response whose body is still produced from `response_model`. No middleware: the defect is scoped to one route, and a global no-store middleware would change caching for every other endpoint (gold plating).
- The current time is produced by a one-function service over the standard library (`datetime.now(timezone.utc)`), so the router stays free of business logic and the unit tier can assert awareness and per-call freshness without HTTP.
- Proposed reproduction class: `deployed-only`. Reason: the stale value is produced by the CDN/edge cache that exists only in front of the deployed API; locally nothing caches, so a local run shows two different values with or without the fix. Environment: the deployed host the item names (`<deployed-host>`); `docs/DEVELOPMENT.md` `## Test environments` has no rows, so the verifier must supply the host. The local evidence is the header assertion (criteria 1 and 2) plus the per-request freshness assertion; criterion 3 is handed to a human through the `mayker:to-verify` route.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time with `Cache-Control: no-store` on the response.
- Router: `backend/app/routers/server_time.py`, `router = APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time(response: Response) -> ServerTimeResponse` with `response_model=ServerTimeResponse`. It sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=server_time_service.get_server_time(), timezone="UTC")`. The header value lives in a module constant (`CACHE_CONTROL_NO_STORE = "no-store"`) with a one-line comment saying why (the edge cache in front of the deployed API).
- Schema: `backend/app/schemas/server_time.py`, `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's aware-datetime type, so a naive value is rejected at the schema rather than serialised without an offset) and `timezone: Literal["UTC"]`. Pydantic serialises a UTC-aware datetime as ISO 8601 with an explicit offset (`Z` or `+00:00`).
- Service layer: `backend/app/services/server_time_service.py`, `get_server_time() -> datetime` returning `datetime.now(timezone.utc)`, computed per call, never cached.
- App factory: `backend/app/main.py` imports `server_time` router and adds `app.include_router(server_time_router)` after the existing three; the module docstring gains BUG-01 to its list of route registrations. No other change to `main.py` (CORS, lifespan and the existing registrations stay as they are).
- Repository layer: none, the endpoint touches no data store.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `Content-Type: application/json`, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-19T10:15:30.123456Z", "timezone": "UTC"}
```

`now` is ISO 8601 in UTC with an explicit offset (`Z` or `+00:00`, whichever Pydantic emits for a UTC-aware datetime; clients must accept both), computed per request. Any other method on `/api/time` answers 405 (FastAPI default).

## Technology Selection
- Current time (service): chose the standard library `datetime.now(timezone.utc)` over any time library, because the stdlib covers an aware UTC timestamp completely.
- Cache directive (router): chose FastAPI's injected `Response` header, a dependency this project already installs, over a custom middleware or a caching library, because one route needs one static header.
- Response schema: chose Pydantic `BaseModel` with `AwareDatetime`, already installed with FastAPI, over a bare dict or a hand-written ISO formatter, because the schema rejects a naive datetime and serialises the offset itself.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime`, `timezone: Literal["UTC"]`)
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning the current aware UTC datetime per call
- [B] backend/app/routers/server_time.py: `GET /api/time` router that sets `Cache-Control: no-store` and returns `ServerTimeResponse`
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for `get_server_time()` (aware UTC, per-call freshness)
- [B] backend/tests/integration/test_server_time_integration.py: router integration tests for `GET /api/time` (shape, offset, `Cache-Control: no-store`, per-request freshness, 405)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/main.py: import and register the server time router; add BUG-01 to the module docstring's registration list
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom routes
No dependency manifest changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: one route is added inside the existing layout, with no change to project structure, run configuration, dependencies or test infrastructure. No E2E spec: no criterion involves the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: `server_time_service.get_server_time()`: returns a timezone-aware datetime whose `utcoffset()` is zero (happy path); two successive calls return strictly increasing values (edge case: per-call freshness, nothing cached); returned value lies between a `datetime.now(timezone.utc)` taken before and after the call (guards against a fixed or wrong-zone value). The app factory gains one registration test.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_server_time_service_unit.py`; the registration test goes into the existing `test_main_unit.py`
- Integration tests: `GET /api/time` through the session `client` fixture (real HTTP request/response cycle, no database needed): 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with zero offset; the response header `cache-control` equals `no-store` (read off `response.headers`, the actual response, not the module constant); two requests return strictly increasing `now` values (microsecond resolution, no sleep); `POST /api/time` answers 405 (error case).
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion involves navigation or interaction through the UI; the feature is a response header on a backend route with no frontend consumer.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion (header present, test asserts header, deployed reproduction returns two different values) plus one edge case (a second request is not served from cache, `now` differs), written as API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | `test_get_time_sets_cache_control_no_store`, `test_get_time_returns_200_with_utc_now_and_timezone` | verifying it needs no navigation or interaction: it is a response header on a router, asserted on the real HTTP response |
| 2 | A test asserts the header on the response. | Integration | `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: the criterion is satisfied by the router integration test itself existing and passing |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration (local proxy) plus human verification on the deployed environment (`deployed-only`) | `test_get_time_returns_fresh_now_per_request`, `test_get_server_time_returns_fresh_value_per_call`, `test_get_time_sets_cache_control_no_store` | no UI is involved, and the edge cache exists only on the deployed environment, so no local tier (E2E included) can reproduce the stale value; locally the tests prove `now` is fresh per request and the no-store directive is sent, and the deployed check is the human step of the `mayker:to-verify` route |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the response status is 200 and the Cache-Control header is no-store |
| 2 | A test asserts the header on the response. | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then the header test passes |
| 3 | After deploy, the reproduction above returns two different values. | covered at Integration locally plus human check on the deployed environment, see Criterion coverage | Given the fix is deployed behind the edge cache, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`.
This criterion has no UI; it is verified by reading the response header.
Prerequisites: the stack is running locally (`docker compose up -d` at the repo root), backend reachable at `http://localhost:8010`.
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers of that response → a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body of that response → JSON with exactly two keys, `now` (an ISO 8601 timestamp ending in `Z` or `+00:00`) and `timezone` with the value `UTC`.

### Criterion 2: A test asserts the header on the response.
This criterion has no UI; it is verified by running the test that asserts it.
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_sets_cache_control_no_store` reads the `cache-control` header off the response of `GET /api/time` and compares it to `no-store`.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.

### Criterion 3: After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
This criterion cannot be verified locally: the edge cache exists only on the deployed environment. The check is on the deployed host, which `docs/DEVELOPMENT.md` `## Test environments` does not yet name, so the verifier supplies it.
Prerequisites: the merged fix is deployed; you know the deployed API host (written below as `<deployed-host>`).
1. In a terminal, run `curl -si https://<deployed-host>/api/time` → status 200, and the headers include `cache-control: no-store`.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies are printed.
3. Compare the `now` values of the two bodies → they differ, the second about one second later than the first. Identical values mean the edge cache still serves a stored copy and the item fails verification.
4. When step 3 passes, remove the `mayker:to-verify` label from the merged PR to mark the item verified.
