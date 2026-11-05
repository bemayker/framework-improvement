# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> **What:** `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> **Acceptance criteria:**
> 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
> 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
> 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
>
> **Notes:** Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches `main.py`'s router registration, so it must not run concurrently with another backend item that does the same.
>
> ClickUp task 123k99ctgcg (https://app.clickup.com/t/123k99ctgcg), status to do, no tags, no priority. Feature map: depends_on [TEST-01], branch `feature/TEST-07-uptime-endpoint`, not the scaffold item.

## Acceptance Criteria
- [ ] `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker, 2026-09-14, /deliver run report for deliver-20260914T095103Z, PR #39): reports a previous build of this item (`started_at` serialised as `+00:00`, a `field_serializer` whose `-> str` annotation makes OpenAPI document `started_at` as a bare `{"type": "string"}` without `format: date-time`, the item held behind FEAT-1 because both register a router in `main.py`, and a residual that `started_at` was captured at module import, which equals process start only while the Dockerfile runs one uvicorn process with `--factory` and no `--workers`). → Addressed by: (a) that code is not on main: `origin/main` at b0ed4c9 holds no uptime router, schema, service or test (a `grep -i uptime` over `backend/app`, `backend/tests` and `e2e` finds nothing), so this plan builds the feature new rather than restoring PR #39; (b) the `+00:00` wire format is kept and pinned by tests, and the OpenAPI observation is carried forward as a known, accepted limitation: the manual verification plan and the UAT script must describe `started_at` in the OpenAPI document as a plain string and must not claim `format: date-time`; (c) the main.py serialization is recorded in `shared_risks.md`; (d) the residual is answered by design rather than restated: the start instant is captured in `create_app()`, which uvicorn's `--factory` calls once per serving process (backend/Dockerfile CMD), not at module import, and `uptime_seconds` is measured on the monotonic clock. Under a future `--workers N` each worker is its own process with its own start, which is what "how long the process has been running" means; calls load-balanced across workers could then see different starts, and that stays a documented known limitation for the PR, not something this item builds for.
- Comment (tracker, 2026-09-07, measured run 3 reset note): the item was reset to to do, its earlier merge (ffbfc12, with 8794a99 and a9695cc) was to be reverted on the sandbox main before any `/deliver` run. → Not acted on as a blocker because its precondition is satisfied: the 2026-09-14 comment records the revert merged as 0ac6818 (#29), and current main carries no uptime code (checked above), so there is nothing left to revert and nothing to collide with. Recorded so the precondition's resolution is visible on the plan.
- Comment (tracker, 17 framework-written notices, "mayker-dev: PR opened for TEST-07" on PRs 544, 514, 482, 445, 410, 381, 344, 317, 271, 223, 191, 168, 144, 90, 63, 57, 26): draft plan PR notices from earlier plan runs on this sandbox. → Not acted on because they carry no planning content and every one of those PRs is closed; this branch was cut fresh from origin/main b0ed4c9. Recorded so no comment is silently dropped.

## Plan Overview
Backend-only feature, kept as small as the criteria allow. Add `GET /api/uptime` following the project's existing Router to Service pattern (`app/routers/version.py`, `app/services/version_service.py`): a new `uptime` router, a new `uptime_service` holding the start-capture and elapsed-time logic, and a new `UptimeResponse` schema in `app/schemas/uptime.py`. `create_app()` captures the process start once (a UTC wall-clock instant for `started_at` plus a monotonic reading for elapsed time) and stores it on `app.state`; the router reads it from there on every request and never recomputes it. `uptime_seconds` is `time.monotonic()` minus the stored monotonic reading, so it is non-negative and never goes backwards when the wall clock is adjusted. `started_at` is serialised with `datetime.isoformat()`, giving an explicit `+00:00` offset. No database, no repository, no migration, no frontend, no new dependency.

Recorded assumptions:
- "Captured once at application startup" is implemented as capture inside `create_app()`. Uvicorn's `--factory` (backend/Dockerfile CMD) calls `create_app()` once when the serving process starts, so this is application startup for the app that serves requests. The `lifespan` hook was considered and rejected: it is skipped by a `TestClient` used without its context manager (the pattern `test_health_integration.py` relies on), which would leave the endpoint with no start value. Note that `app/main.py` also builds a module-level `app = create_app()` on import; that instance is not the one uvicorn serves under `--factory` and each app instance owns its own start, so nothing is shared or recomputed.
- "Explicit offset" is read as a numeric `+00:00` offset, not pydantic v2's default `Z` designator for UTC datetimes; the schema therefore serialises `started_at` itself (`field_serializer` returning `value.isoformat()`), and the tests assert the string ends in `+00:00`.
- `uptime_seconds` is a float in seconds (sub-second precision), not rounded: the criterion says "a number", and rounding to whole seconds would make "increases between two calls a second apart" depend on where the rounding boundary falls.

## Frontend Plan
No frontend changes required. (The feature exposes a backend endpoint; no acceptance criterion renders it. Design reference notes: AI freestyle, Design Reference mode NONE, and no UI is built by this item.)

## Backend Plan
- Endpoints: `GET /api/uptime` in `app/routers/uptime.py` (prefix `/api`, tags `["uptime"]`, `response_model=UptimeResponse`, matching the version router's shape). The handler takes the `Request`, reads `request.app.state.process_start`, and returns `UptimeResponse(uptime_seconds=uptime_service.elapsed_seconds(process_start), started_at=process_start.started_at)`. No business logic in the router.
- Service layer: `app/services/uptime_service.py` with a frozen dataclass `ProcessStart(started_at: datetime, monotonic_start: float)`, `capture_process_start() -> ProcessStart` (reads `datetime.now(UTC)` and `time.monotonic()` once each), and `elapsed_seconds(process_start: ProcessStart) -> float` (returns `time.monotonic() - process_start.monotonic_start`). The module calls the clocks through `time.monotonic` and `datetime.now` at call time so unit tests can monkeypatch them. Comments say why the monotonic clock is used (wall-clock adjustments must not make uptime shrink or go negative).
- App factory: `app/main.py` `create_app()` sets `app.state.process_start = uptime_service.capture_process_start()` and adds `app.include_router(uptime_router)` beside the existing three; the module docstring gains one sentence naming TEST-07's router and start capture.
- Repository layer: none. No data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: none (no parameters, no body)
- Response 200:

  ```json
  {"uptime_seconds": 42.137, "started_at": "2026-11-05T00:49:21.512034+00:00"}
  ```

  `uptime_seconds`: JSON number, seconds elapsed since the serving process started, `>= 0`, sub-second precision. `started_at`: ISO 8601 string in UTC with an explicit `+00:00` offset, identical on every call to the same process.
- Schema: `UptimeResponse` in `app/schemas/uptime.py` (`uptime_seconds: float` constrained `ge=0`, `started_at: AwareDatetime` with a JSON-mode `field_serializer` returning `isoformat()`).
- Known limitation, accepted (tracker comment of 2026-09-14): the generated OpenAPI document describes `started_at` as `{"type": "string"}` without `format: date-time`, because the serializer's `str` return type is what pydantic derives the serialisation schema from. The wire value is what the criteria govern.
- Any other method on the path: 405 (FastAPI default, as with `/api/version` and `/api/health`).

## Technology Selection
- Process start instant (`started_at`): chose the standard library's `datetime.now(UTC)` over any date library, because the stdlib produces an aware UTC datetime whose `isoformat()` already carries the explicit `+00:00` offset.
- Elapsed time (`uptime_seconds`): chose the standard library's `time.monotonic()` over subtracting wall-clock datetimes, because the monotonic clock cannot move backwards on a clock adjustment, which is what guarantees criterion 2's non-negative and increasing value.
- Response schema `UptimeResponse`: chose pydantic `BaseModel` with `AwareDatetime` and a `field_serializer`, already installed with FastAPI and used by every file in `app/schemas/`; no alternative needed, and `AwareDatetime` rejects a naive datetime at construction rather than relying on convention.
- Start-value storage: chose FastAPI's built-in `app.state` over a module-level global, because each app instance then owns its start and module import time stops standing in for process start (the 2026-09-14 residual).
- No net-new dependency is added by this feature.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema (`uptime_seconds` float >= 0, `started_at` aware datetime serialised via `isoformat()` with `+00:00`).
- [B] backend/app/services/uptime_service.py: `ProcessStart` dataclass, `capture_process_start()`, `elapsed_seconds()` on the monotonic clock.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `app.state.process_start`, no business logic.
- [B] backend/tests/unit/test_uptime_service_unit.py: service unit tests with the clocks monkeypatched (capture, elapsed arithmetic, zero-elapsed edge).
- [B] backend/tests/unit/test_uptime_schema_unit.py: schema unit tests (`+00:00` JSON serialisation, rejection of a naive datetime, rejection of a negative `uptime_seconds`).
- [B] backend/tests/integration/test_uptime_integration.py: full HTTP cycle (200 and exact key set, stable `started_at` across calls, increase across calls a second apart, 405 on POST).
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (a restarted backend reports a later `started_at`).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the uptime router and service, set `app.state.process_start` in `create_app()`, register the router with one `include_router` line, extend the module docstring by one sentence.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` and `test_create_app_captures_an_aware_utc_process_start` (each `create_app()` sets `app.state.process_start` with a UTC `started_at`).

No dependency manifest changes, so no lockfile (`backend/uv.lock`, `package-lock.json`) is touched: FastAPI, pydantic and the standard library cover everything. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, adds no environment variable, and neither file keeps an endpoint list.

## Testing Strategy
- Unit tests: `uptime_service` with `time.monotonic` and the `datetime` reference monkeypatched on the module. Happy path: `capture_process_start()` returns the patched UTC instant and monotonic value; `elapsed_seconds()` returns the patched difference (e.g. start 100.0, now 142.5 gives 42.5). Edge case: the same monotonic reading gives `0.0`, which is non-negative. Error case: `UptimeResponse` rejects a naive `started_at` and a negative `uptime_seconds` with `ValidationError`, and its JSON dump renders a UTC `started_at` ending in `+00:00` (not `Z`). App factory: `create_app()` registers `/api/uptime` and sets an aware UTC `app.state.process_start`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`, `test_uptime_schema_unit.py`; route registration goes into the existing `test_main_unit.py`)
- Integration tests: the router through the real HTTP request/response cycle on the shared session `client` fixture from `backend/tests/conftest.py`. 200 with exactly the keys `uptime_seconds` and `started_at`, `uptime_seconds` a number `>= 0`, `started_at` parsed with `datetime.fromisoformat` having `utcoffset() == timedelta(0)` and the raw string ending in `+00:00`; two requests return the identical `started_at` string; two requests separated by `time.sleep(1.0)` (the criterion's own interval) return a strictly larger second `uptime_seconds` and the same `started_at`; POST returns 405. No database is needed by the endpoint, so no database fixture is requested.
  - Directory: backend/tests/integration/ (`test_uptime_integration.py`)
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion: all four are HTTP or schema behaviours of a backend endpoint no UI consumes), so no `e2e/tests/TEST-07_*.spec.ts` is produced and the per-feature edge-case spec obligation does not attach.
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (restarting the backend resets `uptime_seconds` and moves `started_at` later), validated for well-formedness only.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: it is a router response over the real HTTP cycle, and no UI consumes the endpoint |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration | Verifying it needs no navigation or interaction: two HTTP calls a second apart through the real app; the arithmetic is also pinned at Unit with a patched clock |
| 3 | `started_at` captured once at startup, not recomputed, UTC with explicit offset | Integration | Verifying it needs no navigation or interaction: identical `started_at` across calls and its `+00:00` form are read off the HTTP response; capture in `create_app()` is also pinned at Unit |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a schema definition and validation rule, tested by constructing and dumping `UptimeResponse` directly |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime, Then the response is HTTP 200 with a numeric uptime_seconds and an ISO 8601 started_at |
| 2 | `uptime_seconds` non-negative and increasing a second apart | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime twice one second apart, Then both uptime_seconds are at least 0 and the second is larger |
| 3 | `started_at` captured once, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime twice, Then started_at is identical in both and ends in +00:00 |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When a reviewer opens the OpenAPI document, Then GET /api/uptime returns the UptimeResponse schema with uptime_seconds and started_at |

## Manual verification plan
### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
This criterion is not verifiable through the UI (no frontend consumes the endpoint); the observable check is the HTTP response, read with curl.
Prerequisites: Docker running; from the repo root, `docker compose up -d --build backend`; `docker compose ps` shows `backend` running (it listens on host port 8010).
1. In a terminal, run `curl -i http://localhost:8010/api/uptime` → the first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body → it has exactly two keys, for example `{"uptime_seconds":12.84,"started_at":"2026-11-05T09:30:02.118734+00:00"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted date-time string.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Not verifiable through the UI; the observable check is two responses read with curl.
Prerequisites: criterion 1 verified, backend still running.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` → two JSON bodies print.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second is larger than the first by roughly one second (for example 30.41 then 31.42).

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset
Not verifiable through the UI; the observable checks are the responses and a restart.
Prerequisites: criterion 2 verified, backend still running.
1. Look at the two bodies from criterion 2 → `started_at` is the identical string in both, character for character.
2. Read the end of that string → it ends in `+00:00` (not `Z` and not a local offset such as `+01:00`).
3. Run `docker compose restart backend`, wait until `docker compose ps` shows it running, then run `curl -s http://localhost:8010/api/uptime` → `uptime_seconds` is small (a few seconds) and `started_at` is later than the value you read in step 1, which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Not verifiable through the UI as a behaviour; the observable checks are the source file and the OpenAPI document.
Prerequisites: backend running.
1. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` → the 200 response names the `UptimeResponse` schema with `uptime_seconds` (number) and `started_at` (string). Expected: `started_at` is documented as a plain string with no `date-time` format; that is the accepted limitation recorded in the API Contract, not a defect.
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py` → the summary line reports `0 failed`.
