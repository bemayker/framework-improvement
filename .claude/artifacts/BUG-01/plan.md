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
- Comment (tracker): 48 comments across 2 pages, all framework-authored "PR opened" notes from earlier runs (per the dispatch and `.claude/artifacts/BUG-01/decisions.md`) → Addressed by: not acted on because none carries a stakeholder correction or amendment to the criteria.
- Assumption (scope): FEAT-1 is `complete` in the tracker, but its code is absent from `main` (no `backend/app/routers/server_time.py`, no `/api/time` registration in `backend/app/main.py`; the map row records the sandbox reset c5a6e64). Criterion 1 cannot be met on an endpoint that does not exist, so this plan recreates the `GET /api/time` endpoint bounded strictly to FEAT-1's own acceptance criteria (200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request and never naive, body defined by a Pydantic schema in `backend/app/schemas/`, unit and integration tests for shape, offset and freshness) and adds the BUG-01 fix on top. Nothing beyond FEAT-1's criteria plus BUG-01's header is added. Recorded as a scope change for the PR's `## Decisions` block.
- Merged since the last plan: n/a (fresh plan, branched from current main 622c796d).

## Plan Overview
Backend only. Recreate FEAT-1's `GET /api/time` slice in the project's Router to Service to Schema layering (canonical modules: `routers/version.py`, `services/version_service.py`, `schemas/version.py`), register its router in `backend/app/main.py`, and set `Cache-Control: no-store` on the endpoint's response so the deployed edge cache stops serving a stale `now`. No database, no frontend, no external API, no new dependency. Criterion 3 is a deployed-only human check (the item carries `mayker:to-verify`); locally it is proxied by a two-sequential-calls integration test.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time; response carries `Cache-Control: no-store`.
- Service layer: `backend/app/services/server_time_service.py` exposes `get_server_time() -> datetime`, returning `datetime.now(timezone.utc)` (timezone-aware, computed per call). Module docstring names FEAT-1 (endpoint) and BUG-01 (header) and the design reason, per the project's documentation convention.
- Schema: `backend/app/schemas/server_time.py` defines `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's built-in type, rejects a naive datetime) and `timezone: Literal["UTC"] = "UTC"`; a `field_serializer("now")` returns `value.isoformat()` so the wire form carries an explicit `+00:00` offset rather than Pydantic's default `Z`.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, `@router.get("/time", response_model=ServerTimeResponse)`; the handler takes FastAPI's `Response` parameter and sets `response.headers["Cache-Control"] = NO_STORE_CACHE_CONTROL` (module constant `"no-store"`), with a comment saying why (the deployed CDN caches any response that carries no directive). Endpoint-scoped, not an app-wide middleware: the defect and criterion 1 concern this route only.
- App factory: `backend/app/main.py` imports the router and adds `app.include_router(server_time_router)` beside the existing three; module docstring gains one line naming the FEAT-1/BUG-01 registration. CORS middleware and lifespan untouched.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no query parameters
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-18T01:30:00.123456+00:00", "timezone": "UTC"}
```

- Other methods: `POST /api/time` returns 405 (FastAPI default for an undeclared method).

## Technology Selection
- Current time (`server_time_service.py`): chose stdlib `datetime.now(timezone.utc)` over any time library; the standard library covers an aware UTC timestamp fully.
- Response schema (`schemas/server_time.py`): chose installed Pydantic's `AwareDatetime` plus a `field_serializer` over a hand-written naive-check validator; the installed dependency already enforces "never naive".
- Cache directive (`routers/server_time.py`): chose FastAPI's native `Response` header injection (already installed) over a new cache-control dependency or an app-wide middleware; one header on one route is a single line, and a middleware would widen the change to routes no criterion names.
- No other net-new component, module or dependency.

## File Manifest
### New files
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning an aware UTC datetime, computed per call (FEAT-1 recreation)
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` (`now: AwareDatetime` serialised with explicit offset, `timezone: Literal["UTC"]`)
- [B] backend/app/routers/server_time.py: `GET /api/time` router that sets `Cache-Control: no-store` on the response (the BUG-01 fix)
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service and the schema (aware UTC, per-call freshness, explicit offset, naive rejected)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for shape, `Cache-Control: no-store`, two-sequential-calls freshness, 405 on POST
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-01/uat_script.md: the artifact copy of the manual UAT script build-feature writes

### Modified files
- [B] backend/app/main.py: import and register the server_time router; one docstring line
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`

