# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> ## What
>
> `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> ## Acceptance criteria
>
> 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
> 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
> 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
>
> ## Notes
>
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches `main.py`'s router registration, so it must not run concurrently with another backend item that does the same.

## Acceptance Criteria
- [ ] 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 ... Code revert pending ... Do not run /deliver against this item until that revert has merged." → Addressed by: checked against the tree rather than assumed. On `origin/main` at 62e1b544 there is no `backend/app/routers/uptime.py`, `backend/app/schemas/uptime.py`, uptime service or uptime test, and `backend/app/main.py` registers only the version, notes and health routers, so the earlier build is absent and this plan creates every file from scratch. No other action.
- Comment (tracker, 2026-09-14): earlier build's report (wire value `+00:00`, OpenAPI shows a bare string for `started_at`, `started_at` captured at module import, single-worker residual). → Not acted on as a requirement change: it asks for nothing the description does not. Used as input in three places: (a) the plan keeps the explicit `+00:00` offset on the wire (criterion 3), via a `field_serializer`; (b) the plan does NOT claim an OpenAPI `format: date-time` for `started_at` anywhere, and the UAT artifacts must not either; (c) instead of a module-level import-time constant, the start marker is captured inside `create_app()` and stored on `app.state`, so each app instance (and each test-created app) owns exactly one marker. The multi-worker residual (each uvicorn worker is its own process with its own start) is recorded as an assumption below, not engineered around, since the Dockerfile runs one process and the criteria ask for process uptime.
- Assumption (scope, no blocking question): "application startup" is read as the moment `create_app()` builds the app. Under the Dockerfile's `uvicorn app.main:create_app --factory`, that is process start. It is chosen over the `lifespan` hook so the endpoint answers even when lifespan is not entered (a bare `TestClient(app)` without a context manager) and so it stays independent of the database-schema step that lifespan performs.
- Assumption (scope): "explicit offset" is read as the literal `+00:00` suffix, not Pydantic's default `Z`. Both denote UTC; `+00:00` is the unambiguous reading of "offset".

## Plan Overview
Backend only. Add `GET /api/uptime` following the existing Router to Service to Schema shape the version and health endpoints use (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`). No database, no repository, no migration, no frontend, no new dependency.

The start marker (UTC wall-clock `started_at` plus a `time.monotonic()` reading) is captured once in `create_app()` and stored on `app.state.process_start`. The router reads it from `request.app.state`, asks the service for elapsed seconds (monotonic now minus monotonic start, clamped at 0.0), and returns an `UptimeResponse` Pydantic model whose `started_at` serialises with an explicit `+00:00` offset. Using the monotonic clock for elapsed time means a wall-clock adjustment (NTP step) can never make `uptime_seconds` negative or go backwards; `started_at` is the wall-clock moment for human reading.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns 200 with `UptimeResponse`. Router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, handler signature takes `request: Request` and returns `UptimeResponse`, declared with `response_model=UptimeResponse`. Registered in `backend/app/main.py` with `app.include_router(uptime_router)` after the existing three; the module docstring of `main.py` gains one clause naming TEST-07.
- Service layer: `backend/app/services/uptime_service.py`.
  - `ProcessStart`: a frozen `dataclass` with `started_at: datetime` (UTC-aware) and `monotonic_start: float`.
  - `capture_process_start(wall_clock=_utc_now, monotonic_clock=time.monotonic) -> ProcessStart`: reads each clock once. `_utc_now()` returns `datetime.now(timezone.utc)`. Clocks are injectable parameters so unit tests need no monkeypatching of the stdlib.
  - `uptime_seconds(process_start, monotonic_clock=time.monotonic) -> float`: returns `max(0.0, monotonic_clock() - process_start.monotonic_start)`. The clamp is the guarantee behind "non-negative"; the monotonic clock is the guarantee behind "increases".
