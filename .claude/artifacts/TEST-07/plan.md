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

(ClickUp task 123k99ctgcg, workspace 30307190, list 901524718831. Status: to do.)

## Acceptance Criteria
- [ ] 1. `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker): "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/39 ... GET /api/uptime returns {"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC +00:00>"} ... The UAT script was telling testers something untrue ... It claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare {"type": "string"} ... This item was held behind FEAT-1 ... both register a router in backend/app/main.py ... One recorded residual, not a defect today: started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. If the deployment ever gains workers, each child would capture its own value and uptime_seconds would stop being monotonic across calls." → Addressed by: (a) the wire format follows the precedent this comment records: `started_at` is serialised with a numeric `+00:00` offset (see the assumption under Plan Overview). (b) This plan does not repeat the OpenAPI claim: the manual verification plan and the UAT artifacts must describe `started_at` in the OpenAPI document as a string only, never as `format: date-time`, because the plan's JSON-mode serializer returns `str`. Making the document carry `format: date-time` is not an acceptance criterion and is not planned (no gold plating, `user_story_alignment.md` Section 3). (c) The serialization concern with main.py is carried into `shared_risks.md`; in the current backlog TEST-06, FEAT-1, TEST-09 and TEST-13 are the main.py neighbours. (d) The residual is narrowed rather than repeated: the start mark is captured in the FastAPI lifespan startup (application startup, as criterion 3 says), not at module import, and `uptime_seconds` is computed from `time.monotonic()`, so it can never go negative or jump when the wall clock is stepped. The multi-worker caveat remains true by nature (each worker process is its own process with its own start) and is recorded as a known limitation rather than engineered around, since the Dockerfile runs one uvicorn process and no criterion asks for cross-process consistency.
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). Built and merged in measured run 2 by /deliver (PR #26, squash ffbfc12 on main). ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Addressed by: precondition checked rather than assumed. On this branch (cut from origin/main at e262ed6) a case-insensitive grep for "uptime" under `backend/` and `e2e/` finds nothing, and `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, so no earlier uptime code is present and the plan creates every file fresh. No other change.
- Comment (tracker): the other 18 top-level comments are framework "mayker-dev: PR opened for TEST-07 — {url}" link notices from earlier runs whose PRs are all closed → not acted on because they request nothing; they are recorded here only so their absence is not mistaken for an unread input.
- Merged since the last plan: n/a (fresh plan, branched from current main e262ed6; no earlier plan.md exists for TEST-07).

## Plan Overview
Backend-only feature. One new read-only endpoint, `GET /api/uptime`, built in the layering this backend already uses (router, then service, then schema; see `version.py` and `health.py`). No repository layer and no database access are involved.

- `app/services/uptime_service.py` owns the clock logic. `capture_start()` returns a frozen `StartMark` holding the UTC wall-clock start (`started_at`) and a `time.monotonic()` reading taken at the same moment. `get_uptime(mark)` returns an `UptimeReport` whose `uptime_seconds` is `monotonic_now - mark.monotonic_start` (never negative, because the monotonic clock never goes backwards) and whose `started_at` is `mark.started_at`, unchanged.
- `app/main.py`'s existing `lifespan` captures the mark once, as its first statement, and stores it on `app.state.start_mark`, before the DATABASE_URL branch. That is application startup, so `started_at` is never recomputed per request, and every `create_app()` instance (each test client included) carries its own mark with no module-level mutable state.
- `app/routers/uptime.py` reads `request.app.state.start_mark`, calls the service, and returns `UptimeResponse`.
- `app/schemas/uptime.py` defines `UptimeResponse` (criterion 4).

Assumptions (recorded per `user_story_alignment.md` Sections 2 and 4, not blocking):
1. "UTC with an explicit offset" is read as a numeric `+00:00` offset (for example `2026-11-06T09:55:54.123456+00:00`). Pydantic 2.13 (locked in `backend/uv.lock`) would emit `Z` for a UTC datetime by default, which is a UTC designator rather than a numeric offset, so the schema serialises `started_at` explicitly with `isoformat()` after converting to UTC. That matches the format the run-2 delivery shipped (first tracker comment).
2. `uptime_seconds` is a float in seconds with sub-second precision and is not rounded. The criterion asks for "a number", and rounding to whole seconds would make two calls a second apart able to compare equal.
3. "Process has been running" is approximated by application startup (lifespan start), which is within milliseconds of process start for the single-process uvicorn the Dockerfile runs.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this feature has no UI).

