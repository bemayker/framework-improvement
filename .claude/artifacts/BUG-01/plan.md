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
- Comment (tracker): 35 comments read, 0 actionable (all framework PR notices, per the dispatch and `.claude/artifacts/BUG-01/decisions.md`) → Addressed by: nothing to act on; recorded so the read is visible.
- Merged since the last plan: n/a (fresh plan on plan base 1cee27a, the current main tip; no earlier BUG-01 plan exists on this checkout).
- Assumption (dependency state): FEAT-1 is `complete` in the tracker but its code is absent from main. Verified against main at 1cee27a: no `backend/app/routers/server_time.py`, `schemas/server_time.py` or `services/server_time_service.py` is tracked, nothing under `backend/` mentions `server_time` or `Cache-Control`, and `backend/app/main.py` registers only the version, notes and health routers (the reset commit 1cee27a removed the earlier build 649c590). The bug cannot be fixed on an endpoint that does not exist, so this plan recreates the FEAT-1 endpoint to FEAT-1's own acceptance criteria (200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema in `backend/app/schemas/`) and adds the `Cache-Control: no-store` fix on it. Recreating it is the dependency's floor, not gold plating: nothing beyond FEAT-1's criteria and BUG-01's header is added.

## Plan Overview
Backend only. Recreate the server time endpoint `GET /api/time` in the project's Router to Service layering, following the version endpoint's shape (`routers/version.py`, `schemas/version.py`, `services/version_service.py`), register it in `backend/app/main.py`, and set `Cache-Control: no-store` on every response so no shared or private cache (the CDN in front of the deployed API) may store it. No database, no frontend, no external API. Criteria 1 and 2 are proven by an integration test on the real HTTP cycle; criterion 3 is a human check on the deployed environment, recorded as the `to_verify` route's verification step.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, with response header `Cache-Control: no-store`.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, handler `get_server_time(response: Response) -> ServerTimeResponse` with `response_model=ServerTimeResponse`. It sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=get_current_utc_time())`. The header value is a module constant (`NO_STORE = "no-store"`) so the test and the router name one value. Scoped to this route only: no app-wide middleware, since the defect and criterion 1 name this endpoint alone.
- Service layer: `backend/app/services/server_time_service.py`, `get_current_utc_time() -> datetime` returning `datetime.now(timezone.utc)`, evaluated on every call (never cached at import or module level), always timezone-aware.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"] = "UTC"`. A `field_serializer("now")` serializes with `value.astimezone(timezone.utc).isoformat()`, so the wire value carries the explicit `+00:00` offset (Pydantic's default would emit `Z`), and a naive datetime is rejected by a `field_validator` raising `ValueError`, so the "never naive" rule is enforced in the schema rather than assumed.
- Registration: `backend/app/main.py` imports `server_time_router` and adds `app.include_router(server_time_router)` after the existing three; update the module docstring's registration list with one clause. No other change to the factory.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, headers include `Cache-Control: no-store`; body:

```json
{"now": "2026-11-10T01:47:19.123456+00:00", "timezone": "UTC"}
```

- Other methods: 405 (FastAPI default for an unregistered method on the path).

## Technology Selection
- Current time: chose stdlib `datetime.now(timezone.utc)` over any time library; the standard library covers it fully.
- Response schema: chose Pydantic `BaseModel` (already installed with FastAPI) with a `field_serializer`, over a hand-formatted string in the router; the installed dependency covers serialization and validation.
- `Cache-Control` header: chose FastAPI's injected `Response` parameter (installed) setting one header on this route, over a custom middleware or a new caching dependency, because the requirement is one header on one route and the framework's own response object covers it in one line.
- Router, service and their tests: no stdlib call, native platform feature or installed dependency replaces them; they are the project's standard Router to Service layering, built here.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router, sets `Cache-Control: no-store`, returns `ServerTimeResponse`.
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` schema, UTC-aware `now` serialized with explicit `+00:00` offset, `timezone` fixed to `UTC`.
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` returning an aware UTC datetime per call.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service and the schema serializer/validator.
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests: 200 and body shape, `Cache-Control: no-store` header, explicit offset, per-request freshness, 405 on POST.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import and register the server time router; one docstring clause.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom routes.

No dependency is added or changed, so no lockfile is regenerated. No project structure, run configuration, dependency or test infrastructure changes, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. No E2E spec: no criterion is covered at the E2E tier (see Criterion coverage).

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time` returns an aware datetime whose `utcoffset()` is zero (happy path); two calls with a monkeypatched clock return the two different values, proving no caching at module level (edge); `ServerTimeResponse` serializes `now` with a `+00:00` suffix and rejects a naive datetime with a validation error (error case). Plus the route-registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: through the session `client` fixture in `backend/tests/conftest.py` (no database needed, so no `database_url` fixture): `GET /api/time` returns 200 and the body has exactly the keys `now` and `timezone` with `timezone == "UTC"`; the response header `Cache-Control` equals `no-store` (criteria 1 and 2); `now` parses with `datetime.fromisoformat` to an aware value with zero offset and ends with `+00:00`; two requests with the service's clock monkeypatched to advance return different `now` values (freshness without a real sleep); `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. The feature has no UI and no criterion requires navigation or interaction, so per `testing_standards.md` Section 6 the E2E tier is not warranted; the headers and body are verified at the integration tier.
  - Directory: e2e/tests/
  - File: none written (would be BUG-01_server_time_edge_cache.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST is rejected with 405), validated for well-formedness only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a response header on a router, read on the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | the criterion is satisfied by the integration test itself (`test_get_server_time_sets_cache_control_no_store`), a router behaviour with no UI |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Integration | no UI and no local edge cache exist; the executed test is the integration freshness test (two requests, different `now`, header present), and the deployed check itself is the human `to_verify` step in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running When a client requests GET /api/time Then the response has header Cache-Control "no-store" |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite When the server time integration tests run Then 0 failed, including the Cache-Control assertion |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed API When GET /api/time is requested twice a second apart Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion has no UI; the observable check is the response header.
Prerequisites: the stack is running locally with `docker compose up -d --build` from the repository root, and the backend answers on `http://localhost:8010`.
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers in that output → a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body on the last line → JSON of the shape `{"now":"2026-11-10T01:47:19.123456+00:00","timezone":"UTC"}`, where `now` ends in `+00:00` and `timezone` is `UTC`.
4. Run `curl -si -X POST http://localhost:8010/api/time` → status `405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
This criterion has no UI; the observable check is the test run.
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_server_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion can only be verified on the deployed environment, after the fix is merged and deployed (the item's `to_verify` route); there is no UI step.
Prerequisites: the merged change is deployed; you know the deployed API host (shown below as `<deployed-host>`).
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header; note the `now` value.
2. Wait about one second, then run `curl -s https://<deployed-host>/api/time` again → a `now` value that differs from the one in step 1.
3. Optionally, read the CDN's cache-status header in the step 1 output (for example `cf-cache-status` or `x-cache`, depending on the CDN) → it reports a miss or bypass, never a hit.
4. Record the two `now` values and the date on the tracker item, then move it out of to-verify.
