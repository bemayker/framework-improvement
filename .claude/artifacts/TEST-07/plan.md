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
- Comment (tracker): "One recorded residual, not a defect today: started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. If the deployment ever gains workers, each child would capture its own value and uptime_seconds would stop being monotonic across calls." → Addressed by: this plan captures the start once per app instance inside `create_app()` (which `uvicorn --factory` calls once at process startup), not at module import, and stores it on `app.state`; `uptime_seconds` is computed from `time.monotonic()` so a wall-clock adjustment cannot make it go backwards within one process. The multi-worker residual itself is not acted on: the feature asks for how long *the process* has been running, so a per-process value is the correct semantics, and `backend/Dockerfile` (read at plan time) still runs one uvicorn process with no `--workers`. Adding cross-worker coordination would be scope the criteria do not ask for. The build records it again under the PR's known improvements.
- Comment (tracker, same comment): "The UAT script was telling testers something untrue ... It claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare {"type": "string"} — the field_serializer's -> str return annotation ..." → Addressed by: the schema uses `AwareDatetime` with pydantic's own JSON serialisation (UTC rendered with the `Z` designator), with no `field_serializer`, so no `-> str` override exists to strip the format. Independently of that, the Manual verification plan and the UAT artifacts derived from it make no claim about the OpenAPI document's `format` for `started_at`; they verify only the live response body. The builder must not add such a claim unless it probes `/openapi.json` and quotes what it shows.
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 ... Built and merged in measured run 2 by /deliver (PR #26, squash ffbfc12 on main). ... Code revert pending ... Do not run /deliver against this item until that revert has merged." → Not acted on as a plan change, because it is a state note, not a requirement: verified at plan time that the revert has landed, since `backend/app/main.py` on this branch (branched from origin/main at 49d70f8) registers only the version, notes and health routers and no `uptime` router, schema or service file exists under `backend/app/`. The plan therefore creates the files fresh. The 20 framework "PR opened for TEST-07" link comments carry no request and are not acted on.
- Assumption (ambiguity, recorded rather than blocking): criterion 3's "UTC with an explicit offset" is satisfied by the ISO 8601 / RFC 3339 UTC designator `Z` (zero offset), which is pydantic v2's native JSON rendering of an aware UTC datetime, e.g. `2026-11-09T16:15:34.123456Z`. Choosing `Z` over a hand-serialised `+00:00` keeps the schema free of a custom serializer (see the second comment above). The integration test asserts the string parses with `datetime.fromisoformat` to an aware value whose `utcoffset()` is zero, and that it ends in `Z`.

## Plan Overview
One read-only backend endpoint, `GET /api/uptime`, following the existing version-endpoint slice (router, schema, service, registration in `create_app()`). No database, no frontend, no external API, no new dependency.

- `backend/app/services/uptime_service.py`: captures a `ProcessStart` (wall-clock `started_at` in UTC plus a `time.monotonic()` reading) and computes non-negative elapsed seconds from the monotonic clock.
- `backend/app/main.py`: `create_app()` captures the `ProcessStart` once and stores it on `app.state.process_start`, then registers the uptime router. `uvicorn app.main:create_app --factory` (the Dockerfile's CMD) calls `create_app()` once at process startup, so that is the application startup capture point; every request reads the stored value and never recomputes it.
- `backend/app/schemas/uptime.py`: `UptimeResponse` Pydantic model (`uptime_seconds: float` with `ge=0`, `started_at: AwareDatetime`).
- `backend/app/routers/uptime.py`: `GET /api/uptime` reads `request.app.state.process_start`, asks the service for the elapsed seconds, returns `UptimeResponse`.

Why capture in `create_app()` and not in `lifespan` or at module import: module import would compute the value when `app.main` is first imported, not per app (the module-level `app = create_app()` and the factory call would then share a value captured outside either); `lifespan` only runs inside a server or a `TestClient` context, so a router reading `app.state` outside one would fail. `create_app()` is the one point that runs exactly once per application instance in every way the app is started.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime` returns the process uptime and start time; tag `uptime`, router prefix `/api`, same shape as `backend/app/routers/version.py`.
- Service layer: `backend/app/services/uptime_service.py`
  - `@dataclass(frozen=True) class ProcessStart: started_at: datetime; monotonic_start: float`
  - `capture_process_start() -> ProcessStart`: returns `ProcessStart(started_at=datetime.now(UTC), monotonic_start=monotonic())`. Uses module-level imports `from datetime import UTC, datetime` and `from time import monotonic`, so tests monkeypatch `uptime_service.monotonic` (and `uptime_service.datetime` where needed) on the module.
  - `get_uptime_seconds(start: ProcessStart) -> float`: returns `max(0.0, monotonic() - start.monotonic_start)`. The clamp is the guard behind criterion 2's non-negative half; the monotonic clock is what keeps the value increasing when the wall clock is adjusted.
- Repository layer: none (no data access).
- Migrations: none.
- App wiring (`backend/app/main.py`): in `create_app()`, after constructing `FastAPI(...)`, set `app.state.process_start = capture_process_start()`; add `from app.routers.uptime import router as uptime_router` and `app.include_router(uptime_router)` after the existing three registrations. Update the module docstring's list of routers to name TEST-07. Do not touch the lifespan or CORS block.
- Router (`backend/app/routers/uptime.py`): `@router.get("/uptime", response_model=UptimeResponse)` `def get_uptime(request: Request) -> UptimeResponse`, building `UptimeResponse(uptime_seconds=get_uptime_seconds(start), started_at=start.started_at)` from `start = request.app.state.process_start`.
- Schema (`backend/app/schemas/uptime.py`): `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime` (both from `pydantic`). No `field_serializer`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: 200, `application/json`:

```json
{"uptime_seconds": 12.345678, "started_at": "2026-11-09T16:15:34.123456Z"}
```

- `uptime_seconds`: JSON number, >= 0, seconds since this process's app was created, from the monotonic clock (not rounded).
- `started_at`: ISO 8601 string in UTC with the `Z` designator; identical on every call to the same process.
- Other methods (e.g. POST) return 405 (FastAPI default); no 4xx from input since there is none.

## Technology Selection
- Start-time and elapsed-time capture (`uptime_service.py`): chose the standard library's `datetime.now(UTC)` and `time.monotonic()` over a third-party clock or uptime library (none is installed, and none is needed), because the stdlib covers both the wall-clock timestamp and a clock that never goes backwards.
- Process uptime source: chose the app-instance start captured in `create_app()` over reading OS process start time (`psutil` is not installed, and `/proc` is Linux-only), because the stdlib capture covers the need with no dependency.
- Response schema (`schemas/uptime.py`): chose the installed `pydantic` (`BaseModel`, `Field(ge=0)`, `AwareDatetime`) over hand-written validation or a custom serializer, because pydantic's built-in constraint and aware-datetime type cover non-negativity, offset-awareness and ISO 8601 serialisation.
- Router (`routers/uptime.py`): the installed FastAPI `APIRouter`, same as every other router; no alternative needed.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic model (criterion 4)
- [B] backend/app/services/uptime_service.py: `ProcessStart`, `capture_process_start()`, `get_uptime_seconds()`
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router
- [B] backend/tests/unit/test_uptime_unit.py: unit tests for the uptime service and the `UptimeResponse` schema
- [B] backend/tests/integration/test_uptime_integration.py: router integration tests for `GET /api/uptime`
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: capture `app.state.process_start` in `create_app()`, import and register the uptime router, docstring line naming TEST-07
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` and `test_create_app_captures_process_start_per_instance`
No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` edit: neither lists endpoints (checked at plan time), and this feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: service and schema logic, clock monkeypatched on the `uptime_service` module (no real waits).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_uptime_unit.py`; plus two tests added to `test_main_unit.py`
  - Cases in `test_uptime_unit.py`:
    - `test_capture_process_start_returns_aware_utc_datetime` (happy path: `started_at.utcoffset() == timedelta(0)`, and `monotonic_start` equals the faked monotonic reading)
    - `test_get_uptime_seconds_returns_elapsed_monotonic_seconds` (happy path: start at 100.0, clock at 112.5, returns 12.5)
    - `test_get_uptime_seconds_increases_as_clock_advances` (edge: two readings one second apart, second greater than first)
    - `test_get_uptime_seconds_is_zero_at_capture` (edge: clock equal to start returns 0.0)
    - `test_get_uptime_seconds_clamps_to_zero_when_clock_is_behind_start` (error case: clock below start returns 0.0, never negative)
    - `test_uptime_response_rejects_negative_uptime` (error case: `ValidationError`)
    - `test_uptime_response_rejects_naive_started_at` (error case: `ValidationError` for a datetime with no tzinfo)
    - `test_uptime_response_serialises_started_at_in_utc_with_z` (happy path: `model_dump(mode="json")["started_at"]` ends with `Z`)
  - Cases added to `test_main_unit.py`: `test_create_app_registers_uptime_route` (`/api/uptime` in custom paths), `test_create_app_captures_process_start_per_instance` (`app.state.process_start` is a `ProcessStart` with an aware UTC `started_at`).
- Integration tests: full HTTP cycle through the `client` fixture or a fresh `TestClient(create_app())`; no database needed.
  - Directory: backend/tests/integration/
  - File: `test_uptime_integration.py`
  - Cases:
    - `test_get_uptime_returns_200_with_uptime_and_started_at` (criteria 1, 4: status 200, body keys exactly `{"uptime_seconds", "started_at"}`, `uptime_seconds` is an int or float and >= 0)
    - `test_get_uptime_seconds_increases_between_calls_a_second_apart` (criterion 2: monkeypatch `uptime_service.monotonic` to return start+1.0 then start+2.0 on a fresh app, assert the second value is greater than the first and the difference is 1.0; no sleep)
    - `test_get_uptime_started_at_is_identical_across_calls` (criterion 3: two calls return the same `started_at` string, and it equals `app.state.process_start.started_at` rendered by the schema)
    - `test_get_uptime_started_at_is_utc_with_explicit_offset` (criterion 3: string ends with `Z`, `datetime.fromisoformat` gives an aware value with `utcoffset() == timedelta(0)`)
    - `test_get_uptime_answers_when_database_url_is_unset` (no database dependency, mirrors the version test)
    - `test_post_uptime_returns_405_method_not_allowed` (error case)
- E2E tests: none for this feature (E2E is ENABLED, but no criterion needs navigation or interaction through the UI; this item has no frontend). Per `testing_standards.md`, the fourth tier question was asked per criterion, see the table below.
  - Directory: e2e/tests/
  - File: none created (would be `TEST-07_uptime_endpoint.spec.ts`)
- UAT scenarios: one scenario per criterion plus an edge-case scenario (POST returns 405), written against the HTTP response (curl), not the UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked over a real HTTP cycle |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Unit + Integration | Verifying it needs no navigation or interaction: it is clock arithmetic in the service (unit) and its value across two router calls (integration) |
| 3 | `started_at` captured once at startup, not recomputed per request, UTC with explicit offset | Integration + Unit | Verifying it needs no navigation or interaction: it is app-instance state and serialisation, checked across two router calls and on `create_app()` |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit + Integration | Verifying it needs no navigation or interaction: it is a schema definition, checked by validating the model directly and by the router's response matching it |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body has exactly uptime_seconds and started_at |
| 2 | non-negative and increasing | covered at Unit + Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice a second apart, Then both uptime_seconds are >= 0 and the second is larger |
| 3 | started_at fixed at startup, UTC with offset | covered at Integration + Unit, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then started_at is identical and ends in Z; When the backend restarts, Then started_at changes and uptime_seconds resets |
| 4 | Pydantic schema in backend/app/schemas/ | covered at Unit + Integration, see Criterion coverage | Given the source tree, When I open backend/app/schemas/uptime.py, Then UptimeResponse defines uptime_seconds and started_at |

## Manual verification plan
This feature has no UI: every criterion is verified against the live HTTP response, read with curl from a terminal on the host. The backend is published on host port 8010 (`docker-compose.yml`).

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the stack is up (`docker compose up -d --build` from the repository root), and `curl -s http://localhost:8010/api/version` answers.
1. In a terminal, run `curl -s -i http://localhost:8010/api/uptime` → the status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body printed below the headers → it is one JSON object with exactly two keys, `uptime_seconds` (a number such as `42.81733`) and `started_at` (a string such as `2026-11-09T16:15:34.123456Z`), and nothing else.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` → note the `uptime_seconds` value, call it A; it is 0 or greater.
2. Wait about one second, then run `curl -s http://localhost:8010/api/uptime` again → note `uptime_seconds`, call it B; B is greater than A, by roughly 1 (plus however long you took).
3. Optional automated check: run `uv run --directory backend pytest -q tests/unit/test_uptime_unit.py tests/integration/test_uptime_integration.py` → the summary line reports `0 failed`.

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, in UTC with an explicit offset
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → `started_at` is the same string both times, character for character, while `uptime_seconds` differs.
2. Look at the end of `started_at` → it ends in `Z` (the ISO 8601 zero-offset UTC designator), e.g. `...T16:15:34.123456Z`, and the time is close to when you last started the backend, expressed in UTC (not your local time zone).
3. Restart the backend: `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/version` answers again.
4. Run `curl -s http://localhost:8010/api/uptime` → `started_at` is now a later timestamp than in step 1, and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
This is a code property, not a UI behaviour; the observable check is the source file and the generated API document.
1. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`.
2. Run `curl -s http://localhost:8010/openapi.json` and find the `UptimeResponse` entry under `components.schemas` → it lists `uptime_seconds` and `started_at` as properties, and the `/api/uptime` GET operation's 200 response references it. Do not expect any particular `format` value on `started_at`; only the presence of both properties is checked here.
