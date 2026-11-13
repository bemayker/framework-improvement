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
- Comment (tracker): 25 comments on the ticket, newest first from 2026-11-12, every one a framework-generated "mayker-dev: PR opened for BUG-01" notice from earlier `/deliver` runs (PRs #742 down to #396). → Addressed by: not acted on as a requirement, because none is a stakeholder correction to the description. Two facts in them are kept: the restore of FEAT-1's `/api/time` code (planned below, verified independently against the code) and "use `curl -si`, a GET; a HEAD request gets 405 from this route" (carried into the Manual verification plan for criterion 3).
- Assumption (code check, not a comment): the feature notes say "FEAT-1 is complete", and the tracker marks FEAT-1 `complete`, but `origin/main` at 9c543db carries no `backend/app/routers/server_time.py`, no server-time schema or service, and `backend/app/main.py` registers only the version, notes and health routers (`git ls-tree -r origin/main backend/app`). Only stale `.pyc` files remain in the working tree. So `GET /api/time` does not exist on main and criterion 1 cannot be met by editing a router that is not there. This plan restores the minimal FEAT-1 slice (schema, service, router, registration) to FEAT-1's own contract (`{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, computed per request) and adds the header. This is not gold plating: the restore is the precondition of criterion 1, it adds no behaviour FEAT-1 did not already specify, and it is logged here and in the PR description per `user_story_alignment.md` Section 4.
- Merged since the last plan: n/a (fresh plan for this run; no `[merged-since]` lines in the dispatch, branch cut from current main 9c543db).

## Plan Overview
Backend only. Restore `GET /api/time` (FEAT-1's contract, absent from main after the sandbox reset) as a Router to Service to Schema slice following the existing version and health routers, register it in `create_app()`, and set `Cache-Control: no-store` on that route's response only, so the CDN in front of the deployed API stops caching it. Tests: a unit tier for the service's UTC formatting and per-call freshness, an integration tier asserting the header, the body shape and per-request freshness over the real HTTP cycle, and the app-factory unit test asserting the route is registered. No frontend, no database, no new dependency. Criterion 3 is a human check on the deployed environment after merge (the item's `to_verify` route); the cause-level check is automated locally.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, with response header `Cache-Control: no-store`. Router prefix `/api`, tag `server-time`, same shape as `backend/app/routers/version.py`. The handler takes FastAPI's injected `Response` parameter and sets `response.headers["Cache-Control"] = "no-store"` before returning the schema instance; the header is set on this route only, never as app-wide middleware (the version, notes and health routes are out of scope).
- Service layer: `backend/app/services/server_time_service.py` with `to_utc_iso(moment: datetime) -> str` (converts an aware datetime to UTC and returns `isoformat()`, so the offset is always explicit `+00:00`; raises `ValueError` on a naive datetime, which is FEAT-1's "never naive" rule enforced at the one place it can break) and `get_server_time() -> str` (returns `to_utc_iso(datetime.now(UTC))`, evaluated on every call, no caching, no module-level value).
- Repository layer: none. No data access.
- Migrations: none.
- Registration: `backend/app/main.py` imports `router as server_time_router` from `app.routers.server_time` and adds one `app.include_router(server_time_router)` line after the health router, touching nothing else in the factory. The existing CORS middleware already allows `GET`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body defined by `ServerTimeResponse` in `backend/app/schemas/server_time.py` (`now: str`, `timezone: Literal["UTC"]`):

```json
{"now": "2026-11-13T08:03:14.512345+00:00", "timezone": "UTC"}
```

- Errors: `POST /api/time` (and any other non-GET method, including HEAD) returns 405 from FastAPI's routing; no other error path exists.

## Technology Selection
- UTC timestamp: chose the standard library's `datetime.now(UTC)` and `datetime.isoformat()` over any date library, because the stdlib covers aware UTC time and ISO 8601 with offset fully.
- Cache directive: chose FastAPI's injected `Response` parameter (an installed dependency) setting one header on this route over a custom middleware or a new caching package, because a single route needs a single header and a middleware would widen the change to every route.
- Response schema: chose Pydantic `BaseModel` (installed with FastAPI) with `typing.Literal` from the standard library over a bare dict, as FEAT-1 requires a schema in `backend/app/schemas/`.
- No new dependency is added; `backend/pyproject.toml` and `backend/uv.lock` do not change.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` schema (`now: str`, `timezone: Literal["UTC"]`) for `GET /api/time`.
- [B] backend/app/services/server_time_service.py: `to_utc_iso()` and `get_server_time()`, the UTC-with-offset, per-call time logic.
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response; no business logic.
- [B] backend/tests/unit/test_server_time_service_unit.py: service unit tests: explicit `+00:00` offset, non-UTC aware input converted to UTC, naive input raises `ValueError`, two calls with a patched clock differ.
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle: `Cache-Control: no-store` header, 200 body shape with an aware UTC `now`, per-request freshness, 405 on POST.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (POST gets 405).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/BUG-01/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import and register the server-time router in `create_app()` (one import, one `include_router` line).
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is wired in.

No lockfile changes: no dependency is added or changed, so `backend/uv.lock` and the npm lockfiles stay untouched.
No `README.md` or `docs/DEVELOPMENT.md` edit: neither lists API endpoints, and this item changes no project structure, run configuration, dependency or test infrastructure.
No E2E spec: no criterion requires navigation or interaction through the UI (see Criterion coverage), so Phase D produces no file.

## Testing Strategy
- Unit tests: `server_time_service` (offset is explicit `+00:00`, non-UTC aware input is converted, naive input raises, per-call freshness with a monkeypatched clock); app factory registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the session `client` fixture in `backend/tests/conftest.py`: the `Cache-Control: no-store` header, 200 with the schema's shape, `now` parsing as an aware datetime with zero UTC offset, two requests returning different `now`, and 405 on POST. No database needed; the route works with `DATABASE_URL` unset.
  - Directory: backend/tests/integration/
- E2E tests: no spec for this item. E2E is ENABLED, but no criterion is verified through the UI (the endpoint has no frontend consumer), so per `testing_standards.md` Section 6 the tier is not warranted for any criterion.
  - Directory: e2e/tests/
  - File: none produced (would be `BUG-01_server_time_edge_cache.spec.ts`).
- UAT scenarios: one scenario per criterion plus the POST-405 edge case, as API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header on a router, read over the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | `test_get_time_sets_cache_control_no_store` | the criterion is satisfied by that integration test existing and passing; no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_time_returns_fresh_now_per_request`, `test_get_time_returns_200_with_utc_now_and_timezone` | the edge cache exists only on the deployed environment and no local tier can reproduce it; locally the tests cover the cause (the header) and per-request freshness, and the deployed reproduction is the human check in the Manual verification plan (`to_verify` route) |

Supporting tests the builder also writes (not criterion rows): `test_to_utc_iso_returns_explicit_utc_offset`, `test_to_utc_iso_converts_non_utc_aware_datetime_to_utc`, `test_to_utc_iso_raises_value_error_for_naive_datetime`, `test_get_server_time_returns_new_value_per_call`, `test_post_time_returns_405_method_not_allowed`, `test_create_app_registers_server_time_route`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends `GET /api/time`, Then the response status is 200 and the `Cache-Control` header is `no-store` |
| 2 | A test asserts the header on the response | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the header test passes with 0 failed |
| 3 | After deploy, two calls a second apart return different `now` | covered at Integration locally, human check on the deployed environment | Given the change is deployed behind the CDN, When two `GET /api/time` requests are sent one second apart, Then the two `now` values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Not verifiable through the UI: the endpoint has no screen. The observable check is the response header.
Prerequisites: the backend running locally (the handover stack, or `uv run --directory backend uvicorn app.main:app --port 8000`); note the backend URL the handover prints.
1. In a terminal, run `curl -si http://localhost:8000/api/time` (substitute the handover's backend URL) → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers in the same output → a line `cache-control: no-store` is present.
3. Read the body in the same output → JSON of the shape `{"now":"2026-11-13T08:03:14.512345+00:00","timezone":"UTC"}`, with `now` ending in `+00:00`.
4. Run `curl -si -X POST http://localhost:8000/api/time` → the status line reads `405 Method Not Allowed` (edge case: the route is GET only; a HEAD request also gets 405, so always verify with a GET).

### Criterion 2: a test asserts the header on the response
Not verifiable through the UI: it is a property of the test suite. The observable check is the test run.
Prerequisites: a checkout of the merged branch with backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the run ends with `0 failed`, and `test_get_time_sets_cache_control_no_store` is among the tests run (add `-v` to see it by name as `PASSED`).
2. Open `backend/tests/integration/test_server_time_integration.py` → `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: after deploy, the reproduction returns two different values
Not verifiable through the UI and not locally: the edge cache exists only on the deployed environment. A human runs this after the merge reaches it (the item sits at `to_verify` until then).
Prerequisites: the merged change deployed; the deployed host name known (the `<deployed-host>` from the ticket).
1. Run `curl -si https://<deployed-host>/api/time` → 200, a `cache-control: no-store` header, note the `now` value (for example `2026-11-13T09:00:00.101010+00:00`).
2. Wait one second, then run the same `curl -si https://<deployed-host>/api/time` again → 200, a different `now` value, later than the first.
3. Check the CDN's cache-status header in both outputs if the CDN emits one (for example `cf-cache-status` or `x-cache`) → it reads a miss, bypass or dynamic value, never a hit.
4. If both `now` values are identical, the item fails verification: record the two outputs on the ticket rather than moving it to Done.
