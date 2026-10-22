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
- [ ] 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). Built and merged in measured run 2 by /deliver (PR #26, squash ffbfc12 on main). ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Addressed by: confirmed against the code rather than the comment. `backend/app/routers/` holds only `echo.py`, `health.py`, `notes.py` and `version.py`, and `backend/app/main.py` registers no uptime router, so the revert is in place (a later framework comment records it as 0ac6818, PR #29) and this plan builds every file from scratch. The `/deliver` hold no longer applies; this is an assisted `/plan-feature` run in any case.
- Comment (tracker): prior build's handover note, "started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. If the deployment ever gains workers, each child would capture its own value and uptime_seconds would stop being monotonic across calls." → Addressed by: the capture moves out of module import into the app's `lifespan` startup, stored on `app.state` per application instance, so it is tied to the application's own startup event rather than to whenever `app.main` happens to be imported (it is imported once for the module-level `app = create_app()` and again by uvicorn's `--factory` call). The multi-worker residual itself is not acted on: a per-worker value is inherent to any in-process uptime and AC 3 asks for "application startup", which is per process. The Dockerfile runs one process (`CMD ... uvicorn app.main:create_app --factory` with no `--workers`), so nothing changes today; the builder lists the residual in the PR's known improvements again.
- Comment (tracker): prior build's handover note, "The UAT script was telling testers something untrue ... It claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare {"type": "string"} — the field_serializer's -> str return annotation is what pydantic derives the serialisation-mode schema from, so AwareDatetime's format never reaches the document." → Addressed by: the schema uses `AwareDatetime` with **no** `field_serializer` (pydantic 2.13.4's default JSON serialisation of an aware UTC datetime already emits ISO 8601 with the `Z` zero-offset designator, see the assumption under Plan Overview), so the serialisation schema keeps `format: date-time`. A unit test asserts the generated OpenAPI document's `started_at` property, and the manual verification plan claims only what that test asserts.
- Comment (tracker), eight framework notices "mayker-dev: PR opened for TEST-07 — {url} ..." from earlier sandbox rounds → not acted on because they ask for nothing and the PRs they name predate the sandbox reset; this branch was created fresh from `origin/main` at 23a8605.

## Plan Overview
Backend only. One new read-only endpoint, `GET /api/uptime`, following TEST-05's (version) and TEST-06's (echo) router / schema / service split:

- `backend/app/services/uptime_service.py` captures a startup mark (wall-clock `started_at` in UTC plus a `time.monotonic()` reading) and computes uptime as monotonic now minus monotonic at startup. Monotonic time is used for the duration so a wall-clock adjustment (NTP step, DST, a manual clock change) can never make `uptime_seconds` negative or jump backwards; `started_at` is wall-clock because it is what an operator reads.
- `backend/app/main.py`'s existing `lifespan` captures the mark once, first thing at startup (before the optional schema initialisation, so a slow database never delays it), and stores it on `app.state.startup`.
- `backend/app/routers/uptime.py` reads `request.app.state.startup`, asks the service for the elapsed seconds, and returns `UptimeResponse`.
- `backend/app/schemas/uptime.py` defines `UptimeResponse` (`uptime_seconds: float` with `ge=0`, `started_at: AwareDatetime`).

No database, no frontend, no new dependency.

