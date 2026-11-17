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

## Re-Plan Feedback
No feedback to act on. The item's 25 tracker comments are all the framework's own "PR opened for TEST-07" link comments from earlier runs; none requests or changes anything. No PR review comments (fresh plan) and no merged-since lines (branched from current main, fae177dc).

Assumptions recorded (scope decisions, per `user_story_alignment.md` Section 4):
1. "Explicit offset" (criterion 3): Pydantic 2.13 serialises a timezone-aware UTC `datetime` as ISO 8601 with the `Z` designator (e.g. `2026-11-17T17:22:22.123456Z`), which ISO 8601 and RFC 3339 define as the explicit zero offset, equivalent to `+00:00`. The plan accepts Pydantic's default serialisation and adds no custom serializer; the tests assert the string parses with `datetime.fromisoformat` to an offset of exactly zero (a naive timestamp would parse with no offset and fail), not a particular spelling.
2. "Application startup" (criterion 3): the start instant is captured in the existing FastAPI `lifespan` startup hook in `backend/app/main.py` and kept on `app.state`, not at module import time, so each app instance (each process, and each test app from `create_app()`) has its own start instant.
3. `uptime_seconds` is computed from the monotonic clock (`time.monotonic()`), not from wall-clock subtraction, so a system clock adjustment can never make it negative or go backwards (criterion 2). `started_at` is the wall-clock UTC instant captured at the same moment. The value is a float in seconds, unrounded.
4. No authentication, caching headers, or extra fields (process id, version, host) are added: none is asked for.

## Plan Overview
A backend-only, database-free read endpoint following the existing version/health slice (router, service, schema):
- `backend/app/services/uptime_service.py` owns a small immutable `ProcessClock` (wall-clock UTC start instant plus the monotonic reading taken at the same moment), a `start_clock()` factory, and `uptime_seconds(clock)`.
- `backend/app/main.py`'s `lifespan` calls `start_clock()` once, first thing at startup (before the optional schema initialisation), and stores it on `app.state.process_clock`; `create_app()` registers the new router.
- `backend/app/routers/uptime.py` serves `GET /api/uptime`, reading the clock from `request.app.state` and returning `UptimeResponse`.
- `backend/app/schemas/uptime.py` defines `UptimeResponse(uptime_seconds: float, started_at: datetime)`.
No frontend, no database, no migration, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime` (router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, `response_model=UptimeResponse`): returns how long this app instance has been running and when it started.
- Service layer (`backend/app/services/uptime_service.py`):
  - `ProcessClock`: frozen dataclass with `started_at: datetime` (timezone-aware, UTC) and `started_monotonic: float`.
  - `start_clock(now: Callable[[], datetime] = lambda: datetime.now(timezone.utc), monotonic: Callable[[], float] = time.monotonic) -> ProcessClock`: reads both clocks once and returns the record. The injectable callables exist so unit tests are deterministic; production calls it with no arguments.
  - `uptime_seconds(clock: ProcessClock, monotonic: Callable[[], float] = time.monotonic) -> float`: returns `max(0.0, monotonic() - clock.started_monotonic)`. The clamp is a guard only; the monotonic clock never goes backwards.
- App wiring (`backend/app/main.py`): in `lifespan`, before the `DATABASE_URL` branch, `app.state.process_clock = uptime_service.start_clock()`, so the capture happens exactly once per startup and never depends on the database. In `create_app()`, `app.include_router(uptime_router)` after the existing three. Update the module docstring's list of feature routers with one clause for TEST-07.
- Router: `def get_uptime(request: Request) -> UptimeResponse` reads `clock = request.app.state.process_clock` and returns `UptimeResponse(uptime_seconds=uptime_service.uptime_seconds(clock), started_at=clock.started_at)`. It never calls `start_clock()`, which is what keeps `started_at` constant per process.
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
{
  "uptime_seconds": 3725.418233,
  "started_at": "2026-11-17T16:20:17.004512Z"
}
```

- `uptime_seconds`: number (float), at least 0, seconds since this process's app startup.
- `started_at`: string, ISO 8601, UTC, with explicit zero offset (`Z`), constant for the life of the process.
- Other methods (e.g. POST) on the path: 405 Method Not Allowed (FastAPI default).

