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

## Acceptance Criteria
- [ ] 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker, 2026-09-14, deliver-run report from measured run 2, since reverted): wire format `"started_at": "<ISO 8601 UTC +00:00>"`; the UAT script had wrongly claimed the OpenAPI schema documents `started_at` as `format: date-time` while the generated schema shows a bare `{"type": "string"}`; `started_at` captured at module import equals process start only because the Dockerfile runs one uvicorn process with `--factory` and no `--workers`. → Addressed by: (a) the explicit offset is pinned to the numeric form `+00:00` (the serializer emits `datetime.isoformat()` of a `timezone.utc` value), not pydantic's default `Z`, and the API Contract below states it; (b) the plan does not ask for the OpenAPI document to carry `format: date-time` (no criterion asks for it, `user_story_alignment.md` Section 3), and the Manual verification plan and Acceptance Test Outline check the `/docs` page only for the schema's name and its two fields, never for a `format`, so the UAT script cannot repeat the false claim; (c) capture moves from module import to the app's lifespan startup (Technology Selection), which is what criterion 3 literally names and gives each `create_app()` instance its own start. The multi-worker residual is not fixed by this (each worker runs its own lifespan, exactly as each would import the module) and is not in scope: the Dockerfile runs a single process, and the builder records the residual under the PR's known improvements rather than adding cross-process coordination. The comment's test counts (48 unit, 39 integration) describe a reverted branch and are not carried into this plan.
- Comment (tracker, 2026-09-07): reset for measured run 3; "Do not run /deliver against this item until that revert has merged." → Satisfied, verified on the current branch (`feature/TEST-07-uptime-endpoint`, from `origin/main` c225856): no file under `backend/`, `e2e/` or `frontend/src/` contains the string `uptime`, and `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`. Earlier TEST-07 merges remain in history (18b2d1a, 129bca3, c31a4b0) but their code is not on this branch, so the plan creates every file from scratch rather than re-scoping prior work.

## Plan Overview
Backend only. One new read-only endpoint, `GET /api/uptime`, following the existing Router to Service to Schema shape of `version.py` and `health.py` (no repository layer: nothing is persisted, and no database is touched). The app's existing `lifespan` in `backend/app/main.py` captures the process start once (a UTC wall-clock `datetime` plus a `time.monotonic()` reading) on `app.state`, before the notes schema initialisation; the router reads it per request and the service computes the elapsed seconds from the monotonic clock, so wall-clock adjustments can never make uptime negative or go backwards. Registration is one `include_router` line in `create_app()`. No frontend, no external API, no dependency change.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns the process start time and the seconds elapsed since it. Router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, `response_model=UptimeResponse`, takes `request: Request` and reads `request.app.state.process_start`. No business logic in the router.
- Service layer: `backend/app/services/uptime_service.py`.
  `ProcessStart`, a frozen dataclass with `started_at: datetime` (timezone-aware, UTC) and `started_monotonic: float`.
  `capture_process_start() -> ProcessStart`, reads `datetime.now(timezone.utc)` and `time.monotonic()` once each.
  `get_uptime_seconds(start: ProcessStart, now_monotonic: float | None = None) -> float`, returns `max(0.0, now - start.started_monotonic)` where `now` defaults to `time.monotonic()`; the injectable `now_monotonic` is what lets the unit tests prove monotonic increase without sleeping. The `max` clamp is a guard, never expected to trigger with a monotonic clock.
- Startup capture: in `backend/app/main.py` `lifespan`, the first statement sets `app.state.process_start = capture_process_start()`, before the `DATABASE_URL` branch, so the start is recorded even when schema initialisation is skipped. Nothing else in `lifespan` changes.
- Schema: `backend/app/schemas/uptime.py`, `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus a `@field_serializer("started_at")` returning `value.astimezone(timezone.utc).isoformat()` so the wire value always ends in `+00:00`.
- Repository layer: none (no persistence).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: `200 OK`, `application/json`, shape `{"uptime_seconds": float >= 0, "started_at": string}` where `started_at` is ISO 8601 with a numeric UTC offset and stays identical across requests to the same running process. Example:
  ```json
  {"uptime_seconds": 42.517, "started_at": "2026-11-01T04:11:13.482915+00:00"}
  ```
  Any other method on the path returns FastAPI's `405 Method Not Allowed`.

## Technology Selection
- Start-time capture and elapsed-time arithmetic: chose the standard library (`datetime.now(timezone.utc)` for `started_at`, `time.monotonic()` for the elapsed seconds) over a new dependency such as `psutil` (process create time), because the stdlib covers both and a dependency would add a lockfile change for a few lines.
- Elapsed seconds source: chose `time.monotonic()` over subtracting two `datetime.now()` readings, because a wall-clock step (NTP correction) could make the difference negative or shrink between calls, which criterion 2 forbids.
- Where the start is captured: chose the existing FastAPI `lifespan` writing to `app.state` over a module-level constant set at import time (the reverted build's choice), because criterion 3 names application startup, the lifespan is that event, and a per-app value lets the integration test create a fresh app and bound its start; it reuses the lifespan `main.py` already has, so no new mechanism is introduced.
- Response schema: chose pydantic's `BaseModel` with `AwareDatetime` and a `field_serializer` (installed with FastAPI) over a hand-built dict, because criterion 4 requires a Pydantic schema and `AwareDatetime` rejects a naive datetime at construction.
- Router and service modules: no stdlib call, native platform feature or installed dependency covers them, so they are built here, mirroring `version.py` and `version_service.py`.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema, `uptime_seconds` (float, ge=0) and `started_at` (AwareDatetime, serialised as ISO 8601 with `+00:00`).
- [B] backend/app/services/uptime_service.py: `ProcessStart` dataclass, `capture_process_start()`, `get_uptime_seconds()`.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `app.state.process_start`.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for capture (UTC-aware, offset zero) and elapsed seconds (happy path, increase between two injected readings, clamp at zero when the reading precedes the start).
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests that `UptimeResponse` lives in `app.schemas.uptime` and is the route's `response_model`, serialises `started_at` with `+00:00`, rejects a naive datetime and a negative `uptime_seconds`.
- [B] backend/tests/integration/test_uptime_integration.py: HTTP-cycle tests for 200 and body shape, non-negative and increasing uptime, identical `started_at` across calls and bounded by a fresh app's creation time, and 405 on POST.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (a backend restart produces a new `started_at`).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: import and `include_router` the uptime router in `create_app()`; first statement of `lifespan` stores `capture_process_start()` on `app.state.process_start`; module docstring names TEST-07.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route`, in the shape of the existing version and health route tests.