- App factory: `create_app()` in `backend/app/main.py` sets `app.state.process_start = capture_process_start()` before returning. This is the only place the marker is created, so it is never recomputed per request.
- Schema: `backend/app/schemas/uptime.py`, `UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus `@field_serializer("started_at")` returning `value.astimezone(timezone.utc).isoformat()` so the wire value always ends in `+00:00` (a non-UTC aware value is converted, a naive value is rejected by `AwareDatetime` at construction).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: 200, `application/json`:

```json
{"uptime_seconds": 12.345678, "started_at": "2026-11-18T22:05:34.123456+00:00"}
```

`uptime_seconds` is a JSON number, always >= 0, fractional seconds allowed. `started_at` is ISO 8601 in UTC ending in `+00:00`, identical on every response from the same running process. Other methods on the path return FastAPI's default 405.

## Technology Selection
- `started_at` timestamp: chose stdlib `datetime.now(timezone.utc)` over any date library, because the stdlib covers an aware UTC timestamp and its `isoformat()` already emits `+00:00`.
- Elapsed-time source: chose stdlib `time.monotonic()` over subtracting two wall-clock `datetime` values, because a wall clock can be stepped backwards and would break "non-negative and increases"; no installed dependency is needed.
- Response schema `UptimeResponse`: chose Pydantic (already installed with FastAPI) with its built-in `AwareDatetime` and `field_serializer` over a hand-built string field or a custom JSON encoder, because Pydantic validates awareness and serialises in a few lines.
- `ProcessStart` value object: chose stdlib `dataclasses.dataclass(frozen=True)` over a Pydantic model, because it is an internal value never serialised and needs no validation.
- Storage of the start marker: chose FastAPI's native `app.state` over a module-level global, because it scopes one marker to one app instance and keeps `create_app()` instances independent (the existing `test_create_app_returns_independent_instances` contract).
- New dependencies: none.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema with `AwareDatetime` and the `+00:00` field serializer (criterion 4, criterion 3 serialisation)
- [B] backend/app/services/uptime_service.py: `ProcessStart`, `capture_process_start()`, `uptime_seconds()`
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `request.app.state.process_start`
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service functions with injected fake clocks
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for `UptimeResponse` validation and serialisation
- [B] backend/tests/integration/test_uptime_integration.py: router tests over the real HTTP request and response cycle
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual UAT script

### Modified files
- [B] backend/app/main.py: import and register `uptime_router`; set `app.state.process_start = capture_process_start()` in `create_app()`; docstring names TEST-07
- [B] backend/tests/unit/test_main_unit.py: add route-registration and start-marker tests for `create_app()`

No lockfile changes: no dependency is added or removed. No `README.md` or `docs/DEVELOPMENT.md` change: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure. No E2E spec: no criterion involves the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: service functions with injected fake clocks (happy path, clamp edge case, increase between reads, UTC awareness); schema validation and serialisation (offset suffix, non-UTC conversion, naive rejected, negative rejected); app factory registers the route and stores exactly one start marker per app.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`, `test_uptime_schema_unit.py`, and the existing `test_main_unit.py`)
- Integration tests: `GET /api/uptime` through `TestClient` on the session `client` fixture: 200 and body shape, two calls one real second apart (`time.sleep(1.0)`, deliberate, the criterion is phrased that way), `started_at` identical across requests, `started_at` ends in `+00:00` and parses as UTC, `POST` returns 405. No database needed: the endpoint must also answer with `DATABASE_URL` unset, mirroring `test_get_version_answers_when_database_url_is_unset`.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (`test_uptime_integration.py`)
- E2E tests: none warranted. E2E is ENABLED, but no criterion requires navigation or interaction through the UI; the feature has no frontend.
  - Directory: e2e/tests/
  - File: no `TEST-07_uptime_endpoint.spec.ts` is produced
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (non-GET method returns 405), describing API-level observations only; they must not claim an OpenAPI `format: date-time` for `started_at`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` number and `started_at` ISO 8601 UTC | Integration | `test_get_uptime_returns_200_with_uptime_and_started_at`, `test_get_uptime_answers_when_database_url_is_unset`, `test_create_app_registers_uptime_route` | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | `uptime_seconds` non-negative and increases between two calls a second apart | Integration | `test_get_uptime_increases_between_calls_a_second_apart`, `test_uptime_seconds_returns_elapsed_monotonic_time`, `test_uptime_seconds_clamps_to_zero_when_clock_reads_before_start`, `test_uptime_response_rejects_negative_uptime` | verifying it needs no navigation or interaction: it is a timing property of the endpoint and the service |
| 3 | `started_at` captured once at startup, not per request, serialised in UTC with explicit offset | Integration | `test_get_uptime_started_at_is_identical_across_requests`, `test_get_uptime_started_at_is_utc_with_explicit_offset`, `test_create_app_captures_process_start_once`, `test_capture_process_start_records_utc_aware_started_at`, `test_uptime_response_serialises_started_at_with_utc_offset`, `test_uptime_response_converts_non_utc_started_at_to_utc`, `test_uptime_response_rejects_naive_started_at` | verifying it needs no navigation or interaction: it is app-factory state and schema serialisation |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_uptime_response_serialises_started_at_with_utc_offset`, `test_get_uptime_openapi_references_uptime_response_schema` | verifying it needs no navigation or interaction: it is a code-structure property checked on the schema class and the generated OpenAPI `UptimeResponse` component |

