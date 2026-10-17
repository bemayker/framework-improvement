# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> ### What
>
> `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> ### Acceptance criteria
>
> 1. `GET /api/uptime` returns **200** with a JSON object holding `uptime_seconds` (a number) and `started_at` (an ISO 8601 UTC string).
> 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
> 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
>
> ### Notes
>
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches `main.py`'s router registration, so it must not run concurrently with another backend item that does the same.

(The tracker text writes criterion 1's body as a JSON literal with the two keys `uptime_seconds` and `started_at`; it is reworded above only because a heredoc line may not hold a brace beside a quote. The meaning is unchanged.)

## Acceptance Criteria
- [ ] 1. `GET /api/uptime` returns **200** with a JSON object holding `uptime_seconds` (number) and `started_at` (ISO 8601 UTC string).
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker), 2026-09-14, from the autonomous deliver run that built an earlier incarnation: reports the endpoint returned `uptime_seconds` and `started_at` with a `+00:00` offset; that its UAT script wrongly claimed the OpenAPI schema documents `started_at` as a string with `format: date-time`, when the generated schema showed a bare string type because a `field_serializer` with a `-> str` return annotation decides the serialisation-mode schema; and records as a residual that `started_at` was captured at module import, which equals process start only because the Dockerfile runs a single uvicorn process (`--factory`, no `--workers`). (JSON literals reworded so the line holds no brace.) Addressed by, as design input and not as added scope: (a) capture point: `started_at` is captured in the FastAPI `lifespan` startup hook in `backend/app/main.py`, stored once on `app.state`, never at module import and never per request; this is the startup event criterion 3 names, it runs once per application instance, and it makes the test client exercise exactly the production path. A multi-worker deployment would still give each worker process its own value, which is correct for this feature (it reports how long *the process* has run); the Dockerfile today runs one process, and adding workers is out of scope. (b) monotonicity: `uptime_seconds` is computed from `time.monotonic()` against a monotonic origin captured beside `started_at`, not from wall-clock subtraction, so a wall-clock adjustment cannot make it negative or go backwards. (c) OpenAPI: the schema declares `started_at` with an explicit JSON-schema override of type string, format date-time (Pydantic `WithJsonSchema`), placed after the serializer, and an integration test reads `/openapi.json` to prove the published document says `format: date-time`; the UAT script may only claim what that test asserts.
- Comment (tracker), 2026-09-07, operator: reset to to do for measured run 3; the item was built and merged in measured run 2 (PR #26, squash ffbfc12) and the operator would revert ffbfc12 (with 8794a99 and a9695cc) before the run; do not run `/deliver` against the item until that revert has merged. Not acted on because its precondition is verified met: current `origin/main` (957fda7) carries no uptime router, schema, service or test (`backend/app/routers/` holds only `echo.py`, `health.py`, `notes.py`, `version.py`, and `backend/app/main.py` registers only those four), so this is planned as a fresh feature.
- Comment (tracker), six framework-written "PR opened" notices from earlier plan runs (PRs #168, #144, #90, #63, #57, #26; #168 merged but the sandbox main was later reset). Not acted on because they are link notices that request nothing of the plan, and none of the code they refer to is on main now.
- Merged since the last plan: n/a (fresh plan, branched from current main 957fda7).

## Plan Overview
One read-only backend endpoint, `GET /api/uptime`, returning an `UptimeResponse` Pydantic body with `uptime_seconds` (non-negative float) and `started_at` (timezone-aware UTC datetime serialised as ISO 8601 with a `+00:00` offset). Layers touched: a new service module `backend/app/services/uptime_service.py` (capture the process start once; compute uptime from the monotonic clock), a new schema module `backend/app/schemas/uptime.py`, a new router `backend/app/routers/uptime.py`, and `backend/app/main.py` (capture the start in the existing `lifespan` hook, register the router). Standard library only (`time.monotonic`, `datetime.now(timezone.utc)`); no database, no frontend, no external API, no new dependency. Tests: a new service unit test file, a new schema unit test file, one registration test added to `test_main_unit.py`, and a new integration test file through the FastAPI test client (criteria 1 to 4 plus the published OpenAPI schema). No E2E spec: no criterion involves the UI. UAT artifacts (Gherkin scenarios, manual script and its artifact copy) are produced as usual.

Assumption recorded: the manual steps reach the backend at `http://localhost:8010`, the host port `docker-compose.yml` publishes for the `backend` service.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/uptime`, no parameters, returns `UptimeResponse` with status 200. Router `backend/app/routers/uptime.py`, built like `backend/app/routers/version.py`: `router = APIRouter(prefix="/api", tags=["uptime"])`, one function `get_uptime(request: Request) -> UptimeResponse` decorated with `@router.get("/uptime", response_model=UptimeResponse)`. It reads the start captured at startup from `request.app.state.process_start` and returns `UptimeResponse(uptime_seconds=uptime_service.get_uptime_seconds(process_start), started_at=process_start.started_at)`. No business logic in the router.
- Service layer: `backend/app/services/uptime_service.py`, following the `version_service.py` shape (module docstring naming TEST-07, module-level logger only if used):
  - `ProcessStart`: a frozen stdlib `dataclass` with `started_at: datetime` (timezone-aware, UTC) and `monotonic_origin: float`.
  - `capture_process_start() -> ProcessStart`: reads `datetime.now(timezone.utc)` and `time.monotonic()` once each and returns them together. Called exactly once per application instance, from `lifespan` (criterion 3).
  - `get_uptime_seconds(process_start: ProcessStart, now_monotonic: float | None = None) -> float`: returns `now_monotonic - process_start.monotonic_origin`, with `now_monotonic` defaulting to `time.monotonic()` read at call time, clamped at `0.0` so the non-negative contract of criterion 2 also holds for an injected clock earlier than the origin. Using the monotonic clock rather than subtracting wall-clock datetimes is what keeps the value non-negative and increasing across wall-clock adjustments (criterion 2). The optional parameter exists for unit tests; the router never passes it.