No dependency change, so no lockfile entry: everything used is the standard library, FastAPI or pydantic, all already installed.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds an endpoint but changes no project structure, run configuration, dependency or test infrastructure (build-feature Section 15's condition), and neither file carries an endpoint list to extend.
No E2E spec file: no criterion is assigned to E2E (Criterion coverage below).

## Testing Strategy
- Unit tests: service layer (`capture_process_start` returns an aware UTC datetime; `get_uptime_seconds` returns the difference, increases for a later injected reading, clamps to 0.0 for an earlier one) and schema (serialisation offset, naive-datetime and negative-value rejection, route `response_model` identity); plus the route-registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/uptime` through `TestClient` used as a context manager (so the lifespan runs), using the session `client` fixture from `backend/tests/conftest.py` for the shared-app cases and a fresh `create_app()` for the startup-bound case. No database needed; the tests must pass with `DATABASE_URL` unset, as `test_version_integration.py` does.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. E2E Tests is ENABLED, but no frontend consumes `/api/uptime` and no criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion); a spec calling the API directly would be a router integration test (Section 5 anti-pattern).
  - Directory: e2e/tests/
  - File: none for this item (would be TEST-07_uptime_endpoint.spec.ts)
- UAT scenarios: one per criterion plus a restart edge case, verified with `curl` against the compose stack and the `/docs` page.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: it is a router response read over HTTP, which the TestClient cycle covers end to end. |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Unit (increase, via injected monotonic readings) and Integration (non-negative over HTTP; second call not smaller than the first) | No UI exists for it; the increase is a service calculation that an injected clock proves deterministically without a one-second sleep. |
| 3 | `started_at` captured once at startup, not per request, serialised in UTC with explicit offset | Integration (two calls return the identical string ending `+00:00`; a fresh app's `started_at` lies between timestamps taken before and after its startup) and Unit (serializer output) | It is lifespan and serialisation behaviour observable only in the HTTP body; no screen shows it. |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | It is a structural property of the code (schema module and the route's `response_model`), not user behaviour. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a client GETs `/api/uptime`, Then the status is 200 and the body has exactly `uptime_seconds` (number) and `started_at` (string) |
| 2 | non-negative and increasing | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client GETs `/api/uptime` twice about one second apart, Then both `uptime_seconds` are at least 0 and the second is greater than the first |
| 3 | captured once at startup, UTC with explicit offset | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client GETs `/api/uptime` twice, Then `started_at` is identical both times and ends in `+00:00`; edge case: When the backend is restarted, Then `started_at` is later and `uptime_seconds` restarts near 0 |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When an operator opens `/docs`, Then the `GET /api/uptime` 200 response names the `UptimeResponse` schema with fields `uptime_seconds` and `started_at` |

## Manual verification plan
None of the four criteria is verifiable through the application UI: no frontend screen shows uptime. The observable checks are the HTTP response, read with `curl`, and FastAPI's generated `/docs` page.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: Docker running; repository on `feature/TEST-07-uptime-endpoint`; from the repository root `docker compose up -d --build` has finished and `docker compose ps` shows `db` healthy and `backend` running; nothing else bound to host port 8010.
1. In a terminal run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json`.
2. Read the body → exactly two keys, for example `{"uptime_seconds":12.84,"started_at":"2026-11-01T04:11:13.482915+00:00"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted string.
3. Run `curl -i -X POST http://localhost:8010/api/uptime` → `HTTP/1.1 405 Method Not Allowed` (edge case: the endpoint is read-only).

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: Criterion 1's stack still running.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` → two JSON lines are printed.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second exceeds the first by roughly 1 (between about 0.9 and 1.5, allowing for request latency).

### Criterion 3: `started_at` is captured once at startup, in UTC with an explicit offset
Prerequisites: Criterion 1's stack still running.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → the `started_at` string is character-for-character identical in both responses while `uptime_seconds` differs.
2. Read the end of `started_at` → it ends in `+00:00` (not `Z`, and not a local offset such as `+01:00`).
3. Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is now later than the value from step 1, and `uptime_seconds` is small (a few seconds), confirming the value is taken at startup.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: Criterion 1's stack still running; `uv` installed on the host.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` → the 200 response's schema is named `UptimeResponse` and lists `uptime_seconds` (number) and `started_at` (string). Do not expect a `format: date-time` on `started_at`; the generated document shows it as a plain string.
2. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with those two fields, and `backend/app/routers/uptime.py` uses it as `response_model`.
3. From the repository root run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the summary line reports `0 failed`.
