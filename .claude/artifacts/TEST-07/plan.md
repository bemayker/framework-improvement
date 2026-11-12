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
- Comment (tracker, 2026-09-14): "PR opened for TEST-07 ... GET /api/uptime returns {"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC +00:00>"} ... the field_serializer's -> str return annotation ... AwareDatetime's format never reaches the document ... started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers" → Addressed by: no change to the acceptance criteria (the comment reports an earlier build on a sandbox that has since been reset; no uptime code exists on this branch, checked). Two of its observations are carried as design inputs: (a) the UAT script and Manual verification plan must not claim the OpenAPI document shows `format: date-time` for `started_at`, because a `-> str` field serializer makes the serialisation schema a bare string; this plan states that explicitly under Criterion 4. (b) The multi-worker residual is recorded as a known limitation, not fixed: capture happens in `create_app()` (per app instance), and the Dockerfile runs one uvicorn process with `--factory` and no `--workers`, so one process holds one stamp. Adding a cross-process start time is out of scope (`user_story_alignment.md` Section 3).
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Do not run /deliver against this item until that revert has merged." → Not acted on because its precondition is already met on this branch: `backend/` contains no uptime router, schema, service or test, and `backend/app/main.py` registers only the version, notes and health routers (read at b7f2644). The plan builds the feature from nothing.
- Comment (tracker, 22 earlier comments): "mayker-dev: PR opened for TEST-07 — {url} ... draft plan PR for review" → Not acted on because they are framework PR-link notices for closed or reverted PRs and request nothing.

## Plan Overview
Backend only. Add `GET /api/uptime` following the existing version and health slices: a router in `backend/app/routers/uptime.py`, a response schema in `backend/app/schemas/uptime.py`, and a small service in `backend/app/services/uptime_service.py` holding the startup stamp and the uptime arithmetic. `create_app()` in `backend/app/main.py` captures the startup stamp once per application instance into `app.state.startup` and registers the router. No database, no repository, no migration, no frontend, no external API.

Key decisions:
- `started_at` is captured in `create_app()`, not per request and not at module import. That is the application's startup in this codebase: uvicorn runs `app.main:create_app --factory` (Dockerfile), so the served app is created exactly once at process start, and each `create_app()` call in tests gets its own independent stamp (keeps `test_create_app_returns_independent_instances` meaningful). The lifespan hook was considered and rejected: it fires only when a server or a `with TestClient(...)` context runs, so an app used outside one would have no stamp and answer 500.
- `uptime_seconds` is computed from `time.monotonic()` against a monotonic reading taken at the same moment as `started_at`, never from `datetime.now() - started_at`: a wall-clock adjustment (NTP step, DST is irrelevant in UTC but NTP is not) must not make uptime go backwards or negative. It is a float, clamped at `0.0`.
- `started_at` is serialised as `datetime.isoformat()` on a UTC-aware value, giving `+00:00` (e.g. `2026-11-12T21:36:19.123456+00:00`). Pydantic's default for UTC is a trailing `Z`; the criterion says "explicit offset", so `+00:00` is chosen (assumption, see Backend Plan).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns the process's uptime and its startup time. Router `backend/app/routers/uptime.py`: `router = APIRouter(prefix="/api", tags=["uptime"])`, `@router.get("/uptime", response_model=UptimeResponse)`, handler `get_uptime(request: Request) -> UptimeResponse` reads `request.app.state.startup` and returns `UptimeResponse(uptime_seconds=uptime_service.compute_uptime_seconds(stamp), started_at=stamp.started_at)`. No request input, so the only reachable error is 405 for other methods.
- Service layer: `backend/app/services/uptime_service.py`:
  - `@dataclass(frozen=True) class StartupStamp` with `started_at: datetime` (UTC-aware) and `started_monotonic: float`.
  - `capture_startup() -> StartupStamp`: reads `datetime.now(timezone.utc)` and `time.monotonic()` once each.
  - `compute_uptime_seconds(stamp: StartupStamp, now_monotonic: float | None = None) -> float`: `now_monotonic` defaults to `time.monotonic()`; returns `max(0.0, now_monotonic - stamp.started_monotonic)`. The parameter exists so unit tests drive the clock without sleeping or patching module globals.
