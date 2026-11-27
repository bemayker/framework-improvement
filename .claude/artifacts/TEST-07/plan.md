# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> **What:** `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> **Acceptance criteria**
> 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
> 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
> 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
>
> **Notes:** Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches `main.py`'s router registration, so it must not run concurrently with another backend item that does the same.
>
> (ClickUp task 123k99ctgcg, status "to do", no tags, no priority.)

## Acceptance Criteria
- [ ] 1. `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker): 25 top-level comments, all the framework's own "mayker-dev: PR opened for TEST-07 — {url}" link comments from earlier plan runs (those PRs are closed, the branch was deleted) → Addressed by: not acted on, because none asks for a change or contradicts the description; there are 0 actionable comments. No PR comments exist (fresh plan). Merged-since check: n/a (fresh plan, branched from current main).

## Plan Overview
Backend-only, read-only endpoint with no database access. It follows the shape TEST-05 already established for `GET /api/version` (router in `backend/app/routers/`, response schema in `backend/app/schemas/`, logic in `backend/app/services/`):

- `backend/app/services/uptime_service.py` captures a `StartupClock` (wall-clock `started_at` in UTC plus a `time.monotonic()` reading) once, and computes `uptime_seconds` as the monotonic difference.
- `backend/app/main.py`'s `create_app()` captures the clock once and stores it on `app.state.startup_clock`, then registers the uptime router next to the existing three.
- `backend/app/routers/uptime.py` reads the clock from `request.app.state` and returns an `UptimeResponse`.
- `backend/app/schemas/uptime.py` defines `UptimeResponse(uptime_seconds: float >= 0, started_at: AwareDatetime)`, serialising `started_at` as `isoformat()` so the offset is written as `+00:00`.

No frontend, no migrations, no new dependency, no configuration value.

**Assumptions (recorded rather than blocking):**
1. "Captured once at application startup" means once per application instance, inside `create_app()`. Uvicorn executes `app = create_app()` exactly once per process when it imports `app.main`, before serving any request, so the value is the process's start as far as the operator can observe. The FastAPI `lifespan` hook was considered and rejected: a `TestClient` used without `with` (TEST-02's degraded-health test already does this) never runs the lifespan, which would leave the endpoint with no value and force a "not started" branch the criteria do not ask for. Storing it on `app.state` instead of a module global keeps `create_app()`'s existing guarantee that each call returns an independent instance (`test_create_app_returns_independent_instances`).
2. "An explicit offset" is written as `+00:00`, not the `Z` designator Pydantic v2 emits by default for a UTC `datetime`. Both are valid ISO 8601 UTC, but `+00:00` is a numeric offset nobody can read as "no offset"; the schema's `field_serializer` produces it. Example: `2026-11-27T12:58:10.123456+00:00`.
3. `uptime_seconds` is measured on `time.monotonic()`, not as `now() - started_at`, so a wall-clock adjustment (NTP step, DST is irrelevant in UTC) can never make it negative or jump. It is returned as an unrounded float; the criterion asks for a number and no precision, so no rounding is added.
4. "Increases between two calls a second apart" is asserted as strictly greater, with the difference at least 0.9 s on the real clock (tolerance for timer granularity), not as an exact 1.0.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns the process's start instant and its elapsed running time. `APIRouter(prefix="/api", tags=["uptime"])`, `@router.get("/uptime", response_model=UptimeResponse)`. The handler takes `request: Request`, reads `request.app.state.startup_clock`, and returns `UptimeResponse(uptime_seconds=uptime_service.compute_uptime(clock), started_at=clock.started_at)`. Only GET is declared, so any other method answers 405 from FastAPI itself.
- Service layer: `backend/app/services/uptime_service.py`:
  - `@dataclass(frozen=True) class StartupClock: started_at: datetime; started_monotonic: float`.
  - `capture_startup() -> StartupClock`: returns `StartupClock(started_at=datetime.now(timezone.utc), started_monotonic=time.monotonic())`. Called once, from `create_app()`.
  - `compute_uptime(clock: StartupClock) -> float`: returns `time.monotonic() - clock.started_monotonic`. The module imports `time` as a module (`import time`) so unit tests can monkeypatch `uptime_service.time.monotonic` deterministically.
- `backend/app/main.py`: import `capture_startup` and the uptime router; in `create_app()`, set `app.state.startup_clock = capture_startup()` immediately after the `FastAPI(...)` construction, and add `app.include_router(uptime_router)` after the existing `include_router` calls. Update the module docstring's list of routers to name TEST-07. The `lifespan` function is not touched.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: 200, `application/json`, body per `UptimeResponse`:

```json
{"uptime_seconds": 42.517301, "started_at": "2026-11-27T12:58:10.123456+00:00"}
```

  - `uptime_seconds`: number (float), `>= 0`, strictly increasing over the life of the process.
  - `started_at`: string, ISO 8601, UTC, explicit `+00:00` offset; identical on every response from the same process.
- Errors: any non-GET method on `/api/uptime` answers 405 (FastAPI default). No other error path exists: the clock is always present on an app built by `create_app()`.

## Technology Selection
- Startup instant (`started_at`): chose the standard library's `datetime.now(timezone.utc)` over any dependency; no rung above it is needed.
- Elapsed time (`uptime_seconds`): chose the standard library's `time.monotonic()` over subtracting wall-clock datetimes, because a monotonic clock cannot go backwards and so guarantees the non-negative, increasing value criterion 2 asks for. A process-creation-time read (for example `psutil.Process().create_time()`) was not chosen: `psutil` is not installed and the standard library has no portable equivalent, and adding a dependency for this is exactly what the ladder rules out.
- Holding the value once (`app.state.startup_clock`): chose FastAPI's built-in `app.state` (installed dependency) over a module-level global or a custom singleton, because it keeps the value per app instance and preserves `create_app()`'s independent-instance guarantee.
- Response schema (`UptimeResponse`): chose Pydantic's built-in `AwareDatetime` type, `Field(ge=0)` and `field_serializer` (installed, pydantic 2.13.4 in `backend/uv.lock`) over hand-written validation, because they reject a naive datetime and a negative number declaratively.
- Router module (`backend/app/routers/uptime.py`): no stdlib call, native feature or installed dependency replaces a route; it is built here with FastAPI's `APIRouter`, as every existing router is.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic model (`uptime_seconds: float = Field(ge=0)`, `started_at: AwareDatetime`, `field_serializer` writing `started_at.astimezone(timezone.utc).isoformat()`).
- [B] backend/app/services/uptime_service.py: `StartupClock` dataclass, `capture_startup()`, `compute_uptime()`.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `request.app.state.startup_clock`.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for `capture_startup` and `compute_uptime` with a monkeypatched monotonic clock.
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for `UptimeResponse` validation and serialisation.
- [B] backend/tests/integration/test_uptime_integration.py: router integration tests over the full HTTP cycle (`client` fixture, no database needed).
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-07/uat_script.md: the copy of the manual UAT script build-feature writes alongside it.

### Modified files
- [B] backend/app/main.py: `app.state.startup_clock = capture_startup()` in `create_app()`, `app.include_router(uptime_router)`, docstring names TEST-07.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` and `test_create_app_captures_startup_clock_once_per_app`.

