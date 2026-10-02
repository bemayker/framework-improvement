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

## Re-Plan Feedback (if applicable)
Four tracker comments (0 threaded replies), newest first. None contradicts the description; all describe earlier builds whose code was reverted from main by PR #60, so `origin/main` (32170ac) carries no uptime code and this plan builds from nothing.
- Comment (tracker): "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/57 ... Assisted run plan-feature-20260920T213246Z: draft plan PR for review. When approved, move this item to "on hold" (Ready for Build) and dispatch /build-feature TEST-07." → Not acted on: a framework link comment for an earlier plan PR. That plan's code never reached main in a form that survives (PR #60 reverted TEST-07), so nothing is reused from it; the lifecycle instruction it carries is the main session's, not the plan's.
- Comment (tracker): "mayker-dev: PR opened for TEST-07 — .../pull/39 ... started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. If the deployment ever gains workers, each child would capture its own value and uptime_seconds would stop being monotonic across calls. ... the field_serializer's -> str return annotation is what pydantic derives the serialisation-mode schema from, so AwareDatetime's format never reaches the document. ... This item was held behind FEAT-1 ..." (abridged; full text in the dispatch) → Addressed by three decisions. (a) Capture point: the start instant is captured in the existing `lifespan` startup hook in `backend/app/main.py` and stored on `app.state`, not at module import (see Plan Overview, "Start-instant decision"). Under several workers every worker process would still have its own start, which is correct for "how long the process has been running" (the item's own wording) but means successive calls may land on different workers; the Dockerfile runs one process (`--factory`, no `--workers`), so this is recorded as a residual and a single-process assumption, not built around. (b) Monotonicity: `uptime_seconds` is computed from `time.monotonic()` deltas, not wall-clock subtraction, so within one process it can never go backwards or negative even if the system clock is adjusted. (c) OpenAPI: the generated schema will show `started_at` as a plain string; the plan does not chase `format: date-time`, and the manual verification plan and UAT script must not claim it. The FEAT-1 serialization note is carried into `shared_risks.md`.
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending ... Do not run /deliver against this item until that revert has merged." → Precondition satisfied: the revert for this run is PR #60 (36d8f0d), merged and an ancestor of current `origin/main` (32170ac); no uptime code exists in `backend/`. Nothing else to act on.
- Comment (tracker): "mayker-dev: PR opened for TEST-07 — .../pull/26 ... Autonomous delivery run deliver-20260903T125824Z ..." → Not acted on: a historical link comment for a build that was later reverted.
- Merged since the last plan: n/a (fresh plan on a branch created from current `origin/main`; no `[merged-since]` lines were passed).

## Plan Overview
Backend only. One read-only endpoint, `GET /api/uptime`, in the existing Router to Service layering (no repository, no database):

- A tiny service module, `backend/app/services/uptime_service.py`, owns a frozen `ProcessStart` value (the UTC wall-clock instant plus the `time.monotonic()` reading taken at the same moment), a `capture_process_start()` factory and a pure `compute_uptime_seconds(start, now_monotonic)` function. Clocks are injectable parameters with stdlib defaults so the unit tests need no sleeps.
- A schema module, `backend/app/schemas/uptime.py`, defines `UptimeResponse` (criterion 4).
- A router, `backend/app/routers/uptime.py`, reads the `ProcessStart` from `request.app.state` and returns the schema.
- `backend/app/main.py` captures the start in `lifespan` and registers the router.

**Start-instant decision (recorded per the PR #39 residual).** Three options were weighed: module import, the app factory, and `lifespan`. Chosen: the first statement of the existing `lifespan` context manager, `app.state.process_start = capture_process_start()`, before the database schema step so time spent initialising the schema counts as uptime. Why: `lifespan` is literally application startup (criterion 3's wording), it runs once per running app and never per request, it has no import-time side effect (importing `app.main` already builds a module-level `app`, and `uvicorn --factory` builds a second one, so an import-time or factory-time capture would be taken twice), and it gives each app instance its own value, which makes "captured at startup, not per request" testable by starting two apps. Not chosen: module import (the earlier builds' choice; shared across every app instance in a test session, so it cannot distinguish "per startup" from "per import"), and a cross-process shared value (would need a file, env var from a supervisor, or the database: out of scope under "keep every feature as small as possible"). Residual: under `uvicorn --workers N` each worker has its own start and consecutive calls may alternate between them; today the Dockerfile runs one process, so this is noted in the PR, not engineered for.

**Serialisation decision.** `started_at` is stored as an aware UTC `datetime` and serialised with `isoformat()`, which yields an explicit `+00:00` offset (for example `2026-10-02T10:42:41.123456+00:00`). Pydantic's default JSON form would emit a trailing `Z`; `Z` denotes UTC but criterion 3 asks for an explicit offset, so the assumption made is that `+00:00` is the unambiguous reading. `uptime_seconds` is a non-negative float in seconds (sub-second resolution, so two calls one second apart differ by about 1.0).

No frontend, no database, no external API, no new dependency.

## Infrastructure Scaffolding (scaffold feature only)
Not applicable: TEST-01 is the scaffold item and is done; `backend/`, `frontend/` and `e2e/` exist.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this feature renders no UI).

## Backend Plan
- Endpoints: `GET /api/uptime`, returns the process uptime and start instant. Router `APIRouter(prefix="/api", tags=["uptime"])`, matching the echo and version routers.
- Service layer: `backend/app/services/uptime_service.py`
  - `@dataclass(frozen=True) class ProcessStart: started_at: datetime; started_monotonic: float`
  - `def capture_process_start(wall_clock: Callable[[], datetime] = _utc_now, monotonic_clock: Callable[[], float] = time.monotonic) -> ProcessStart`, where `_utc_now()` returns `datetime.now(UTC)`. Raises `ValueError` if the wall clock returns a naive datetime; converts any aware value to UTC with `astimezone(UTC)`.
  - `def compute_uptime_seconds(start: ProcessStart, now_monotonic: float | None = None) -> float`: returns `max(0.0, now - start.started_monotonic)` with `now` defaulting to `time.monotonic()`. The clamp only guards a caller passing an earlier reading; a real monotonic delta is never negative.
- Router: `get_uptime(request: Request) -> UptimeResponse` reads `request.app.state.process_start`, calls `compute_uptime_seconds`, returns `UptimeResponse(uptime_seconds=..., started_at=start.started_at)`. No business logic beyond that call. The lifespan always sets the state under uvicorn and under `with TestClient(app)`; no fallback is added for an app whose lifespan never ran (the conftest `client` fixture and every new test enter the lifespan).
- `backend/app/main.py`: import the router and `capture_process_start`; first line inside `lifespan` stores the start on `app.state.process_start`; `app.include_router(uptime_router)` after the echo router; extend the module docstring's registration sentence with "and TEST-07 the uptime router".
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no path, query or body parameters.
- Response 200, `application/json`, schema `UptimeResponse`:
  - `uptime_seconds`: number, `>= 0` (pydantic `NonNegativeFloat`), seconds since the process start captured at startup.
  - `started_at`: string, ISO 8601 in UTC with explicit `+00:00` offset; identical on every call within one process.
  - Example: `{"uptime_seconds": 12.5, "started_at": "2026-10-02T10:42:41.123456+00:00"}`
- Errors: none defined by the criteria. A non-GET method gets FastAPI's standard 405.

## Technology Selection
- Uptime measurement (`uptime_service.py`): chose the standard library's `time.monotonic()` for the elapsed interval and `datetime.now(UTC)` for the reported start instant, over wall-clock subtraction (`datetime.now() - started_at`), because only a monotonic clock guarantees criterion 2's non-negative, non-decreasing value when the system clock is adjusted; no new dependency (process-start lookups such as `psutil` were not considered, because the stdlib covers the need).
- Start-instant storage: chose FastAPI's built-in `app.state` set inside the existing `lifespan` hook (installed dependency) over a module-level global or a new settings/registry module, because the framework already provides per-app startup state.
- Response schema (`schemas/uptime.py`): chose pydantic's built-in `NonNegativeFloat`, `AwareDatetime` and `field_serializer` (installed via FastAPI) over hand-written range checks and string formatting, because they declare the constraints on the model itself.
- Router (`routers/uptime.py`): no stdlib call, native platform feature or installed dependency replaces an endpoint, so it is built here on FastAPI's `APIRouter` like the existing routers.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/services/uptime_service.py: `ProcessStart` dataclass, `capture_process_start()` and `compute_uptime_seconds()` with injectable clocks
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema (`uptime_seconds: NonNegativeFloat`, `started_at: AwareDatetime` serialised as UTC `isoformat()` with `+00:00`)
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading the start from `request.app.state`
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for capture and uptime computation with fake clocks
- [B] backend/tests/unit/test_uptime_unit.py: unit tests for the `UptimeResponse` schema (serialisation, offset conversion, naive and negative rejection)
- [B] backend/tests/integration/test_uptime_integration.py: router tests through the real HTTP cycle (status, shape, increase between calls, stable `started_at`, per-startup capture, OpenAPI `$ref`, 405)
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: capture the process start on `app.state` in `lifespan`, import and register the uptime router, extend the docstring
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route`

No dependency changes, so no lockfile (`backend/uv.lock`) entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds one endpoint inside the existing `backend/app/` layering and changes no project structure, run configuration, dependency or test infrastructure, and neither document enumerates endpoints.

## Testing Strategy
- Unit tests: service (`compute_uptime_seconds`: happy path with fake readings; exactly +1.0 one fake second later; zero at the start instant; clamp to 0.0 for an earlier reading; `capture_process_start`: returns UTC, converts a `+02:00` wall clock to UTC, raises `ValueError` on a naive datetime) and schema (`UptimeResponse` JSON dump has exactly the two keys; `started_at` string ends in `+00:00` and round-trips via `datetime.fromisoformat`; a `+02:00` input is emitted as the equivalent UTC instant; naive datetime and negative uptime raise `ValidationError`). Plus the app-factory registration test.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`, `test_uptime_unit.py`)
- Integration tests: `GET /api/uptime` through `TestClient` with the lifespan entered (the shared session `client` fixture for the plain cases; a fresh `with TestClient(create_app())` for the per-startup case). The endpoint uses no database, so these tests need no `DATABASE_URL` (the lifespan logs a warning and skips schema setup when it is unset). The criterion 2 increase is asserted on two calls separated by a short real sleep (0.05 s) with a strict `>`; the full one-second spacing is pinned deterministically at unit level with fake clocks rather than by sleeping a second in the suite.
  - Directory: backend/tests/integration/
  - File: test_uptime_integration.py
