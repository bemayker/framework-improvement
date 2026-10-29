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
- [ ] 1. `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker, 2026-09-14): "mayker-dev: PR opened for TEST-07 (PR #39) ... GET /api/uptime returns {"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC +00:00>"} ... the UAT script claimed the OpenAPI schema documents started_at as string with format: date-time; the generated schema showed a bare {"type": "string"} because the field_serializer's -> str annotation drives the serialisation-mode schema ... started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers." → Addressed by: three decisions. (a) The wire format is pinned to the `+00:00` offset that comment reports, since criterion 3 asks for an explicit offset and Pydantic's default UTC rendering is `Z`; see Assumptions. (b) The manual verification plan and the UAT artifacts must not claim an OpenAPI `format: date-time` for `started_at`: they describe the bare string the serializer produces, and Phase G is told so explicitly. (c) The module-import capture that comment flags as a residual is replaced: `started_at` is captured in the app's `lifespan` startup hook and stored on `app.state`, which is the literal "application startup" of criterion 3 and is per process by construction. With several uvicorn workers each worker would still report its own process's start, which is what "how long the process has been running" asks for; this is recorded, not engineered around. The comment's "held behind FEAT-1" note no longer applies: FEAT-1's code is absent from main (feature_map.md TEST-09/BUG-01 rows), and the serialization advice is carried in shared_risks.md.
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Addressed by: precondition verified against the repository rather than assumed. The 2026-09-14 comment records the revert merged as 0ac6818 (#29), and on the current branch (fresh from origin/main) a case-insensitive search for `uptime` under `backend/app`, `backend/tests`, `e2e` and `frontend/src` finds nothing, and `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`. The plan therefore creates every uptime file from scratch. This plan is for `/plan-feature` (assisted), not `/deliver`, so the comment's run restriction does not bind it either way.
- Comment (tracker, 11 framework link comments): "mayker-dev: PR opened for TEST-07 — {url}" from earlier plan and build runs whose PRs were closed when the sandbox was reset. → Not acted on because they carry only a PR link and ask for nothing; this plan's PR gets its own link comment from the main session.

## Plan Overview
One read-only backend endpoint, `GET /api/uptime`, following the existing version and health slices (router, service, schema). The process start is captured once, in `main.py`'s existing `lifespan` hook, as a pair: a wall-clock UTC `started_at` for the response and a `time.monotonic()` reading for the duration, so `uptime_seconds` cannot go backwards on a wall-clock adjustment. The router reads that pair from `request.app.state`, the service computes the elapsed seconds, and a Pydantic schema in `backend/app/schemas/uptime.py` defines and serialises the body. No database, no frontend, no new dependency.

**Assumptions (recorded, not blocking):**
1. "Explicit offset" is read as the numeric `+00:00` offset (e.g. `2026-10-29T16:17:45.123456+00:00`), not the `Z` designator Pydantic v2 emits by default for UTC. The schema's serializer converts to UTC and calls `isoformat()`. The OpenAPI document will then show `started_at` as a plain string (no `format: date-time`); that is accepted and must be described truthfully in the UAT artifacts.
2. `uptime_seconds` is a JSON number with sub-second precision (a float), not rounded to an integer: the criterion says "number", and an integer would make "increases between two calls a second apart" flaky at the boundary.
3. "Application startup" is the FastAPI `lifespan` startup, which runs once per `create_app()` instance under uvicorn and under `with TestClient(app)`. The capture is placed first in the lifespan, before the database schema step, so it never depends on the database.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/uptime`, read-only, no parameters, returns 200 with `UptimeResponse`. Router at `backend/app/routers/uptime.py` with `APIRouter(prefix="/api", tags=["uptime"])`, same shape as `routers/version.py`. The handler takes `request: Request`, reads `request.app.state.process_start`, and returns `UptimeResponse(uptime_seconds=..., started_at=...)`. No business logic in the router (coding_standards.md Section 2.2).
- Service layer: `backend/app/services/uptime_service.py`.
  - `ProcessStart`: frozen dataclass with `started_at: datetime` (timezone-aware, UTC) and `started_monotonic: float`.
  - `capture_process_start() -> ProcessStart`: reads `datetime.now(timezone.utc)` and `time.monotonic()` once. Called exactly once, from the lifespan.
  - `get_uptime_seconds(process_start: ProcessStart) -> float`: returns `max(0.0, time.monotonic() - process_start.started_monotonic)`. The clamp makes criterion 2's non-negativity a guarantee of the code rather than of the clock. `time` is imported as a module (`import time`) and called as `time.monotonic()` so unit tests can monkeypatch `uptime_service.time.monotonic`.
