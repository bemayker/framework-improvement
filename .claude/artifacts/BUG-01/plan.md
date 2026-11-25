# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> Reproduction (deployed only): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`. Expected: two different `now` values. Actual: identical values. Locally both calls differ, because nothing caches them.
>
> Notes: Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): every comment on the item is an automated `mayker-dev` bot note from earlier runs whose code was reset off main → not acted on because none is a stakeholder requirement; no human comment exists.
- Assumption (dependency state): FEAT-1 is `complete` in the tracker, but `GET /api/time` does not exist on main at plan base 3b00cacf (no `backend/app/routers/server_time.py`, no registration in `backend/app/main.py`; the sandbox reset removed it, as the feature map row records) → this plan recreates the FEAT-1 endpoint to FEAT-1's own acceptance criteria (200 with `now` as ISO 8601 UTC with an explicit offset and `timezone: "UTC"`, `now` computed per request, body defined by a Pydantic schema, unit and integration tests for shape, offset and freshness) as the prerequisite of this fix. Without it criterion 1 has no response to put a header on. This is a scope change against the ticket's "Backend only, server_time.py" note, recorded here and to be logged through `decision-record.sh` at build time.
- Merged since the last plan: n/a (fresh plan, branched from current main 3b00cacf).

## Plan Overview
Backend only. Recreate the FEAT-1 server time slice in the project's Router, Service, Schema layering (the version slice is the precedent: `routers/version.py`, `services/version_service.py`, `schemas/version.py`), register its router in `backend/app/main.py`, and have the route set `Cache-Control: no-store` on every response, which is the defect fix. No database, no frontend, no external API. Criterion 3 is a human check on the deployed environment after merge (the item carries `mayker:to-verify`); locally it is proxied by the header test plus a per-request freshness test.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time; every response carries `Cache-Control: no-store`.
- Service layer: `backend/app/services/server_time_service.py` with `get_server_time() -> str`, returning `datetime.now(timezone.utc).isoformat()` (stdlib), so the value is timezone-aware and serialised with the explicit `+00:00` offset, computed on each call. A module constant `SERVER_TIMEZONE = "UTC"`.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, handler `get_time(response: Response) -> ServerTimeResponse` that sets `response.headers["Cache-Control"] = "no-store"` and returns the schema. The header is set in the route, not as app-wide middleware, so the fix stays scoped to the endpoint the defect names (no other route changes behaviour). A module constant `NO_STORE = "no-store"` keeps the literal in one place for the router and its test.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: str` and `timezone: Literal["UTC"]`. `now` is a string rather than a `datetime` field because Pydantic v2 serialises a UTC datetime with a `Z` suffix, while FEAT-1's contract and this plan's tests use the `+00:00` offset `isoformat()` produces.
- Wiring: `backend/app/main.py` imports and `include_router`s the server time router beside the existing three; the module docstring line naming registered routers gains FEAT-1 and BUG-01.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-25T13:34:31.123456+00:00", "timezone": "UTC"}
```

- Errors: `POST /api/time` returns 405 (FastAPI default for an unregistered method); no other error path exists.

