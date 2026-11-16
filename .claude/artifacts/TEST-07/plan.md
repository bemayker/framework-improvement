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
- [ ] 1. `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Plan Overview
Backend only. One read-only endpoint, `GET /api/uptime`, following the existing version/health slice layout (router, service, schema, registered in `create_app()`).

- The start instant is captured exactly once per application instance, inside `create_app()` (which runs once at process startup via the module-level `app = create_app()`), and stored on `app.state.process_start`. It holds two readings taken together: the wall-clock UTC instant (for `started_at`) and a `time.monotonic()` reading (for `uptime_seconds`).
- `uptime_seconds` is computed per request as `time.monotonic() - start.monotonic`, clamped at 0. The monotonic clock never goes backwards, so a wall-clock adjustment (NTP step, container clock change) can never produce a negative or shrinking uptime.
- `started_at` is serialised by the schema as `datetime.isoformat()` of a UTC-aware value, which always ends in `+00:00` (an explicit offset).
- No database, no frontend, no new dependency.

Assumptions (recorded per `user_story_alignment.md` Section 4):
- A1. "Application startup" is `create_app()`, not the lifespan hook: `create_app()` runs once per process under uvicorn, and capturing there means the value exists for every app instance, including a `TestClient` used without its context manager (lifespan does not run then). Each `create_app()` call gets its own start instant, so tests never share one.
- A2. "Serialised in UTC with an explicit offset" is read as the `+00:00` suffix. Pydantic v2's default would emit `Z`; the schema therefore serialises `started_at` with an explicit `field_serializer` so the offset is literally present and the output does not depend on Pydantic's default.
- A3. `uptime_seconds` is a float (seconds with sub-second precision). The criterion says "number" and "increases between two calls a second apart"; an integer would also satisfy it, a float is the direct monotonic difference and needs no rounding rule.
- A4. The only reachable error case is a wrong method (405); the endpoint takes no input, so there is no 422 or 404 to test.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns `UptimeResponse` (200). Router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, handler takes `request: Request` and reads `request.app.state.process_start`.
- Service layer: `backend/app/services/uptime_service.py`:
  - `ProcessStart` frozen dataclass: `started_at: datetime` (UTC-aware), `monotonic: float`.
  - `capture_process_start() -> ProcessStart`: reads `datetime.now(timezone.utc)` and `time.monotonic()` once.
  - `uptime_seconds(start: ProcessStart, now_monotonic: float) -> float`: returns `max(0.0, now_monotonic - start.monotonic)`. The caller (router) passes `time.monotonic()`, so the function is pure and unit-testable without patching clocks.
- Schema: `backend/app/schemas/uptime.py`, `UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: datetime`, plus a `field_serializer("started_at")` returning `value.astimezone(timezone.utc).isoformat()`.
- App factory: `backend/app/main.py` `create_app()` sets `app.state.process_start = capture_process_start()` and adds `app.include_router(uptime_router)`. The module docstring gains one line naming TEST-07's registration, matching how it names the earlier items.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `UptimeResponse`:

```json
{"uptime_seconds": 3612.418734, "started_at": "2026-11-17T22:49:37.120394+00:00"}
```

- `uptime_seconds`: number, >= 0, grows with wall time between calls.
- `started_at`: string, ISO 8601, UTC, always with the `+00:00` offset; identical on every call to the same process.
- Errors: a non-GET method returns FastAPI's 405.

## Technology Selection
- Start-instant and uptime arithmetic (`uptime_service.py`): chose the standard library (`datetime.now(timezone.utc)`, `time.monotonic()`) over any installed dependency, because the stdlib covers it fully; no dependency (and no `psutil` process-start lookup) is added.
- Storing the start instant: chose FastAPI's own `app.state` (installed dependency) over a module-level global, because it scopes the value to one app instance so repeated `create_app()` calls in tests stay independent.
- Response schema (`schemas/uptime.py`): chose Pydantic (installed, 2.13.4) `BaseModel` with `Field(ge=0)` and `field_serializer`, over hand-formatting the timestamp in the router, because the criterion requires a Pydantic schema and the constraint and serialisation then live in it.
- Router (`routers/uptime.py`): FastAPI `APIRouter`, already installed; no alternative needed.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema (non-negative `uptime_seconds`, `started_at` serialised with `+00:00`)
- [B] backend/app/services/uptime_service.py: `ProcessStart`, `capture_process_start()`, `uptime_seconds()`
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for the schema's constraint and serialisation
- [B] backend/tests/integration/test_uptime_integration.py: HTTP request/response tests for the endpoint
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-07/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: capture `app.state.process_start` in `create_app()`, register the uptime router, docstring line
- [B] backend/tests/unit/test_main_unit.py: add a test that the app registers `/api/uptime`

No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither document lists API endpoints.

## Testing Strategy
- Unit tests: service (`capture_process_start` returns a UTC-aware instant, `uptime_seconds` happy path, clamp at 0 when the monotonic reading precedes start), schema (`+00:00` serialisation, conversion of a non-UTC aware value to UTC, rejection of a negative uptime), app factory (route registered, start instant set per app).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: real HTTP cycle through the session `client` fixture in `backend/tests/conftest.py` (no database needed): 200 and body shape, increase across calls one second apart (`time.sleep(1.0)` between them, as the criterion specifies the interval), `started_at` stable across requests and carrying `+00:00`, OpenAPI response schema is `UptimeResponse`, and 405 on POST.
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion involves navigation or interaction through the UI (no frontend change), so per `testing_standards.md` Section 6 the E2E tier is not warranted.
  - Directory: e2e/tests/
  - File: no spec for TEST-07
- UAT scenarios: one scenario per criterion plus one edge case (POST returns 405), verified by HTTP request since the feature has no UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | `test_get_uptime_returns_200_with_uptime_and_started_at` | verifying it needs no navigation or interaction: it is a router response, and no UI renders it |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration, Unit | `test_get_uptime_seconds_increases_between_calls_a_second_apart`, `test_uptime_seconds_returns_elapsed_monotonic_seconds`, `test_uptime_seconds_clamps_to_zero_when_now_precedes_start`, `test_uptime_response_rejects_negative_uptime_seconds` | verifying it needs no navigation or interaction: it is router behaviour over time plus a service calculation and a schema constraint |
| 3 | `started_at` captured once at startup, not per request, serialised in UTC with explicit offset | Integration, Unit | `test_get_uptime_started_at_is_identical_across_requests`, `test_get_uptime_started_at_is_utc_with_explicit_offset`, `test_capture_process_start_returns_utc_aware_instant`, `test_uptime_response_serialises_started_at_with_utc_offset`, `test_uptime_response_converts_non_utc_started_at_to_utc`, `test_create_app_captures_process_start_once_per_app` | verifying it needs no navigation or interaction: it is startup wiring and serialisation of an API field |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_get_uptime_openapi_response_schema_is_uptime_response` | verifying it needs no navigation or interaction: it is the route's declared response model, read from the OpenAPI document |