- Startup capture: in `backend/app/main.py`, the first statement of the existing `lifespan` function becomes `app.state.process_start = uptime_service.capture_process_start()`, before the `DATABASE_URL` check, so the start is recorded whether or not a database is configured, and the lifespan docstring gains one sentence saying so. Nothing recomputes it per request (criterion 3). Consequence recorded for the builder: the value exists only once lifespan has run, which every existing test already ensures (the conftest `client` fixture and every ad hoc client use `with TestClient(...)`); new tests must do the same.
- Schema: `backend/app/schemas/uptime.py` holds `class UptimeResponse(BaseModel)` with docstring naming the endpoint (shape of `backend/app/schemas/version.py`) and two fields (criterion 4):
  - `uptime_seconds: float = Field(ge=0)`: the bound is declared, so the published schema says `minimum: 0` and a negative value can never be serialised (criterion 2).
  - `started_at: UtcTimestamp`, where `UtcTimestamp` is a module-level `Annotated` alias over Pydantic `AwareDatetime` (a naive datetime is rejected at validation) carrying, in this order, a `PlainSerializer` that converts the value with `.astimezone(timezone.utc).isoformat()` (`return_type=str`, `when_used="json"`) and a `WithJsonSchema` override declaring type string with format date-time. The serializer is what gives the explicit `+00:00` offset criterion 3 asks for (Pydantic default JSON output for UTC is a `Z` suffix, and `+00:00` is what the earlier build and its tracker comment specified); the override is what keeps `format: date-time` in `/openapi.json`, which the tracker comment of 2026-09-14 found lost when only a `-> str` serializer was present. The OpenAPI integration test is the arbiter of that claim.
- Registration: `backend/app/main.py` gains `from app.routers.uptime import router as uptime_router` and `from app.services import uptime_service` beside the existing imports, `app.include_router(uptime_router)` after `app.include_router(echo_router)` in `create_app()`, and one clause in the module docstring naming TEST-07 as registering the uptime router and capturing the process start. CORS needs no change: `allow_methods` already includes `GET`.
- Repository layer: none (no data access).
- Migrations: none.
- Out of scope (not in the criteria, so not built): a human-readable duration, a per-worker or container identifier, restart counters, any other method on `/api/uptime`, any frontend display, adding uvicorn workers.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response 200: `UptimeResponse`, a JSON object with exactly two keys: `uptime_seconds`, a non-negative JSON number of seconds since startup (fractional, as computed; no rounding), and `started_at`, an ISO 8601 string in UTC ending in the explicit offset `+00:00`, identical on every call to the same running process. Example:
```json
{"uptime_seconds": 42.517, "started_at": "2026-10-17T09:15:02.123456+00:00"}
```
- Published schema (`/openapi.json`, `components.schemas.UptimeResponse`): `uptime_seconds` of type number with `minimum` 0; `started_at` of type string with `format` date-time; both required.
- Error responses: none produced by this endpoint for a GET. A method other than GET answers FastAPI's standard 405. Never 500 once lifespan has run.

