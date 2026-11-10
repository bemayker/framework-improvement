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
<!--
  Fresh plan. The item carries 23 tracker comments: 21 framework "PR opened"
  link comments, one operator note about the 2026-09-07 state reset (already
  satisfied), and one earlier run's delivery report. None asks for anything the
  description does not, so none changes scope. The one with technical content
  is recorded below because it informed a design decision.
-->
- Comment (tracker): "One recorded residual, not a defect today: started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. If the deployment ever gains workers, each child would capture its own value and uptime_seconds would stop being monotonic across calls. Noted in the PR's known improvements." → Addressed by: not acted on as a scope change (it is an observation on code that no longer exists after the sandbox reset, not a request). It informs one decision: this plan captures the start inside `create_app()` (the factory `backend/Dockerfile` launches with `--factory`), not at module import, so the value is tied to the application instance the server starts. The multi-worker residual still applies to any per-process clock and stays a known limitation for the PR body; cross-worker monotonicity is not an acceptance criterion and is not built.
- Comment (tracker): the remaining 22 comments (framework PR-link comments, the reset note, the delivery report) → not acted on because they carry no requirement.

## Plan Overview
One read-only backend endpoint, `GET /api/uptime`, following the existing version-endpoint slice (router, schema, service, registration in `create_app()`). The process start is captured once per application instance in `create_app()` as a wall-clock UTC timestamp plus a `time.monotonic()` reading, stored on `app.state`. Each request computes `uptime_seconds` from the monotonic clock (immune to wall-clock adjustments, so it can never go negative or backwards within a process) and returns the stored `started_at` unchanged. No database, no frontend, no new dependency.

Assumptions recorded (no blocking question, per `user_story_alignment.md`):
- "Captured once at application startup" is satisfied by capturing in `create_app()`, which the server calls once at boot (`uvicorn app.main:create_app --factory`). Not the lifespan hook: the existing lifespan carries conditional database logic, and capturing in the factory means `app.state` is populated whether or not a test client runs the lifespan.
- "Explicit offset" is met with a numeric `+00:00` offset (`2026-11-10T10:26:35.123456+00:00`) via a field serializer, rather than Pydantic's default `Z` designator, so the string carries an offset in the most literal reading of the criterion.
- `uptime_seconds` is a float (fractional seconds), not rounded; the criterion says "number".

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns the process's uptime and start time. Read-only; any other method gets FastAPI's 405.
- Service layer: `backend/app/services/uptime_service.py`
  - `ProcessStart`: frozen dataclass holding `started_at: datetime` (timezone-aware UTC) and `monotonic_start: float`.
  - `capture_process_start() -> ProcessStart`: reads `datetime.now(timezone.utc)` and `time.monotonic()` once.
  - `uptime_seconds(start: ProcessStart, now_monotonic: float | None = None) -> float`: `now_monotonic` defaults to `time.monotonic()`; returns `max(0.0, now_monotonic - start.monotonic_start)`. The optional parameter exists so unit tests inject clock values without patching.
