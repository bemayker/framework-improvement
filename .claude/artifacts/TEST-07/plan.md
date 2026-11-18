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
- Comment (tracker): 29 comments on the item (27 framework "PR opened" link comments from earlier runs, one 2026-09-07 operator note recording a state reset for a measured run, one 2026-09-14 delivery-run report) → not acted on because none asks for a change to the description or the acceptance criteria; the description is planned as written.
- Assumption (criterion 3, "explicit offset"): `started_at` is serialised with the numeric offset `+00:00` (for example `2026-11-18T09:15:02.481233+00:00`), not Pydantic v2's default `Z` suffix. Both are ISO 8601 UTC; `+00:00` is chosen because it satisfies the literal reading of "explicit offset" as well as the UTC one, so the criterion cannot be failed on a reading of the word.
- Assumption (criterion 3, "application startup"): `started_at` is captured once per process, when the uptime service module is first imported (which `backend/app/main.py` does at process start, through the router import), not inside the `lifespan` handler. The feature's purpose is "how long the process has been running", the existing `lifespan` is tied to database schema initialisation, and a module-level capture also holds for code paths that build the app without running its lifespan (as the TEST-02 health integration test does). Repeated `create_app()` calls in one process therefore share one `started_at`, which is the intended per-process meaning.
- Assumption (criterion 2, measuring uptime): `uptime_seconds` is computed from the monotonic clock (`time.monotonic()`), captured at the same moment as `started_at`, not by subtracting wall-clock datetimes, so a system clock adjustment can never make it negative or decrease. It is a float rounded to 3 decimal places (millisecond resolution).
- Merged since the last plan: n/a (fresh plan, branch freshly created from current `origin/main`).

## Plan Overview
One read-only backend endpoint, `GET /api/uptime`, following the existing Router to Service to Schema slice the version endpoint (TEST-05) established. No database, repository, migration, frontend or external API is involved. A new service module captures the process start once (a timezone-aware UTC `datetime` and a monotonic clock reading) and computes uptime per call; a new Pydantic response schema defines the body and serialises `started_at` with an explicit `+00:00` offset; a new router exposes the endpoint and is registered in `backend/app/main.py`. Unit and integration tests cover all four criteria; no criterion involves the UI, so there is no E2E spec.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime` (router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, `response_model=UptimeResponse`), returns how long the process has been running and when it started. Registered in `backend/app/main.py` with `app.include_router(uptime_router)` after the existing three registrations; the module docstring's list of registering features gains TEST-07. No other change to `main.py` (lifespan and CORS untouched).
- Service layer: `backend/app/services/uptime_service.py`.
  - Module-level constants captured once at import: `PROCESS_STARTED_AT = datetime.now(timezone.utc)` and `PROCESS_STARTED_MONOTONIC = time.monotonic()`.
  - `UptimeReport` frozen dataclass (`uptime_seconds: float`, `started_at: datetime`), matching the `HealthReport` pattern in `health_service.py`.
  - `get_uptime() -> UptimeReport`: returns `started_at=PROCESS_STARTED_AT` (never recomputed) and `uptime_seconds=round(max(0.0, time.monotonic() - PROCESS_STARTED_MONOTONIC), 3)`. The `max(0.0, ...)` clamp is a guard for the non-negative criterion; it cannot trigger with a monotonic clock but keeps the contract explicit. The clock is read through the module's `time` reference so unit tests can monkeypatch it (the same technique `test_version_service_unit.py` uses).
- Schema: `backend/app/schemas/uptime.py`, `UptimeResponse(BaseModel)` with `uptime_seconds: float` and `started_at: datetime`, plus a `@field_serializer("started_at")` returning `value.astimezone(timezone.utc).isoformat()` so the JSON always carries `+00:00`.
- Repository layer: none (no data access).
- Migrations: none.
- Error handling: no reachable error path beyond FastAPI's own 405 for a non-GET method; the endpoint reads no input and touches no database, so it answers 200 even when `DATABASE_URL` is unset.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query or path parameters.
- Response: 200, `application/json`, body defined by `UptimeResponse`:

```json
{
  "uptime_seconds": 42.317,
  "started_at": "2026-11-18T09:15:02.481233+00:00"
}
```

- `uptime_seconds`: JSON number, float seconds since process start, `>= 0`, millisecond resolution, increases between calls.
- `started_at`: ISO 8601 string, UTC, explicit `+00:00` offset, identical on every call within one process.
- Errors: 405 Method Not Allowed for any non-GET method (FastAPI default).

## Technology Selection
- Process start timestamp: chose the standard library `datetime.now(timezone.utc)` over any installed dependency, because the stdlib covers a timezone-aware UTC timestamp completely.
- Uptime measurement: chose the standard library `time.monotonic()` over subtracting wall-clock datetimes or a process-inspection dependency (e.g. psutil, not installed), because only a monotonic clock guarantees a non-negative, non-decreasing value.
- Explicit-offset serialisation: chose Pydantic's own `field_serializer` (already installed with FastAPI) with `datetime.isoformat()` over a custom JSON encoder or a string-typed field, because it keeps `started_at` a typed `datetime` in the schema while fixing the wire format.
- Uptime router, service and schema modules: no stdlib call, native platform feature or installed dependency provides an uptime endpoint, so they are built here on FastAPI and Pydantic, which the project already installs. No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema (`uptime_seconds: float`, `started_at: datetime`, serialised with `+00:00`).
- [B] backend/app/services/uptime_service.py: once-per-process start capture (`PROCESS_STARTED_AT`, `PROCESS_STARTED_MONOTONIC`), `UptimeReport` and `get_uptime()`.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router returning `UptimeResponse`.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for `get_uptime()` and the schema's serialisation, with the monotonic clock monkeypatched.
- [B] backend/tests/integration/test_uptime_integration.py: full HTTP cycle tests for `GET /api/uptime` (200 shape, increase across a one-second gap, stable `started_at`, 405 on POST).
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation is ENABLED).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: import `uptime_router` and register it with `app.include_router(uptime_router)`; add TEST-07 to the module docstring's list.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` asserting `/api/uptime` is among the app's custom routes.

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is regenerated.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither document lists API endpoints.
No E2E spec file is produced: no criterion is covered at the E2E tier (see Criterion coverage).

