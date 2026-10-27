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
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset (`+00:00`, per the 2026-09-14 tracker comment).
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker, 2026-09-14): "GET /api/uptime returns {"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC +00:00>"}. ... The UAT script was telling testers something untrue and it is now fixed. It claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare {"type": "string"}: the field_serializer's -> str return annotation is what pydantic derives the serialisation-mode schema from, so AwareDatetime's format never reaches the document. ... One recorded residual, not a defect today: started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. If the deployment ever gains workers, each child would capture its own value and uptime_seconds would stop being monotonic across calls." → Addressed by: (a) the explicit offset is pinned to `+00:00`, never `Z`: the schema serialises `started_at` through a `field_serializer` returning `value.astimezone(UTC).isoformat()`, because pydantic's default UTC rendering is `Z`; criterion 3 above now names `+00:00`. (b) the UAT script, the Gherkin scenarios and the manual verification plan below say the OpenAPI document shows `started_at` as a plain string with no `format: date-time`, and never claim the format. (c) the residual is reduced rather than repeated: `started_at` is captured in the FastAPI lifespan (application startup, criterion 3's own words) and stored on `app.state`, not at module import, so it is per application instance and testable without module-global state. A per-worker value under a future `--workers N` remains true of any in-process capture; adding workers is not in scope (`backend/Dockerfile` runs one uvicorn process), so it is recorded here as a residual and not acted on further.
- Comment (tracker, 2026-09-07, operator): "Reset to to do on 2026-09-07 for measured run 3 ... Built and merged in measured run 2 by /deliver (PR #26, squash ffbfc12 on main). ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Not acted on as a code change, verified instead: `backend/app/main.py` registers only the version, notes and health routers, and no `uptime` or `started_at` symbol exists anywhere under `backend/app/` on the current branch, so the revert has landed and this is a fresh plan with every file new except `main.py` and `test_main_unit.py`.
- Comment (tracker, 10 framework "PR opened" link comments from earlier runs): carry only links to PRs whose branches were removed in the sandbox reset → not acted on because they hold no requirement or correction.

## Plan Overview
One read-only backend endpoint, `GET /api/uptime`, following the existing version and health endpoint pattern (Router, Service, Schema; no repository, no database). The application lifespan in `backend/app/main.py` captures the process start once, as a wall-clock UTC timestamp plus a `time.monotonic()` reading, and stores it on `app.state`. The router reads that captured value, the service computes elapsed seconds from the monotonic clock (so a wall-clock adjustment can never make uptime go backwards or negative), and a Pydantic response schema serialises `started_at` as ISO 8601 with a `+00:00` offset. No frontend, no external API, no new dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this feature renders no UI)

## Backend Plan
- Endpoints: `GET /api/uptime`, reports the running application's start time and elapsed uptime. Registered in `backend/app/main.py` with `app.include_router(uptime_router)`, after the existing three.
- Service layer: `backend/app/services/uptime_service.py`.
  - `ProcessStart`, a frozen dataclass with `started_at: datetime` (timezone-aware UTC) and `started_monotonic: float`.
  - `capture_process_start() -> ProcessStart`: reads `datetime.now(UTC)` and `time.monotonic()` once. Called only from the lifespan.
  - `compute_uptime_seconds(process_start: ProcessStart, now_monotonic: float | None = None) -> float`: returns `max(0.0, now - process_start.started_monotonic)`, with `now` defaulting to `time.monotonic()`. The parameter exists so unit tests inject the clock; the clamp makes criterion 2's non-negativity unconditional rather than dependent on clock behaviour.
