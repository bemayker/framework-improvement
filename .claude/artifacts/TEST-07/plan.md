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
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Addressed by: precondition checked, not assumed. On the current main (c6684ce) `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, `backend/app/main.py` registers only the version, notes and health routers, and no file under `backend/app` mentions uptime, so the revert has landed and nothing of the earlier build remains. The plan builds every file from scratch; no code action beyond that.
- Comment (tracker): "mayker-dev: PR opened for TEST-07 — .../pull/39 ... GET /api/uptime returns {"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC +00:00>"} ... The UAT script was telling testers something untrue ... the OpenAPI schema documents started_at as ... a bare {"type": "string"} ... This item was held behind FEAT-1 ... One recorded residual ... started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers." → Addressed by, point by point:
  (a) Wire format: acted on. `started_at` is serialised as `datetime.isoformat()` of a UTC-aware value, so it ends in `+00:00` (not pydantic's default `Z`), matching what that build shipped and making "explicit offset" literal. See API Contract.
  (b) OpenAPI description of `started_at`: acted on in the UAT artifacts. The schema's `field_serializer` returns `str`, so the generated OpenAPI document shows `started_at` as a plain string with no `format: date-time`. The manual UAT script and Gherkin scenarios must describe that reality and must not claim `format: date-time`. The serializer is not bent to change the document; no criterion asks about the OpenAPI document.
  (c) Capture point: acted on. `started_at` is no longer captured at module import; it is captured once inside `create_app()` (which uvicorn's `--factory` calls once per process at startup) and stored on `app.state`, so each app instance owns one start mark and a test's fresh `create_app()` gets its own. The multi-worker residual stays true of any in-process capture (each worker process would have its own start) and is recorded under Risks below as a known limitation, not fixed: the Dockerfile runs one process and no criterion covers multi-worker deployments.
  (d) Serialisation behind FEAT-1: not acted on in the plan's code. FEAT-1's server-time router is absent from main after the sandbox reset, so there is nothing to reconcile with; the scheduling concern (other items registering routers in `main.py`) is carried in `shared_risks.md`.
  (e) The test counts and review tallies in that comment describe a closed PR on a branch since discarded; not carried into this plan (a count is not an expected result).
- Comment (tracker): the fifteen other `mayker-dev: PR opened for TEST-07 — …` link comments from earlier, now-closed plan runs → not acted on because they ask for nothing and describe PRs whose code is no longer on main.
- Merged since the last plan: n/a (fresh plan, branched from current main c6684ce; no earlier plan on this branch).

## Plan Overview
Backend-only feature: one read-only endpoint, `GET /api/uptime`, following the project's Router, Service, Schema layering (no repository: no persistence). A start mark (UTC wall-clock `started_at` plus a `time.monotonic()` reading) is captured once per app instance in `create_app()` and kept on `app.state`. Each request computes `uptime_seconds` from the monotonic clock (immune to wall-clock adjustments, never negative) and returns the stored `started_at` unchanged. The response is a Pydantic `UptimeResponse` in `backend/app/schemas/uptime.py`. No database, no frontend, no external API, no new dependency.

Assumptions (recorded rather than blocking):
- "Application startup" is the `create_app()` call. In production that is uvicorn's `--factory` call at process start (`backend/Dockerfile`). The module-level `app = create_app()` in `main.py` also captures a mark for that unused instance; harmless.
- `uptime_seconds` is a float with sub-second precision (criterion says `<number>`); not rounded.
- `started_at` keeps microsecond precision from `datetime.now(UTC)`.

Risks / known limitations:
- Multi-worker deployment: with `--workers N`, each worker has its own start mark, so consecutive calls landing on different workers can report different `started_at` values and non-monotonic `uptime_seconds`. Not in scope (single-process Dockerfile); to be listed in the PR's known improvements.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns the process uptime and start time. Router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, `response_model=UptimeResponse`. The handler takes `request: Request`, reads `request.app.state.uptime_start` and calls the service; no business logic in the router.
- Service layer: `backend/app/services/uptime_service.py`:
  - `StartMark`: frozen dataclass with `started_at: datetime` (UTC-aware) and `started_monotonic: float`.
  - `capture_start_mark() -> StartMark`: reads `datetime.now(UTC)` and `time.monotonic()` once. Called only from `create_app()`.
  - `uptime_seconds(mark: StartMark, now_monotonic: float | None = None) -> float`: `now_monotonic` defaults to `time.monotonic()`; returns `max(0.0, now_monotonic - mark.started_monotonic)`. The clamp is a guard for an injected or mismatched reading; `time.monotonic()` itself never goes backwards. A clamp event is logged at warning level with both readings (standard `logging`, no `print`).
- `backend/app/main.py`: in `create_app()`, set `app.state.uptime_start = capture_start_mark()` and `app.include_router(uptime_router)` after the existing three. Update the module docstring's list of registered routers to name TEST-07. Lifespan, CORS and the existing registrations are untouched. `allow_methods=["GET", "POST"]` already covers GET.
- Repository layer: none (no persistence).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no parameters, no body.
- Response: 200, `application/json`, schema `UptimeResponse` (`backend/app/schemas/uptime.py`):
  - `uptime_seconds`: number, `Field(ge=0)`, seconds since this process's app started (float).
  - `started_at`: `AwareDatetime` (naive values rejected at validation), serialised by a `field_serializer` as `value.astimezone(timezone.utc).isoformat()`, so always UTC with an explicit `+00:00` offset.
  - Example: `{"uptime_seconds": 12.483201, "started_at": "2026-11-03T22:56:29.104512+00:00"}`
- Other methods on `/api/uptime` (e.g. POST): 405 from FastAPI's routing; no custom handling.
- OpenAPI note: because the serializer returns `str`, the generated document lists `started_at` as `{"type": "string"}` without `format: date-time`. Accepted; documented in the UAT artifacts as such.

## Technology Selection
- Start time and UTC serialisation: chose stdlib `datetime.now(timezone.utc)` and `datetime.isoformat()` over a date library (none installed, and stdlib covers it fully).
- Uptime measurement: chose stdlib `time.monotonic()` over subtracting wall-clock datetimes, because the wall clock can jump (NTP, manual change) and could yield a negative or shrinking uptime; no installed dependency is needed.
- Per-app storage of the start mark: chose FastAPI's native `app.state` over a module-level global, because it ties the capture to app startup (`create_app()`), gives each test app its own mark, and needs nothing new.
- Response schema with UTC enforcement: chose the already-installed Pydantic (via FastAPI) `AwareDatetime`, `Field(ge=0)` and `field_serializer` over hand-written validation.
- No new dependency is added; `pyproject.toml` and `uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic model (criterion 4), UTC `+00:00` serializer for `started_at`, `ge=0` on `uptime_seconds`
- [B] backend/app/services/uptime_service.py: `StartMark`, `capture_start_mark()`, `uptime_seconds()`
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service (start mark is UTC-aware; uptime happy path, zero edge, clamp error case)
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for the schema (UTC `+00:00` serialisation, non-UTC aware value converted to UTC, naive datetime rejected, negative uptime rejected)
- [B] backend/tests/integration/test_uptime_integration.py: HTTP request/response tests for `GET /api/uptime`
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: capture `app.state.uptime_start` in `create_app()`, register the uptime router, update the docstring
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` and `test_create_app_captures_uptime_start_per_instance`
No lockfile changes: the feature adds no dependency, so `backend/uv.lock` and `pyproject.toml` stay as they are.
No documentation changes: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit (build-feature Section 15's condition is not met).
No E2E spec: the feature has no UI, so no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: service layer and schema, all external state (clock) injected or monkeypatched.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, i.e. `test_uptime_service_unit.py`, `test_uptime_schema_unit.py`; plus additions to `test_main_unit.py`.
  - `test_uptime_service_unit.py`: `test_capture_start_mark_returns_utc_aware_started_at`; `test_uptime_seconds_returns_elapsed_monotonic_seconds` (mark at 100.0, now 112.5, gives 12.5); `test_uptime_seconds_returns_zero_at_start_instant` (edge); `test_uptime_seconds_clamps_to_zero_when_now_precedes_start` (error case, and asserts the warning is logged); `test_uptime_seconds_defaults_to_time_monotonic` (monkeypatch `time.monotonic`).
  - `test_uptime_schema_unit.py`: `test_uptime_response_serialises_started_at_with_utc_offset` (JSON value ends `+00:00`); `test_uptime_response_converts_non_utc_aware_started_at_to_utc` (a `+02:00` input serialises as the same instant in `+00:00`); `test_uptime_response_rejects_naive_started_at` (ValidationError); `test_uptime_response_rejects_negative_uptime` (ValidationError).
  - `test_main_unit.py`: route `/api/uptime` is registered; two `create_app()` calls produce two distinct `app.state.uptime_start` objects, each with UTC-aware `started_at`.
- Integration tests: router through the full HTTP cycle with `TestClient` (no database needed; uses the session `client` fixture or a fresh `create_app()` inside `with TestClient(...)`).
  - Directory: backend/tests/integration/
  - File: `test_uptime_integration.py`:
    - `test_get_uptime_returns_200_with_uptime_and_started_at` (criterion 1: status 200, exactly the two keys, `uptime_seconds` is int or float and >= 0, `started_at` parses with `datetime.fromisoformat`).
    - `test_get_uptime_increases_between_calls_a_second_apart` (criterion 2: two calls separated by a real `time.sleep(1.0)`; second `uptime_seconds` greater than the first by at least 0.9).
    - `test_get_uptime_started_at_is_stable_across_requests` (criterion 3: two calls return byte-identical `started_at`, equal to `app.state.uptime_start.started_at` serialised).
    - `test_get_uptime_started_at_is_utc_with_explicit_offset` (criterion 3: string ends with `+00:00`, parsed `utcoffset()` is zero, and it is not later than a UTC timestamp taken after the response).
    - `test_get_uptime_answers_when_database_url_is_unset` (edge: no database needed; monkeypatch-delete `DATABASE_URL`, fresh app, 200).
    - `test_post_uptime_returns_405_method_not_allowed` (error case).
    - `test_openapi_documents_uptime_response_schema` (criterion 4: `/openapi.json` path `/api/uptime` GET 200 references the `UptimeResponse` component with properties `uptime_seconds` and `started_at`).
- E2E tests: none warranted. The feature has no UI and no criterion involves navigation or interaction; calling the API from a browser spec would be a router integration test (testing_standards.md Section 5). No file under e2e/tests/.
  - Directory: e2e/tests/ (unused for this feature)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405, or the endpoint answers without a database), verified against the running backend with HTTP requests; no browser.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: no UI consumes the endpoint; it is a router response checked through the real HTTP cycle |
| 2 | `uptime_seconds` non-negative and increases between two calls a second apart | Integration (plus Unit for the non-negative clamp) | Verifying it needs no navigation or interaction: two HTTP calls a second apart through the real router; the clamp is a pure service rule |
| 3 | `started_at` captured once at startup, not recomputed per request, UTC with explicit offset | Integration (plus Unit for capture-per-app and serialisation) | Verifying it needs no navigation or interaction: comparing two responses and the string format is an HTTP-level and schema-level check |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit (plus Integration via OpenAPI) | Verifying it needs no navigation or interaction: it is a structural property of the schema module and the generated OpenAPI document |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body has exactly `uptime_seconds` (a number) and `started_at` (an ISO 8601 string) |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice a second apart, Then both values are >= 0 and the second is larger |
| 3 | `started_at` captured once, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then `started_at` is identical and ends in `+00:00`; When the backend restarts, Then `started_at` changes and `uptime_seconds` drops |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When I open /docs, Then GET /api/uptime documents the `UptimeResponse` schema with `uptime_seconds` and `started_at` |

## Manual verification plan
This feature has no UI: no frontend screen consumes `GET /api/uptime`, so every check below reads the HTTP response directly with `curl` (or a browser address bar) against the running backend at `http://localhost:8010`.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the stack is up (`docker compose up -d --build` at the repo root) and `docker compose ps` shows the backend running on port 8010.
1. In a terminal, run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body printed by step 1 → it is a JSON object with exactly two keys, `uptime_seconds` (a number such as `37.512904`, no quotes) and `started_at` (a quoted string such as `"2026-11-03T22:56:29.104512+00:00"`).

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (call it A) → A is 0 or greater.
2. Wait about one second, then run `curl -s http://localhost:8010/api/uptime` again and note `uptime_seconds` (call it B) → B is 0 or greater and B is larger than A by roughly one second (between about 0.9 and a few seconds, depending on how long you waited).

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and is UTC with an explicit offset
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart, and compare the two `started_at` values → they are character-for-character identical even though `uptime_seconds` differs.
2. Look at the end of the `started_at` value → it ends in `+00:00` (UTC with an explicit offset), not in `Z` and not without an offset.
3. Run `date -u` in the terminal and compare with `started_at` → `started_at` is earlier than the current UTC time by about `uptime_seconds`.
4. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again, and read the body → `started_at` is a new, later timestamp and `uptime_seconds` is small (a few seconds), showing the restart.

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs` in a browser → the Swagger UI lists `GET /api/uptime` under the `uptime` tag.
2. Expand `GET /api/uptime` and open its 200 response schema → it is named `UptimeResponse` with fields `uptime_seconds` (number) and `started_at` (string). The document shows `started_at` as a plain string with no `date-time` format; that is expected (the schema's serializer returns a string) and is not a failure.
3. Open `backend/app/schemas/uptime.py` in the repository → it defines `class UptimeResponse(BaseModel)` with those two fields.
4. Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the run ends with `0 failed`.
