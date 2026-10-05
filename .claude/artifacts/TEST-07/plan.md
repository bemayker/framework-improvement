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
Fresh plan, branched from current main (5727104). Five top-level tracker comments, zero threaded replies, read newest first; every one is recorded below with its source tag. No `[merged-since]` lines: n/a (fresh plan, branched from current main).

- Comment (tracker): "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/63 (branch feature/TEST-07-uptime-endpoint). Assisted run plan-feature-20261002T104241Z: draft plan PR for review. ..." → not acted on because it is a framework link notice, not feedback. PR 63 merged and its branch was deleted; main at 5727104 holds no uptime code and no TEST-07 plan (`backend/app/routers/` has only `echo.py`, `health.py`, `notes.py`, `version.py`). The `uptime*.pyc` files under `__pycache__/` are untracked bytecode left by earlier runs, not source, and are ignored.
- Comment (tracker): "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/57 ... Assisted run plan-feature-20260920T213246Z: draft plan PR for review. ..." → not acted on because it is a framework link notice from an earlier run.
- Comment (tracker): "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/39 ... Autonomous delivery run deliver-20260914T095103Z ... One recorded residual, not a defect today: started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. ..." → Addressed by: `started_at` is captured in the existing `lifespan` startup hook of `backend/app/main.py` and stored on `app.state`, never at module import, so it is tied to the application's startup event (criterion 3's wording) rather than to whenever a module happens to be imported. The multi-worker case is unchanged in kind and stays out of scope: with `--workers N` each worker runs its own lifespan and reports its own process's uptime, which is a true answer for the process that served the call; the Dockerfile runs one process (`uvicorn app.main:create_app --factory`, no `--workers`). Its OpenAPI observation is also taken on board: the plan does not claim the generated schema shows `format: date-time` for `started_at` (see Backend Plan and the Manual verification plan), and the manual steps describe what Swagger really shows. The "held behind FEAT-1" remark is historical; FEAT-1's router is not on main today, see `shared_risks.md`.
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Addressed by: precondition verified satisfied on current main (no uptime router, schema, service or tests exist), so this plan creates the feature from nothing. This is `/plan-feature`, not `/deliver`.
- Comment (tracker): "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/26 ... Autonomous delivery run deliver-20260903T125824Z ..." → not acted on because it is a framework link notice from an earlier run.

Assumptions (no comment settles these; recorded instead of blocking, `user_story_alignment.md` Section 4):
- "Explicit offset" is written as `+00:00` (Python's `datetime.isoformat()` on an aware UTC value), not the `Z` designator Pydantic emits by default, because `+00:00` is unambiguously an offset. Criterion 1's `<ISO 8601 UTC>` is satisfied by both; `+00:00` satisfies criterion 3 on any reading.
- `uptime_seconds` is a float measured with `time.monotonic()` against a monotonic reading taken at the same startup moment as `started_at`, so it never goes backwards if the wall clock is adjusted. It is returned unrounded; no precision was requested.
- "Startup" means the FastAPI lifespan startup of the app instance serving the request. "The process" in the feature text is that app's process; per-worker behaviour is noted above and not designed for.

## Plan Overview
One backend-only GET endpoint, `GET /api/uptime`, in the TEST-02/TEST-05 shape: a router `backend/app/routers/uptime.py`, a response schema `UptimeResponse` in `backend/app/schemas/uptime.py`, and a small service `backend/app/services/uptime_service.py` holding the two pieces of logic (capturing the start moment, computing elapsed seconds). `backend/app/main.py` gains one router registration and one line in the existing `lifespan` that captures the start moment onto `app.state`. Unit tests for the service, schema and handler, integration tests through the HTTP cycle, one added route-registration test, and the UAT artifacts. No database, no repository, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this feature renders nothing).