## Technology Selection
- Process start capture and uptime computation (`backend/app/services/uptime_service.py`): chose the standard library, `time.monotonic()` for elapsed time and `datetime.now(timezone.utc)` for the wall-clock start, over any installed or new dependency (none is needed) and over subtracting two wall-clock datetimes, because the monotonic clock is the stdlib facility that cannot go backwards, which is what criterion 2 requires.
- `ProcessStart` value object: chose a frozen stdlib `dataclass` over a Pydantic model, because it is internal state never serialised and a dataclass is the lightest stdlib carrier.
- Startup hook: chose the FastAPI `lifespan` context manager already present in `backend/app/main.py` over module-import-time capture (the earlier incarnation) and over a new startup mechanism, because lifespan is the framework's own startup event, runs once per application instance, and already exists.
- `UptimeResponse` schema (`backend/app/schemas/uptime.py`): chose a Pydantic `BaseModel` with `Field(ge=0)`, `AwareDatetime`, `PlainSerializer` and `WithJsonSchema`, all in the installed Pydantic 2.13.4, over a bare dict or a custom serialisation helper, because criterion 4 names a Pydantic schema and these declarative annotations give the bound, the `+00:00` offset and the published `format: date-time` without hand-written code.
- `GET /api/uptime` router (`backend/app/routers/uptime.py`): chose FastAPI `APIRouter`, already installed (FastAPI 0.139.2), matching the four existing routers; no alternative is needed.
- New dependencies: none. Tests use `pytest`, `fastapi.testclient.TestClient` (needs `httpx`, already a dev dependency) and the stdlib `time.sleep` and `datetime.fromisoformat`.

## File Manifest
### New files
- [B] backend/app/services/uptime_service.py: `ProcessStart` frozen dataclass, `capture_process_start()`, `get_uptime_seconds()` on the monotonic clock with a 0.0 floor.
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema (`uptime_seconds` float with `ge=0`, `started_at` as the `UtcTimestamp` annotated alias serialising with a `+00:00` offset and publishing `format: date-time`).
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `request.app.state.process_start`, `response_model=UptimeResponse`.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for `capture_process_start` and `get_uptime_seconds` (injected clock values).
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for `UptimeResponse` serialisation (`+00:00` offset, non-UTC aware input normalised to UTC, naive datetime and negative uptime rejected).
- [B] backend/tests/integration/test_uptime_integration.py: integration tests through the test client for criteria 1 to 3 and the published OpenAPI schema.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus the stable-across-calls edge case.
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-07/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: capture `app.state.process_start` as the first statement of `lifespan`, import and register the uptime router after the echo router, docstring clauses naming TEST-07.
- [B] backend/tests/unit/test_main_unit.py: add a test that `create_app()` registers `/api/uptime` and that its route's `response_model` is `app.schemas.uptime.UptimeResponse` (criterion 4).

No E2E spec (`[D]`) is listed: no acceptance criterion requires navigation or interaction through the UI (see Criterion coverage), so `e2e/tests/` gets no file for this item.
No lockfile entry: the feature adds and changes no dependency, so neither `backend/uv.lock` nor `frontend/package-lock.json` changes.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: `README.md` lists no endpoints, and the feature changes no project structure, run configuration, dependency or test infrastructure (one endpoint inside the existing routers, schemas and services packages, tests in the existing directories).

## Testing Strategy
Tier selection per `testing_standards.md` Section 6: the feature adds service-layer logic (unit warranted for `uptime_service.py`, plus the schema serialisation rule) and an API endpoint (integration warranted); it touches no repository, model or migration; and no criterion involves navigation or interaction through the UI (E2E not warranted for any criterion).

