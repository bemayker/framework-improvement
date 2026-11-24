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
- Comment (tracker, 2026-09-14, a past `/deliver` run's report): "started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. If the deployment ever gains workers, each child would capture its own value..." → Addressed by: the start marker is captured inside `create_app()` and stored on `app.state`, not at module import (see Plan Overview, decision 1). The multi-worker residual is not acted on: `backend/Dockerfile` runs one uvicorn process (`app.main:create_app --factory`, no `--workers`), so per-process capture equals process start, and an operator asking "did this process restart" is asking a per-process question anyway. Making it cross-worker would need shared state the four criteria do not ask for. Recorded here and as a known limitation for the PR.
- The remaining 31 tracker comments (30 framework "PR opened" link comments, 1 operator state-reset note of 2026-09-07) ask for nothing and contradict nothing in the description → not acted on, no plan change.
- Assumption (ambiguity in criterion 3, "UTC with an explicit offset"): Pydantic v2 serialises a UTC-aware datetime with the `Z` designator. This plan emits the numeric offset `+00:00` (`datetime.isoformat()` on a UTC-aware value, e.g. `2026-11-24T03:44:56.123456+00:00`) so the offset is unambiguously explicit. A client parsing ISO 8601 accepts both.

## Plan Overview
One read-only backend endpoint, `GET /api/uptime`, following the router to service to schema layering the existing `version` and `health` slices already use. No database, no frontend, no new dependency.

Key decisions:
1. **Capture point.** `create_app()` in `backend/app/main.py` calls `uptime_service.capture_process_start()` once and stores the returned `ProcessStart` on `app.state.process_start`. The container runs `uvicorn app.main:create_app --factory` (read from `backend/Dockerfile`), so that call happens once at process startup. Each `create_app()` instance gets its own marker, which keeps tests independent. Capture in the factory rather than in `lifespan`: a `TestClient(app)` used without a `with` block never runs `lifespan`, and the endpoint would then fail with an attribute error.
2. **Two clocks.** `ProcessStart` holds the wall-clock start `started_at = datetime.now(timezone.utc)` (for display) and a `time.monotonic()` reading (for elapsed time). `uptime_seconds` is computed from the monotonic clock, so a wall-clock adjustment (NTP step, DST does not apply to UTC) can never make it negative or move it backwards. The result is also clamped at `0.0` as a guard.
3. **Serialisation.** `UptimeResponse.started_at` is a `datetime`. A Pydantic `field_serializer` normalises it to UTC and emits `isoformat()`, giving the `+00:00` offset (see the assumption in Re-Plan Feedback).
4. **Request access.** The router reads the marker through `request.app.state.process_start`, so the endpoint reports the app instance that serves it, never a module global.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns how long this process has been running and when it started. Router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, `@router.get("/uptime", response_model=UptimeResponse)`, handler `get_uptime(request: Request) -> UptimeResponse`. Accepts no input. Any other method gets FastAPI's own 405.
- Service layer: `backend/app/services/uptime_service.py`:
  - `@dataclass(frozen=True) class ProcessStart` with `started_at: datetime` (UTC-aware) and `started_monotonic: float`.
  - `capture_process_start() -> ProcessStart`, which reads `datetime.now(timezone.utc)` and `monotonic()` once each.
  - `uptime_seconds(start: ProcessStart) -> float`, which returns `max(0.0, monotonic() - start.started_monotonic)`.
  - Import `monotonic` as `from time import monotonic` so unit and integration tests can monkeypatch `uptime_service.monotonic` without patching the global `time` module.
- Repository layer: none, no data access.
- Migrations: none.
- App factory: `backend/app/main.py` imports `router as uptime_router` from `app.routers.uptime`, adds `app.include_router(uptime_router)` after the existing three, and sets `app.state.process_start = uptime_service.capture_process_start()` inside `create_app()` before returning. Update the module docstring's list of registering features with one clause for TEST-07. Do not touch the CORS middleware or `lifespan`.
- Known limitation (not in scope, for the PR's known-improvements list): with multiple uvicorn workers each worker reports its own start. The current Dockerfile runs one.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `UptimeResponse` (`backend/app/schemas/uptime.py`):

```json
{"uptime_seconds": 12.503, "started_at": "2026-11-24T03:44:56.123456+00:00"}
```

  - `uptime_seconds`: `float`, at least `0.0`, seconds since this process's app was created, sub-second precision, not rounded.
  - `started_at`: ISO 8601 string, UTC, numeric offset `+00:00`, identical on every response from the same process.
- Errors: 405 for a non-GET method (FastAPI default). No 4xx/5xx path of its own.

## Technology Selection
- Process start timestamp: chose stdlib `datetime.now(timezone.utc)` over `psutil.Process().create_time()`, because psutil is not installed and the app-creation time under `--factory` is the process start this endpoint means.
- Elapsed-time source: chose stdlib `time.monotonic()` over subtracting wall-clock datetimes, because a wall-clock step backwards would break criterion 2's non-negative and increasing guarantee.
- Holding the start marker: chose FastAPI's installed `app.state` over a module-level global, because a module global is captured at import and is shared across every `create_app()` instance in the test session.
- `UptimeResponse` schema: Pydantic `BaseModel` (installed), as criterion 4 requires. No alternative considered.
- `started_at` serialisation: chose Pydantic's installed `field_serializer` with `datetime.isoformat()` over a custom JSON encoder or response class, because it is a few lines on the schema itself.
- `ProcessStart` value object: stdlib `dataclasses.dataclass(frozen=True)`, matching `HealthReport` in `health_service.py`.
- `uptime` router: FastAPI `APIRouter` (installed), the pattern the version and health routers already use.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic model with `uptime_seconds: float` and `started_at: datetime`, plus the `field_serializer` emitting UTC `isoformat()`.
- [B] backend/app/services/uptime_service.py: `ProcessStart`, `capture_process_start()`, `uptime_seconds()`.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` handler reading `request.app.state.process_start`.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service with a faked monotonic clock.
- [B] backend/tests/integration/test_uptime_integration.py: HTTP request and response tests for the endpoint.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case.
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual UAT script.

### Modified files
- [B] backend/app/main.py: register the uptime router, capture `app.state.process_start` in `create_app()`, add TEST-07 to the docstring.
- [B] backend/tests/unit/test_main_unit.py: add route-registration and start-capture tests for the factory.

No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` edit: neither lists API endpoints, and the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the service layer, `uptime_service`, with `uptime_service.monotonic` monkeypatched. Plus factory wiring in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`)
  - Cases: `test_capture_process_start_returns_utc_aware_started_at` (happy path: tzinfo is UTC, offset zero); `test_uptime_seconds_returns_elapsed_monotonic_seconds` (fake clock start 100.0, now 112.5, expect 12.5); `test_uptime_seconds_is_zero_when_monotonic_reading_is_behind_start` (edge/error guard: now below start, expect 0.0); in `test_main_unit.py`, `test_create_app_registers_uptime_route` and `test_create_app_captures_process_start_on_app_state` (each `create_app()` call yields its own `ProcessStart` on `app.state`).
- Integration tests: the router through FastAPI's `TestClient` (shared `client` fixture in `backend/tests/conftest.py`, no database needed).
  - Directory: backend/tests/integration/
  - File: `test_uptime_integration.py`
  - Cases: `test_get_uptime_returns_200_with_uptime_seconds_and_started_at` (status 200, body keys exactly `{"uptime_seconds", "started_at"}`, `uptime_seconds` is a number, `started_at` parses with `datetime.fromisoformat`); `test_get_uptime_seconds_is_non_negative_and_increases_a_second_apart` (monkeypatch `uptime_service.monotonic` to return `start + 5.0` then `start + 6.0` across two calls, where `start` is `client.app.state.process_start.started_monotonic`; assert both are at least 0 and the second is greater than the first; deterministic, no sleep); `test_get_uptime_started_at_is_identical_across_requests`; `test_get_uptime_started_at_is_utc_with_explicit_offset` (string ends with `+00:00`, parsed `utcoffset()` is zero, equals `client.app.state.process_start.started_at`); `test_get_uptime_openapi_response_uses_uptime_response_schema` (`/openapi.json` 200 response for `/api/uptime` references `#/components/schemas/UptimeResponse`); `test_post_uptime_returns_405_method_not_allowed` (the router's only error case).
- E2E tests: none for this feature. E2E is ENABLED in `CLAUDE.md`, but no criterion involves navigation or interaction through the UI, and the feature has no frontend.
  - Directory: e2e/tests/
  - File: none created (it would have been `TEST-07_uptime_endpoint.spec.ts`).
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (a POST is rejected with 405), all at the HTTP level.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | `test_get_uptime_returns_200_with_uptime_seconds_and_started_at`, `test_create_app_registers_uptime_route` | it needs no navigation or interaction: it is a router request and response behaviour with no UI |
| 2 | `uptime_seconds` non-negative and increases between two calls a second apart | Integration | `test_get_uptime_seconds_is_non_negative_and_increases_a_second_apart`, `test_uptime_seconds_returns_elapsed_monotonic_seconds`, `test_uptime_seconds_is_zero_when_monotonic_reading_is_behind_start` | it needs no navigation or interaction: it is a service computation observed through the router |
| 3 | `started_at` captured once at startup, not per request, UTC with explicit offset | Integration | `test_get_uptime_started_at_is_identical_across_requests`, `test_get_uptime_started_at_is_utc_with_explicit_offset`, `test_create_app_captures_process_start_on_app_state`, `test_capture_process_start_returns_utc_aware_started_at` | it needs no navigation or interaction: it is app-factory state and schema serialisation |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_get_uptime_openapi_response_uses_uptime_response_schema` | it needs no navigation or interaction: it is the router's declared response model, visible in the OpenAPI document |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body has exactly `uptime_seconds` and `started_at` |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice a second apart, Then both values are at least 0 and the second is larger |
| 3 | `started_at` fixed per process, UTC with offset | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then `started_at` is identical and ends in `+00:00`; When the backend restarts, Then `started_at` changes |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When I open /openapi.json, Then the /api/uptime 200 response references `UptimeResponse` |

## Manual verification plan
This feature has no UI. Every check below is an HTTP request against the running backend, from a terminal or a browser address bar.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the stack is up with `docker compose up -d --build` from the repository root, and `curl` is available. The backend listens on `http://localhost:8010`.
1. Run `curl -i http://localhost:8010/api/uptime` → the status line reads `HTTP/1.1 200 OK` and `content-type` is `application/json`.
2. Read the body → it is one JSON object with exactly two keys, `uptime_seconds` (a number such as `37.214`) and `started_at` (a string such as `2026-11-24T03:44:56.123456+00:00`), and nothing else.
3. Open `http://localhost:8010/api/uptime` in a browser address bar → the same two-key JSON object is shown.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `40.102`) → the value is 0 or greater.
2. Wait about one second, then run the same command again → `uptime_seconds` is larger than the first value by roughly 1 (for example `41.118`).
3. Run the backend tests: `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the summary line reports no failed or errored test and the command exits 0.

### Criterion 3: `started_at` is captured once at startup, not per request, and is UTC with an explicit offset
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart, and note `started_at` each time → both responses carry the identical `started_at` string.
2. Read that string → it ends in `+00:00`, and its date and time match the moment the backend container started, in UTC (compare with `docker compose ps backend`, whose status column shows how long ago it started).
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again, and read the body → `started_at` is now a later time than in step 1, and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process.

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for Criterion 1.
1. Open `http://localhost:8010/docs` in a browser → the Swagger page lists `GET /api/uptime` under the `uptime` tag.
2. Expand `GET /api/uptime` and look at the 200 response → its schema is named `UptimeResponse`, with `uptime_seconds` (number) and `started_at` (string, date-time).
3. Open `backend/app/schemas/uptime.py` in the repository → it defines `class UptimeResponse(BaseModel)` with those two fields.