- E2E tests: The E2E toggle is ENABLED, but no browser spec is warranted and none is planned: no criterion involves navigation or interaction through the UI (no page calls `/api/uptime`), and calling the API from Playwright would be a router integration test in the wrong tier (`testing_standards.md` Section 5). So there is no `[D]` entry and no `e2e/tests/TEST-07_*.spec.ts`.
  - Directory: e2e/tests/ (unused by this feature)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (the uptime is reported again after a restart with a new, later `started_at`); validated for well-formedness only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: it is a router's HTTP status and JSON shape, asserted through the real request/response cycle |
| 2 | `uptime_seconds` non-negative and increases between two calls a second apart | Integration + Unit | No UI involved: integration asserts `>= 0` and a strict increase across two real calls; unit pins the exact +1.0 for one second with fake monotonic readings, without sleeping |
| 3 | `started_at` captured once at startup, not per request, UTC with explicit offset | Integration + Unit | No UI involved: integration asserts two calls return the identical string ending `+00:00` and that a second app started later reports a later value; unit asserts UTC conversion and the `+00:00` serialisation |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | No UI involved: it is a code-structure property, asserted via the generated OpenAPI document (200 response is `$ref` to `UptimeResponse`) plus the schema's own unit tests |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/uptime, Then the status is 200 and the body has exactly `uptime_seconds` (a number) and `started_at` (an ISO 8601 string) |
| 2 | non-negative and increasing a second apart | covered at Integration + Unit, see Criterion coverage | Given the backend is running, When I request GET /api/uptime twice one second apart, Then both `uptime_seconds` values are at least 0 and the second exceeds the first by about 1 |
| 3 | `started_at` captured once at startup, UTC with explicit offset | covered at Integration + Unit, see Criterion coverage | Given the backend is running, When I request GET /api/uptime twice, Then `started_at` is identical both times and ends with `+00:00`; edge case: When the backend restarts, Then `started_at` is later and `uptime_seconds` is small again |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the API docs, When I inspect GET /api/uptime, Then its 200 response is the `UptimeResponse` schema defined in `backend/app/schemas/uptime.py` |

