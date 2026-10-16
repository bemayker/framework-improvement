# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> **What**
>
> `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> **Acceptance criteria**
>
> 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
> 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
> 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
>
> **Notes**
>
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches `main.py`'s router registration, so it must not run concurrently with another backend item that does the same.

## Acceptance Criteria
- [ ] 1. GET /api/uptime returns 200 with a JSON body holding the keys uptime_seconds (a number) and started_at (an ISO 8601 UTC string), as the feature text above gives it.
- [ ] 2. uptime_seconds is a non-negative number and increases between two calls a second apart.
- [ ] 3. started_at is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in backend/app/schemas/.

## Re-Plan Feedback
- Comment (tracker, 2026-09-14): "One recorded residual, not a defect today: started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. If the deployment ever gains workers, each child would capture its own value and uptime_seconds would stop being monotonic across calls. Noted in the PR's known improvements." → Addressed by: started_at is no longer captured at module import. It is captured once, as the first statement of the existing `lifespan` in `backend/app/main.py`, by `uptime_service.capture_start()`, and stored on `app.state.uptime_start`. That satisfies criterion 3 literally (application startup), runs before the database schema step so the value is not delayed by it, and gives each app instance its own value instead of one module global shared across every `create_app()` call the test suite makes. The multi-worker residual is recorded and deliberately not engineered for: `backend/Dockerfile` still runs one uvicorn process (`--factory`, no `--workers`), so application startup is process startup today, and cross-worker coordination or persistence is asked for by no criterion (`user_story_alignment.md` Section 3). The build carries the residual into the PR description as a known improvement again.
- Comment (tracker, 2026-09-14, same comment, second part): "The UAT script was telling testers something untrue and it is now fixed. It claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare [string-typed schema with no format; the JSON fragment is elided here because the plan writer refuses a brace beside a quote] — the field_serializer's [str return annotation] is what pydantic derives the serialisation-mode schema from, so AwareDatetime's format never reaches the document." → Addressed by: this plan uses no field_serializer. `started_at` is declared `AwareDatetime` and serialised by Pydantic's own JSON mode, which writes a UTC value with the `Z` offset designator (pydantic 2.13.4, pinned in `backend/uv.lock`), so the generated OpenAPI document keeps `format: date-time`. A unit test asserts that format on `create_app().openapi()`, so the Manual verification plan and the UAT script claim only what a test pins.
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). Built and merged in measured run 2 by /deliver (PR #26, squash ffbfc12 on main). [...] Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Checked, not acted on further: the revert has merged (0ac6818, PR #29, per a later comment), and current main (375a655) holds no uptime code. `backend/app/routers/` holds echo, health, notes and version only, `backend/app/schemas/` echo, health, note and version only, and `backend/app/main.py` registers only those four routers. This plan is written against main as it now stands.
- Comment (tracker, 5 comments): framework "PR opened" link records for PRs #144, #90, #63, #57 and #26 from earlier runs → Not acted on because they are link records, not requirements.
- Merged since the last plan: n/a (fresh plan, branched from current main at 375a655).
- Assumption (no comment covers it): "explicit offset" in criterion 3 is satisfied by the ISO 8601 and RFC 3339 zero-offset designator `Z`, which Pydantic writes for an aware UTC datetime by default, for example `2026-10-16T03:33:49.120456Z`. A `+00:00` spelling would need a custom serializer, which is exactly what removed `format: date-time` from the OpenAPI document last time (comment above). A naive timestamp (no designator at all) is what the criterion rules out, and the tests assert the designator is present and the parsed offset is zero.
- Assumption: uptime_seconds is an unrounded float, measured with the monotonic clock. The criterion asks for a number and states no precision, so none is imposed.
- Assumption: "how long the process has been running" is measured from application startup, which criterion 3 names explicitly, not from the operating-system process creation time (which would need a new dependency such as psutil; see Technology Selection).

## Plan Overview
Backend only. One new router, `backend/app/routers/uptime.py`, exposing `GET /api/uptime` with `response_model=UptimeResponse`. One new Pydantic response schema, `backend/app/schemas/uptime.py` (`UptimeResponse`: `uptime_seconds: float` declared non-negative with `Field(ge=0)`, `started_at: AwareDatetime`). One new service module, `backend/app/services/uptime_service.py`, holding the start mark (a frozen dataclass pairing the UTC wall-clock start time with the monotonic clock reading taken at the same moment), the function that captures it, the function that reads it back off the app state, and the function that computes elapsed seconds from the monotonic clock. `backend/app/main.py` captures the start mark once, as the first statement of the existing `lifespan`, stores it on `app.state.uptime_start`, and registers the uptime router after the echo router. No repository layer, no database access, no migration. Tests: unit tests for the service, the schema and its OpenAPI declaration, and the lifespan capture; integration tests through the real HTTP cycle for criteria 1 to 3; one registration assertion in the existing app-factory unit test. No frontend, no external API, no new dependency.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders nothing).

## Backend Plan
- Endpoints: `GET /api/uptime` (router prefix `/api`, path `/uptime`, tag `uptime`, `response_model=UptimeResponse`). Handler `get_uptime(request: Request)` reads the start mark with `uptime_service.get_start_mark(request.app.state)` and returns `UptimeResponse(uptime_seconds=uptime_service.uptime_seconds(start), started_at=start.started_at)`. The handler computes nothing itself and never captures a new start time (criterion 3).
- Schemas: `backend/app/schemas/uptime.py` defines `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime` (criterion 4), in the shape of `backend/app/schemas/version.py`. No field_serializer and no custom JSON encoder: Pydantic JSON mode writes the aware UTC value with the `Z` designator, and the OpenAPI document keeps `type: string, format: date-time` for `started_at` and `type: number, minimum: 0` for `uptime_seconds`.
- Service layer: `backend/app/services/uptime_service.py`, stdlib only, importing `monotonic` from `time` and `datetime, timezone` from `datetime` at module level so unit tests can pin the clocks with `monkeypatch.setattr(uptime_service, "monotonic", ...)`, the pattern `test_version_service_unit.py` uses for `version`.
  - `@dataclass(frozen=True) class StartMark` with `started_at: datetime` (aware, UTC) and `monotonic_at: float`.
  - `capture_start()` returns `StartMark(started_at=datetime.now(timezone.utc), monotonic_at=monotonic())`, both read in the same call.
  - `get_start_mark(state)` returns `state.uptime_start`, or logs an error and raises `UptimeNotRecordedError` (a `RuntimeError` subclass defined in this module) when the app state carries no mark, which means the lifespan never ran. FastAPI then answers 500, which is correct for that misconfiguration; uvicorn and every `with TestClient(app)` run the lifespan, so the path is unreachable in normal operation.
  - `uptime_seconds(start)` returns `monotonic() - start.monotonic_at`. The monotonic clock never goes backwards, so the value is non-negative and grows between calls even if the wall clock is stepped (criterion 2).
- Registration and startup capture, `backend/app/main.py`:
  - imports: `from app.routers.uptime import router as uptime_router` after the version-router import line (alphabetical, as the block is now), and `from app.services import uptime_service` after the `app.core.db` import.
  - `lifespan`: first statement, before `settings = get_settings()`, is `app.state.uptime_start = uptime_service.capture_start()`, with a one-line comment saying why it is first (the start is not delayed by schema initialisation). The docstring gains one sentence naming the TEST-07 start capture.
  - `create_app()`: `app.include_router(uptime_router)` after `app.include_router(echo_router)`.
  - module docstring: one clause naming TEST-07 and the uptime router. CORS middleware untouched (`allow_methods` already includes GET).
- Repository layer: none. No database access.
- Migrations: none.
- Error responses: none added. The endpoint takes no input, so there is no validation error to answer; a POST gets FastAPI's default 405.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime` (backend at http://localhost:8010 under `docker compose`)
- Request: no parameters, no body, no headers beyond the defaults.
- Response 405: any method other than GET (FastAPI default, body `detail` = `Method Not Allowed`).
- Response 200: `UptimeResponse`, exactly two fields. `uptime_seconds` is a JSON number, at least 0, seconds elapsed on the monotonic clock since application startup. `started_at` is an ISO 8601 string in UTC ending in the `Z` offset designator, identical on every response from the same running app. Example, about an hour after startup:
```json
{"uptime_seconds": 3725.418, "started_at": "2026-10-16T03:33:49.120456Z"}
```

## Technology Selection
- Start timestamp (`started_at`): chose the stdlib `datetime.now(timezone.utc)` over any installed or new library, because the standard library already yields an aware UTC datetime and nothing more is needed.
- Elapsed time (`uptime_seconds`): chose the stdlib `time.monotonic()` over subtracting two wall-clock datetimes, because a wall-clock step (NTP correction, manual change) could make the difference shrink or go negative between calls, which criterion 2 forbids; and over `psutil.Process().create_time()` for the operating-system process start, because psutil is not installed and criterion 3 names application startup anyway.
- `backend/app/schemas/uptime.py` (`UptimeResponse`): chose a Pydantic `BaseModel` with `AwareDatetime` and `Field(ge=0)`, already installed through FastAPI, over a bare dict or a stdlib dataclass, because criterion 4 names a Pydantic schema and FastAPI serialises and documents a `response_model` from it. Chose Pydantic default datetime JSON serialisation over a custom `field_serializer`, because the default already writes UTC with an explicit `Z` offset and, unlike the serializer, keeps `format: date-time` in the OpenAPI document (tracker comment of 2026-09-14).
- `backend/app/services/uptime_service.py`: chose a stdlib frozen dataclass stored on FastAPI `app.state` (Starlette `State`, installed) over a module-level global, because `app.state` gives each app instance its own start mark, so the test suite repeated `create_app()` calls cannot overwrite one another; no stdlib call or installed dependency reports application uptime, so the few functions are built here.
- `backend/app/routers/uptime.py`: chose FastAPI `APIRouter` (installed), the shape TEST-02, TEST-05 and TEST-06 established; no stdlib call or native platform feature serves an HTTP route, so nothing substitutes it.
- Dependencies: none added. FastAPI, Pydantic, pytest and httpx are already installed (`backend/pyproject.toml`).

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime` (criteria 1, 2, 3 and 4)
- [B] backend/app/services/uptime_service.py: `StartMark`, `capture_start`, `get_start_mark`, `uptime_seconds` and `UptimeNotRecordedError`, stdlib only (criteria 2 and 3)
- [B] backend/app/routers/uptime.py: `GET /api/uptime`, `response_model=UptimeResponse`, reads the start mark off `request.app.state` (criteria 1 to 4)
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for capture, read-back, the missing-mark error and elapsed-time arithmetic with pinned clocks
- [B] backend/tests/unit/test_uptime_unit.py: unit tests for `UptimeResponse` validation and JSON serialisation, and for its OpenAPI declaration (number with minimum 0, string with format date-time)
- [B] backend/tests/integration/test_uptime_integration.py: HTTP-cycle tests for the 200 body, non-negative and increasing uptime a second apart, constant startup-captured started_at with a zero UTC offset, and 405 on POST
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from this plan Manual verification plan
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus the restart edge case (UAT Generation ENABLED)
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/main.py: import the uptime router and `uptime_service`, capture the start mark as the first statement of `lifespan` onto `app.state.uptime_start`, `app.include_router(uptime_router)` after the echo router, docstring clauses naming TEST-07
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` and `test_lifespan_records_uptime_start_mark_on_startup`

No lockfile changes: the feature adds no dependency, so `backend/uv.lock` and `package-lock.json` are untouched.
No documentation edit: `README.md` and `docs/DEVELOPMENT.md` list no individual endpoints, and this feature changes no project structure, run configuration, dependency or test infrastructure, so build-feature Section 15 has nothing to update.
No E2E spec file: no criterion is assigned to the E2E tier (see Criterion coverage), matching TEST-02 and TEST-06 on main, which are backend-only and ship no `e2e/tests/` spec.

## Testing Strategy
- Unit tests: the service with pinned clocks, the schema and its OpenAPI declaration, and the lifespan capture. No HTTP request against a running server and no database.
  - `test_uptime_service_unit.py`:
    - `test_capture_start_returns_utc_aware_started_at` (happy path: `started_at.utcoffset()` equals `timedelta(0)` and lies between a UTC timestamp taken just before and just after the call)
    - `test_capture_start_pairs_started_at_with_the_monotonic_reading` (edge case: with `uptime_service.monotonic` pinned to 100.0, `monotonic_at` is 100.0)
    - `test_uptime_seconds_returns_elapsed_monotonic_time` (happy path: mark at 100.0, clock pinned to 101.5, result 1.5)
    - `test_uptime_seconds_is_zero_at_the_start_instant` (edge case, non-negative boundary of criterion 2: clock equal to the mark gives 0.0)
    - `test_uptime_seconds_increases_as_the_monotonic_clock_advances` (criterion 2 pinned: clock 100.0 then 101.0 gives a strictly larger second value)
    - `test_get_start_mark_returns_the_recorded_mark` (happy path on a Starlette `State` holding a mark)
    - `test_get_start_mark_raises_when_startup_recorded_none` (error case: an empty `State` raises `UptimeNotRecordedError`)
  - `test_uptime_unit.py`:
    - `test_uptime_response_serialises_utc_started_at_with_z_offset` (criterion 3: `model_dump_json()` of a response built from `datetime(2026, 10, 16, 3, 33, 49, tzinfo=timezone.utc)` carries `2026-10-16T03:33:49Z`)
    - `test_uptime_response_rejects_naive_started_at` (error case: a naive datetime raises `pydantic.ValidationError`)
    - `test_uptime_response_rejects_negative_uptime_seconds` (error case: -1.0 raises `pydantic.ValidationError`)
    - `test_openapi_declares_uptime_response_schema` (criterion 4: in `create_app().openapi()`, GET `/api/uptime` 200 references `UptimeResponse`, whose `uptime_seconds` is `type: number` with `minimum: 0` and whose `started_at` is `type: string` with `format: date-time`, both required)
  - `test_main_unit.py` additions: `test_create_app_registers_uptime_route`, and `test_lifespan_records_uptime_start_mark_on_startup` (DATABASE_URL removed with `monkeypatch.delenv` so no database is touched; inside `with TestClient(create_app())` the app state holds a `StartMark`)
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_uptime_service_unit.py` and `test_uptime_unit.py`
- Integration tests: the router through the real HTTP request/response cycle, with the shared session-scoped `client` fixture from `backend/tests/conftest.py`, or a fresh `with TestClient(create_app())` with DATABASE_URL removed where the test needs to observe startup itself. The endpoint touches no database, so no DB fixture is requested.
  - `test_get_uptime_returns_200_with_uptime_seconds_and_started_at` (criterion 1: status 200, the JSON keys are exactly uptime_seconds and started_at, uptime_seconds is an int or float and not a bool, started_at parses with `datetime.fromisoformat`)
  - `test_get_uptime_seconds_is_non_negative_and_increases_a_second_apart` (criterion 2: first value at least 0, `time.sleep(1)`, second value greater than the first by at least 0.9)
  - `test_get_uptime_started_at_is_identical_across_requests` (criterion 3: two calls return the same started_at string while uptime_seconds differs)
  - `test_get_uptime_started_at_is_captured_at_startup_not_per_request` (criterion 3: on a fresh app, started_at lies between a UTC timestamp taken before entering `with TestClient(app)` and one taken right after startup, and the request is made after a short `time.sleep(0.05)`, so a per-request value would fall after that second timestamp)
  - `test_get_uptime_started_at_is_utc_with_explicit_offset` (criterion 3: the string ends in `Z` and the parsed value has `utcoffset()` equal to `timedelta(0)`)
  - `test_post_uptime_returns_405_method_not_allowed` (error case, the only one reachable: the endpoint takes no input)
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py, here `test_uptime_integration.py`
- E2E tests: no criterion is assigned to E2E. No screen calls `/api/uptime` and the feature adds no frontend, so no criterion needs navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, asked per criterion). No spec file is written, as for TEST-02 and TEST-06 on main.
  - Directory: e2e/tests/ (unused by this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus a restart edge case (a restart resets started_at and uptime_seconds), phrased as HTTP requests and responses because there is no UI, and one scenario that runs the feature test files expecting 0 failed. The manual script expands the Manual verification plan below.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/uptime returns 200 with uptime_seconds and started_at | Integration | No UI consumes the endpoint: it is a router request/response behaviour, verified fully through the HTTP cycle |
| 2 | uptime_seconds is non-negative and increases between two calls a second apart | Integration, plus Unit with pinned clocks | A timing property of the response with no navigation or interaction; the HTTP cycle observes it and the unit tests pin the arithmetic |
| 3 | started_at captured once at startup, not per request, in UTC with an explicit offset | Integration, plus Unit for serialisation | Startup capture and serialisation are app-lifecycle and schema behaviour, observed through the HTTP cycle and the schema, with nothing a browser adds |
| 4 | Response body defined by a Pydantic schema in backend/app/schemas/ | Unit | A structural property of the schema module and its OpenAPI declaration, checked without HTTP or a browser; the integration tests also exercise it as the response model |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/uptime returns 200 with uptime_seconds and started_at | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/uptime, Then the status is 200 and the JSON body has exactly the keys uptime_seconds and started_at |
| 2 | uptime_seconds non-negative and increasing a second apart | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/uptime twice one second apart, Then both uptime_seconds values are at least 0 and the second is larger |
| 3 | started_at captured once at startup, UTC with explicit offset | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/uptime twice, Then started_at is identical and ends in Z; edge: after a backend restart started_at is later and uptime_seconds is small |
| 4 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When I read the OpenAPI document, Then GET /api/uptime responds with UptimeResponse carrying uptime_seconds as a number and started_at as a date-time string |

## Manual verification plan
No screen of the task-notes app calls this endpoint, so every criterion is verified against the HTTP response itself: in a browser address bar, in FastAPI's interactive docs at http://localhost:8010/docs, or with curl. All four blocks share these prerequisites.

Prerequisites: on branch `feature/TEST-07-uptime-endpoint` (or `main` once merged), from the repository root run `docker compose up -d --build`, then `docker compose ps` until `backend` reports running. The backend answers on http://localhost:8010 (docker-compose.yml publishes 8010). A terminal with `curl` and `python3`, and a browser.

### Criterion 1: GET /api/uptime returns 200 with uptime_seconds and started_at
1. In a terminal, run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers.
2. Run `curl -s http://localhost:8010/api/uptime | python3 -m json.tool` → a JSON object with exactly two keys, `uptime_seconds` holding an unquoted number such as `42.137` and `started_at` holding a quoted string such as `2026-10-16T03:33:49.120456Z`, and nothing else.
3. Open http://localhost:8010/api/uptime in a browser → the page shows the same two keys, with the same `started_at` value as step 2.

### Criterion 2: uptime_seconds is non-negative and increases between two calls a second apart
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds`, for example `42.137` → the value is 0 or greater, never negative.
2. Wait one second (run `sleep 1`), then run `curl -s http://localhost:8010/api/uptime` again → `uptime_seconds` is larger than the value from step 1 by about 1, for example `43.141`.
3. Open http://localhost:8010/api/uptime in a browser and press reload twice, a second or more apart → `uptime_seconds` grows on each reload and never goes down.

### Criterion 3: started_at is captured once at application startup, not recomputed per request, in UTC with an explicit offset
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart, and compare `started_at` → it is character-for-character identical in both responses, while `uptime_seconds` differs.
2. Read `started_at` from step 1 → it ends in `Z` (the UTC offset designator), and its date and time match the moment the backend container started, which `docker compose ps` shows as its uptime (`Up N minutes`) and which roughly equals `uptime_seconds` counted back from now.
3. Run `docker compose restart backend`, then `docker compose ps` until `backend` reports running again, then `curl -s http://localhost:8010/api/uptime` → `started_at` is now later than the value from step 1 and `uptime_seconds` is small (a few seconds): this is how an operator tells a restart from a long-lived process.
4. Open `backend/app/main.py` → the first statement of `lifespan` stores `uptime_service.capture_start()` on `app.state.uptime_start`; open `backend/app/routers/uptime.py` → the handler reads the mark with `get_start_mark` and never calls `capture_start`.

### Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/
This is a code-structure property with no UI behaviour; the observable checks are the OpenAPI document and the module.
1. Open http://localhost:8010/docs, expand `GET /api/uptime`, look under `Responses` for code `200` → the schema is named `UptimeResponse` with two required properties, `uptime_seconds` (number) and `started_at` (string, date-time).
2. Open http://localhost:8010/openapi.json and find `components`, then `schemas`, then `UptimeResponse` → `uptime_seconds` has `type` `number` and `minimum` `0`; `started_at` has `type` `string` and `format` `date-time`; both are listed under `required`.
3. Open `backend/app/schemas/uptime.py` → `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`; `backend/app/routers/uptime.py` declares `response_model=UptimeResponse` and returns an `UptimeResponse`, never a dict literal.
4. Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/unit/test_uptime_unit.py tests/integration/test_uptime_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