## Backend Plan
- Endpoints: `GET /api/uptime`, `response_model=UptimeResponse`, returns 200.
- Service (`backend/app/services/uptime_service.py`):
  - `@dataclass(frozen=True) class ProcessStart`: `started_at: datetime` (aware, UTC) and `monotonic_start: float`.
  - `capture_process_start() -> ProcessStart`: reads `datetime.now(timezone.utc)` and `time.monotonic()` once each and returns them together.
  - `get_uptime_seconds(process_start: ProcessStart) -> float`: returns `time.monotonic() - process_start.monotonic_start`. Clocks are read through the module (`time.monotonic`, `datetime`) so unit tests monkeypatch them; no clock is injected through a parameter the router must pass.
  - Module docstring states why the start moment is captured in `lifespan` and not at import (the 2026-09-14 residual).
- Startup capture (`backend/app/main.py`): first statement of `lifespan` is `app.state.process_start = uptime_service.capture_process_start()`, before the existing `DATABASE_URL` branch, so it runs exactly once per app startup and is independent of the database. The `lifespan` docstring gains one sentence for it. Nothing else in `lifespan` or `create_app()` changes besides the router registration.
- Router (`backend/app/routers/uptime.py`): `router = APIRouter(prefix="/api", tags=["uptime"])`; handler `get_uptime(request: Request) -> UptimeResponse` reads `request.app.state.process_start` and returns `UptimeResponse(uptime_seconds=uptime_service.get_uptime_seconds(process_start), started_at=process_start.started_at)`. No per-request time capture of `started_at` (criterion 3). No try/except: lifespan always runs under uvicorn and under the shared `client` fixture (`with TestClient(...)`), so a missing `process_start` is a wiring defect that should fail loudly.
- Schema (`backend/app/schemas/uptime.py`): `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus a `@field_serializer("started_at")` returning `value.astimezone(timezone.utc).isoformat()` so the wire value always ends in `+00:00` (criteria 1, 3, 4). Known and accepted: Pydantic derives the serialisation-mode OpenAPI schema from the serializer's `-> str` annotation, so `/docs` shows `started_at` as a plain `string`; no criterion concerns the OpenAPI document, and the manual steps say so.
- Repository layer: none (no persistence).
- Migrations: none.
- Registration: `backend/app/main.py` imports `from app.routers.uptime import router as uptime_router` and `from app.services import uptime_service`, adds `app.include_router(uptime_router)` after `echo_router`, and the module docstring gains a clause naming TEST-07. CORS `allow_methods` already includes GET.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no parameters, no body.
- Response 200: `UptimeResponse`, for example

  `{"uptime_seconds": 12.503417, "started_at": "2026-10-05T09:14:02.118734+00:00"}`

  `uptime_seconds` is a JSON number, at least 0. `started_at` is an ISO 8601 string with a `+00:00` offset and is identical on every call until the process restarts.
- Response 405: any non-GET method (FastAPI default; the router's error case, as in TEST-05 and TEST-06).

## Technology Selection
- Start-time capture hook: chose FastAPI's existing `lifespan` context manager in `backend/app/main.py` over a module-level constant captured at import or a deprecated `@app.on_event("startup")`, because lifespan is the framework's startup event already in use, and import time is only coincidentally process start (2026-09-14 tracker comment).
- Elapsed-time clock: chose the stdlib `time.monotonic()` over subtracting two `datetime.now()` wall-clock readings, because a monotonic clock cannot go backwards on an NTP or manual clock change, which is what guarantees criterion 2's "non-negative" and "increases".
- UTC timestamp: chose the stdlib `datetime.now(timezone.utc)` and `datetime.isoformat()` over a date library (none needed; no new dependency).
- Response schema `UptimeResponse`: chose a Pydantic `BaseModel` with the installed `pydantic`'s `AwareDatetime` and `Field(ge=0)` over a bare `dict` or hand-written checks, because criterion 4 names a Pydantic schema and those constraints reject a naive datetime or a negative number declaratively.
- `+00:00` serialisation: chose Pydantic's own `field_serializer` over a custom JSON encoder or response class, because it is one decorated method on the schema; no stdlib or native alternative changes Pydantic's default `Z` output.
- Uptime service module: no stdlib call or installed dependency is "process uptime since app startup", so a ~20-line service is built here on `time` and `datetime`.
- Uptime router module: no alternative replaces a route definition; built on the installed FastAPI `APIRouter`.
- New dependencies: none. `fastapi` and `pydantic` (2.13.4 in `backend/uv.lock`) are already installed, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/services/uptime_service.py: `ProcessStart` dataclass, `capture_process_start()` (one UTC wall-clock reading plus one monotonic reading) and `get_uptime_seconds(process_start)`.
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema, `uptime_seconds: float = Field(ge=0)`, `started_at: AwareDatetime`, `field_serializer` emitting `+00:00` ISO 8601.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `request.app.state.process_start` and returning `UptimeResponse`.
- [B] backend/tests/unit/test_uptime_service_unit.py: service unit tests with monkeypatched clocks: capture returns an aware UTC datetime and the monotonic reading; uptime equals the monotonic delta (a fake clock advanced by 1.0 gives 1.0 more); zero elapsed gives 0.0 (edge); capture reads the wall clock exactly once.
- [B] backend/tests/unit/test_uptime_unit.py: schema and handler unit tests: `UptimeResponse` JSON dump has exactly the two keys and `started_at` ends in `+00:00`; a non-UTC aware input is serialised converted to UTC; a naive `started_at` and a negative `uptime_seconds` each raise `ValidationError` (error cases); `get_uptime` called with a stub request whose `app.state.process_start` is fixed returns that exact `started_at`.
- [B] backend/tests/integration/test_uptime_integration.py: full HTTP cycle: 200 with exactly `uptime_seconds` (number, >= 0) and `started_at` (parses with `datetime.fromisoformat`, `utcoffset()` is zero, string ends `+00:00`); two calls separated by a short real wait return a strictly larger `uptime_seconds` and an identical `started_at`; a fresh `create_app()` entered with `TestClient` reports a `started_at` between timestamps taken just before and just after entering the context, and still the same value on a later request; POST returns 405.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (restart resets `started_at` and `uptime_seconds`).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `uptime_router` and `uptime_service`; first line of `lifespan` sets `app.state.process_start = uptime_service.capture_process_start()`; `app.include_router(uptime_router)` after the echo router; docstring clauses naming TEST-07.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` asserting `/api/uptime` is among the custom routes, matching the existing version/health/echo registration tests.