## Technology Selection
- Current UTC time: chose stdlib `datetime.now(timezone.utc).isoformat()` over any time library, because the standard library covers aware UTC time and ISO 8601 serialisation fully.
- Cache directive: chose setting the header on FastAPI's injected `Response` (installed dependency) over a custom middleware or a CDN-side rule, because one header on one route needs no new component and the defect is the missing directive on this response.
- Response schema: chose Pydantic `BaseModel` (installed dependency, already used by every schema here) over a bare dict, as FEAT-1 requires.
- No new dependency is added; `backend/pyproject.toml` and `backend/uv.lock` do not change.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now`, `timezone`).
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning the aware UTC ISO 8601 string, `SERVER_TIMEZONE`.
- [B] backend/app/routers/server_time.py: `GET /api/time` route setting `Cache-Control: no-store`.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for offset, awareness and per-call freshness of the service.
- [B] backend/tests/integration/test_server_time_integration.py: HTTP cycle tests for shape, header, freshness and 405.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios per acceptance criterion plus one edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/BUG-01/uat_script.md: the artifact copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import and register the server time router; docstring names FEAT-1 and BUG-01.
- [B] backend/tests/unit/test_main_unit.py: add a test that the app registers `/api/time`.

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` change: neither lists API endpoints and this item changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `get_server_time()` returns a string that parses with `datetime.fromisoformat`, is timezone-aware with `utcoffset() == timedelta(0)` and ends in `+00:00` (happy path); two calls with a patched clock return different values (freshness edge case); `create_app()` registers `/api/time`. The service has no error path of its own (the stdlib clock does not raise), so the error case is covered at router level by the 405 test.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: real HTTP request/response cycle through `TestClient` against `create_app()`: 200 with the schema shape, `Cache-Control: no-store` on the response, two requests separated by a short real delay return different `now`, and `POST /api/time` returns 405. Uses the shared `client` fixture; no database needed.
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion involves navigation or interaction through the UI; the endpoint has no frontend consumer.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus one edge case (a second request does not reuse the first response's `now`); criterion 3's scenario states it runs against the deployed host.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header of a router, read off the HTTP cycle |
| 2 | A test asserts the header on the response | Integration | `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: the criterion is satisfied by the integration test that asserts the header existing and passing |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_time_returns_fresh_now_per_request`, `test_get_time_sets_cache_control_no_store` | there is no UI and no edge cache locally; the automated proxy is per-request freshness plus the no-store directive the CDN honours, and the deployed check itself is the human step in the Manual verification plan |

Supporting tests recreating FEAT-1 (named so the builder produces them): `test_get_time_returns_200_with_now_and_utc_timezone`, `test_post_time_returns_405_method_not_allowed`, `test_get_server_time_returns_iso_string_with_utc_offset`, `test_get_server_time_returns_fresh_value_per_call`, `test_create_app_registers_server_time_route`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running, When I request GET /api/time, Then the response header Cache-Control is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When I run the server time integration tests, Then the run passes including the Cache-Control assertion |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; final check is manual on the deployed host | Given the deployed API behind its CDN, When I request GET /api/time twice one second apart, Then the two now values differ |

## Manual verification plan
None of the three criteria has a UI: the endpoint has no frontend consumer, so every step reads the HTTP response with curl or runs the tests.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the stack is running locally (`docker compose up -d` from the repo root), backend reachable at `http://localhost:8010` (the port `docker-compose.yml` publishes).
1. Run `curl -si http://localhost:8010/api/time` in a terminal → the status line is `HTTP/1.1 200 OK`.
2. Read the headers of that same output → a line `cache-control: no-store` is present.
3. Read the body of that same output → JSON shaped like `{"now":"2026-11-25T13:34:31.123456+00:00","timezone":"UTC"}`, `now` ending in `+00:00`.

### Criterion 2: a test asserts the header on the response
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_sets_cache_control_no_store` → it asserts the response's `Cache-Control` header equals `no-store`.

### Criterion 3: after deploy, the reproduction returns two different values
Prerequisites: this fix is merged and deployed; you know the deployed host name (replace `<deployed-host>` below). This cannot be verified locally, because no edge cache exists there.
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header; note the `now` value.
2. Wait one second, then run `curl -s https://<deployed-host>/api/time` again → the `now` value differs from the one noted in step 1.
3. If the two values are identical, read the response headers for a CDN cache marker (for example `x-cache: HIT` or an `age` header) → its presence means the CDN still caches the route and the item fails verification.

## Scope changes

- 2026-11-25 Recreated FEAT-1's GET /api/time (backend/app/schemas/server_time.py, backend/app/services/server_time_service.py, backend/app/routers/server_time.py, registered in backend/app/main.py, with unit and integration tests) as the prerequisite of the BUG-01 fix, against the ticket's "Backend only, server_time.py" note. Reason: the endpoint does not exist on main (the sandbox reset removed it), so criterion 1 had no response to put `Cache-Control: no-store` on.
