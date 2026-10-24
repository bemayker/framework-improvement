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
- Comment (tracker), newest: "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/271 (branch feature/TEST-07-uptime-endpoint). Assisted run plan-feature-20261022T165251Z: draft plan PR for review. ..." → not acted on because it is a framework link-back notice from an earlier run; PR #271 and its branch no longer exist (sandbox reset), and this branch was created fresh from `origin/main`. It changes no requirement.
- Comment (tracker): framework notice naming PR #223 → not acted on: link-back notice from an earlier run, PR no longer exists, no requirement in it.
- Comment (tracker): framework notice naming PR #191 → not acted on: same reason.
- Comment (tracker): framework notice naming PR #168 → not acted on: same reason.
- Comment (tracker): framework notice naming PR #144 → not acted on: same reason.
- Comment (tracker): framework notice naming PR #90 → not acted on: same reason.
- Comment (tracker): framework notice naming PR #63 → not acted on: same reason.
- Comment (tracker): framework notice naming PR #57 (autonomous deliver run) → not acted on: same reason.
- Comment (tracker): framework notice naming PR #26 (autonomous deliver run) → not acted on: same reason.
- Comment (tracker), 2026-09-14: "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/39 ... GET /api/uptime returns {"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC +00:00>"} ... The UAT script was telling testers something untrue ... It claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare {"type": "string"} ... This item was held behind FEAT-1 rather than built in parallel ... One recorded residual, not a defect today: started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers ..." → Addressed by, point by point: (a) wire format: this plan keeps the `+00:00` serialisation that comment describes, since AC3 asks for an explicit offset and `+00:00` is unambiguous where pydantic's default `Z` designator could be argued either way (see Assumptions). (b) OpenAPI: the plan's UAT artifacts must not claim `format: date-time` for `started_at`; they describe the field as a string in the OpenAPI document, which is what a `field_serializer` returning `str` produces. Making the document advertise `date-time` is not in any criterion and is not planned. (c) serialisation behind other `main.py` routers: carried into `shared_risks.md`. (d) the module-import residual: re-scoped. This plan captures the start once per application instance inside `create_app()` (which `uvicorn --factory` calls exactly once at process start, per the `backend/Dockerfile` CMD verified on this branch), and computes `uptime_seconds` from `time.monotonic()` rather than wall-clock subtraction, so it cannot go negative or backwards on an NTP clock step within one process. The multi-worker limit remains inherent to "process uptime" (each worker is its own process) and is recorded below as a known limitation, not fixed. The "48 unit and 39 integration tests green" counts are not carried anywhere: test steps here expect `0 failed`.
- Comment (tracker), 2026-09-07: "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Checked rather than assumed: a repository-wide search for `uptime` across `backend/`, `frontend/src/` and `e2e/` on this branch finds nothing, `backend/app/routers/` holds only `health.py`, `notes.py`, `version.py` and `backend/app/schemas/` only `health.py`, `note.py`, `version.py`. No uptime code exists, so the precondition holds and everything below is planned as new. No other plan change.
- Merged since the last plan: n/a (fresh plan, branched from current `origin/main`; no `[merged-since]` lines were supplied).

## Plan Overview
Backend-only. One new read-only endpoint, `GET /api/uptime`, following the existing Router to Service layering used by `version.py` and `health.py`:

1. `backend/app/services/uptime_service.py` captures a `ProcessStart` record (a wall-clock UTC `started_at` plus a `time.monotonic()` reading) once, and computes uptime from the monotonic clock.
2. `backend/app/main.py` `create_app()` captures that record once and stores it on `app.state.process_start`, then registers the new router.
3. `backend/app/routers/uptime.py` reads `request.app.state.process_start` and returns the Pydantic `UptimeResponse` from `backend/app/schemas/uptime.py`.

No database, no repository, no migration, no frontend, no new dependency.