No dependency changes, so no lockfile entry (`backend/uv.lock` and `package-lock.json` are untouched). No `[Docs]` entries: the feature adds one endpoint and changes no project structure, run configuration, dependencies or test infrastructure, and neither `README.md` nor `docs/DEVELOPMENT.md` enumerates endpoints, so build-feature Section 15's condition is not met. No E2E spec file: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: the uptime service with monkeypatched `time.monotonic` and `datetime` (happy path, zero-elapsed edge, single-read check), the `UptimeResponse` schema (serialisation, UTC conversion, naive-datetime and negative-number errors) and the `get_uptime` handler called as a plain function with a stub request, plus the route-registration assertion. Names follow `test_{method_or_action}_{scenario}_{expected_outcome}` (`testing_standards.md` Section 3).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py → `test_uptime_service_unit.py` and `test_uptime_unit.py`; registration test added to the existing `test_main_unit.py`
- Integration tests: the router through the real request/response cycle with the session-scoped `client` fixture in `backend/tests/conftest.py` (which enters `TestClient` as a context manager, so `lifespan` runs), plus one test on a fresh `create_app()` for the startup-capture window. No database is touched, so none of the database fixtures are used. The increase check uses a short real wait (tens of milliseconds) rather than a one-second sleep: monotonic resolution makes any positive gap observable, and the exact one-second step is pinned deterministically by the unit test's fake clock (`testing_standards.md` Section 1.3's no-hardcoded-waits spirit, applied to keep the suite fast).
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py → `test_uptime_integration.py`
- E2E tests: enabled per CLAUDE.md but not warranted: the feature has no UI, and no acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion). An E2E test calling the API directly is a router integration test (`testing_standards.md` Section 5), which the integration tier already covers.
  - Directory: e2e/tests/ (not used)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the restart edge case, and the manual UAT script expanded from the Manual verification plan.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | `uptime_seconds` is non-negative and increases between two calls | Integration | verifying it needs no navigation or interaction: two HTTP calls compared; the exact one-second step is also pinned at Unit with a fake monotonic clock |