- Startup capture: the existing `lifespan` in `backend/app/main.py` sets `app.state.process_start = capture_process_start()` as its first statement, before the DATABASE_URL branch, so the capture happens once per application startup whether or not a database is configured, and is never recomputed per request.
- Router: `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, `@router.get("/uptime", response_model=UptimeResponse)`, takes `request: Request`, reads `request.app.state.process_start`, and returns `UptimeResponse(uptime_seconds=compute_uptime_seconds(process_start), started_at=process_start.started_at)`. No business logic in the router.
- Schema: `backend/app/schemas/uptime.py`, `UptimeResponse(BaseModel)` with `uptime_seconds: NonNegativeFloat` and `started_at: AwareDatetime`, plus a `@field_serializer("started_at")` returning `value.astimezone(UTC).isoformat()` so the wire format is always `YYYY-MM-DDTHH:MM:SS.ffffff+00:00`. A naive datetime is rejected at construction. The OpenAPI document will show `started_at` as `{"type": "string"}` without `format: date-time` (the serializer's `-> str` annotation drives the serialisation schema); that is expected and must not be described otherwise in any artifact.
- Repository layer: none, the endpoint reads no persisted data.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query or path parameters
- Response: 200, `application/json`, schema `UptimeResponse`:
  `{"uptime_seconds": 42.137, "started_at": "2026-10-27T16:33:15.482913+00:00"}`
  `uptime_seconds` is a JSON number, at least 0, growing with elapsed time; `started_at` is the same string on every call until the process restarts. Any other method on the path answers 405 (FastAPI default).

## Technology Selection
- Process start capture and elapsed time (`uptime_service.py`): chose the standard library's `time.monotonic()` and `datetime.now(UTC)` over `psutil.Process().create_time()` (not installed) and over subtracting two wall-clock readings, because a monotonic clock cannot go backwards on an NTP adjustment and two stdlib calls cover the need with no new dependency.
- Where the start value lives: chose Starlette's native `app.state`, set in the existing FastAPI lifespan, over a module-level global captured at import, because the lifespan is "application startup" in criterion 3's own sense and per-app state needs no reset between tests.
- `UptimeResponse` schema: chose Pydantic (already installed with FastAPI) `BaseModel` with `AwareDatetime`, `NonNegativeFloat` and one `field_serializer`, over a hand-built dict and over a custom datetime type, because criterion 4 requires a Pydantic schema and the installed types already express non-negativity and timezone awareness.
- Uptime router: no stdlib call, native platform feature or installed dependency replaces it; it is the project's existing `APIRouter` pattern (as `routers/version.py`), so it is built here.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema, `started_at` serialised in UTC with `+00:00`
- [B] backend/app/services/uptime_service.py: `ProcessStart`, `capture_process_start()`, `compute_uptime_seconds()`
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for capture and elapsed-time computation
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for `UptimeResponse` validation and serialisation
- [B] backend/tests/integration/test_uptime_integration.py: router integration tests through the real HTTP cycle
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus edge cases
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/main.py: lifespan captures `app.state.process_start`; import and register the uptime router; module docstring names TEST-07
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route`

No dependency changes: everything used ships with the standard library or with the already installed `fastapi` and `pydantic`, so no `pyproject.toml` edit and no `uv.lock` or `package-lock.json` regeneration.
Neither README.md nor docs/DEVELOPMENT.md needs an edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the existing endpoints.

