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
- Comment (tracker): 16 comments read on the item, all framework PR notices from earlier runs; 0 actionable, so none changes this plan.
- Assumption (tree verified at plan base efaa67d): FEAT-1 is `complete` in the tracker, but `GET /api/time` does not exist on main. No `backend/app/routers/server_time.py`, no `backend/app/schemas/server_time.py`, no registration in `backend/app/main.py` and no server-time test exist (the sandbox reset a90e181 removed them). Criterion 1 cannot be met on an endpoint that does not exist, so this plan recreates the endpoint to FEAT-1's own acceptance criteria (read from the tracker: 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request and never naive, body defined by a Pydantic schema in `backend/app/schemas/`) and adds the cache directive on it. That is the minimum the defect's criteria require; nothing beyond FEAT-1's contract is added. Record this in the PR description as a scope note.

## Plan Overview
Backend-only fix. Recreate the server-time slice (schema, router, registration in the app factory) and make the router set `Cache-Control: no-store` on every `GET /api/time` response, so no cache between client and API (the CDN included) may store it. Tests: an integration test asserts the header and the body contract on the real HTTP cycle; unit tests cover the schema's UTC construction and the route registration. Criterion 3 is a human check on the deployed environment, which carries the item to `to_verify`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, with response header `Cache-Control: no-store`.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, same shape as `backend/app/routers/version.py`. The handler takes FastAPI's `Response` parameter and sets `response.headers["Cache-Control"] = "no-store"` (one named module constant, with a one-line comment saying why: the CDN caches any response without a directive). Set the header in this router only, not as app-wide middleware: the defect and criterion 1 are about this endpoint, and a global header would change caching of every other route (scope containment).
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"]` (default `"UTC"`), plus a classmethod `now_utc()` that builds it from `datetime.now(timezone.utc)`. Pydantic serialises an aware UTC datetime as ISO 8601 with an explicit offset (`...Z` or `+00:00`); the builder must never pass a naive datetime.
- Service layer: none. The value is a single stdlib call and needs no business logic; the schema classmethod keeps it out of the router. No repository and no database access.
- Registration: `backend/app/main.py` imports the router and adds `app.include_router(server_time_router)` beside the existing three; update the module docstring's router list by one clause. No other change to the factory.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-10-30T17:24:13.123456Z", "timezone": "UTC"}
```

The offset may serialise as `Z` or `+00:00` (both are explicit UTC offsets); tests assert the parsed value is timezone-aware with a zero UTC offset rather than one literal suffix.

## Technology Selection
- Current UTC time: chose the standard library `datetime.now(timezone.utc)` over any time library, because the stdlib covers an aware UTC timestamp completely.
- Cache directive: chose FastAPI's per-route `Response` header (already installed) over a caching middleware or a new dependency, because one header on one route needs neither.
- Response schema: chose Pydantic `BaseModel` (installed through FastAPI) over a bare dict, as FEAT-1's contract requires.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router, sets `Cache-Control: no-store`
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` schema with the `now_utc()` builder
- [B] backend/tests/integration/test_server_time_integration.py: HTTP cycle tests for the header, the body contract and per-request freshness
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for `ServerTimeResponse.now_utc()` (aware UTC, offset zero, serialised with explicit offset)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server-time router; docstring router list gains one clause
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is a custom route

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `ServerTimeResponse.now_utc()` returns an aware datetime with `utcoffset() == timedelta(0)` and `timezone == "UTC"` (happy path); its JSON serialisation carries an explicit offset (edge case); constructing the schema with a non-`"UTC"` timezone raises `ValidationError` (error case). Route registration in the app factory.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: through the `client` fixture in `backend/tests/conftest.py` (no database needed, like `test_version_integration.py`): `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` (criteria 1 and 2); `test_get_time_returns_200_with_utc_now_and_timezone` asserts the body contract and that the parsed `now` is aware with zero offset; `test_get_time_now_differs_between_requests` asserts two calls return different `now` values (freeze or monkeypatch the clock source in the schema module to two distinct instants rather than sleeping, so the test is deterministic); `test_post_time_returns_405_method_not_allowed` is the error case.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI; the endpoint has no frontend consumer.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus one edge case (two requests return different `now` values locally), validated for well-formedness only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header on a router, asserted on the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | The criterion is satisfied by the integration test itself (`test_get_time_sets_cache_control_no_store`); no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Integration | Only the deployed CDN can show the defect, so no automated tier can reproduce it; the integration test asserting the header plus per-request freshness is the executed local coverage, and the deployed check is the human step in the Manual verification plan (reproduction class deployed-only) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running When a client requests GET /api/time Then the response carries Cache-Control: no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite When the server-time integration tests run Then 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the fix is deployed When two requests to GET /api/time are made a second apart Then the two now values differ |

## Manual verification plan
This item has no UI: every step is a terminal command whose output is read by the person verifying.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the stack is running locally (`docker compose up -d` at the repo root), backend on `http://localhost:8010`.
1. Run `curl -s -D - -o /dev/null http://localhost:8010/api/time` → the printed headers include `cache-control: no-store` and the status line is `HTTP/1.1 200 OK`.
2. Run `curl -s http://localhost:8010/api/time` → the body is JSON of the form `{"now":"2026-10-30T17:24:13.123456Z","timezone":"UTC"}`, with `now` ending in `Z` or `+00:00`.

### Criterion 2: A test asserts the header on the response
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py` → the run reports `0 failed`, and `test_get_time_sets_cache_control_no_store` is among the tests run (add `-v` to see it listed as PASSED).

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable locally: there is no edge cache on a developer machine, and `docs/DEVELOPMENT.md` → `## Test environments` has no row, so the deployed host is the one the operator deploys to.
Prerequisites: the fix is merged and deployed; you know the deployed host name.
1. Run `curl -s -D - https://<deployed-host>/api/time` → the response headers include `cache-control: no-store` (the CDN forwards the origin's directive).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ by about one second.
3. If both values are identical, the CDN is still caching: the item stays in To verify and is reopened. If they differ, remove the `mayker:to-verify` label from the item.