- Unit tests (named per `testing_standards.md` Section 3; each tested function gets a happy path, an edge case and an error case per Section 1.1):
  - `test_uptime_service_unit.py`: `test_capture_process_start_returns_utc_aware_start` (happy: `started_at.tzinfo` is UTC, `monotonic_origin` is a float); `test_get_uptime_seconds_returns_elapsed_monotonic_time` (happy: origin 100.0, now 142.5 gives 42.5); `test_get_uptime_seconds_at_origin_returns_zero` (edge: now equal to origin gives 0.0); `test_get_uptime_seconds_with_clock_before_origin_returns_zero` (error case: now 99.0 against origin 100.0 is clamped to 0.0, never negative); `test_get_uptime_seconds_defaults_to_current_monotonic_clock` (monkeypatch `uptime_service.time.monotonic` to return a fixed value, assert it is used).
  - `test_uptime_schema_unit.py`: `test_uptime_response_serialises_started_at_with_utc_offset` (happy: JSON mode dump of a UTC datetime ends in `+00:00`); `test_uptime_response_normalises_non_utc_aware_started_at_to_utc` (edge: a `+02:00` input serialises as the same instant with `+00:00`); `test_uptime_response_rejects_naive_started_at` and `test_uptime_response_rejects_negative_uptime_seconds` (error: `pydantic.ValidationError`).
  - `test_main_unit.py`: `test_create_app_registers_uptime_route_with_uptime_response_model`, reusing the file's `_collect_route_paths`, `_find_route` and `BUILT_IN_ROUTE_PATHS` (criterion 4).
  - Directory: backend/tests/unit/
  - Naming: test_<module>_unit.py
- Integration tests (`test_uptime_integration.py`, full HTTP cycle; no database fixture, the endpoint touches no database):
  - `test_get_uptime_returns_200_with_uptime_and_started_at` (criteria 1 and 4): status 200, body keys are exactly `uptime_seconds` and `started_at`, `uptime_seconds` is an int or float, `started_at` parses with `datetime.fromisoformat` and has a zero UTC offset.
  - `test_get_uptime_seconds_is_non_negative_and_increases_a_second_apart` (criterion 2): first call, `time.sleep(1.0)`, second call; both values at least 0, and the second exceeds the first by at least 1.0. The one-second sleep is the criterion's own wording and is the only real wait in the file.
  - `test_get_uptime_started_at_is_stable_across_requests` (criterion 3): two calls return byte-identical `started_at` strings, and that string ends in `+00:00`.
  - `test_get_uptime_started_at_is_captured_at_startup` (criterion 3): with `with TestClient(create_app()) as fresh_client`, the response `started_at` equals `fresh_client.app.state.process_start.started_at` serialised, and lies no later than a UTC timestamp taken right after entering the client context (captured at startup, not at request time).
  - `test_openapi_declares_uptime_response_schema` (criteria 2 to 4): `/openapi.json` shows the 200 response of `GET /api/uptime` referencing `UptimeResponse`, `uptime_seconds` as type number with `minimum` 0, and `started_at` as type string with `format` date-time, both required.
  - `test_post_uptime_returns_405_method_not_allowed`: the only reachable error case, as in `test_version_integration.py`.
  - Directory: backend/tests/integration/
  - Naming: test_<module>_integration.py
