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
- Comment (tracker): "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/39 ... The UAT script was telling testers something untrue ... It claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare {"type": "string"} ... This item was held behind FEAT-1 ... started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers ..." → Addressed by: (a) the UAT script and Gherkin scenarios this plan asks for make no claim about the OpenAPI document's `format` for `started_at`; they check the wire value only, which is what criterion 3 asks for (the OpenAPI shape is not an acceptance criterion, so it is neither asserted nor "fixed"). (b) `started_at` is captured inside `create_app()` and stored on `app.state`, not at module import, so capture is tied to the application instance the server actually starts (the Dockerfile's `--factory` launch calls `create_app()` once per process). The multi-worker residual is recorded under Assumptions: uptime is per process by design, which is exactly "how long the process has been running". (c) The FEAT-1 serialization note is historical: no FEAT-1 code is in `backend/app/main.py` on current main (read at ecaacc6), and the current conflict set comes from `feature_map.md` (see shared_risks.md). The test counts quoted in the comment belong to a closed PR and are not carried.
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Not acted on, because its precondition is already satisfied: the newer comment records the revert merged as 0ac6818 (#29), and the repository was read at ecaacc6 to confirm it: no `uptime` or `started_at` symbol exists under `backend/app/`, `backend/tests/` or `e2e/`; the only matches are historical run records under `docs/runs/`. This plan therefore creates every file from scratch rather than re-scoping existing code.

## Plan Overview
Backend only, one read-only endpoint following the existing router, service, schema split (`version.py` and `health.py` are the precedents). `create_app()` captures a `ProcessStart` (aware UTC wall-clock time plus a `time.monotonic()` reading) once and stores it on `app.state`; the new `GET /api/uptime` router reads it per request and asks the service for the elapsed monotonic seconds, returning a Pydantic `UptimeResponse` whose `started_at` is serialised as ISO 8601 with a `+00:00` offset.
No database, no repository layer, no frontend, no external API, no new dependency.

### Assumptions
1. "Captured once at application startup" means once per `create_app()` call, stored on `app.state`. Under the shipped launch (`uvicorn app.main:create_app --factory`, single process, backend/Dockerfile) that is once per process start. The module-level `app = create_app()` in `main.py` also captures its own value at import; that instance is not the one the Dockerfile serves and is left as is (no restructuring of the factory).
2. Uptime is measured per process. If the deployment ever gains `--workers N`, each worker reports its own start; that is the correct answer to "how long has this process been running", and making it cross-worker is out of scope.
3. `uptime_seconds` is computed from `time.monotonic()`, not from wall-clock subtraction, so a system clock change cannot make it go backwards or negative; it is clamped at `0.0` as a guard. It is a JSON number (float), unrounded, since the criterion asks for a number and names no precision.
4. "UTC with an explicit offset" is rendered as `+00:00` (Python `isoformat()` on a UTC-aware datetime), not as the `Z` suffix pydantic's default JSON serialisation produces, because `+00:00` is unambiguously an offset. Example: `2026-11-07T16:30:00.123456+00:00`.
5. The OpenAPI document's description of `started_at` is not part of any criterion and is not asserted (see the first tracker comment).
6. Criterion 2's "a second apart" is verified literally at integration level with a 1-second sleep between two calls; the unit tier verifies the arithmetic deterministically with injected clock values.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns how long the serving process has been running and when it started. Read-only, no input, no auth (consistent with `/api/version` and `/api/health`).
- Service layer: `backend/app/services/uptime_service.py` holds a frozen dataclass `ProcessStart(started_at: datetime, monotonic_start: float)`; `capture_process_start(wall_clock: Callable[[], datetime] = lambda: datetime.now(UTC), monotonic: Callable[[], float] = time.monotonic) -> ProcessStart`, which normalises the wall-clock value to UTC; and `get_uptime_seconds(process_start: ProcessStart, now_monotonic: float | None = None) -> float`, returning `max(0.0, now - process_start.monotonic_start)` where `now` defaults to `time.monotonic()`. The injectable clocks exist so the unit tier needs no sleeps or patching of `datetime`.
- Router: `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, `@router.get("/uptime", response_model=UptimeResponse)`, handler takes `request: Request`, reads `request.app.state.process_start`, returns `UptimeResponse(uptime_seconds=get_uptime_seconds(process_start), started_at=process_start.started_at)`.
- Schema: `backend/app/schemas/uptime.py`, `UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus a `@field_serializer("started_at")` returning `value.astimezone(UTC).isoformat()` so the wire value always carries `+00:00`.
- App factory: `backend/app/main.py` `create_app()` sets `app.state.process_start = capture_process_start()` right after constructing the `FastAPI` instance (not in `lifespan`, so a `TestClient` used without its context manager, as the health integration test does, still finds it), and adds `app.include_router(uptime_router)` after the existing three. The module docstring gains one sentence naming TEST-07.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: `200 OK`, `application/json`:
```json
{"uptime_seconds": 42.517, "started_at": "2026-11-07T16:30:00.123456+00:00"}
```
- Other methods: `POST /api/uptime` returns `405 Method Not Allowed` (FastAPI default for a GET-only route).

## Technology Selection
- Process start wall-clock time: chose `datetime.now(UTC)` (standard library) over `psutil.Process().create_time()`, because the standard library covers it and psutil would be a new dependency for one value.
- Elapsed-time measurement: chose `time.monotonic()` (standard library) over subtracting wall-clock datetimes, because a monotonic clock cannot step backwards on an NTP or manual clock change, which criterion 2's "non-negative and increasing" needs.
- UTC-aware timestamp field and its serialisation: chose pydantic's `AwareDatetime` and `field_serializer` (already installed with FastAPI) over a hand-written validator or a plain `str` field, because the installed dependency covers both the aware-only constraint and the output format.
- Start-time storage: chose FastAPI's `app.state` (installed dependency) over a module-level global, because it ties the value to the app instance `create_app()` builds, so each test app and each served process has its own.
- No new dependency is added; `backend/pyproject.toml` and `backend/uv.lock` are untouched.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema (criterion 4), `started_at` serialised with a `+00:00` offset.
- [B] backend/app/services/uptime_service.py: `ProcessStart`, `capture_process_start()`, `get_uptime_seconds()`.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `app.state.process_start`.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for capture and uptime arithmetic with injected clocks.
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for the schema's validation and UTC-offset serialisation.
- [B] backend/tests/integration/test_uptime_integration.py: router tests over the real HTTP cycle (200 shape, increase across a 1-second gap, stable `started_at`, 405 on POST).
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case.
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual UAT script.

### Modified files
- [B] backend/app/main.py: capture `app.state.process_start` in `create_app()`, register the uptime router, docstring names TEST-07.
- [B] backend/tests/unit/test_main_unit.py: assert `/api/uptime` is registered and each `create_app()` call carries its own `process_start`.

No lockfile changes: no dependency is added or changed. No README.md or docs/DEVELOPMENT.md change: the feature alters no project structure, run configuration, dependency or test infrastructure, and neither file lists endpoints today. No E2E spec: no criterion involves the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: service layer and schema.
  - `uptime_service`: `capture_process_start` returns the injected wall-clock value converted to UTC and the injected monotonic reading (happy path); a non-UTC aware input (e.g. `+02:00`) is normalised to UTC (edge); `get_uptime_seconds` returns `now - start` for injected values (happy), returns `0.0` when `now` equals start (edge), clamps to `0.0` when `now` is below start (error/guard), and with no `now_monotonic` uses `time.monotonic()` (monkeypatched).
  - `UptimeResponse`: serialises `started_at` with `+00:00` for a UTC input and converts a `+02:00` input to `+00:00` (happy and edge); rejects a naive datetime and a negative `uptime_seconds` with `ValidationError` (error cases).
  - `create_app()`: `/api/uptime` is registered; two `create_app()` calls produce distinct `process_start` objects.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/uptime` through FastAPI's `TestClient` (real HTTP request/response cycle, no database needed): 200 with exactly the keys `uptime_seconds` and `started_at`, `uptime_seconds` a non-negative number, `started_at` parsed by `datetime.fromisoformat` with `utcoffset() == timedelta(0)` and ending in `+00:00`; two calls separated by `time.sleep(1.0)` show the second `uptime_seconds` greater than the first and identical `started_at` values; a fresh `create_app()` with `DATABASE_URL` unset still answers 200; `POST /api/uptime` answers 405.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI and no frontend consumes the endpoint (testing_standards.md Section 6, fourth question, asked per criterion below).
  - Directory: e2e/tests/
  - File: none for this feature (would be TEST-07_uptime_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (a backend restart yields a new `started_at` and a small `uptime_seconds`), verified with `curl` against the compose stack.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: it is a router response shape over the HTTP cycle, and no UI renders it |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration (plus Unit for the arithmetic and clamp) | Verifying it needs no navigation or interaction: two HTTP calls with a 1-second gap, no UI involved |
| 3 | `started_at` captured once at startup, serialised in UTC with an explicit offset | Integration (stable across calls, `+00:00` on the wire) plus Unit (capture and serialiser) | Verifying it needs no navigation or interaction: it is app-factory and serialisation behaviour |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a schema module's validation and serialisation rule, and the router's `response_model` is exercised by the integration tests |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body has exactly `uptime_seconds` (a number) and `started_at` (an ISO 8601 string) |
| 2 | non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice a second apart, Then both `uptime_seconds` are at least 0 and the second is greater than the first |
| 3 | captured once, UTC with explicit offset | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then `started_at` is identical and ends in `+00:00`; edge: When the backend restarts, Then `started_at` is later and `uptime_seconds` is small |
| 4 | Pydantic schema in backend/app/schemas/ | covered at Unit, see Criterion coverage | Given the repository, When I open backend/app/schemas/uptime.py, Then it defines `UptimeResponse` and the router declares it as `response_model` |

## Manual verification plan
No criterion is verifiable through the UI: no frontend consumes `GET /api/uptime`, so each check below reads the HTTP response with `curl` against the compose stack, which publishes the backend on host port 8010 (docker-compose.yml).

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: Docker running; from the repository root `docker compose up -d --build` has completed and `docker compose ps` shows `backend` running and `db` healthy; a terminal with `curl`.
1. Run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body → it is one JSON object with exactly two keys, for example `{"uptime_seconds":37.204,"started_at":"2026-11-07T16:30:00.123456+00:00"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted ISO 8601 date-time.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: criterion 1's stack still up.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; echo; curl -s http://localhost:8010/api/uptime` → two JSON bodies print, one per line.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second is greater than the first by roughly 1 (at least 1.0, typically under 1.5).
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the run ends with `0 failed`.

### Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset
Prerequisites: criterion 1's stack still up.
1. Run `curl -s http://localhost:8010/api/uptime`, wait about 3 seconds, run it again → `started_at` is character-for-character identical in both bodies while `uptime_seconds` has grown.
2. Read `started_at` → it ends in `+00:00` (not `Z`, not a local offset such as `+01:00`), and its date and time are the backend container's start time in UTC: compare with `docker compose ps backend`, whose status shows how long ago it started.
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again → `started_at` is now later than the value from step 1 and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Not a UI behaviour; the observable check is the code and its tests.
1. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`.
2. Open `backend/app/routers/uptime.py` → the route decorator declares `response_model=UptimeResponse`.
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py` → the run ends with `0 failed`.