## Backend Plan
- Endpoints: `GET /api/uptime`. Returns 200 with `UptimeResponse`. Read-only and takes no input. No database access, so it answers whether or not `DATABASE_URL` is set.
- Service layer: `backend/app/services/uptime_service.py`
  - `StartMark` (frozen dataclass): `started_at: datetime` (timezone-aware, UTC), `monotonic_start: float`.
  - `UptimeReport` (frozen dataclass): `uptime_seconds: float`, `started_at: datetime`.
  - `capture_start(wall_clock: Callable[[], datetime] = _utc_now, monotonic_clock: Callable[[], float] = time.monotonic) -> StartMark`. `_utc_now` returns `datetime.now(timezone.utc)`. The clocks are parameters so unit tests inject fixed values without patching the global `time` module.
  - `get_uptime(mark: StartMark, monotonic_clock: Callable[[], float] = time.monotonic) -> UptimeReport`: `uptime_seconds = monotonic_clock() - mark.monotonic_start`, `started_at = mark.started_at`.
- Startup wiring: in `backend/app/main.py`, `lifespan` sets `app.state.start_mark = uptime_service.capture_start()` as its first statement, before the existing DATABASE_URL check, and `create_app()` adds `app.include_router(uptime_router)` after the three existing `include_router` calls. Update the module docstring's list of registered routers with one TEST-07 clause. Nothing else in `main.py` changes.
- Router: `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, `@router.get("/uptime", response_model=UptimeResponse)`, `def get_uptime(request: Request) -> UptimeResponse`, which builds the response from `uptime_service.get_uptime(request.app.state.start_mark)`.
- Schema: `backend/app/schemas/uptime.py`, `class UptimeResponse(BaseModel)`, with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus a `@field_serializer("started_at", when_used="json")` that returns `value.astimezone(timezone.utc).isoformat()`. `AwareDatetime` rejects a naive datetime at construction, so a missing offset fails loudly instead of being serialised. Known and accepted: because the JSON serializer returns `str`, the generated OpenAPI document shows `started_at` as `{"type": "string"}` with no `format: date-time`, and no artifact may claim otherwise (first tracker comment).
- Repository layer: none, since no data is persisted.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `UptimeResponse`:

```json
{"uptime_seconds": 12.483201, "started_at": "2026-11-06T09:55:54.123456+00:00"}
```

`uptime_seconds` is a float, at least 0, that grows with process lifetime. `started_at` is the ISO 8601 UTC instant at which the application started, always with the `+00:00` offset, and it is identical across every call to the same running process. Any other method on `/api/uptime` answers 405 (FastAPI default).

## Technology Selection
- Start-time capture and elapsed-time measurement (`uptime_service.py`): chose the standard library's `datetime.now(timezone.utc)` for `started_at` and `time.monotonic()` for elapsed time over a wall-clock subtraction (`now - started_at`) or a third-party library such as psutil's process create time. The monotonic clock is the stdlib's own guarantee that the value never decreases, which criterion 2 needs, and psutil would be a new dependency for a few lines.
- Capture point (`main.py` lifespan): chose the existing FastAPI lifespan plus `app.state`, an installed-dependency feature already used by this app, over a module-level global captured at import. It is application startup by definition, it is per app instance (so tests stay isolated), and it adds no mutable module state.
- `UptimeResponse` schema: chose the installed Pydantic's `AwareDatetime`, `Field(ge=0)` and `field_serializer` over a hand-written validator or a string field formatted in the router. No new dependency.
- `uptime.py` router: no stdlib call, native platform feature or installed dependency replaces a FastAPI router, so it is built here in the existing `version.py` shape.
- No new dependency is added, so `pyproject.toml` and `uv.lock` are untouched.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema, with the UTC `+00:00` JSON serializer for `started_at` (criteria 1, 3, 4)
- [B] backend/app/services/uptime_service.py: `StartMark`, `UptimeReport`, `capture_start()` and `get_uptime()` with injectable clocks (criteria 2, 3)
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `request.app.state.start_mark` (criterion 1)
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for `capture_start` and `get_uptime` with fixed fake clocks
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for `UptimeResponse` validation and JSON serialisation
- [B] backend/tests/integration/test_uptime_integration.py: HTTP request/response tests for `GET /api/uptime`
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: capture the start mark first in `lifespan` and store it on `app.state.start_mark`, register `uptime_router` in `create_app()`, extend the module docstring
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route`