Assumptions (recorded per `user_story_alignment.md` Section 4):
- "Serialised in UTC with an explicit offset" is met by pydantic's default JSON form of an aware UTC datetime, `2026-10-22T16:52:51.123456Z`: `Z` is ISO 8601's designator for a zero UTC offset (RFC 3339 treats it as identical to `+00:00`), and it is what keeps `format: date-time` in the OpenAPI document (third comment above). The excluded case is a naive timestamp with no offset at all. Tests assert the value parses with `datetime.fromisoformat` to a datetime whose `utcoffset()` is zero, not only a string suffix.
- "Captured once at application startup" means once per application instance's lifespan startup. The test client fixture enters the lifespan (`with TestClient(app)` in `backend/tests/conftest.py`), so tests exercise the real capture path.
- `uptime_seconds` is a float (sub-second precision) rather than an integer: AC 1 says `<number>`, and an integer would make "increases between two calls a second apart" depend on rounding.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns `UptimeResponse` with 200. Router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, `@router.get("/uptime", response_model=UptimeResponse)`, handler `get_uptime(request: Request) -> UptimeResponse`. Registered in `create_app()` with `app.include_router(uptime_router)` after the echo router; module docstring of `main.py` gains "and TEST-07 the uptime router plus the startup mark".
- Service layer: `backend/app/services/uptime_service.py`.
  - `from time import monotonic` and `from datetime import UTC, datetime` imported at module level, so unit and integration tests patch `uptime_service.monotonic` (and `uptime_service.datetime` only if needed) the way `test_version_service_unit.py` patches `version_service.version`.
  - `@dataclass(frozen=True) class StartupMark` with `started_at: datetime` and `started_monotonic: float`.
  - `capture_startup() -> StartupMark`: returns `StartupMark(started_at=datetime.now(UTC), started_monotonic=monotonic())`.
  - `uptime_seconds(mark: StartupMark) -> float`: returns `monotonic() - mark.started_monotonic`. No clamping: a monotonic clock cannot go backwards within a process, and the schema's `ge=0` turns an impossible negative into a loud validation error rather than a silently corrected value.
- Startup wiring: in `main.py`'s `lifespan`, the first statement is `app.state.startup = capture_startup()`, before `get_settings()` and the DATABASE_URL branch. The lifespan docstring gains one sentence saying why it comes first.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no parameters, no body.
- Response: 200, `application/json`, schema `UptimeResponse`:
  ```json
  {"uptime_seconds": 12.345678, "started_at": "2026-10-22T16:52:51.123456Z"}
  ```
  `uptime_seconds`: number, `>= 0`, seconds since the application's lifespan startup. `started_at`: string, `format: date-time`, the UTC instant of that startup, identical on every call until the process restarts.