Note on row 4: `test_get_uptime_openapi_references_uptime_response_schema` lives in `backend/tests/integration/test_uptime_integration.py` and asserts that `client.get("/openapi.json")` lists `UptimeResponse` as the 200 response schema of `GET /api/uptime` with properties `uptime_seconds` and `started_at`; it asserts nothing about the `format` of `started_at`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running When I GET /api/uptime Then the status is 200 and the body has a numeric uptime_seconds and an ISO 8601 started_at |
| 2 | non-negative, increases a second apart | covered at Integration, see Criterion coverage | Given the backend is running When I GET /api/uptime twice one second apart Then both uptime_seconds are >= 0 and the second is larger |
| 3 | `started_at` captured once, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running When I GET /api/uptime twice Then started_at is identical and ends in +00:00; When the backend restarts Then started_at changes and uptime_seconds drops |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running When I open /docs Then GET /api/uptime shows the UptimeResponse schema |

## Manual verification plan
None of the criteria has a UI in the app itself; every check below is an HTTP call from a terminal or the FastAPI docs page. Prerequisites for all blocks: the stack is running with `docker compose up -d --build` from the repository root, and the backend answers on `http://localhost:8010` (compose maps `8010:8010`).

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: stack running as above.
1. In a terminal run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is present.
2. Read the body → it has exactly two keys, for example `{"uptime_seconds":42.17,"started_at":"2026-11-18T22:05:34.123456+00:00"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted ISO 8601 date-time.
3. Run `curl -i -X POST http://localhost:8010/api/uptime` → status `405 Method Not Allowed` (the edge case: the endpoint is read-only).

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: stack running as above.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (call it A) → A is 0 or greater.
2. Wait about one second, then run the same command again and note `uptime_seconds` (call it B) → B is 0 or greater and B is larger than A by roughly one second.
3. Run `uv run --directory backend pytest -q tests/integration/test_uptime_integration.py tests/unit/test_uptime_service_unit.py` → the summary line reports no failed or errored test and the command exits 0 (needs `DATABASE_URL` only if CI is set; the uptime tests themselves use no database).

### Criterion 3: `started_at` is captured once at startup, in UTC with an explicit offset
Prerequisites: stack running as above.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → `started_at` is character-for-character identical in both responses while `uptime_seconds` differs.
2. Read the end of `started_at` → it ends in `+00:00`, not `Z` and not a local offset such as `+01:00`.
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again → `started_at` is now a later timestamp than in step 1 and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: stack running as above.
1. Open `http://localhost:8010/docs` in a browser → the Swagger page lists `GET /api/uptime` under the `uptime` tag.
2. Expand `GET /api/uptime` and its 200 response → the schema is named `UptimeResponse` with fields `uptime_seconds` (number) and `started_at` (string). Do not expect a `date-time` format annotation on `started_at`; the schema only documents it as a string.
3. Open `backend/app/schemas/uptime.py` in the repository → it defines `class UptimeResponse(BaseModel)` with those two fields.