No dependency changes, so no lockfile entry. No E2E spec: the feature has no UI, so no criterion's covering tier is E2E. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test-infrastructure change, and neither document lists API endpoints.

Overlap with TEST-09 (approved-pending plan): BUG-01 touches **none** of TEST-09's files (`backend/app/core/config.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, `backend/app/routers/version.py`, `backend/Dockerfile`, `docker-compose.yml`, `.env.example`, `backend/tests/unit/test_config_unit.py`, `backend/tests/unit/test_version_service_unit.py`, `backend/tests/unit/test_version_schema_unit.py`, `backend/tests/integration/test_version_integration.py`, its UAT files). BUG-01's only shared-surface files are `backend/app/main.py` and `backend/tests/unit/test_main_unit.py`, which TEST-09's plan does not list.

## Testing Strategy
- Unit tests: service and schema, mocked clock where freshness is asserted.
  - `test_get_server_time_returns_aware_utc_datetime`: `tzinfo` is UTC, `utcoffset()` is zero.
  - `test_get_server_time_returns_fresh_value_per_call`: patch the module's clock to return two different instants; two calls return two different values (edge case: no caching in the service).
  - `test_server_time_response_serialises_explicit_utc_offset`: `model_dump(mode="json")["now"]` ends with `+00:00` and `timezone` is `"UTC"`.
  - `test_server_time_response_rejects_naive_datetime`: constructing with a naive datetime raises `ValidationError` (error case).
  - `test_create_app_registers_server_time_route` (in `test_main_unit.py`): `/api/time` is among the custom routes.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle through the session `client` fixture (no database needed).
  - `test_get_time_returns_200_with_utc_now_and_timezone`: 200, body keys exactly `now` and `timezone`, `timezone == "UTC"`, `datetime.fromisoformat(now).utcoffset()` is zero and not None.
  - `test_get_time_response_carries_cache_control_no_store`: `response.headers["cache-control"] == "no-store"`.
  - `test_get_time_two_sequential_calls_return_different_now`: two calls separated by a short real delay return different `now` values (the local proxy of criterion 3).
  - `test_post_time_returns_405_method_not_allowed`: error case.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion involves navigation or interaction through a UI; the endpoint has no frontend consumer.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus an edge case (POST returns 405); criterion 3's scenario is the deployed-environment curl check for the human verifier.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_response_carries_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header of a router, read off the HTTP cycle |
| 2 | A test asserts the header on the response | Integration | `test_get_time_response_carries_cache_control_no_store` | the criterion is the existence of that router test itself; no UI exists to drive |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_time_two_sequential_calls_return_different_now`, `test_get_server_time_returns_fresh_value_per_call` | no UI, and the edge cache exists only on the deployed environment: locally the integration test proves per-request freshness, and the deployed check is the human verification the `mayker:to-verify` label names |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response carries Cache-Control: no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the header test passes |
| 3 | Deployed reproduction returns two different values | covered at Integration locally, human on the deployed environment | Given the deployed API behind the CDN, When GET /api/time is requested twice a second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion has no UI; the observable check is the response header.
Prerequisites: the stack is running (`docker compose up -d` from the repository root), backend answering on `http://localhost:8010`.
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers of that output → a line `cache-control: no-store` is present.
3. Read the body of that output → JSON of the form `{"now":"2026-11-18T01:30:00.123456+00:00","timezone":"UTC"}`, with `now` ending in `+00:00`.

### Criterion 2: A test asserts the header on the response
This criterion has no UI; the observable check is the test run.
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_response_carries_cache_control_no_store` asserts the `cache-control` header equals `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion has no UI and runs on the deployed environment only; the observable check is two `now` values.
Prerequisites: the merged change is deployed; you know the deployed host (replace `<deployed-host>` below).
1. Run `curl -s https://<deployed-host>/api/time` → JSON with a `now` value, for example `"2026-11-18T09:00:00.100000+00:00"`; note it.
2. Wait one second, then run `curl -s https://<deployed-host>/api/time` again → a `now` value roughly one second later than step 1's, not identical to it.
3. Run `curl -si https://<deployed-host>/api/time` → the headers include `cache-control: no-store` as served through the CDN.
4. If step 2's value equals step 1's, the defect persists: record the CDN's own cache headers from step 3's output (for example `age` or `x-cache`) in the verification note.