- Schema: `backend/app/schemas/uptime.py`: `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus `@field_serializer("started_at") def _serialise_started_at(self, value: datetime) -> str: return value.astimezone(timezone.utc).isoformat()`. `AwareDatetime` rejects a naive datetime at construction, so a code path that ever passes one fails loudly instead of emitting an offset-less string. Assumption recorded for the PR description: "explicit offset" is read as `+00:00`, not `Z`. Consequence to state honestly in the UAT script: the generated OpenAPI schema shows `started_at` as `{"type": "string"}` without `format: date-time`, because the serializer's `-> str` annotation drives the serialisation schema. This is accepted, not fixed.
- App factory: `backend/app/main.py`: import `router as uptime_router` and `capture_startup`; in `create_app()` set `app.state.startup = capture_startup()` right after `FastAPI(...)` is constructed, and add `app.include_router(uptime_router)` after the existing three. Update the module docstring's list of registering features to include TEST-07. Nothing else in the factory changes.
- Repository layer: none (no data access).
- Migrations: none.
- Known limitation (not in scope): under multiple uvicorn workers each worker process would hold its own stamp, so successive calls could alternate `started_at` values. The current Dockerfile runs a single process.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: `200 OK`, `application/json`, schema `UptimeResponse`:

```json
{"uptime_seconds": 42.517, "started_at": "2026-11-12T21:36:19.123456+00:00"}
```

  `uptime_seconds`: float, `>= 0`, seconds since `started_at` measured on a monotonic clock. `started_at`: ISO 8601 string, always UTC, always ending `+00:00`, identical on every response from the same process.
- Errors: any other method on `/api/uptime` returns `405 Method Not Allowed` (FastAPI default).

## Technology Selection
- Uptime service (`uptime_service.py`): chose stdlib `time.monotonic()` for elapsed time and `datetime.now(timezone.utc)` for the stamp over `psutil.Process().create_time()` (not installed; a new dependency for two stdlib calls) and over wall-clock subtraction (`datetime.now() - started_at`, which can go negative or jump after a clock adjustment and so cannot guarantee criterion 2).
- Response schema (`UptimeResponse`): chose Pydantic (installed, 2.13.4 per `backend/uv.lock`) with `AwareDatetime`, `Field(ge=0)` and a `field_serializer` over a hand-built dict or manual timezone validation, because Pydantic already enforces both constraints and criterion 4 requires a Pydantic schema.
- Uptime router (`uptime.py`): FastAPI `APIRouter` (installed), the pattern the version and health routers already use; no stdlib or native alternative applies.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router.
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema with the UTC `+00:00` serializer.
- [B] backend/app/services/uptime_service.py: `StartupStamp`, `capture_startup()`, `compute_uptime_seconds()`.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service.
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for the schema's validation and serialisation.
- [B] backend/tests/integration/test_uptime_integration.py: HTTP request/response tests for `/api/uptime`.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: capture `app.state.startup` in `create_app()`, register `uptime_router`, docstring mentions TEST-07.
- [B] backend/tests/unit/test_main_unit.py: add route-registration and startup-capture tests for the factory.

No lockfile changes: no dependency is added or changed. No E2E spec file: no criterion's covering tier is E2E (see Criterion coverage). `README.md` and `docs/DEVELOPMENT.md` need no edit: neither lists the API's endpoints, and the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the service (`capture_startup` returns a UTC-aware stamp; `compute_uptime_seconds` returns elapsed monotonic time, grows with the clock, clamps a negative difference to `0.0`), the schema (serialises `started_at` with `+00:00`, converts a non-UTC aware value to UTC, rejects a naive datetime, rejects a negative `uptime_seconds`), and the factory (registers `/api/uptime`, stores one stamp per app instance).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/uptime` happy path with shape and types, monotonic increase across two calls one second apart, `started_at` stable across requests on one app, and `POST /api/uptime` returns 405. No database fixture is needed (uses the session `client` from `backend/tests/conftest.py`, or a fresh `create_app()` inside `with TestClient(...)` where a test needs its own stamp).
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No frontend consumes `/api/uptime` and no criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, asked per criterion below).
  - Directory: e2e/tests/
  - File: none for this feature (would be `TEST-07_uptime_endpoint.spec.ts`)
