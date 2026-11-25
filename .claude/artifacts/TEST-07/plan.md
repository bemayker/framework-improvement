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
- Comment (tracker, 2026-09-14, earlier `/deliver` build, PR #39): "GET /api/uptime returns {"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC +00:00>"} ... It claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare {"type": "string"} ... started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers." → Not acted on as a correction: it reports on a build that is no longer on the tree (no uptime file exists in `backend/app/` on this branch, checked) and asks for no change to the description. Read as information, it agrees with three choices this plan makes on its own grounds and records here so the builder does not rediscover them: (a) `started_at` goes out with the numeric `+00:00` offset (see Assumptions); (b) the UAT script and Gherkin must not claim the OpenAPI schema documents `started_at` as `format: date-time`, because a `field_serializer` returning `str` makes the serialisation-mode schema a bare string; (c) the multi-worker residual is recorded under Assumptions.
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 ... Code revert pending ... Do not run /deliver against this item until that revert has merged." → Not acted on: the precondition holds on this branch. `origin/main` (6c3179ea) has no `backend/app/routers/uptime.py`, `schemas/uptime.py` or `services/uptime_service.py`, and `backend/app/main.py` registers only the version, notes and health routers.
- Comment (tracker, 31 comments): the framework's own "PR opened for TEST-07" link comments from earlier runs, all on closed PRs → Not acted on: they carry no requirement.

### Assumptions (scope decisions, no scope added)
- "Explicit offset" is read as the numeric `+00:00`, not the `Z` designator. Pydantic 2.13 (pinned in `backend/uv.lock`) serialises a UTC-aware `datetime` as `...Z` by default, so the schema carries a `field_serializer` that emits `isoformat()` of the UTC value (`2026-11-25T01:45:47.123456+00:00`). Both forms are valid ISO 8601 UTC; `+00:00` is the stricter reading of "explicit offset".
- "Captured once at application startup" is implemented as two module-level constants in `backend/app/services/uptime_service.py`, set when the module is first imported: `STARTED_AT = datetime.now(timezone.utc)` and `STARTED_MONOTONIC = time.monotonic()`. `app.main` imports the router, which imports the service, when uvicorn loads the app at process start (`backend/Dockerfile`: a single `uvicorn app.main:create_app --factory` process, no `--workers`). Rejected alternative: setting it in `main.py`'s `lifespan` on `app.state`. That couples a second edit into the shared `lifespan`, and a request served without the lifespan having run (a `TestClient` used outside its context manager) would 500 on missing state.
- Recorded residual, not a defect today: if the deployment ever gains `--workers N`, each worker captures its own values and calls landing on different workers would report different `started_at`. Out of scope; no criterion covers multi-process deployment.
- `uptime_seconds` is computed from `time.monotonic()`, not from wall-clock subtraction against `started_at`, so an NTP step backward cannot make it decrease (criterion 2). It is a float in seconds, not rounded: the criterion says `<number>`, and rounding to whole seconds could make two calls one second apart look equal at a boundary.
- No `/api/uptime` frontend consumer, no auth, no caching header: none is asked for.

## Plan Overview
Backend only. One read-only endpoint, `GET /api/uptime`, built in the same Router → Service → Schema shape as the existing `GET /api/version` (`backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`). No repository or database layer: the feature has no persistence. The service owns the startup capture and the elapsed-time computation; the schema owns validation (aware datetime only) and the `+00:00` wire format; the router only maps service output to the schema. One line added to `create_app()` in `backend/app/main.py` registers the router. No new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, which returns process uptime and the startup timestamp. Router `backend/app/routers/uptime.py`: `router = APIRouter(prefix="/api", tags=["uptime"])`, `@router.get("/uptime", response_model=UptimeResponse)`, handler `get_uptime() -> UptimeResponse` that calls `uptime_service.get_uptime()` and builds `UptimeResponse(uptime_seconds=report.uptime_seconds, started_at=report.started_at)`. No business logic in the router.
- Service layer: `backend/app/services/uptime_service.py`. Module docstring states why the values are module-level (captured once at process start, see Assumptions). Contents: `from time import monotonic` (imported by name so unit tests can monkeypatch `uptime_service.monotonic`); `STARTED_AT: datetime = datetime.now(timezone.utc)`; `STARTED_MONOTONIC: float = monotonic()`; a frozen dataclass `UptimeReport(uptime_seconds: float, started_at: datetime)`; `get_uptime() -> UptimeReport` returning `UptimeReport(uptime_seconds=monotonic() - STARTED_MONOTONIC, started_at=STARTED_AT)`. Monotonic time never goes backward, so the value is non-negative by construction; no clamp is added (it would be dead code).
- Schema: `backend/app/schemas/uptime.py`. `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime` (pydantic, rejects a naive datetime). `@field_serializer("started_at", when_used="json")` returns `value.astimezone(timezone.utc).isoformat()`, so a non-UTC aware value is normalised to UTC and the wire format always ends in `+00:00`. Docstring notes that the serializer's `str` return makes the OpenAPI serialisation schema a plain string (no `format: date-time`), which is accepted and must not be described otherwise in UAT artifacts.
- Registration: `backend/app/main.py` gains `from app.routers.uptime import router as uptime_router` beside the other router imports and `app.include_router(uptime_router)` after `health_router`. The module docstring's list of registered routers gains "TEST-07 the uptime router". No other change to `main.py` (lifespan and CORS untouched; `GET` is already in `allow_methods`).
- Repository layer: none (no persistence).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no path, query or body parameters.
- Response: `200 OK`, `application/json`:

```json
{"uptime_seconds": 1234.567891, "started_at": "2026-11-25T01:45:47.123456+00:00"}
```

  `uptime_seconds`: number (float), ≥ 0, grows with process lifetime. `started_at`: string, ISO 8601, always UTC with the `+00:00` offset, identical on every response for the life of the process. Any other method on the path returns FastAPI's `405 Method Not Allowed`.

## Technology Selection
- Elapsed-time source: chose stdlib `time.monotonic()` over wall-clock `datetime.now()` subtraction (also stdlib) and over `psutil` process create time (a new dependency), because only a monotonic clock guarantees criterion 2's "increases" across an NTP step, and the stdlib covers it.
- Startup timestamp: chose stdlib `datetime.now(timezone.utc)` captured at module import; no alternative needed.
- `UptimeResponse` schema: chose pydantic `BaseModel` with `AwareDatetime` and a `field_serializer` (pydantic is already installed as a FastAPI dependency) over a plain `str` field formatted in the router, because the schema then validates timezone-awareness itself and owns the wire format in one place (criterion 4).
- Uptime router: chose FastAPI `APIRouter` (installed) following the existing version router; no alternative considered.
- No new dependency is added, so `backend/pyproject.toml` and `backend/uv.lock` are untouched.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema, `AwareDatetime` plus `+00:00` serializer
- [B] backend/app/services/uptime_service.py: startup capture (`STARTED_AT`, `STARTED_MONOTONIC`), `UptimeReport`, `get_uptime()`
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for `uptime_service` with a fake monotonic clock
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for `UptimeResponse` serialisation and validation, and the route's declared response model
- [B] backend/tests/integration/test_uptime_integration.py: router integration tests over the full HTTP cycle
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register `uptime_router` in `create_app()`; docstring router list
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route`

No lockfile changes: the feature adds no dependency. No `README.md` or `docs/DEVELOPMENT.md` edit: neither lists endpoints, and the feature changes no project structure, run configuration, dependency or test infrastructure. No E2E spec under `e2e/tests/`: no criterion needs UI navigation or interaction (see Criterion coverage).

## Testing Strategy
- Unit tests: `uptime_service` (elapsed computation against a monkeypatched `uptime_service.monotonic` and `STARTED_MONOTONIC`, non-negative at zero elapsed, same `STARTED_AT` on repeated calls, `STARTED_AT` is UTC-aware) and `UptimeResponse` (serialises `+00:00`, normalises a non-UTC aware value to UTC, rejects a naive datetime with `ValidationError` as the error case, the route declares `UptimeResponse` from `app.schemas.uptime` as its response model). App factory: the uptime route is registered.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`, `test_uptime_schema_unit.py`)
- Integration tests: `GET /api/uptime` through the session `client` fixture in `backend/tests/conftest.py`: 200 with exactly the two keys and their types; `uptime_seconds` grows across two requests separated by `time.sleep(1.0)` (a real one-second gap, mirroring criterion 2's wording; acceptable in this tier, the no-hardcoded-wait rule is an E2E convention); `started_at` identical across requests and ending in `+00:00`; `POST /api/uptime` returns 405 (the only reachable error case: the endpoint takes no input). The endpoint needs no database; the tests use the existing `client` fixture and no DB fixture.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (`test_uptime_integration.py`)
- E2E tests: none for this feature. The toggle is ENABLED, but no frontend renders `/api/uptime` and no criterion involves navigation or interaction, so the tier is not warranted (testing_standards.md Section 6, fourth question asked per criterion).
- UAT scenarios: one Gherkin scenario per criterion plus one edge-case scenario (the uptime value resets after a backend restart), verified through HTTP responses since there is no UI.
  - Directory: e2e/uat/scenarios/ (scripts in e2e/uat/scripts/)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | `test_get_uptime_returns_200_with_uptime_seconds_and_started_at`, `test_post_uptime_returns_405_method_not_allowed` | No UI consumes the endpoint; verifying it needs no navigation or interaction, it is a router behaviour |
| 2 | `uptime_seconds` non-negative and increases between two calls a second apart | Integration | `test_get_uptime_seconds_increases_between_calls_one_second_apart`, `test_get_uptime_returns_non_negative_seconds_when_no_time_elapsed`, `test_get_uptime_increases_by_elapsed_monotonic_seconds` | A clock property of the service and router; needs no navigation or interaction (the last two ids are unit tests with a fake clock) |
| 3 | `started_at` captured once at startup, UTC with explicit offset | Integration | `test_get_uptime_started_at_is_identical_across_requests`, `test_get_uptime_started_at_has_explicit_utc_offset`, `test_get_uptime_reports_the_same_started_at_on_repeated_calls`, `test_started_at_is_timezone_aware_utc`, `test_uptime_response_serialises_started_at_with_explicit_utc_offset`, `test_uptime_response_converts_non_utc_started_at_to_utc` | Capture-once and serialisation are service and schema behaviour; needs no navigation or interaction |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_uptime_route_declares_uptime_response_schema`, `test_uptime_response_rejects_naive_started_at`, `test_create_app_registers_uptime_route` | A structural property of the code (route response model and schema validation); needs no navigation or interaction |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When an operator requests GET /api/uptime, Then the status is 200 and the body has exactly `uptime_seconds` (number) and `started_at` (string) |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When the operator requests GET /api/uptime twice about a second apart, Then both values are ≥ 0 and the second is greater than the first |
| 3 | `started_at` captured once, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When the operator requests GET /api/uptime twice, Then `started_at` is identical in both and ends in `+00:00`; edge case: When the backend is restarted, Then `started_at` is later than before and `uptime_seconds` is small again |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the repository at this branch, When the schema unit tests are run, Then they pass and `backend/app/schemas/uptime.py` defines `UptimeResponse` |

## Manual verification plan
No criterion is verifiable through the UI: no frontend consumes `GET /api/uptime`. The observable check is the HTTP response itself, read with `curl` against the Docker Compose stack, whose backend listens on host port 8010 (`backend/Dockerfile`, `docker-compose.yml`).

Prerequisites for all criteria: Docker and Docker Compose running; this branch checked out; from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows the `backend` service running and `db` healthy; a terminal with `curl`.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: stack up as above.
1. Run `curl -i http://localhost:8010/api/uptime` → the first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the response body → it is one JSON object with exactly two keys, for example `{"uptime_seconds":42.318904,"started_at":"2026-11-25T01:45:47.123456+00:00"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted string.
3. Run `curl -i -X POST http://localhost:8010/api/uptime` → `HTTP/1.1 405 Method Not Allowed`.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: stack up as above.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` → two JSON bodies print.
2. Compare the two `uptime_seconds` values → both are ≥ 0, and the second is greater than the first by roughly 1 (for example `42.31` then `43.32`).

### Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset
Prerequisites: stack up as above.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → the `started_at` string is character-for-character identical in both responses, while `uptime_seconds` differs.
2. Read the end of `started_at` → it ends in `+00:00` (not `Z`, and not a local offset such as `+01:00`).
3. Run `docker compose restart backend`, wait until `docker compose ps` shows it running, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is now later than the value from step 1, and `uptime_seconds` is small (a few seconds), showing a restart is distinguishable from a long-lived process.
4. Do not check the OpenAPI document for `format: date-time` on `started_at`: the generated schema shows it as a plain string, which is expected (see Re-Plan Feedback).

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Not verifiable through the UI; the observable checks are the source file and its unit tests.
1. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`.
2. Open `backend/app/routers/uptime.py` → the `GET /uptime` route declares `response_model=UptimeResponse`, imported from `app.schemas.uptime`.
3. From the repository root run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