- `backend/app/main.py`: in `lifespan`, first statement `app.state.process_start = capture_process_start()`, before the existing DATABASE_URL branch; in `create_app`, `app.include_router(uptime_router)` after the existing three registrations; update the module docstring's list of registering features with one clause for TEST-07. Nothing else in `main.py` changes.
- Schema: `backend/app/schemas/uptime.py`, `UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus a `@field_serializer("started_at")` that returns `value.astimezone(timezone.utc).isoformat()`. `AwareDatetime` rejects a naive datetime at construction, so a value without an offset can never be serialised.
- Repository layer: none (no persistence).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query or path parameters.
- Response: 200, `application/json`, exactly two keys:

```json
{"uptime_seconds": 12.345678, "started_at": "2026-10-29T16:17:45.123456+00:00"}
```

- `uptime_seconds`: number, `>= 0`, seconds since this process's application startup, monotonic across calls.
- `started_at`: string, ISO 8601, UTC with the `+00:00` offset, identical on every call for the life of the process.
- Any other method on the path: 405 (FastAPI default, no code added).

## Technology Selection
- Process start time and elapsed duration (`uptime_service.py`): chose the standard library's `datetime.now(timezone.utc)` and `time.monotonic()` over reading the process start from `psutil` or `/proc/self/stat`, because the stdlib pair covers the need with no new dependency and `time.monotonic()` is immune to wall-clock jumps.
- Capture point: chose FastAPI's existing `lifespan` hook in `main.py` (already installed and already used there) over a module-level constant set at import time, because the lifespan is the application-startup event criterion 3 names and is testable per app instance.
- Response schema (`schemas/uptime.py`): chose Pydantic, already installed as FastAPI's dependency (pydantic 2.13 in `uv.lock`), with its `AwareDatetime` type, `Field(ge=0)` constraint and `field_serializer`, over a hand-written validation or formatting helper; criterion 4 also requires Pydantic.
- No new dependency is added, so `pyproject.toml` and `uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema, `+00:00` serialisation of `started_at` (criteria 1, 3, 4)
- [B] backend/app/services/uptime_service.py: `ProcessStart`, `capture_process_start()`, `get_uptime_seconds()` (criteria 2, 3)
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `app.state.process_start` (criterion 1)
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service (criteria 2, 3)
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for the schema's constraints and serialisation (criteria 3, 4)
- [B] backend/tests/integration/test_uptime_integration.py: router integration tests through the full HTTP cycle (criteria 1, 2, 3)
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-07/uat_script.md: the copy of the manual UAT script build-feature writes

### Modified files
- [B] backend/app/main.py: capture `app.state.process_start` first in `lifespan`, register the uptime router in `create_app`, docstring clause
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route`, same shape as the version and health route tests

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints. No E2E spec: no criterion is assigned to the E2E tier (see Criterion coverage).

## Testing Strategy
- Unit tests: service and schema, all external clocks monkeypatched.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` (`test_uptime_service_unit.py`, `test_uptime_schema_unit.py`, plus the addition to `test_main_unit.py`)
  - `test_uptime_service_unit.py`: `test_capture_process_start_returns_utc_aware_datetime` (tzinfo set, `utcoffset() == timedelta(0)`); `test_get_uptime_seconds_returns_elapsed_monotonic_seconds` (start 100.0, patched now 105.5, expect 5.5); `test_get_uptime_seconds_returns_zero_at_the_start_instant` (edge: now equals start); `test_get_uptime_seconds_never_negative_when_clock_reads_earlier` (error case: now below start returns 0.0); `test_get_uptime_seconds_increases_as_the_clock_advances` (two reads one second apart, second greater).
  - `test_uptime_schema_unit.py`: `test_uptime_response_serialises_started_at_with_utc_offset` (an aware UTC datetime dumps in JSON mode ending `+00:00`); `test_uptime_response_converts_non_utc_offset_to_utc` (edge: a `+02:00` value dumps as the equivalent `+00:00` instant); `test_uptime_response_rejects_naive_started_at` (error: `ValidationError`); `test_uptime_response_rejects_negative_uptime_seconds` (error: `ValidationError`).
  - `test_main_unit.py`: `test_create_app_registers_uptime_route` asserts `/api/uptime` is among the custom route paths.