Assumptions recorded (each made rather than blocked on, per `user_story_alignment.md` Section 4):
1. "Captured once at application startup" means once per application instance, at `create_app()`. Under the shipped `uvicorn ... --factory` CMD that is once per process start. Capturing in `create_app()` rather than at module import or in `lifespan` keeps every `create_app()` call (tests included) independent, and does not depend on `lifespan` having run (a `TestClient` used without a `with` block skips it).
2. "Serialised in UTC with an explicit offset" is met by `+00:00` (for example `2026-10-24T04:24:56.123456+00:00`), produced by `datetime.isoformat()` on a UTC-aware value. Pydantic v2's default JSON form for a UTC datetime uses the `Z` designator; the plan does not rely on it.
3. `uptime_seconds` is a float in seconds with sub-second precision, not rounded. AC1 says `<number>` and nothing asks for an integer or a precision.
4. "Increases between two calls a second apart" is read as strictly greater on the second call within one process. Uptime is measured with the monotonic clock so that holds even if the wall clock is stepped back.
5. Known limitation, not in scope: if the deployment ever runs uvicorn with `--workers N`, each worker is its own process with its own `started_at`, so consecutive calls may land on different workers. The current `backend/Dockerfile` runs one process. Recorded for the PR's known improvements.
6. The OpenAPI document will show `started_at` as `{"type": "string"}` (the serializer's `str` return type), not `format: date-time`. No criterion asks for the document's format, so it is left as is (`user_story_alignment.md` Section 3) and the UAT artifacts describe it truthfully.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/uptime`, returns 200 with `UptimeResponse`. Router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, same shape as `backend/app/routers/version.py`. The handler takes `request: Request` and passes `request.app.state.process_start` to the service. No query parameters, no request body. Only `GET` is declared, so other methods return FastAPI's 405.
- Service layer: `backend/app/services/uptime_service.py`, stdlib only (`datetime`, `time`, `dataclasses`):
  - `@dataclass(frozen=True) class ProcessStart`: `started_at: datetime` (UTC-aware) and `monotonic_start: float`.
  - `capture_process_start() -> ProcessStart`: reads `datetime.now(timezone.utc)` and `time.monotonic()` once each. Called only from `create_app()`.
  - `get_uptime_seconds(process_start: ProcessStart) -> float`: returns `max(0.0, time.monotonic() - process_start.monotonic_start)`. The clamp is a guard for a hand-built `ProcessStart` in tests; under the real clock the difference is never negative.
  - The clock reads go through the module's own `time.monotonic` and a module-level `_utc_now()` helper so unit tests can monkeypatch them, the same pattern `test_version_service_unit.py` uses for `version_service.version`.
- Schema: `backend/app/schemas/uptime.py`, `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus `@field_serializer("started_at")` returning `value.astimezone(timezone.utc).isoformat()` so the wire value always carries `+00:00`. `AwareDatetime` rejects a naive datetime at construction, `ge=0` rejects a negative uptime.
- App factory: `backend/app/main.py` `create_app()` sets `app.state.process_start = uptime_service.capture_process_start()` before registering routers, and adds `app.include_router(uptime_router)` after the existing three. The module docstring gains one sentence naming TEST-07's router and the start capture. `lifespan` is unchanged.
- Repository layer: none. The endpoint reads no data store.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no parameters, no body.
- Response: 200, `application/json`, body defined by `UptimeResponse`:

```json
{"uptime_seconds": 12.483915, "started_at": "2026-10-24T04:24:56.123456+00:00"}
```

  - `uptime_seconds`: number, `>= 0`, seconds since this process's application instance was created, strictly increasing across calls within one process.
  - `started_at`: string, ISO 8601, UTC, always ending `+00:00`; identical on every call until the process restarts.
- Errors: any method other than GET returns 405. No other error path exists (no input, no data store).

## Technology Selection
- Start-time capture and uptime arithmetic (`uptime_service.py`): chose the standard library (`datetime.now(timezone.utc)`, `time.monotonic()`, `dataclasses`) over any third-party process or clock library, because stdlib covers it completely; `time.monotonic()` was chosen over subtracting two `datetime.now()` readings because the monotonic clock cannot step backwards, which AC2 depends on.
- Response schema (`schemas/uptime.py`): chose Pydantic, already installed through FastAPI, with its built-in `AwareDatetime` and `Field(ge=0)`, over hand-written validation; AC4 names Pydantic explicitly.
- UTC `+00:00` serialisation: chose a one-line `field_serializer` calling `datetime.isoformat()` (stdlib) over a custom JSON encoder or a datetime library, because no installed rung emits `+00:00` by default.
- Router (`routers/uptime.py`): FastAPI `APIRouter`, already installed, the same construct as the three existing routers; no alternative needed.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema (`uptime_seconds: float >= 0`, `started_at: AwareDatetime` serialised with `+00:00`).
- [B] backend/app/services/uptime_service.py: `ProcessStart`, `capture_process_start()`, `get_uptime_seconds()`.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `request.app.state.process_start`.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for capture (UTC-aware, zero offset), uptime computation (non-negative, increases when the monotonic clock advances one second, clamped at 0 for a future `monotonic_start`).
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for `UptimeResponse` (JSON `started_at` ends `+00:00` and round-trips through `datetime.fromisoformat` to the same instant; a non-UTC aware input is normalised to `+00:00`; naive datetime raises `ValidationError`; negative `uptime_seconds` raises `ValidationError`).
- [B] backend/tests/integration/test_uptime_integration.py: full HTTP cycle tests (200 and exact key set; types; `started_at` identical across two calls while `uptime_seconds` strictly increases; answers with `DATABASE_URL` unset; POST returns 405).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-07/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).