No lockfile entry: the feature adds no dependency, so `backend/pyproject.toml` and `backend/uv.lock` do not change. No `README.md` or `docs/DEVELOPMENT.md` entry: the feature changes no project structure, run configuration, dependency or test infrastructure (one more endpoint on the existing backend, with no new environment variable), so build-feature Section 15's condition is not met. No E2E spec: no criterion is covered at the E2E tier (see Criterion coverage).

## Testing Strategy
- Unit tests (`testing_standards.md` Section 1.1: happy path, an edge case and an error case per tested function, dependencies stubbed):
  - `test_uptime_service_unit.py`:
    - `test_capture_start_records_utc_wall_clock_and_monotonic_reading`: happy path with fake clocks returning `datetime(2026, 11, 6, 9, 0, tzinfo=timezone.utc)` and `100.0`.
    - `test_capture_start_default_wall_clock_is_timezone_aware_utc`: edge case with no injected clocks; `started_at.utcoffset() == timedelta(0)`.
    - `test_get_uptime_at_capture_instant_returns_zero`: edge, the non-negative boundary, monotonic clock still `100.0`, so the result is `0.0`.
    - `test_get_uptime_one_second_later_increases_by_one_second`: criterion 2 arithmetic; a monotonic clock of `101.0` gives `1.0`, and a later read of `102.5` gives `2.5`.
    - `test_get_uptime_returns_the_captured_started_at_unchanged`: criterion 3; repeated calls return the same `started_at` object and never read the wall clock (the injected wall clock fails the test if called).
  - `test_uptime_schema_unit.py`:
    - `test_uptime_response_serialises_started_at_with_explicit_utc_offset`: `model_dump(mode="json")["started_at"]` ends with `+00:00`.
    - `test_uptime_response_converts_non_utc_aware_datetime_to_utc`: edge; input with offset `+02:00` serialises as the same instant at `+00:00`.
    - `test_uptime_response_rejects_naive_started_at`: error; a naive datetime raises `ValidationError`.
    - `test_uptime_response_rejects_negative_uptime_seconds`: error; `-0.1` raises `ValidationError`.
  - `test_main_unit.py`: `test_create_app_registers_uptime_route` asserts `/api/uptime` is among the app's custom paths, using the existing `_collect_route_paths` helper.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests (`testing_standards.md` Section 1.2, router: success cycle plus an error case), in `test_uptime_integration.py`:
  - `test_get_uptime_returns_200_with_uptime_seconds_and_started_at`: status 200; body keys are exactly `{"uptime_seconds", "started_at"}`; `uptime_seconds` is an `int` or `float` (not `bool`) and `>= 0`; `started_at` parses with `datetime.fromisoformat`, ends with `+00:00` and has a zero UTC offset.
  - `test_get_uptime_increases_between_two_calls_a_second_apart`: two calls separated by `time.sleep(1.0)`. The second `uptime_seconds` is greater than the first by at least `0.9`, and `started_at` is identical in both bodies.
  - `test_get_uptime_started_at_is_the_value_captured_at_startup`: build a fresh `create_app()` inside `with TestClient(app)`, read `app.state.start_mark.started_at`, and assert the response's `started_at` equals its UTC `isoformat()` and is earlier than or equal to a `datetime.now(timezone.utc)` taken after the request.
  - `test_get_uptime_answers_when_database_url_is_unset`: edge, mirroring the version test. With `DATABASE_URL` deleted via monkeypatch, a fresh app still answers 200 with both fields.
  - `test_post_uptime_returns_405_method_not_allowed`: error case; the endpoint is read-only.
  - Uses the shared session `client` fixture from `backend/tests/conftest.py` where a fresh app is not needed; no new fixtures.
  - Directory: backend/tests/integration/