No dependency changes, so no lockfile entry: `backend/pyproject.toml` and `backend/uv.lock` stay untouched.
No `README.md` or `docs/DEVELOPMENT.md` change: neither lists endpoints today, and this feature changes no project structure, run configuration, dependency or test infrastructure.
No E2E spec: no criterion requires navigation or interaction through the UI (see `### Criterion coverage`).

## Testing Strategy
- Unit tests: service and schema logic, with the clock monkeypatched so results are deterministic.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` (`test_uptime_service_unit.py`, `test_uptime_schema_unit.py`; `test_main_unit.py` extended)
  - `test_uptime_service_unit.py`: `test_capture_startup_returns_utc_aware_started_at` (happy path: tz-aware, `utcoffset()` is zero), `test_compute_uptime_returns_elapsed_monotonic_seconds` (fake monotonic 100.0 at capture, 142.5 at compute, result 42.5), `test_compute_uptime_increases_as_monotonic_clock_advances` (two computes with the fake clock advanced by 1.0, second greater), `test_compute_uptime_is_zero_at_the_capture_instant` (edge: same monotonic reading returns 0.0, never negative). The service has no raising path; its error case is covered by the schema's rejection tests below.
  - `test_uptime_schema_unit.py`: `test_uptime_response_serialises_started_at_with_explicit_utc_offset` (JSON dump of `started_at` ends with `+00:00`, not `Z`), `test_uptime_response_rejects_naive_started_at` (ValidationError), `test_uptime_response_rejects_negative_uptime_seconds` (ValidationError), `test_uptime_response_lives_in_app_schemas` (the class is importable from `app.schemas.uptime` and is a `pydantic.BaseModel` subclass).
  - `test_main_unit.py`: `test_create_app_registers_uptime_route` (`/api/uptime` in the custom paths, using the existing `_collect_route_paths` helper), `test_create_app_captures_startup_clock_once_per_app` (one `create_app()` has a `StartupClock` on `app.state.startup_clock`; two calls hold two distinct clock objects).
- Integration tests: router over the real HTTP request/response cycle through the session `client` fixture. No database: the endpoint does not touch it, and the fixture's lifespan already tolerates an unset `DATABASE_URL`.
  - Directory: `backend/tests/integration/`
  - File: `test_uptime_integration.py`
  - `test_get_uptime_returns_200_with_uptime_seconds_and_started_at` (200; body keys exactly `uptime_seconds` and `started_at`; `uptime_seconds` is a JSON number `>= 0`; `started_at` parses with `datetime.fromisoformat`).
  - `test_get_uptime_seconds_increases_between_calls_a_second_apart` (real clock: call, `time.sleep(1.0)`, call; second value greater than the first and the difference at least 0.9).
  - `test_get_uptime_started_at_is_identical_across_requests` (two calls with a pause between them return the same `started_at` string, which equals `app.state.startup_clock.started_at` serialised).
  - `test_get_uptime_started_at_is_utc_with_explicit_offset` (string ends with `+00:00`; parsed value's `utcoffset()` is zero; it is not later than the current UTC time).
  - `test_post_uptime_returns_405_method_not_allowed` (error case).
- E2E tests: none for this feature. E2E is ENABLED in `CLAUDE.md`, but no acceptance criterion involves navigation or interaction through the UI; there is no frontend change at all.
  - Directory: `e2e/tests/` (unused by this feature)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a non-GET method answers 405), expressed against the HTTP endpoint, and the manual UAT script expanded from `## Manual verification plan`.
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | `test_get_uptime_returns_200_with_uptime_seconds_and_started_at`, `test_create_app_registers_uptime_route` | Verifying it needs no navigation or interaction: it is a router response over HTTP, and no UI consumes the endpoint. |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration | `test_get_uptime_seconds_increases_between_calls_a_second_apart`, `test_compute_uptime_increases_as_monotonic_clock_advances`, `test_compute_uptime_is_zero_at_the_capture_instant` | Verifying it needs no navigation or interaction: it is a property of two HTTP responses and of the service's clock arithmetic. |
| 3 | `started_at` captured once at startup, not per request, serialised in UTC with an explicit offset | Integration | `test_get_uptime_started_at_is_identical_across_requests`, `test_get_uptime_started_at_is_utc_with_explicit_offset`, `test_create_app_captures_startup_clock_once_per_app`, `test_capture_startup_returns_utc_aware_started_at` | Verifying it needs no navigation or interaction: it is a property of the app factory and of the serialised response. |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_uptime_response_lives_in_app_schemas`, `test_uptime_response_serialises_started_at_with_explicit_utc_offset`, `test_uptime_response_rejects_naive_started_at`, `test_uptime_response_rejects_negative_uptime_seconds` | Verifying it needs no navigation or interaction: it is a schema definition and validation rule. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with both fields | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/uptime, Then the status is 200 and the body holds `uptime_seconds` and `started_at` |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/uptime twice one second apart, Then both values are non-negative and the second is larger |
| 3 | `started_at` captured once, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/uptime twice, Then `started_at` is identical and ends in `+00:00`; When the backend restarts, Then `started_at` changes |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API docs at /docs, When I open GET /api/uptime, Then its 200 response is documented as `UptimeResponse` |

## Manual verification plan
This endpoint has no UI; every check is made from a terminal (or a browser address bar) against the running backend at `http://localhost:8010`, the host port `docker-compose.yml` publishes.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the stack is up (`docker compose up -d --build` from the repo root) and `docker compose ps` shows the `backend` service running.
1. In a terminal run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers.
2. Read the body on the last line → it is a JSON object with exactly two keys, `uptime_seconds` (a number such as `37.84`) and `started_at` (a string such as `2026-11-27T12:58:10.123456+00:00`).
3. Open `http://localhost:8010/api/uptime` in a browser → the same two-key JSON is shown.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` → two JSON lines are printed.
2. Compare the two `uptime_seconds` values → both are zero or greater, and the second is larger than the first by roughly 1 (for example `52.10` then `53.12`).

### Criterion 3: `started_at` is captured once at startup, not per request, in UTC with an explicit offset
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → `started_at` is character-for-character identical in both responses while `uptime_seconds` differs.
2. Look at the end of `started_at` → it ends in `+00:00` (not `Z`, not a local offset such as `+01:00`), and its date and time equal the current UTC time minus `uptime_seconds`, to within a second.
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again → `started_at` is now later than the value noted in step 1, and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` under the `uptime` tag → the 200 response's schema is named `UptimeResponse`, with `uptime_seconds` (number, minimum 0) and `started_at` (string, date-time), both required.
2. Open `backend/app/schemas/uptime.py` in the editor → it defines `class UptimeResponse(BaseModel)` with those two fields.
3. From the repo root run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