## Technology Selection
- Uptime duration (`uptime_service.uptime_seconds`): chose the standard library's `time.monotonic()` over wall-clock subtraction (`datetime.now() - started_at`) and over a third-party package such as `psutil` (process create time), because monotonic time cannot go backwards on a clock adjustment, which is what keeps AC 2's "non-negative and increases" true, and the standard library covers it in one call.
- Startup timestamp (`uptime_service.capture_startup`): chose the standard library's `datetime.now(UTC)` over any dependency; nothing else is needed.
- Holding the startup mark: chose FastAPI's own `app.state` set in the existing `lifespan` (an installed dependency's native feature) over a module-level global captured at import, because import time is not application startup (the prior build's recorded residual) and a module global is shared across the several `create_app()` instances the test suite makes.
- Serialising `started_at` in UTC: chose pydantic's built-in `AwareDatetime` type and default JSON serialisation (installed, pydantic 2.13.4) over a hand-written `field_serializer`, because the default already emits ISO 8601 with a zero-offset designator and a serializer's `-> str` annotation strips `format: date-time` from the OpenAPI document.
- Non-negativity: chose a pydantic `Field(ge=0)` constraint over a hand-written check in the handler.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, module docstring naming TEST-07.
- [B] backend/app/services/uptime_service.py: `StartupMark`, `capture_startup()`, `uptime_seconds(mark)`, using `datetime.now(UTC)` and `time.monotonic()`.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `request.app.state.startup` and returning `UptimeResponse`.
- [B] backend/tests/unit/test_uptime_unit.py: unit tests for the service and the schema, plus the OpenAPI declaration of the response (see Testing Strategy).
- [B] backend/tests/integration/test_uptime_integration.py: router tests through the shared `client` fixture (see Testing Strategy).
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-07/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `capture_startup` and the uptime router; `lifespan` sets `app.state.startup = capture_startup()` as its first statement; `create_app()` adds `app.include_router(uptime_router)`; docstrings updated.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route`, asserting `/api/uptime` is among the custom route paths, in the same shape as the echo test.

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints. No E2E spec is produced, because no criterion's covering tier is E2E (Criterion coverage below).

## Testing Strategy
- Unit tests: `backend/tests/unit/test_uptime_unit.py`, service and schema layer, no app lifespan needed except the OpenAPI test, which calls `create_app().openapi()` like `test_echo_unit.py` does.
  - `test_capture_startup_returns_aware_utc_started_at`: happy path, `started_at.utcoffset()` is `timedelta(0)` and `started_at.tzinfo` is not None.
  - `test_capture_startup_records_monotonic_reading`: with `uptime_service.monotonic` patched to return `100.0`, the mark's `started_monotonic` is `100.0`.
  - `test_uptime_seconds_returns_elapsed_monotonic_time`: mark at `100.0`, patched clock at `101.5`, returns `1.5`.
  - `test_uptime_seconds_is_zero_at_the_startup_instant`: edge case, patched clock equal to the mark, returns `0.0`.
  - `test_uptime_seconds_ignores_wall_clock_changes`: edge case, a mark whose `started_at` lies a day in the future, with `started_monotonic=100.0` and the patched monotonic clock at `102.0`, returns `2.0` (proves the duration never reads wall-clock time).
  - `test_uptime_response_serializes_started_at_as_utc_iso_8601`: `UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 22, 16, 52, 51, tzinfo=UTC)).model_dump(mode="json")` gives `started_at == "2026-10-22T16:52:51Z"`, and `datetime.fromisoformat` of it has a zero `utcoffset()`.
  - `test_uptime_response_with_negative_uptime_raises_validation_error`: error case, `uptime_seconds=-0.1` raises `ValidationError`.
  - `test_uptime_response_with_naive_started_at_raises_validation_error`: error case, a naive `datetime` raises `ValidationError` (AwareDatetime).
  - `test_openapi_declares_uptime_response_fields`: `create_app().openapi()`; the `/api/uptime` GET 200 response references `UptimeResponse`, whose `uptime_seconds` property is `type: number` and whose `started_at` property is `type: string` with `format: date-time`, and both are required. Look the component up by the name the `$ref` names rather than hardcoding a `-Output` suffix.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py`
  - Also: `backend/tests/unit/test_main_unit.py` gains `test_create_app_registers_uptime_route`.
- Integration tests: `backend/tests/integration/test_uptime_integration.py`, real HTTP request/response cycle through the session-scoped `client` fixture, which enters the app lifespan, so the real startup capture runs. No database needed.
  - `test_get_uptime_returns_200_with_uptime_and_started_at`: status 200, body keys exactly `{"uptime_seconds", "started_at"}`, `uptime_seconds` is an int or float and `>= 0`, `started_at` parses with `datetime.fromisoformat` to a zero-offset datetime.
  - `test_get_uptime_increases_between_calls_a_second_apart`: patch `app.services.uptime_service.monotonic` (pytest `monkeypatch`) to return the mark's reading plus 5.0, call, then plus 6.0, call; the second `uptime_seconds` is greater than the first by 1.0 (within `pytest.approx`). Deterministic, no real sleep. Read the mark from `client.app.state.startup`.
  - `test_get_uptime_returns_same_started_at_on_every_call`: two calls, with the monotonic clock patched forward between them, return byte-identical `started_at`, equal to `client.app.state.startup.started_at` serialised.
  - `test_get_uptime_started_at_is_not_later_than_request_time`: `started_at` parsed is `<=` `datetime.now(UTC)` taken after the call.
  - `test_post_uptime_returns_405`: error case, `POST /api/uptime` returns 405 (the route is GET-only).
  - Directory: `backend/tests/integration/`