- App factory: `backend/app/main.py` `create_app()` sets `app.state.process_start = capture_process_start()` and calls `app.include_router(uptime_router)` after the existing three registrations. Nothing else in the factory changes; update the module docstring's list of registered routers with one clause for TEST-07.
- Router: `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, `@router.get("/uptime", response_model=UptimeResponse)`, handler takes `request: Request`, reads `request.app.state.process_start`, returns `UptimeResponse(uptime_seconds=uptime_service.uptime_seconds(start), started_at=start.started_at)`.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `UptimeResponse` in `backend/app/schemas/uptime.py`:
  - `uptime_seconds`: float, `Field(ge=0)`
  - `started_at`: `AwareDatetime`, serialised by a `field_serializer` as `value.astimezone(timezone.utc).isoformat()`

```json
{"uptime_seconds": 42.517, "started_at": "2026-11-10T10:26:35.123456+00:00"}
```

- Error: `POST /api/uptime` (or any non-GET method) returns 405 from FastAPI's routing; no custom error responses.

## Technology Selection
- Start-time and elapsed-time measurement: chose the standard library (`datetime.now(timezone.utc)` for `started_at`, `time.monotonic()` for elapsed time) over a process-inspection dependency such as `psutil`'s process create time, because the stdlib covers it in a few lines and the application-start time is what the criterion asks for.
- Response schema `UptimeResponse`: chose Pydantic (already installed through FastAPI, 2.13.4 in `backend/uv.lock`) with its built-in `AwareDatetime` and `Field(ge=0)`, over hand-written validation; the criterion mandates a Pydantic schema.
- `+00:00` serialisation: chose a Pydantic `field_serializer` calling stdlib `datetime.isoformat()` over a date library, because isoformat on an aware UTC datetime already emits the numeric offset.
- Router: chose FastAPI's `APIRouter` (installed) following the existing `version.py` pattern; no alternative needed.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema with the `+00:00` serializer for `started_at`.
- [B] backend/app/services/uptime_service.py: `ProcessStart`, `capture_process_start()`, `uptime_seconds()`.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service (capture, elapsed computation, clamp at zero).
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for the schema (serialised offset, rejection of a naive datetime and of a negative uptime).
- [B] backend/tests/integration/test_uptime_integration.py: HTTP-level tests for criteria 1 to 4 against `create_app()`.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case.
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/TEST-07/uat_script.md: the copy of the manual UAT script build-feature writes.

### Modified files
- [B] backend/app/main.py: capture `app.state.process_start` in `create_app()`, import and register `uptime_router`, docstring clause.
- [B] backend/tests/unit/test_main_unit.py: add a test that `create_app()` registers `/api/uptime` and sets `app.state.process_start` before any request.

No dependency manifest changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` edit: neither lists the API endpoints, and this feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: service and schema logic, all clocks injected, no I/O.
  - `uptime_seconds` returns the difference for a later monotonic reading (happy path), returns 0.0 for an equal reading (edge), clamps to 0.0 for an earlier reading (error case), and defaults to `time.monotonic()` when no reading is passed.
  - `capture_process_start` returns a timezone-aware UTC `started_at` and a monotonic reading (monkeypatch `time.monotonic` and the module's clock to fixed values).
  - `UptimeResponse` serialises an aware UTC datetime as a string ending in `+00:00`, converts a non-UTC aware datetime to UTC, rejects a naive datetime, rejects `uptime_seconds=-1`.
  - `create_app()` registers `/api/uptime` and sets `app.state.process_start` (in `test_main_unit.py`, using its existing `_collect_route_paths` helper).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: real HTTP cycle through `TestClient(create_app())`; no database needed (the existing `client` fixture works with or without `DATABASE_URL`).
  - 200 with exactly the keys `uptime_seconds` and `started_at`; `uptime_seconds` is an `int` or `float` and `>= 0`; `started_at` parses with `datetime.fromisoformat` and has `utcoffset() == timedelta(0)`, and the string ends in `+00:00`.
  - Two calls separated by `time.sleep(1)`: second `uptime_seconds` is strictly greater than the first, and `started_at` is identical across both calls (not recomputed per request).
  - `started_at` equals `app.state.process_start.started_at` serialised, proving it is the value captured at startup.
  - `POST /api/uptime` returns 405 (the router's only reachable error case).
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. Enabled per CLAUDE.md, but no criterion involves navigation or interaction through the UI (see Criterion coverage), so no spec is warranted.
  - Directory: e2e/tests/
  - File: none (would be TEST-07_uptime_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), written as API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: it is an HTTP router response with no UI. |
| 2 | `uptime_seconds` non-negative and increases between two calls a second apart | Integration (plus Unit for the clamp) | Verifying it needs no navigation or interaction: two HTTP calls a second apart, and the non-negative clamp is service logic. |
| 3 | `started_at` captured once at startup, UTC with an explicit offset | Integration (plus Unit for serialisation and factory capture) | Verifying it needs no navigation or interaction: equality across two HTTP calls and a string format check. |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a schema definition and its validation rules. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body has exactly uptime_seconds and started_at |
| 2 | `uptime_seconds` non-negative, increases | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice a second apart, Then both values are non-negative and the second is greater |
| 3 | `started_at` captured once, UTC with offset | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then started_at is identical and ends in +00:00 |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When I open /docs, Then GET /api/uptime documents the UptimeResponse schema |

## Manual verification plan
<!--
  No criterion has a UI: the app's frontend does not call this endpoint. Each
  block below verifies through the HTTP API with curl, and through FastAPI's
  own /docs page for the schema.
-->
### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
Prerequisites: the stack is running (`docker compose up -d --build` from the repo root), the backend answers on `http://localhost:8010`.
1. In a terminal, run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/uptime` → prints `200`.
2. Run `curl -s http://localhost:8010/api/uptime` → prints one JSON object with exactly two keys, for example `{"uptime_seconds":42.517,"started_at":"2026-11-10T10:26:35.123456+00:00"}`; `uptime_seconds` is a bare number (no quotes) and `started_at` is a quoted ISO 8601 string.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` → two JSON objects are printed.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second is larger than the first by roughly 1 (between 1 and 2).
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers, and read `uptime_seconds` → it is small (a few seconds), lower than the values from step 2, showing the restart.

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 2; curl -s http://localhost:8010/api/uptime` → two JSON objects are printed.
2. Compare the two `started_at` strings → they are character-for-character identical.
3. Read the end of the `started_at` string → it ends in `+00:00`, and the time shown is in UTC (it matches `date -u` minus the reported uptime, to within a few seconds).
4. Run `docker compose restart backend`, then `curl -s http://localhost:8010/api/uptime` → `started_at` is now a later timestamp than in step 2, roughly the moment of the restart.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for Criterion 1.
1. Open `http://localhost:8010/docs` in a browser → the Swagger UI lists `GET /api/uptime` under the `uptime` tag.
2. Expand `GET /api/uptime` and open the 200 response's Schema tab → it shows `UptimeResponse` with `uptime_seconds` (number, minimum 0) and `started_at` (string, date-time).
3. Open `backend/app/schemas/uptime.py` in the repository → it defines `class UptimeResponse(BaseModel)` with those two fields, and `backend/app/routers/uptime.py` declares `response_model=UptimeResponse`.
4. Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py tests/unit/test_main_unit.py` → the summary reports `0 failed`.