- E2E tests: not warranted for this feature. E2E Tests is ENABLED, but `testing_standards.md` Section 6's fourth question, asked per criterion, answers no for all four: each is an HTTP status, payload or startup behaviour of an endpoint no UI consumes, and an E2E spec calling the API directly is a router integration test by Section 5's anti-pattern list. No spec is produced, and the per-feature edge-case spec obligation does not attach (Section 4 scopes the E2E row to criteria assigned to E2E). Same as the backend-only precedents TEST-02 and TEST-06.
  - Directory: e2e/tests/ (no file for this item)
  - File: none (would have been TEST-07_uptime_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus the stable-across-calls edge case, phrased as HTTP requests and responses (no UI steps); manual script and its artifact copy expanded from the Manual verification plan below.
  - Directory: e2e/uat/scenarios/ (scenarios), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` (number) and `started_at` (ISO 8601 UTC) | Integration | Verifying it needs no navigation or interaction: it is a router response over the real HTTP cycle, and no UI calls the endpoint |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration | Verifying it needs no navigation or interaction: it is two timed HTTP calls; the non-negative floor is also unit-tested on the service |
| 3 | `started_at` captured once at startup, not per request, serialised in UTC with explicit offset | Integration | Verifying it needs no navigation or interaction: it is a startup-hook and serialisation behaviour, observed by comparing calls against the captured app state; offset handling is also unit-tested on the schema |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a structural property of the route (its declared `response_model`), with the published schema also asserted by the OpenAPI integration test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime, Then the response is HTTP 200 and the body has exactly the keys uptime_seconds (a number) and started_at (an ISO 8601 string) |
| 2 | Non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime twice one second apart, Then both uptime_seconds values are at least 0 and the second is at least 1 greater than the first |
| 3 | `started_at` captured once at startup, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime twice, Then started_at is identical in both responses and ends in +00:00; edge case: after a backend restart started_at changes and uptime_seconds starts again near 0 |
| 4 | Body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When a client opens the OpenAPI document, Then the 200 response of GET /api/uptime references the schema UptimeResponse with uptime_seconds (number, minimum 0) and started_at (string, format date-time) |

## Manual verification plan
No acceptance criterion is verifiable through the UI: no frontend screen calls `GET /api/uptime`. Each block below therefore gives the observable check instead, an HTTP request made with `curl` in a terminal (or the same URL pasted into a browser address bar) and the exact fields to read.

Shared prerequisites for every block: Docker and Docker Compose running; the repository on branch `feature/TEST-07-uptime-endpoint`; from the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running. The backend answers on `http://localhost:8010` (the host port `docker-compose.yml` publishes). A terminal with `curl`.

### Criterion 1: GET /api/uptime returns 200 with uptime_seconds (number) and started_at (ISO 8601 UTC string)
Prerequisites: shared prerequisites above.
1. In a terminal, run `curl -i http://localhost:8010/api/uptime` and read the first response line: it reads `HTTP/1.1 200 OK`.
2. Read the `content-type` header of the same response: it is `application/json`.
3. Read the response body: a JSON object with exactly two keys, `uptime_seconds` and `started_at`, and nothing else.
4. Read `uptime_seconds`: a plain number without quotes, for example `12.84` (fractional digits are expected).
5. Read `started_at`: a quoted string shaped like `2026-10-17T09:15:02.123456+00:00`, a date, the letter `T`, a time, and an offset.
6. Paste `http://localhost:8010/api/uptime` into a browser address bar: the page shows the same two-key JSON object.

### Criterion 2: uptime_seconds is non-negative and increases between two calls a second apart
Prerequisites: shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/uptime` and note the `uptime_seconds` value, for example `30.2`: it is 0 or greater, never negative.
2. Wait about one second, then run the same command again and note the new `uptime_seconds` value: it is at least 1 greater than the value from step 1 (for example `31.3` or more).
3. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` to make the two calls exactly a second apart: the second line shows an `uptime_seconds` at least 1 greater than the first line.

### Criterion 3: started_at is captured once at application startup, not per request, and serialised in UTC with an explicit offset
Prerequisites: shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/uptime` and copy the full `started_at` string.
2. Wait a few seconds and run the same command again: `started_at` is character-for-character identical to step 1, while `uptime_seconds` has grown. It is not recomputed per request.
3. Read the end of the `started_at` string: it ends in `+00:00`, the explicit UTC offset (not `Z`, and not a missing offset).
4. Compare `started_at` with the current UTC time from `date -u +%Y-%m-%dT%H:%M:%S`: `started_at` is earlier, by roughly `uptime_seconds` seconds.
5. Restart the backend with `docker compose restart backend`, wait until `docker compose ps` shows it running again, and repeat step 1: `started_at` is a new, later value and `uptime_seconds` has started again near 0. The value is set when the application starts.

### Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/
Prerequisites: shared prerequisites above.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime`: the 200 response schema is named `UptimeResponse`, with `uptime_seconds` (number, minimum 0) and `started_at` (string, format date-time), both required.
2. Open `backend/app/schemas/uptime.py`: it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`.
3. Open `backend/app/routers/uptime.py`: the route decorator names `response_model=UptimeResponse` and the handler returns an `UptimeResponse`, not a dict literal.
4. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_uptime_integration.py tests/unit/test_uptime_service_unit.py tests/unit/test_uptime_schema_unit.py tests/unit/test_main_unit.py`: the summary line reports `0 failed`.