- E2E tests: E2E Tests is ENABLED, but not warranted for this feature. No criterion requires navigation or interaction through the UI: the endpoint has no consumer in the frontend and the item adds none. So no spec is written (`testing_standards.md` Section 6, fourth question asked per criterion, and Section 4's E2E row is scoped to E2E-tier criteria).
  - Directory: `e2e/tests/`
  - File: none (would be `TEST-07_uptime_endpoint.spec.ts`)
- UAT scenarios: one scenario per criterion plus one edge case (a restart yields a new `started_at` and a small `uptime_seconds`), written in API terms like TEST-06's.
  - Directory: `e2e/uat/scenarios/` (`TEST-07_uptime_endpoint.feature`), manual script in `e2e/uat/scripts/` (`TEST-07_uptime_endpoint_uat_script.md`).

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | verifying it needs no navigation or interaction: it is a router request/response cycle with no UI consumer |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration (plus Unit for the service arithmetic and the `ge=0` constraint) | verifying it needs no navigation or interaction: it is a router behaviour over a patched monotonic clock |
| 3 | `started_at` captured once at startup, not recomputed per request, UTC with explicit offset | Integration (plus Unit for the serialised form) | verifying it needs no navigation or interaction: it is the lifespan capture and the schema's serialisation |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is the schema's declaration and the generated OpenAPI document |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body holds exactly `uptime_seconds` and `started_at` |
| 2 | non-negative, increases a second apart | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice a second apart, Then both values are >= 0 and the second exceeds the first by about 1 |
| 3 | captured once at startup, UTC with offset | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then `started_at` is identical and ends in the UTC designator; and When the backend restarts, Then `started_at` changes |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the OpenAPI document, When I read the /api/uptime 200 response, Then it references `UptimeResponse` with a number and a date-time string |

## Manual verification plan
<!--
  No UI consumes this endpoint, so every criterion is verified against the
  running backend with curl, the OpenAPI document and the test suite, as
  TEST-06's script was.
-->
Shared prerequisites for every block: Docker running; repository on `feature/TEST-07-uptime-endpoint`; from the repository root `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running on `http://localhost:8010` (the `8010:8010` mapping in `docker-compose.yml`); a terminal with `curl` and `python3`.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the shared prerequisites above.
1. Run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers.
2. Read the body printed by step 1 → it is one JSON object with exactly two keys, `uptime_seconds` (a number such as `42.137`, no quotes) and `started_at` (a quoted string such as `"2026-10-22T16:52:51.123456Z"`), and nothing else.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: the shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` → two JSON bodies are printed.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second is larger than the first by about 1 (between 1.0 and roughly 1.2, allowing for curl's own time).
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_unit.py tests/integration/test_uptime_integration.py` → the run reports `0 failed` for those two files.

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: the shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 2; curl -s http://localhost:8010/api/uptime` → the two `started_at` strings are character-for-character identical, while `uptime_seconds` grew by about 2.
2. Read the `started_at` value → it ends in `Z`, ISO 8601's zero-UTC-offset designator; it never ends without a designator (a naive time).
3. Run `python3 -c "from datetime import datetime; print(datetime.fromisoformat('PASTE_STARTED_AT_HERE').utcoffset())"`, replacing `PASTE_STARTED_AT_HERE` with the value from step 1 → it prints `0:00:00`.
4. Run `docker compose restart backend`, wait until `docker compose ps` shows it running again, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is now a later instant than in step 1, and `uptime_seconds` is small (a few seconds), showing a restart is distinguishable from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the shared prerequisites above.
1. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with `uptime_seconds: float` constrained `ge=0` and `started_at: AwareDatetime`, and no serializer method.
2. Open `backend/app/routers/uptime.py` → the route declares `response_model=UptimeResponse` and returns an `UptimeResponse(...)` instance, not a dict literal.
3. Run `curl -s http://localhost:8010/openapi.json` and find `paths`, `/api/uptime`, `get`, `responses`, `200` → its schema is a `$ref` to a `components.schemas` entry named for `UptimeResponse`; in that entry `uptime_seconds` is `"type": "number"`, `started_at` is `"type": "string"` with `"format": "date-time"`, and both are listed under `required`.
4. Run `uv run --directory backend pytest -q tests/unit/test_uptime_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py` → the run reports `0 failed` for those three files.