- E2E tests: not warranted for this feature. E2E Tests is ENABLED in CLAUDE.md, but no acceptance criterion involves navigation or interaction through a UI (`testing_standards.md` Section 6, fourth question, asked per criterion below), and no frontend consumes the endpoint.
  - Directory: e2e/tests/
  - File: none (would be `TEST-07_uptime_endpoint.spec.ts`, not created)
- UAT scenarios: one Gherkin scenario per criterion plus the edge case "a restart produces a new started_at and a small uptime_seconds", verified with `curl` against the compose stack, never a browser.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: it is a router request/response cycle, and no UI renders it |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration (plus Unit for the arithmetic) | Verifying it needs no navigation or interaction: two HTTP calls with a one-second gap, plus the service's monotonic arithmetic with fake clocks |
| 3 | `started_at` captured once at startup, not per request, serialised in UTC with an explicit offset | Integration (plus Unit for serialisation) | Verifying it needs no navigation or interaction: it compares the lifespan-captured mark with the response and checks the serialised offset |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a schema location and validation rule, exercised directly on `UptimeResponse` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/uptime`, Then the status is 200 and the body has exactly `uptime_seconds` (a number) and `started_at` (an ISO 8601 string) |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When a client calls GET `/api/uptime` twice about one second apart, Then both values are at least 0 and the second is greater than the first |
| 3 | `started_at` captured once at startup, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When a client calls GET `/api/uptime` twice, Then `started_at` is identical in both and ends in `+00:00`; and When the backend is restarted, Then `started_at` changes |
| 4 | Response defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the repository, When the schema unit tests run, Then 0 failed, and `backend/app/schemas/uptime.py` defines `UptimeResponse` |

## Manual verification plan
No criterion is verifiable through the UI: no screen renders `GET /api/uptime`. Every check below reads the HTTP response with `curl` against the Docker Compose stack, where the backend is published at `http://localhost:8010` (`docker-compose.yml`), and with the stack's own logs.

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
Prerequisites: Docker running; repository on branch `feature/TEST-07-uptime-endpoint`; from the repository root, `docker compose up -d --build` has completed and `docker compose ps` shows the `backend` service running; host port 8010 free before start-up.
1. In a terminal run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body → it is a single JSON object with exactly two keys, `uptime_seconds` and `started_at`, for example `{"uptime_seconds":7.214533,"started_at":"2026-11-06T10:02:11.482113+00:00"}`; `uptime_seconds` is an unquoted number and `started_at` is a quoted string.
3. Run `curl -i -X POST http://localhost:8010/api/uptime` → `HTTP/1.1 405 Method Not Allowed` (the endpoint is read-only).

### Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart
Prerequisites: the stack from Criterion 1 still up.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (call it A) → A is 0 or greater.
2. Wait about one second, then run `curl -s http://localhost:8010/api/uptime` again and note `uptime_seconds` (B) → B is greater than A, by roughly one second plus however long you took between the two commands; it never shows a negative value.

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: the stack from Criterion 1 still up.
1. Run `curl -s http://localhost:8010/api/uptime` three times, a few seconds apart, and compare the `started_at` values → all three are character-for-character identical, while `uptime_seconds` grows each time.
2. Read the end of the `started_at` value → it ends in `+00:00` (an explicit UTC offset), not `Z` and not a bare time with no offset.
3. Run `docker compose logs backend | grep -i "application startup complete"` and compare the log timestamp with `started_at` → `started_at` is within a second or two of that startup line (allowing for the log's own timezone), not the time of your curl requests.
4. Run `docker compose restart backend`, wait until `docker compose ps` shows it running, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is now later than the value from step 1, and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process.
5. Optional schema check: run `curl -s http://localhost:8010/openapi.json` and find `UptimeResponse` → `started_at` is documented as a string (`"type": "string"`); do not expect `format: date-time`, which this plan deliberately does not add.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Not verifiable through the UI; the observable check is the source file and its tests.
1. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`, and `backend/app/routers/uptime.py` declares `response_model=UptimeResponse`.
2. From the repository root run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/integration/test_uptime_integration.py` → the summary line reports `0 failed` for those two files (the endpoint reads no database, so these tests run with `DATABASE_URL` unset; if it is set, it must point at a reachable PostgreSQL, because the app's startup creates the notes schema).
