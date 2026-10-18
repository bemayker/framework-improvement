# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> **TEST-07: Uptime endpoint** (ClickUp task 123k99ctgcg). Status: to do. Priority: none. Labels: none.
>
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> ### What
>
> `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> ### Acceptance criteria
>
> 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
> 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
> 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
>
> ### Notes
>
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches the router registration in `main.py`, so it must not run concurrently with another backend item that does the same.

## Acceptance Criteria
- [ ] `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
<!-- First plan on this branch, on an item that carries tracker comments: nine top-level comments, no threaded replies. Two carry content and are listed first; the seven framework-written PR-link comments are recorded on the last comment line. No PR review comments exist yet. -->
- Comment (tracker): "mayker-dev: PR opened for TEST-07 (https://github.com/bemayker/framework-improvement/pull/39) ... Autonomous delivery run deliver-20260914T095103Z ... The UAT script was telling testers something untrue and it is now fixed. It claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare string type, because the return annotation str on the field_serializer is what pydantic derives the serialisation-mode schema from, so the AwareDatetime format never reaches the document. ... One recorded residual, not a defect today: started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. If the deployment ever gains workers, each child would capture its own value and uptime_seconds would stop being monotonic across calls." (quoted as relayed; the JSON fragment of the schema probe is reworded as a bare string type) - Addressed by: two changes. (a) This plan also emits the explicit `+00:00` offset through a json-mode `field_serializer` (Assumption A2), so the API Contract, Testing Strategy and Manual verification plan all state that `/openapi.json` documents `started_at` as a plain string with no `date-time` format, and no test, Gherkin sketch or verification step asserts a format; the UAT script expanded from this plan cannot repeat the false claim. (b) The start mark is captured inside `create_app()` and stored on `app.state`, not at module import (Assumption A1), so it belongs to the application instance the server starts. The multi-worker residual is not removed by that, and is recorded as Assumption A4: with workers each process reports its own uptime, which is what the What asks for (how long the process has been running), and monotonicity across calls holds per process only. This plan changes no deployment; the Dockerfile stays a single uvicorn process.
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). Built and merged in measured run 2 by /deliver (PR #26, squash ffbfc12 on main). ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." - Addressed by: not acted on, because its precondition is met. The revert merged long ago (recorded later as 0ac6818, PR #29), the sandbox was reset again for the 0.3.410 release run (c21ade6), and current main holds no uptime code: `backend/app/routers/` has only `echo.py`, `health.py`, `notes.py` and `version.py`, and `create_app()` registers only those four. This plan builds the feature from scratch.
- Comment (tracker): seven framework-written "PR opened for TEST-07" link comments from earlier plan and deliver runs (PRs 191, 168, 144, 90, 63, 57, 26) - Addressed by: not acted on, because they link earlier PRs and ask nothing of the plan.
- Merged since the last plan: n/a (fresh plan, branched from current main; no merged-since lines).

## Plan Overview
Backend-only. Add one read-only endpoint, `GET /api/uptime`, that reports when the running application started and how many seconds have elapsed since. Layers touched, following the sibling `version` router shape (router prefix `/api`, `response_model` from a schema in `backend/app/schemas/`, logic in a service module):
- a schema module `backend/app/schemas/uptime.py` (`UptimeResponse`),
- a service module `backend/app/services/uptime_service.py` (capture the start mark, compute elapsed seconds; this is real clock logic, so unlike TEST-06 a service layer is warranted per `coding_standards.md` Section 2.2: no business logic in the router),
- a router `backend/app/routers/uptime.py`,
- `backend/app/main.py`: `create_app()` captures the start mark once onto `app.state` and registers the router.
No database, no repository, no frontend, no external API, no new dependency.

Assumptions (recorded per `user_story_alignment.md` Section 4, no blocking question):
- A1, when application startup is: `create_app()` is the factory uvicorn calls once at server start (the Dockerfile runs `uvicorn app.main:create_app --factory`), so the start mark is captured there, stored as `app.state.uptime_start`, and the handler only reads it from `request.app.state`; it never recomputes it. Not module import (the tracker comment residual), and not the lifespan hook, because a `TestClient` used without a context manager skips the lifespan and the handler would then read a missing attribute. Each `create_app()` call gets its own mark, which is what lets a test prove capture-once on a fresh app.
- A2, explicit offset: Pydantic 2 serialises a UTC datetime with a trailing `Z`. `Z` is the ISO 8601 UTC designator, but the criterion asks for an explicit offset, so `started_at` is emitted as `+00:00` (for example `2026-10-19T09:15:03.123456+00:00`) by a json-mode `field_serializer` returning `value.astimezone(timezone.utc).isoformat()`. Accepted consequence: the OpenAPI document shows `started_at` as a plain string (tracker comment above).
- A3, the number: `uptime_seconds` is a float of fractional seconds, not rounded, computed as the difference of two `time.monotonic()` readings so a wall-clock adjustment cannot make it shrink or go negative. `started_at` is the wall-clock moment `datetime.now(timezone.utc)` read at the same capture. Non-negativity is guaranteed twice: the service clamps with `max(0.0, ...)` and the schema declares `Field(ge=0)`.
- A4, per-process scope: each server process has its own application instance and therefore its own start mark. Behind several workers, two calls may land on different processes; that residual is recorded, not designed for, because the deployment is a single process and the criteria name no multi-worker behaviour.
- A5, methods and extras: only GET is registered (other methods get the default 405); the existing CORS middleware already allows GET, so no CORS change. No human-readable duration, no rounding and no extra fields are added (`user_story_alignment.md` Section 3).

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/uptime`, no query parameters and no body. Returns 200 with an `UptimeResponse` body holding `uptime_seconds` (seconds since the start mark, a non-negative float) and `started_at` (the start mark wall-clock time, UTC, serialised with `+00:00`).
- Schemas (`backend/app/schemas/uptime.py`): `UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime` (a naive datetime is rejected at validation), plus `@field_serializer("started_at", when_used="json")` returning the value converted to UTC as `isoformat()`, so the JSON string always ends in `+00:00`. Module and class docstrings name TEST-07, as `schemas/version.py` does for TEST-05.
- Service layer (`backend/app/services/uptime_service.py`): a frozen dataclass `StartMark` with `started_at: datetime` (aware, UTC) and `monotonic_start: float`; `capture_start(wall_clock=..., monotonic_clock=...) -> StartMark`, defaulting to `datetime.now(timezone.utc)` and `time.monotonic`, normalising the wall-clock value to UTC and raising `ValueError` for a naive one; `elapsed_seconds(mark, monotonic_clock=time.monotonic) -> float` returning `max(0.0, monotonic_clock() - mark.monotonic_start)`. The clocks are injectable parameters so unit tests need no sleeping and no monkeypatching of the stdlib.
- Router (`backend/app/routers/uptime.py`): `router = APIRouter(prefix="/api", tags=["uptime"])`; one handler `get_uptime(request: Request) -> UptimeResponse`, decorated `@router.get("/uptime", response_model=UptimeResponse)`, reading `mark = request.app.state.uptime_start` and returning `UptimeResponse(uptime_seconds=uptime_service.elapsed_seconds(mark), started_at=mark.started_at)`. No clock call in the router.
- App factory (`backend/app/main.py`): in `create_app()`, set `app.state.uptime_start = uptime_service.capture_start()` right after the `FastAPI(...)` instance is built, import `router as uptime_router` from `app.routers.uptime` beside the four existing router imports, and add `app.include_router(uptime_router)` after the existing `include_router` calls. Add TEST-07 the uptime router and its start mark to the module docstring line that lists which feature registers what. Nothing else in the factory changes (no lifespan, CORS or settings change).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: none; no query string, no body.
- Response (200): `UptimeResponse`, a JSON object with exactly two fields: `uptime_seconds` (JSON number, at least 0, fractional) and `started_at` (JSON string, ISO 8601 with an explicit `+00:00` offset). `started_at` is identical on every call to the same running process; `uptime_seconds` grows between calls. Example:
```json
{"uptime_seconds": 42.517, "started_at": "2026-10-19T09:15:03.123456+00:00"}
```
- OpenAPI: `/openapi.json` documents `UptimeResponse` with `uptime_seconds` as a number and `started_at` as a plain string. It carries no `date-time` format, because the json-mode serializer return type is what the serialisation schema is derived from (tracker comment, Re-Plan Feedback). Nothing in this contract, its tests or its verification asserts a format.
- Response (405): any method other than GET, the framework default.
- No error response is defined: the endpoint takes no input and reads no external resource.

## Technology Selection
- Start time and elapsed time: chose the standard library, `time.monotonic()` for the elapsed seconds and `datetime.now(timezone.utc)` for `started_at`, over a process-start reading through `psutil` (not installed) or parsing `/proc/self/stat`, because the stdlib covers it in a few lines and the criterion names application startup, which is the moment `create_app()` runs.
- `started_at` with an explicit offset: chose a Pydantic json-mode `field_serializer` calling stdlib `datetime.isoformat()` on the installed Pydantic over a custom JSON encoder or a hand-formatted string field, because the default Pydantic output uses `Z` and a string field would drop the `AwareDatetime` validation that rejects a naive value.
- `UptimeResponse` body: chose a Pydantic `BaseModel` (installed) over a bare dict returned from the router, because criterion 4 requires a schema in `backend/app/schemas/`.
- Holding the start mark: chose the installed FastAPI `app.state` over a module-level global, because a global is set at import time (the residual the tracker comment records) and is shared across app instances, so tests could not prove capture-once on a fresh app.
- Uptime router and service modules: no stdlib call, native platform feature or installed dependency covers a project route, so they are built here on the installed FastAPI `APIRouter`, the same as the sibling routers.
- No new dependency is added; `backend/pyproject.toml` and `backend/uv.lock` do not change.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` (`uptime_seconds` float at least 0, `started_at` AwareDatetime serialised with `+00:00`)
- [B] backend/app/services/uptime_service.py: `StartMark`, `capture_start()` and `elapsed_seconds()` with injectable clocks
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router returning `UptimeResponse` from the start mark on `app.state`
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests of `capture_start()` and `elapsed_seconds()` with fake clocks
- [B] backend/tests/unit/test_uptime_unit.py: unit tests of `UptimeResponse` (serialisation, validation) and of the route declaration and the start mark set by `create_app()`
- [B] backend/tests/integration/test_uptime_integration.py: router integration tests through the HTTP cycle (200 body shape, UTC offset, growth across two calls a second apart, stable `started_at`, 405 on POST)
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus edge cases (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: capture the start mark onto `app.state.uptime_start` in `create_app()`, import and register the uptime router; docstring names TEST-07
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` asserting `/api/uptime` is among the custom routes, in the existing pattern

No E2E spec is produced: no criterion needs navigation or interaction through the UI (no frontend consumes this endpoint), so every criterion is covered at unit or integration tier per `### Criterion coverage`, and the E2E phase has no file to write.
No lockfile changes: the feature adds no dependency, so neither `backend/uv.lock` nor `frontend/package-lock.json` is touched.
No documentation changes: `README.md` and `docs/DEVELOPMENT.md` need no edit, because the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure (build-feature Section 15 condition not met).

## Testing Strategy
- Unit tests: the service, the schema and the route declaration, in isolation with no HTTP cycle, no database and no sleeping. Test names follow `test_{action}_{scenario}_{expected}` (`testing_standards.md` Section 3).
  - `uptime_service` (`test_uptime_service_unit.py`): `capture_start` with an injected aware UTC wall clock and a monotonic clock returns a `StartMark` holding both values (happy path); an injected `+02:00` aware datetime is normalised to the same instant with a zero UTC offset (edge); an injected naive datetime raises `ValueError` (error). `elapsed_seconds` with a fake monotonic clock at 100.0 then 105.5 returns 5.5 (happy); a clock equal to the mark returns 0.0 (edge, the non-negative floor); a clock earlier than the mark returns 0.0, never a negative number (error, the clamp); a fake clock advanced by 1.0 between two calls yields a second value exactly 1.0 greater (criterion 2 at unit level); calling `elapsed_seconds` twice leaves `mark.started_at` unchanged (criterion 3: nothing recomputes it).
  - Schema and route (`test_uptime_unit.py`): `UptimeResponse(...).model_dump(mode="json")` has exactly the keys `uptime_seconds` and `started_at`, and its `started_at` string ends in `+00:00` and parses back with `datetime.fromisoformat` to a zero UTC offset; a `+02:00` aware input is serialised as the same instant in `+00:00`; a naive `started_at` raises `ValidationError`; `uptime_seconds=-1` raises `ValidationError` and `0` is accepted. The `/api/uptime` route on `create_app()` declares `response_model` `UptimeResponse` from `app.schemas.uptime` (found with the route recursion helper pattern `test_main_unit.py` uses, or on `app.routers.uptime.router.routes`). `create_app()` sets `app.state.uptime_start` to a `StartMark`, and two `create_app()` calls hold two distinct marks (capture per application instance).
  - Plus `test_main_unit.py`: `/api/uptime` is registered.
  - Directory: backend/tests/unit/
  - Naming: test_uptime_service_unit.py and test_uptime_unit.py (pattern test_{module}_unit.py)
- Integration tests: the router through the real HTTP request and response cycle with the session `client` fixture from `backend/tests/conftest.py`; no database fixture is used. `GET /api/uptime` is 200 with exactly the two keys, `uptime_seconds` a JSON number (int or float, not bool) at least 0, and `started_at` a string ending in `+00:00` that parses with `datetime.fromisoformat` to a zero UTC offset and is not later than the request time (criteria 1, 2, 3). Two GETs separated by `time.sleep(1.0)`: the second `uptime_seconds` is greater than the first, and `started_at` is identical on both (criteria 2 and 3; the one-second interval is the criterion itself, not a synchronisation wait). The `started_at` returned equals `app.state.uptime_start.started_at` of a fresh `create_app()` app served through its own `TestClient` (criterion 3, captured at startup). `POST /api/uptime` is 405.
  - Directory: backend/tests/integration/
  - File: test_uptime_integration.py
- E2E tests: no spec. E2E Tests is ENABLED, but no acceptance criterion requires navigation or interaction through the UI (no frontend consumes `/api/uptime`), so `testing_standards.md` Section 6 fourth question is no for every criterion and the Section 4 E2E row assigns this feature no spec. A browser spec calling the API directly would be a router integration test (`testing_standards.md` Section 5).
  - Directory: e2e/tests/ (unused by this feature)
  - File: none (would be TEST-07_uptime_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus edge cases (the offset is `+00:00` and not `Z`, `started_at` changes after a restart, POST is 405), validated for well-formedness in CI; plus the manual UAT script expanded from `## Manual verification plan`. No scenario claims an OpenAPI `date-time` format for `started_at`.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/uptime returns 200 with a body holding uptime_seconds (number) and started_at (ISO 8601 UTC) | Integration | Verifying it needs no navigation or interaction: no UI consumes the endpoint, it is a router request and response behaviour |
| 2 | uptime_seconds is non-negative and increases between two calls a second apart | Integration (two real calls one second apart) plus Unit (`elapsed_seconds` with a fake clock, clamp at 0.0, schema ge=0) | Verifying it needs no navigation or interaction: it is a service computation observed through the router |
| 3 | started_at is captured once at startup, not per request, serialised in UTC with an explicit offset | Integration (identical across calls, equals the app.state mark, ends in +00:00) plus Unit (`create_app` sets the mark, serializer emits +00:00) | Verifying it needs no navigation or interaction: it is application wiring and a serialisation rule |
| 4 | The response body is defined by a Pydantic schema in backend/app/schemas/ | Unit | Verifying it needs no navigation or interaction: it is a structural property of the route (its response_model is `UptimeResponse` from `app.schemas.uptime`) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/uptime returns 200 with uptime_seconds and started_at | Covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/uptime, Then the status is 200 and the body has exactly the fields uptime_seconds and started_at |
| 2 | uptime_seconds non-negative and increasing a second apart | Covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/uptime twice one second apart, Then both uptime_seconds values are at least 0 and the second is greater than the first |
| 3 | started_at captured once at startup, UTC with explicit offset | Covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/uptime twice, Then started_at is identical on both and ends in +00:00; and after the backend restarts, started_at is later than before |
| 4 | Response body defined by a Pydantic schema | Covered at Unit, see Criterion coverage | Given the source tree, When I open backend/app/routers/uptime.py, Then the route declares response_model UptimeResponse imported from app.schemas.uptime and returns no bare dict |

## Manual verification plan
<!-- Backend-only feature: no screen in the app consumes /api/uptime, so every check is made in a terminal with curl (status line and body) or in a browser address bar (body only), against the backend the compose stack publishes on host port 8010. -->
Shared prerequisites for every criterion: Docker running; repository on branch `feature/TEST-07-uptime-endpoint` (or `main` once merged); from the repository root run `docker compose up -d --build`, then `docker compose ps` until the `backend` service shows running. The backend answers on `http://localhost:8010` (published by `docker-compose.yml`).

### Criterion 1: GET /api/uptime returns 200 with uptime_seconds (a number) and started_at (ISO 8601 UTC)
Prerequisites: shared prerequisites above.
1. In a terminal run `curl -i http://localhost:8010/api/uptime` and read the status line and headers: the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body printed under the headers: a JSON object with exactly two fields, `uptime_seconds` holding an unquoted number such as `12.84`, and `started_at` holding a quoted timestamp such as `2026-10-19T09:15:03.123456+00:00`; no other field.
3. Open `http://localhost:8010/api/uptime` in a browser address bar: the page shows the same two-field JSON object.

### Criterion 2: uptime_seconds is non-negative and increases between two calls a second apart
Prerequisites: shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/uptime` and note the `uptime_seconds` value (for example `30.11`): it is 0 or greater, never negative.
2. Wait about one second, then run `curl -s http://localhost:8010/api/uptime` again: the new `uptime_seconds` value is greater than the one noted in step 1, by roughly one second plus the time you took (for example `31.37`).
3. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` to make the two calls exactly one second apart: the second printed `uptime_seconds` is greater than the first.

### Criterion 3: started_at is captured once at application startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/uptime` and note `started_at`: it ends in `+00:00` (an explicit offset, not `Z` and not a local offset such as `+02:00`).
2. Run the same command twice more, a few seconds apart: `started_at` is character-for-character identical on every call while `uptime_seconds` keeps growing, so the start time is not recomputed per request.
3. Subtract: the current UTC time (`date -u`) minus `started_at` is approximately the `uptime_seconds` value from the same moment, within a second or two.
4. Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s http://localhost:8010/api/uptime`: `started_at` is now later than the value noted in step 1 and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/
Prerequisites: a checkout of the branch; for step 3, `uv` installed and the backend dependencies synced (`uv sync --directory backend`).
1. Open `backend/app/schemas/uptime.py`: `class UptimeResponse(BaseModel)` declares `uptime_seconds` as a float with `ge=0` and `started_at` as `AwareDatetime`, with a json-mode serializer for `started_at` that converts it to UTC.
2. Open `backend/app/routers/uptime.py`: the route decorator declares `response_model=UptimeResponse`, `UptimeResponse` is imported from `app.schemas.uptime`, and the handler returns an `UptimeResponse` instance, not a dict literal, and calls no clock itself.
3. From the repository root run `uv run --directory backend pytest -q tests/unit/test_uptime_unit.py tests/unit/test_uptime_service_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py`: the summary reports `0 failed` across those four files (they cover all four criteria; no database is needed for them).
4. Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime`: the 200 response schema is shown as `UptimeResponse` with the fields `uptime_seconds` (number) and `started_at` (string). The docs do not show a `date-time` format for `started_at`, and that is expected, not a defect (see Re-Plan Feedback).