## Technology Selection
- Start-instant capture and elapsed time (`uptime_service.py`): chose the standard library (`time.monotonic`, `datetime.now(timezone.utc)`, `dataclasses`) over an installed or new dependency such as `psutil` process start time, because the stdlib covers it and the criterion asks for application startup, not OS process creation.
- Storing the start instant: chose FastAPI's own `app.state` set in the existing `lifespan` hook (an installed dependency's native feature) over a module-level global, because it scopes the value to each app instance and needs no extra module state.
- Response schema (`schemas/uptime.py`): chose Pydantic `BaseModel` with a `datetime` field (installed) over a hand-written ISO formatter, because Pydantic already serialises an aware UTC datetime with its explicit offset.
- Router (`routers/uptime.py`): FastAPI `APIRouter` (installed), the project's existing pattern; no alternative needed.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema (`uptime_seconds: float`, `started_at: datetime`)
- [B] backend/app/services/uptime_service.py: `ProcessClock`, `start_clock()`, `uptime_seconds()`
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the uptime service
- [B] backend/tests/integration/test_uptime_integration.py: HTTP request/response tests for `GET /api/uptime`
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: capture the process clock in `lifespan` onto `app.state.process_clock`; register the uptime router; docstring clause
- [B] backend/tests/unit/test_main_unit.py: add a test that the app registers `/api/uptime`

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `uptime_service` in isolation, with injected fake clocks (no app, no network).
  - `test_start_clock_records_utc_start_and_monotonic_reading`: the returned clock carries exactly the injected instants, and `started_at.utcoffset() == timedelta(0)`.
  - `test_uptime_seconds_returns_elapsed_monotonic_time`: fake monotonic 100.0 at start, 103.5 later, returns 3.5.
  - `test_uptime_seconds_increases_as_monotonic_clock_advances`: two readings one second apart differ by 1.0.
  - `test_uptime_seconds_returns_zero_at_startup_instant`: edge case, same reading gives 0.0.
  - `test_uptime_seconds_never_negative_when_clock_reads_earlier`: error/guard case, a reading before the start returns 0.0.
  - `test_create_app_registers_uptime_route` in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: real HTTP cycle through `TestClient` with the lifespan running (the shared `client` fixture, or a fresh `create_app()` inside `with TestClient(...)` where a test needs its own startup). No database needed; `DATABASE_URL` may be unset.
  - `test_get_uptime_returns_200_with_uptime_and_started_at`: status 200, keys exactly `{"uptime_seconds", "started_at"}`, `uptime_seconds` is a number, `started_at` parses as ISO 8601.
  - `test_get_uptime_is_non_negative_and_increases_a_second_apart`: two calls with a real one-second pause between them; both values are at least 0 and the second is at least 0.9 larger than the first.
  - `test_get_uptime_started_at_is_constant_across_requests`: two calls return the identical `started_at` string.
  - `test_get_uptime_started_at_is_captured_at_startup_in_utc`: fresh app; take UTC timestamps before entering and after entering `with TestClient(app)`; the returned `started_at` parses to an offset of exactly zero and lies between the two.
  - `test_get_uptime_response_is_defined_by_uptime_response_schema`: the body validates with `UptimeResponse.model_validate`, and the OpenAPI document's 200 response for `GET /api/uptime` references the `UptimeResponse` component.
  - `test_post_uptime_returns_405_method_not_allowed`: the error case.
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. E2E Tests is ENABLED, but no criterion involves navigation or interaction through the UI (the feature has no frontend), so every criterion is covered at integration or unit level (`testing_standards.md` Section 6, asked per criterion).
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), exercising the API with request steps, since there is no UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | `test_get_uptime_returns_200_with_uptime_and_started_at` | verifying it needs no navigation or interaction: it is a router response, there is no UI |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration | `test_get_uptime_is_non_negative_and_increases_a_second_apart`, `test_uptime_seconds_increases_as_monotonic_clock_advances`, `test_uptime_seconds_never_negative_when_clock_reads_earlier` | verifying it needs no navigation or interaction: it is service arithmetic plus a router behaviour |
| 3 | `started_at` captured once at startup, serialised in UTC with an explicit offset | Integration | `test_get_uptime_started_at_is_constant_across_requests`, `test_get_uptime_started_at_is_captured_at_startup_in_utc`, `test_start_clock_records_utc_start_and_monotonic_reading` | verifying it needs no navigation or interaction: it is app-startup wiring and serialisation |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_get_uptime_response_is_defined_by_uptime_response_schema` | verifying it needs no navigation or interaction: it is the router's declared response model |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/uptime, Then the status is 200 and the body has `uptime_seconds` and `started_at` |
| 2 | non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/uptime twice a second apart, Then both values are at least 0 and the second is larger |
| 3 | `started_at` captured once, UTC with offset | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/uptime twice, Then `started_at` is identical and ends in `Z`; When the backend restarts, Then `started_at` is later and `uptime_seconds` is small |
| 4 | Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When I open the OpenAPI document, Then GET /api/uptime's 200 response references `UptimeResponse` |

## Manual verification plan
There is no UI for this feature: every check is an HTTP request against the running backend and a read of its JSON. The stack's backend listens on `http://localhost:8010` (docker-compose.yml `ports: 8010:8010`); if the handover rebuild moved it to another free port, use that port instead.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the stack is up (`docker compose up -d --build` at the repo root) and the backend container is running.
1. Run `curl -s -i http://localhost:8010/api/uptime` → the status line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present.
2. Read the body → it is a JSON object with exactly two keys: `uptime_seconds` (a bare number such as `42.731`, not a string) and `started_at` (a string such as `"2026-11-17T17:22:22.123456Z"`).
3. Open `http://localhost:8010/api/uptime` in a browser → the same JSON object is shown.

### Criterion 2: `uptime_seconds` is non-negative and increases a second apart
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (call it A) → A is 0 or greater.
2. Wait about one second, then run the same command again and note `uptime_seconds` (call it B) → B is greater than A by roughly 1 (between about 0.9 and 2, allowing for the time you took).
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` from the repo root → the summary line reports no failed or errored test and the command exits 0.

### Criterion 3: `started_at` captured once at startup, UTC with an explicit offset
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → `started_at` is the identical string both times while `uptime_seconds` grew.
2. Read `started_at` → it ends with `Z` (the explicit UTC zero offset), and subtracting `uptime_seconds` from the current UTC time gives approximately that instant.
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again → `started_at` is now a later instant than in step 1, and `uptime_seconds` is small (a few seconds).

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` → the 200 response shows the schema `UptimeResponse` with fields `uptime_seconds` (number) and `started_at` (string, date-time).
2. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with those two fields, and `backend/app/routers/uptime.py` declares `response_model=UptimeResponse`.