| 3 | `started_at` captured once at startup, UTC with explicit offset | Integration | verifying it needs no navigation or interaction: the startup window and the unchanged value across calls are HTTP observations; the `+00:00` serialisation is also pinned at Unit |
| 4 | Response body is a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a structural property, asserted by the unit tests on `UptimeResponse` and the handler's return type, and by the reviewer against the diff |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `GET /api/uptime`, Then the status is 200 and the body has exactly a numeric `uptime_seconds` and a string `started_at` |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `GET /api/uptime` twice about one second apart, Then both `uptime_seconds` values are at least 0 and the second is larger by roughly one |
| 3 | `started_at` captured once at startup, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `GET /api/uptime` several times, Then `started_at` is identical each time and ends in `+00:00`; edge case: after the backend restarts, `started_at` is later and `uptime_seconds` is small again |
| 4 | Response body is a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When a reader opens the OpenAPI docs for `GET /api/uptime`, Then the 200 response is documented as the `UptimeResponse` schema with `uptime_seconds` and `started_at` |

## Manual verification plan
This feature has no screen in the app. Every check runs against the backend directly, in the browser's address bar, in FastAPI's interactive docs (Swagger UI) and with `docker compose`.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the stack is up (`docker compose up -d --build` at the repository root) and the backend answers on http://localhost:8010 (opening http://localhost:8010/api/version shows a `version` value).
1. In a browser, open `http://localhost:8010/api/uptime` → the page shows a JSON object with exactly two keys, for example `{"uptime_seconds": 42.81, "started_at": "2026-10-05T09:14:02.118734+00:00"}`; `uptime_seconds` is a bare number (no quotes) and `started_at` is a quoted date-time.
2. In a terminal run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
3. Open `http://localhost:8010/docs`, expand `GET /api/uptime`, click "Try it out" then "Execute" → "Server response" shows Code `200` and a body with the same two keys.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/api/uptime` and write down `uptime_seconds` (for example `42.81`) → it is 0 or greater, never negative.
2. Wait about one second, then reload the page → `uptime_seconds` is larger than the value written down, by roughly the time waited (for example `43.86`).
3. In a terminal run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` → the second line's `uptime_seconds` exceeds the first line's by about 1.

### Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/api/uptime` and copy the full `started_at` value → it ends in `+00:00` (not `Z`, not a local offset such as `+02:00`, and not missing an offset).
2. Reload the page three times → `started_at` is character-for-character identical every time while `uptime_seconds` keeps growing (it is not the current time of each request).
3. Check consistency: `started_at` plus `uptime_seconds` is approximately the current UTC time (run `date -u` in a terminal to compare).
4. In a terminal run `docker compose restart backend`, wait until `http://localhost:8010/api/version` answers again, then open `http://localhost:8010/api/uptime` → `started_at` is now a later time than the value copied in step 1, still ending in `+00:00`, and `uptime_seconds` is small (a few seconds), showing the restart.

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs` and expand `GET /api/uptime` → under Responses, `200` shows an example value with `uptime_seconds` and `started_at`, and its Schema tab names `UptimeResponse`.
2. Scroll to the "Schemas" section at the bottom and expand `UptimeResponse` → it lists two required properties: `uptime_seconds` (number, minimum 0) and `started_at` (string). Swagger shows `started_at` as a plain string without a `date-time` format; that is expected (the `+00:00` serializer determines the documented type) and is not a defect against any criterion.
3. Not verifiable further through a UI: the observable check is the code, where `backend/app/schemas/uptime.py` defines `class UptimeResponse(BaseModel)` and `backend/app/routers/uptime.py` returns `UptimeResponse(...)` with no dict literal.