## Testing Strategy
- Unit tests: service layer and schema, all clocks injected or monkeypatched.
  - `test_uptime_service_unit.py`: `capture_process_start` returns a timezone-aware UTC `started_at` and the monotonic reading taken at call time (monkeypatch `time.monotonic` and the module's `datetime`); `compute_uptime_seconds` happy path (start 100.0, now 142.5 gives 42.5), edge case (now equals start gives 0.0), error case (now earlier than start gives 0.0, never negative), default clock path reads `time.monotonic()`.
  - `test_uptime_schema_unit.py`: a UTC `started_at` serialises ending in `+00:00` and never `Z`; a non-UTC aware input (`+02:00`) serialises converted to the same instant in `+00:00`; a naive datetime raises `ValidationError`; a negative `uptime_seconds` raises `ValidationError`.
  - `test_main_unit.py`: `/api/uptime` is among the app's custom routes.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `test_uptime_integration.py`, each test builds a fresh app with `DATABASE_URL` unset (as `test_version_integration.py` does) so no database is needed. 200 with exactly the two keys and the right JSON types; two requests about one second apart (`time.sleep(1.0)` between them, a literal reading of criterion 2 in a backend test, not an E2E wait) with the second `uptime_seconds` at least 0.9 greater; `started_at` identical across both requests, ending in `+00:00`, and falling between a UTC timestamp taken before entering the `TestClient` context and one taken before the first request (captured at startup, not per request); a second, separately started app reports a later `started_at` (restart is visible); the OpenAPI document's 200 response for `/api/uptime` references the `UptimeResponse` component; `POST /api/uptime` answers 405.
  - Directory: backend/tests/integration/
- E2E tests: none written. E2E is ENABLED, but no criterion involves navigation or interaction through the UI (the feature has no frontend), so `testing_standards.md` Section 6's fourth question is answered no for every criterion and no spec under e2e/tests/ is warranted.
  - Directory: e2e/tests/
  - File: not applicable, no spec (would have been TEST-07_uptime_endpoint.spec.ts)
- UAT scenarios: one scenario per criterion plus edge cases (a backend restart produces a new `started_at` and a small `uptime_seconds`; `POST /api/uptime` answers 405). No scenario claims a `format: date-time` in the OpenAPI document.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | verifying it needs no navigation or interaction: it is a router response, checked through the real HTTP cycle |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration, plus Unit for the clamp and the injected-clock arithmetic | verifying it needs no navigation or interaction: two real requests a second apart, plus a pure computation |
| 3 | `started_at` captured once at startup, not per request, serialised in UTC with `+00:00` | Integration, plus Unit for the serializer | verifying it needs no navigation or interaction: equality across requests, startup bounds and the string's offset are response properties |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit, plus Integration for the OpenAPI reference | verifying it needs no navigation or interaction: it is a schema definition and its registration in the OpenAPI document |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/uptime, Then the status is 200 and the body has a number `uptime_seconds` and a string `started_at` |
| 2 | non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When a client calls GET /api/uptime twice one second apart, Then both values are at least 0 and the second is about one second larger |
| 3 | captured once at startup, UTC `+00:00` | covered at Integration, see Criterion coverage | Given the backend is running, When a client calls GET /api/uptime twice, Then `started_at` is identical and ends in `+00:00`; And after a backend restart `started_at` is later |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When an operator opens /docs, Then GET /api/uptime documents the `UptimeResponse` schema with `uptime_seconds` and `started_at` |

## Manual verification plan
This feature has no UI in the app itself; every check is made against the backend API on the host at `http://localhost:8010`, from a terminal or the FastAPI docs page.

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
Prerequisites: the stack is running from the repo root with `docker compose up -d --build backend`, and `docker compose ps backend` shows it running.
1. In a terminal, run `curl -i http://localhost:8010/api/uptime` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body of the same response → it has exactly two keys, `uptime_seconds` with an unquoted number such as `12.84`, and `started_at` with a quoted string such as `"2026-10-27T16:33:15.482913+00:00"`.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `20.11`) → the value is 0 or greater.
2. Wait one second, then run the same command again → `uptime_seconds` is larger than the first value by roughly one second (for example `21.13`), and never smaller.

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → `started_at` is the identical string both times, while `uptime_seconds` grows.
2. Read the end of `started_at` → it ends in `+00:00`, not `Z` and not any other offset.
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again → `started_at` is now a later time than in step 1 and `uptime_seconds` is small (a few seconds), showing the restart.

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs` in a browser → the Swagger UI lists `GET /api/uptime` under the `uptime` tag.
2. Expand `GET /api/uptime` and read its 200 response → it names the `UptimeResponse` schema with `uptime_seconds` (number, minimum 0) and `started_at` (string). The page shows `started_at` as a plain string without a `date-time` format; that is expected and not a defect.
3. In a terminal at the repo root, run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the summary reports `0 failed`.