Supporting tests outside the table (endpoint error case and registration): `test_post_uptime_returns_405_method_not_allowed`, `test_create_app_registers_uptime_route`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body has a numeric `uptime_seconds` and a string `started_at` |
| 2 | non-negative and increasing | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice a second apart, Then both `uptime_seconds` are >= 0 and the second is greater than the first |
| 3 | `started_at` fixed at startup, UTC with offset | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then `started_at` is identical and ends in `+00:00`; When the backend restarts, Then `started_at` changes and `uptime_seconds` resets near 0 |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When I read /openapi.json, Then the 200 response of GET /api/uptime references the `UptimeResponse` schema |

## Manual verification plan
This feature has no UI. Every check below is an HTTP request from a terminal against the running backend, which the root `docker-compose.yml` publishes on `http://localhost:8010`.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the stack is up (`docker compose up -d --build` at the repo root) and `docker compose ps` shows the backend container running.
1. Run `curl -s -i http://localhost:8010/api/uptime` → the status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body → it is one JSON object with exactly two keys, `uptime_seconds` (a number such as `42.137`) and `started_at` (a string such as `2026-11-17T22:49:37.120394+00:00`).

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (call it A) → A is 0 or greater.
2. Wait about one second, then run the same command again and note `uptime_seconds` (B) → B is greater than A, by roughly one second plus the time you took.
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/unit/test_uptime_schema_unit.py tests/integration/test_uptime_integration.py` → the summary line reports no failed or errored test, and the command exits 0.

### Criterion 3: `started_at` captured once at startup, not per request, UTC with explicit offset
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → `started_at` is character-for-character identical in both responses, while `uptime_seconds` grew.
2. Read the end of `started_at` → it ends in `+00:00` (not `Z`, and not a local offset such as `+01:00`).
3. Run `docker compose restart backend`, wait until `docker compose ps` shows it running, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is now a later instant than in step 1, and `uptime_seconds` is small (a few seconds), showing a restart is distinguishable from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
This is a code-structure criterion; the observable check is the OpenAPI document and the file.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` → its 200 response schema is named `UptimeResponse` with fields `uptime_seconds` (number, minimum 0) and `started_at` (string, date-time).
2. Open `backend/app/schemas/uptime.py` in the repository → it defines `class UptimeResponse(BaseModel)` with those two fields, and `backend/app/routers/uptime.py` declares `response_model=UptimeResponse`.