### Modified files
- [B] backend/app/main.py: capture `app.state.process_start` in `create_app()`, import and register `uptime_router`, docstring sentence for TEST-07.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` and `test_create_app_captures_process_start_once_per_instance` (attribute present, UTC-aware, and two `create_app()` calls hold distinct records).

No dependency changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) entry applies. No `README.md` or `docs/DEVELOPMENT.md` edit applies: this feature changes no project structure, run configuration, dependency or test infrastructure, and neither file keeps a list of endpoints that would need the new one.

## Testing Strategy
- Unit tests: service layer (`uptime_service`: capture returns a UTC-aware datetime with zero offset; uptime is non-negative; uptime with the monotonic clock patched to advance by 1.0 s is exactly 1.0 s larger; future `monotonic_start` clamps to 0.0), schema (`UptimeResponse` serialisation and validation), and app factory (route registered, start captured once per instance). Clock reads are monkeypatched, no sleeping.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`, `test_uptime_schema_unit.py`, existing `test_main_unit.py`)
- Integration tests: router through the real app via the shared `client` fixture in `backend/tests/conftest.py` and a fresh `create_app()` for the no-database case. Happy path 200 with exact keys `{"uptime_seconds", "started_at"}`; `uptime_seconds` is an int or float and `>= 0`; `started_at` parses with `datetime.fromisoformat`, has `utcoffset() == timedelta(0)` and ends with `+00:00`; two calls with a short real pause between them (about 50 ms, enough for the monotonic clock) return the same `started_at` and a strictly larger `uptime_seconds`; DATABASE_URL unset still answers 200; POST returns 405 as the error case. No database fixture is used: the endpoint touches none.
  - Directory: backend/tests/integration/
- E2E tests: not warranted for this feature. No acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion): the endpoint has no frontend surface. The edge-case spec obligation in Section 4 applies only when E2E is warranted at all. No spec file is planned.
  - Directory: e2e/tests/ (none added)
  - File: none (would have been `TEST-07_uptime_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST is rejected with 405), all phrased against the HTTP endpoint.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` number and `started_at` ISO 8601 UTC string | Integration | Verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI surface. |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration and Unit | No UI surface: the integration test asserts the increase across two real HTTP calls, the unit test asserts the exact one-second advance with a patched monotonic clock. |
| 3 | `started_at` captured once at startup, not per request, serialised in UTC with explicit offset | Integration and Unit | No UI surface: the integration test asserts identical `started_at` across calls and the `+00:00` suffix, the unit tests assert capture-once-per-instance in `create_app()` and the serializer output. |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | It is a code-structure and validation rule: the schema unit tests exercise `UptimeResponse` directly and the router declares it as `response_model`. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body has exactly `uptime_seconds` (number) and `started_at` (ISO 8601 string) |
| 2 | Non-negative and increasing | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice about one second apart, Then both `uptime_seconds` values are at least 0 and the second is larger by roughly one second |
| 3 | Captured once, UTC with offset | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then `started_at` is identical both times and ends in `+00:00`; When the backend restarts, Then `started_at` changes and `uptime_seconds` resets near 0 |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API docs, When I open the OpenAPI document, Then `/api/uptime` returns the `UptimeResponse` schema with properties `uptime_seconds` and `started_at` |

## Manual verification plan
This endpoint has no screen in the app, so every criterion is verified through the HTTP endpoint with `curl` in a terminal and, for criterion 4, in the browser at the API docs page. The observable check is the response status and body.

Shared prerequisites for every criterion: the stack is running from the repository root with `docker compose up -d --build backend`, and `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` prints `200` (the backend answers on port 8010).

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
Prerequisites: shared prerequisites above.
1. In a terminal, run `curl -s -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the body on the last line → it has exactly two keys, for example `{"uptime_seconds":37.912405,"started_at":"2026-10-24T04:24:56.123456+00:00"}`: `uptime_seconds` is an unquoted number, `started_at` is a quoted date-time string.
3. Run `curl -s http://localhost:8010/api/uptime | python3 -m json.tool` → the output shows the same two keys and no others.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds`, for example `40.10` → the value is 0 or greater.
2. Wait about one second, then run `curl -s http://localhost:8010/api/uptime` again → `uptime_seconds` is larger than in step 1, by roughly one second (for example `41.13`).
3. Run the automated checks: `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the summary line reports `0 failed`.

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset
Prerequisites: shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/uptime` and copy `started_at`, for example `2026-10-24T04:24:56.123456+00:00` → the value ends with `+00:00`.
2. Wait a few seconds and run the same command again → `started_at` is character-for-character identical to step 1, while `uptime_seconds` has grown.
3. Restart the backend with `docker compose restart backend`, wait until `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` prints `200`, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is a later time than in step 1, still ends with `+00:00`, and `uptime_seconds` is small (a few seconds).
4. Run `uv run --directory backend pytest -q tests/unit/test_main_unit.py tests/unit/test_uptime_schema_unit.py tests/integration/test_uptime_integration.py` → the summary line reports `0 failed`.

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: shared prerequisites above.
1. Open `backend/app/schemas/uptime.py` in an editor → it defines `class UptimeResponse(BaseModel)` with fields `uptime_seconds` and `started_at`.
2. Open `backend/app/routers/uptime.py` → the `GET /uptime` route declares `response_model=UptimeResponse`.
3. In a browser, open `http://localhost:8010/docs` and expand `GET /api/uptime` → the 200 response shows the `UptimeResponse` schema with `uptime_seconds` (number) and `started_at` (string). Do not expect a `date-time` format on `started_at`: the document shows a plain string, which is expected (see Assumptions, item 6).
4. Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py` → the summary line reports `0 failed`.