- Integration tests: router through the real HTTP cycle with the existing session-scoped `client` fixture in `backend/tests/conftest.py` (no database needed).
  - Directory: `backend/tests/integration/`
  - File: `test_uptime_integration.py`
  - `test_get_uptime_returns_200_with_uptime_and_started_at` (status 200, keys exactly `{"uptime_seconds", "started_at"}`, `uptime_seconds` is an int or float and `>= 0`); `test_get_uptime_started_at_is_utc_with_explicit_offset` (string ends `+00:00`, `datetime.fromisoformat` parses it, `utcoffset() == timedelta(0)`, not later than now); `test_get_uptime_increases_between_calls_a_second_apart` (two calls with a real `time.sleep(1)` between them: second `uptime_seconds` is at least 1.0 greater, and `started_at` is identical on both, which also covers "not recomputed per request"); `test_get_uptime_answers_when_database_url_is_unset` (fresh `create_app()` under `with TestClient(...)` after `monkeypatch.delenv("DATABASE_URL")`, 200, proving the capture does not depend on the database branch of the lifespan); `test_post_uptime_returns_405_method_not_allowed` (only reachable error case, mirrors the version test).
  - The one-second sleep is deliberate: it is the criterion's own wording, and the testing standards' "no hardcoded waits" rule is an E2E rule (testing_standards.md Section 1.3). The deterministic version of the same property is the unit test with a patched clock.
- E2E tests: not warranted. No criterion requires navigation or interaction through the UI: no frontend consumes `/api/uptime`, and a Playwright spec that calls the API directly is a router integration test (testing_standards.md Section 5). Phase D therefore writes no spec, and the per-feature edge-case spec obligation does not arise because E2E is not warranted for this feature at all.
  - Directory: `e2e/tests/` (unused by this feature)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a non-GET method returns 405), describing HTTP requests and responses, not browser steps. The manual script is expanded from the Manual verification plan below. Neither artifact may claim an OpenAPI `format: date-time` for `started_at` (see Re-Plan Feedback).
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: no UI consumes the endpoint, it is a router response checked through the HTTP cycle |
| 2 | `uptime_seconds` non-negative and increasing between calls a second apart | Integration + Unit | Verifying it needs no navigation or interaction: it is a response value over two HTTP calls, plus the service's clamp and arithmetic with a patched clock |
| 3 | `started_at` captured once at startup, UTC with explicit offset | Integration + Unit | Verifying it needs no navigation or interaction: identity across two HTTP calls and the serialised string format, plus the capture function and serializer in isolation |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a schema definition, checked by constructing and dumping `UptimeResponse` directly |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I send GET /api/uptime, Then the status is 200 and the body has exactly `uptime_seconds` and `started_at` |
| 2 | non-negative and increasing | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request /api/uptime twice a second apart, Then both values are non-negative and the second is larger |
| 3 | captured once, UTC with explicit offset | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request /api/uptime twice, Then `started_at` is identical and ends in `+00:00`; and after a backend restart it changes |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the repository, When I open `backend/app/schemas/uptime.py`, Then `UptimeResponse` is a Pydantic model the router declares as its response model |

## Manual verification plan
No criterion is verifiable through a UI: no frontend screen shows uptime. Every check below is a terminal command against the running stack, and its output is the observable result.

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
Prerequisites: Docker running; repository on branch `feature/TEST-07-uptime-endpoint`; host port 8010 free; from the repository root `docker compose up -d --build` has finished and `docker compose ps` shows the `backend` service running.
1. In a terminal run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body → it has exactly two keys, for example `{"uptime_seconds":42.17,"started_at":"2026-10-29T16:17:45.123456+00:00"}`: `uptime_seconds` is an unquoted number, `started_at` is a quoted string.
3. Run `curl -i -X POST http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 405 Method Not Allowed` (edge case: the endpoint is read-only).

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: the stack from Criterion 1 is still up.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; echo; curl -s http://localhost:8010/api/uptime` → two JSON bodies are printed.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second is at least 1 greater than the first (for example `42.17` then `43.18`).
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the run ends with `0 failed`.

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: the stack from Criterion 1 is still up.
1. Run `curl -s http://localhost:8010/api/uptime`, wait 2 seconds, run it again → the `started_at` string is character-for-character identical on both calls while `uptime_seconds` has grown.
2. Read `started_at` → it ends in `+00:00` (not `Z`, not another offset, not missing), and the time is close to when the backend container started (compare with `docker compose ps`, the `backend` row's status age).
3. Run `docker compose restart backend`, wait until `docker compose ps` shows it running, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is now later than the value read in step 1 and `uptime_seconds` is small (a few seconds), showing a restart is visible.
4. Optional: open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` → the response schema lists `uptime_seconds` (number) and `started_at` (string). It is a plain string in the schema, with no `date-time` format; that is expected and not a failure.

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the repository checked out on the feature branch.
1. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`.
2. Open `backend/app/routers/uptime.py` → the route is declared with `response_model=UptimeResponse` and returns an `UptimeResponse`.
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py` → the run ends with `0 failed`.