## Manual verification plan
No criterion is verifiable through the application UI: no frontend page calls `/api/uptime`. Every check reads the HTTP response in a terminal with `curl` (or the browser address bar on the API URL), plus the API docs page for criterion 4.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: Docker running; repository on branch `feature/TEST-07-uptime-endpoint`; from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows `backend` running; host port 8010 free; a terminal with `curl` and `python3`.
1. In the terminal run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json`.
2. Read the body of the same response → a JSON object with exactly two keys, for example `{"uptime_seconds": 37.204, "started_at": "2026-10-02T10:42:41.123456+00:00"}` (FastAPI prints it without spaces); `uptime_seconds` is an unquoted number and `started_at` is a quoted string.
3. Open `http://localhost:8010/api/uptime` in a browser address bar → the browser shows the same two-key JSON object.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: the backend from Criterion 1 is running.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` → two JSON bodies print one after the other.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second is larger than the first by roughly 1 (for example 41.02 then 42.03).
3. Immediately after `docker compose restart backend` and waiting for it to be running again, run `curl -s http://localhost:8010/api/uptime` → `uptime_seconds` is a small non-negative number (a few seconds), never negative.

### Criterion 3: `started_at` is captured once at startup, not per request, and serialised in UTC with an explicit offset
Prerequisites: the backend from Criterion 1 is running; note the time the container last started.
1. Run `curl -s http://localhost:8010/api/uptime` three times, a few seconds apart → the `started_at` string is character-for-character identical in all three responses while `uptime_seconds` grows.
2. Read the end of the `started_at` value → it ends with the explicit offset `+00:00` (not a bare time, not a local offset such as `+02:00`).
3. Compare `started_at` with the current UTC time from `date -u` → `started_at` is earlier than now, and now minus `started_at` approximately equals `uptime_seconds`.
4. Run `docker compose restart backend`, wait for it to be running, then `curl -s http://localhost:8010/api/uptime` → `started_at` has changed to a later instant (the restart time) and `uptime_seconds` has dropped back to a few seconds, which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend from Criterion 1 is running.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` → the 200 response's schema is named `UptimeResponse`.
2. In the Schemas section at the bottom of the docs page expand `UptimeResponse` → it lists `uptime_seconds` (number, minimum 0) and `started_at` (string). Do not expect a `date-time` format on `started_at`: the custom serialiser makes the documented type a plain string, and the wire value is checked in Criterion 3 instead.
3. Open `backend/app/schemas/uptime.py` in an editor → it defines `class UptimeResponse(BaseModel)` with the two fields, and `backend/app/routers/uptime.py` declares `response_model=UptimeResponse`.