## Testing Strategy
- Unit tests: `uptime_service.get_uptime()` (happy path, edge case at zero elapsed time, clamp on a clock reading behind the captured start), the `started_at` constant being returned unchanged across calls, the `UptimeResponse` serialiser's `+00:00` output, the router's declared response model, and the app registering `/api/uptime`. Monotonic clock monkeypatched via `monkeypatch.setattr(uptime_service.time, "monotonic", ...)` or an equivalent module-level seam; no real sleeps in the unit tier.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`; the registration test goes in the existing `test_main_unit.py`)
- Integration tests: the full HTTP cycle through `TestClient` with the session-scoped `client` fixture from `backend/tests/conftest.py`: 200 with exactly the two keys and their types, a real increase across a one-second gap (one `time.sleep(1.0)`; real time is the point at this tier), `started_at` identical across two requests and across two `create_app()` instances, `started_at` parsing back to an aware datetime whose `utcoffset()` is zero and whose string ends in `+00:00`, and 405 on POST. No database is needed; one test proves the endpoint answers with `DATABASE_URL` unset, as the version test does.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (`test_uptime_integration.py`)
- E2E tests: none written. E2E is ENABLED in CLAUDE.md, but no acceptance criterion requires navigation or interaction through the UI (the feature has no frontend), so every criterion is covered at the integration or unit tier per `testing_standards.md` Section 6.
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST rejected with 405), all expressed against the HTTP endpoint; plus the manual UAT script.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}` | Integration | `test_get_uptime_returns_200_with_uptime_seconds_and_started_at`, `test_get_uptime_answers_when_database_url_is_unset`, `test_create_app_registers_uptime_route` | verifying it needs no navigation or interaction: it is a router response shape, checked over the real HTTP cycle |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration | `test_get_uptime_uptime_seconds_increases_between_calls_one_second_apart`, `test_get_uptime_returns_non_negative_uptime_at_zero_elapsed`, `test_get_uptime_clamps_to_zero_when_clock_reads_before_start`, `test_get_uptime_returns_elapsed_monotonic_seconds` | verifying it needs no navigation or interaction: it is router and service behaviour over time, checked with a real one-second gap at integration and a controlled clock at unit |
| 3 | `started_at` captured once at startup, not recomputed per request, serialised in UTC with an explicit offset | Integration | `test_get_uptime_started_at_is_identical_across_requests`, `test_get_uptime_started_at_is_utc_with_explicit_offset`, `test_get_uptime_returns_the_process_start_captured_at_import`, `test_uptime_response_serialises_started_at_with_utc_offset` | verifying it needs no navigation or interaction: it is a captured-once value and a serialisation rule, checked across requests and on the schema |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_uptime_router_declares_uptime_response_model` | verifying it needs no navigation or interaction: it is a structural property of the router (its declared `response_model` is `UptimeResponse` from `app.schemas.uptime`) |

Placement of those ids: `test_get_uptime_returns_200_with_uptime_seconds_and_started_at`, `test_get_uptime_answers_when_database_url_is_unset`, `test_get_uptime_uptime_seconds_increases_between_calls_one_second_apart`, `test_get_uptime_started_at_is_identical_across_requests`, `test_get_uptime_started_at_is_utc_with_explicit_offset` and `test_post_uptime_returns_405_method_not_allowed` live in `backend/tests/integration/test_uptime_integration.py`; `test_create_app_registers_uptime_route` in `backend/tests/unit/test_main_unit.py`; the rest in `backend/tests/unit/test_uptime_service_unit.py`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET `/api/uptime`, Then the status is 200 and the body has a numeric `uptime_seconds` and a string `started_at` |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When I GET `/api/uptime` twice one second apart, Then both values are at least 0 and the second is greater than the first |
| 3 | `started_at` captured once, UTC, explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When I GET `/api/uptime` twice, Then `started_at` is identical and ends in `+00:00`, and after a restart it is later |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API docs at `/docs`, When I open `GET /api/uptime`, Then its 200 response schema is `UptimeResponse` |

## Manual verification plan
This feature has no UI of its own; every check below is made against the running backend in a terminal or through FastAPI's built-in docs page at `http://localhost:8010/docs`.

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
Prerequisites: the stack is up (`docker compose up -d` at the repo root), and the backend answers on `http://localhost:8010` (check: `curl -s http://localhost:8010/api/version` prints a JSON version).
1. Run `curl -s -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body printed under the headers → it is one JSON object with exactly two keys, `uptime_seconds` holding an unquoted number such as `42.317`, and `started_at` holding a quoted string such as `"2026-11-18T09:15:02.481233+00:00"`.
3. Open `http://localhost:8010/docs` in a browser, expand `GET /api/uptime`, click `Try it out` then `Execute` → the Server response shows code `200` and the same two-key body.

### Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` and note the `uptime_seconds` value (for example `120.004`) → the value is 0 or greater.
2. Wait about one second, then run `curl -s http://localhost:8010/api/uptime` again → the new `uptime_seconds` is greater than the value from step 1 by roughly one second (for example `121.019`).
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/version` answers again, then run `curl -s http://localhost:8010/api/uptime` → `uptime_seconds` is small (a few seconds) and not negative, showing the restart.

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` and copy the `started_at` value → it ends in `+00:00` (not `Z`, and not a local offset such as `+01:00`).
2. Wait about two seconds and run the same command again → `started_at` is character-for-character identical to step 1, while `uptime_seconds` has grown.
3. Check that `started_at` plus `uptime_seconds` is approximately the current UTC time: run `date -u +%Y-%m-%dT%H:%M:%S` → the printed time is within a second or two of `started_at` advanced by `uptime_seconds`.
4. Run `docker compose restart backend`, wait until the backend answers again, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is now later than the value from step 1 (the restart time), still ending in `+00:00`.

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for Criterion 1, and the repository checked out on this branch.
1. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds: float` and `started_at: datetime`.
2. Open `backend/app/routers/uptime.py` → the `@router.get("/uptime", ...)` decorator passes `response_model=UptimeResponse`, imported from `app.schemas.uptime`.
3. Open `http://localhost:8010/docs`, expand `GET /api/uptime` → the 200 response's schema is named `UptimeResponse` and lists `uptime_seconds` (number) and `started_at` (string, date-time).
4. Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py tests/unit/test_main_unit.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