- UAT scenarios: one scenario per criterion plus one edge case (POST is rejected with 405), verified with `curl` against the running backend.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | `test_get_uptime_returns_200_with_uptime_and_started_at`, `test_post_uptime_returns_405_method_not_allowed`, `test_create_app_registers_uptime_route` | Verifying it needs no navigation or interaction: it is a router response shape, and no UI renders it |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration | `test_get_uptime_increases_between_calls_a_second_apart`, `test_compute_uptime_seconds_returns_elapsed_monotonic_time`, `test_compute_uptime_seconds_clamps_negative_difference_to_zero` | Verifying it needs no navigation or interaction: it is a property of two HTTP responses and of the service arithmetic |
| 3 | `started_at` captured once at startup, not recomputed per request, serialised in UTC with an explicit offset | Integration | `test_get_uptime_returns_same_started_at_across_requests`, `test_create_app_captures_one_startup_stamp_per_app`, `test_capture_startup_returns_utc_aware_started_at`, `test_uptime_response_serialises_started_at_with_utc_offset`, `test_uptime_response_converts_non_utc_started_at_to_utc` | Verifying it needs no navigation or interaction: it is app-factory state plus a serialisation rule |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_uptime_response_rejects_naive_started_at`, `test_uptime_response_rejects_negative_uptime_seconds`, `test_get_uptime_returns_200_with_uptime_and_started_at` | Verifying it needs no navigation or interaction: it is a schema definition, checked by validating the model and the response against it |

Test placement for the builder: `test_compute_uptime_seconds_*` and `test_capture_startup_*` in `backend/tests/unit/test_uptime_service_unit.py`; `test_uptime_response_*` in `backend/tests/unit/test_uptime_schema_unit.py`; `test_create_app_*` in `backend/tests/unit/test_main_unit.py`; `test_get_uptime_*` and `test_post_uptime_*` in `backend/tests/integration/test_uptime_integration.py`. The happy-path integration test validates the JSON body with `UptimeResponse.model_validate(...)` and asserts `started_at` ends with `+00:00`. The one-second test uses a real `time.sleep(1)` between the two calls, because the criterion is stated in real time; it is the only sleeping test.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with both fields | covered at Integration, see Criterion coverage | Given the backend is running, When I GET `/api/uptime`, Then the status is 200 and the body has `uptime_seconds` (number) and `started_at` (string) |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When I GET `/api/uptime` twice a second apart, Then both `uptime_seconds` are >= 0 and the second is larger |
| 3 | `started_at` captured once, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When I GET `/api/uptime` twice, Then `started_at` is identical and ends with `+00:00`; When the backend restarts, Then `started_at` is later and `uptime_seconds` is small again |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API docs, When I open `/docs`, Then `GET /api/uptime` lists the `UptimeResponse` response model |

## Manual verification plan
No frontend renders `/api/uptime`, so no criterion is verifiable by clicking through the UI. Every check below reads the HTTP response with `curl` in a terminal, against the stack started with `docker compose up -d --build` from the repository root (backend on `http://localhost:8010`).

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the stack is up (`docker compose ps` shows `backend` running), a terminal with `curl`.
1. Run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body of the same response → it is one JSON object with exactly two keys, `uptime_seconds` (a number such as `37.214`, no quotes) and `started_at` (a quoted string such as `"2026-11-12T21:36:19.123456+00:00"`).
3. Run `curl -i -X POST http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 405 Method Not Allowed`.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` → two JSON bodies print.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second exceeds the first by roughly 1 (between about 0.9 and 1.5, depending on request latency).

### Criterion 3: `started_at` is captured once at startup, not per request, and is UTC with an explicit offset
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` three times, a few seconds apart → the `started_at` string is byte-identical in all three responses while `uptime_seconds` grows.
2. Read the end of that `started_at` string → it ends in `+00:00` (not `Z`, and never without an offset).
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers, and run it once → `started_at` is now later than the value from step 1, and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the repository checked out, the stack up as for Criterion 1.
1. Open `backend/app/schemas/uptime.py` in an editor → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` → the 200 response lists the `UptimeResponse` schema with `uptime_seconds` (number) and `started_at` (string). The docs show `started_at` as a plain string without a `date-time` format, which is expected: the field's serializer returns a string.
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py` → the summary line shows `0 failed` for those four files.
