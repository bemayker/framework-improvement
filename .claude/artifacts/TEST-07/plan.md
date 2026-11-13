# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> **What:** `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> **Notes:** Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches `main.py`'s router registration, so it must not run concurrently with another backend item that does the same.
>
> Source: ClickUp task 123k99ctgcg (https://app.clickup.com/t/123k99ctgcg).

## Acceptance Criteria
- [ ] 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker, newest): "PR opened for TEST-07 ... GET /api/uptime returns {"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC +00:00>"}" → Addressed by: `started_at` is serialised with the numeric `+00:00` offset (via `datetime.isoformat()` on an aware UTC value), not Pydantic's default `Z` designator. Assumption: criterion 3's "explicit offset" means a numeric offset; `Z` is a designator, so `+00:00` is the reading that satisfies both interpretations.
- Comment (tracker, newest, same comment): "the OpenAPI schema documents started_at as ... a bare {"type": "string"}" → Addressed by: the plan keeps the `field_serializer(..., when_used="json")` approach and does NOT add a JSON-schema override (no criterion asks for an OpenAPI `format`). The UAT script and Gherkin scenarios must not claim `format: date-time` for `started_at`; they verify the wire value only.
- Comment (tracker, newest, same comment): "This item was held behind FEAT-1 ... both register a router in backend/app/main.py" → Not acted on in the plan body, because FEAT-1's code is not on main (`backend/app/main.py` at 385e1bb registers only version, notes and health). The serialization constraint against every other open item that registers a router in `main.py` is carried in `shared_risks.md`.
- Comment (tracker, newest, same comment): "started_at is captured at module import ... If the deployment ever gains workers, each child would capture its own value" → Addressed by: the start record is captured inside `create_app()` and stored on `app.state`, not at module import, so it is tied to the app instance the process serves (and tests get a fresh record per app). The multi-worker residual is unchanged in kind: each worker process is its own process with its own start time, which is the correct per-process answer, but responses from different workers would interleave. `backend/Dockerfile` launches a single uvicorn process with `--factory` and no `--workers`, so this is recorded, not engineered for (no criterion asks for cross-worker consistency).
- Comment (tracker, newest, same comment): "48 unit and 39 integration tests green" → Not acted on: a historical count about a branch that no longer exists; this plan carries no test counts.
- Comment (tracker, older): "Code revert pending ... Do not run /deliver against this item until that revert has merged." → Addressed by: checked against the code as it stands. On this branch (from origin/main 385e1bb) there is no `backend/app/routers/uptime.py`, no `backend/app/schemas/uptime.py`, no uptime service and no uptime registration in `main.py`, so the revert precondition holds and the plan builds every file from scratch.

## Plan Overview
Backend-only feature: one read-only endpoint, `GET /api/uptime`, following the existing Router → Service → Schema slice used by `/api/version` (TEST-05). No database, no repository, no migration, no frontend.

- A small service module captures a start record (aware UTC wall-clock `started_at` plus a `time.monotonic()` reading) and computes elapsed seconds from the monotonic clock, so a wall-clock adjustment can never make uptime negative or jump backwards.
- `create_app()` captures the start record once and stores it on `app.state.startup`; the router reads it from `request.app.state` per request and recomputes only `uptime_seconds`.
- A Pydantic `UptimeResponse` schema in `backend/app/schemas/uptime.py` defines the body: `uptime_seconds: float` constrained `>= 0`, `started_at: AwareDatetime` serialised to JSON as `isoformat()` (e.g. `2026-11-13T14:01:50.123456+00:00`).

Key decisions:
1. Capture in `create_app()`, not the lifespan hook: the existing `/api/health` integration test builds an unmanaged `TestClient` (no lifespan), and a start record that only exists after lifespan would 500 there. `create_app()` is what uvicorn's `--factory` calls once per process, so it is application startup.
2. Uptime from `time.monotonic()`, `started_at` from `datetime.now(UTC)`: two clocks, each for what it is good at. The service imports `monotonic` as a module attribute (`from time import monotonic`) so tests patch `uptime_service.monotonic` to advance the clock deterministically instead of sleeping.
3. `uptime_seconds` is a float, unrounded: "a number" in criterion 1, and rounding would break criterion 2's strict increase on fast successive calls in tests with a real clock.
4. No `test_main_unit.py` route assertion: the integration tests prove registration through real HTTP, and leaving that file untouched removes one shared-file conflict with the other router-registering items.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime` → 200 `UptimeResponse`; read-only, no parameters. Router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, handler `get_uptime(request: Request) -> UptimeResponse`, mirroring `backend/app/routers/version.py`. Registered in `backend/app/main.py` `create_app()` with `app.include_router(uptime_router)` after the existing three, and `app.state.startup = uptime_service.capture_startup()` set in `create_app()` before the routers are included. Update the module docstring's list of registering features with one TEST-07 line.
- Service layer: `backend/app/services/uptime_service.py`:
  - `StartupRecord`: frozen dataclass `started_at: datetime` (aware UTC), `started_monotonic: float`.
  - `capture_startup() -> StartupRecord`: `StartupRecord(started_at=datetime.now(UTC), started_monotonic=monotonic())`.
  - `get_uptime_seconds(record: StartupRecord) -> float`: `max(0.0, monotonic() - record.started_monotonic)`. The clamp guards a clock reading taken before the record (only possible with a patched or misbehaving clock); log a warning with context when it clamps, per the backend logging rule (no `print`).
  - No new exception classes: nothing in this path can fail under normal operation.
- Repository layer: none (no persistence).
- Migrations: none.
- Schema: `backend/app/schemas/uptime.py`: `class UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus `@field_serializer("started_at", when_used="json")` returning `value.astimezone(UTC).isoformat()`. The router builds it as `UptimeResponse(uptime_seconds=get_uptime_seconds(record), started_at=record.started_at)`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query or path parameters.
- Response: `200 OK`, `application/json`:

```json
{"uptime_seconds": 42.318, "started_at": "2026-11-13T14:01:50.123456+00:00"}
```

  `uptime_seconds`: JSON number, `>= 0`, seconds since the app instance was created. `started_at`: ISO 8601 string in UTC with the explicit `+00:00` offset, identical on every call to the same process. Any other method on the path returns `405 Method Not Allowed` (FastAPI default).

## Technology Selection
- Start-time and uptime clocks: chose stdlib `datetime.now(UTC)` and `time.monotonic()` over adding a dependency (for example `psutil` process create time), because the stdlib covers both and the endpoint reports the app instance's start, which the app itself records.
- `UptimeResponse` schema: chose Pydantic `BaseModel`, `Field(ge=0)` and `AwareDatetime` from the installed `pydantic` 2.13.4 (pulled in by FastAPI) over a hand-written validator, because the installed library already enforces non-negative and timezone-aware values.
- `+00:00` serialisation: chose Pydantic's `field_serializer` calling stdlib `datetime.isoformat()` over a custom JSON encoder or a new date library, because Pydantic's default emits `Z` and the stdlib call emits the numeric offset in one line.
- `uptime_service` module and `uptime` router: no stdlib call, native platform feature or installed dependency covers an app-specific endpoint, so they are built here as the existing Router → Service slice.

## File Manifest
### New files
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router, reads `request.app.state.startup`, returns `UptimeResponse`
- [B] backend/app/services/uptime_service.py: `StartupRecord`, `capture_startup()`, `get_uptime_seconds()`
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema with the `+00:00` JSON serializer
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service (capture, elapsed time, advancing clock, clamp)
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for the schema (offset serialisation, negative rejected, naive rejected, module location)
- [B] backend/tests/integration/test_uptime_integration.py: HTTP round-trip tests for `/api/uptime`
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the uptime router, capture `app.state.startup` in `create_app()`, add TEST-07 to the module docstring
No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is touched.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints.

## Testing Strategy
- Unit tests: service layer (`capture_startup` returns an aware UTC `started_at`; `get_uptime_seconds` returns elapsed monotonic time, increases as the clock advances, clamps to 0 when the clock reads before the start) and schema (`started_at` serialises with `+00:00`, negative `uptime_seconds` rejected, naive `started_at` rejected, schema lives in `app.schemas.uptime`). Clock is controlled by monkeypatching `uptime_service.monotonic`; no sleeps.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`, `test_uptime_schema_unit.py`)
- Integration tests: full HTTP cycle through the session `client` fixture from `backend/tests/conftest.py`: 200 with both fields; strict increase between two calls with the clock advanced 1.0 s via `monkeypatch.setattr(uptime_service, "monotonic", ...)` returning `client.app.state.startup.started_monotonic + 1.0` then `+ 2.0`; identical `started_at` across two calls; `started_at` parses with `datetime.fromisoformat` to a UTC offset of zero and ends in `+00:00`; OpenAPI 200 response references the `UptimeResponse` component; `POST /api/uptime` returns 405. No database fixture is used: the endpoint needs no database.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. E2E is ENABLED, but no criterion involves navigation or interaction through the UI (the feature adds no UI), so every criterion is covered at integration or unit tier (`testing_standards.md` Section 6, fourth question, asked per criterion).
  - Directory: e2e/tests/ (no file for this item)
  - File: none
- UAT scenarios: one scenario per criterion plus one edge case (POST returns 405), verifying the HTTP response with an API client; no claim about the OpenAPI `format` of `started_at`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | `test_get_uptime_returns_200_with_uptime_seconds_and_started_at`, `test_post_uptime_returns_405_method_not_allowed` | verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration | `test_get_uptime_seconds_increases_between_two_calls_a_second_apart`, `test_get_uptime_seconds_increases_as_the_clock_advances`, `test_get_uptime_seconds_clamps_to_zero_when_clock_reads_before_start` | verifying it needs no navigation or interaction: it is service arithmetic over a controllable clock, proven through HTTP and in isolation |
| 3 | `started_at` captured once at startup, serialised in UTC with an explicit offset | Integration | `test_get_uptime_started_at_is_identical_across_requests`, `test_get_uptime_started_at_is_utc_with_explicit_offset`, `test_capture_startup_records_utc_aware_started_at`, `test_uptime_response_serialises_started_at_with_explicit_utc_offset` | verifying it needs no navigation or interaction: it is app-startup state and a serialisation rule |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_uptime_response_is_a_pydantic_model_in_app_schemas`, `test_get_uptime_openapi_response_references_uptime_response_schema`, `test_uptime_response_rejects_negative_uptime_seconds`, `test_uptime_response_rejects_naive_started_at` | verifying it needs no navigation or interaction: it is a structural property of the code and the generated OpenAPI document |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with both fields | covered at Integration, see Criterion coverage | Given the backend is running, When I send GET /api/uptime, Then the status is 200 and the JSON body has exactly `uptime_seconds` (a number) and `started_at` (a string) |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When I call GET /api/uptime twice about a second apart, Then both `uptime_seconds` are >= 0 and the second is larger |
| 3 | `started_at` captured once, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When I call GET /api/uptime twice, Then `started_at` is identical and ends in `+00:00`; When the backend is restarted, Then `started_at` changes |
| 4 | Body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the generated OpenAPI document, When I read the 200 response of GET /api/uptime, Then it references the `UptimeResponse` schema |

## Manual verification plan
This feature has no UI. Every criterion is verified against the running backend with `curl` (or any HTTP client), plus one code check for criterion 4.

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
Prerequisites: the stack is running (`docker compose up -d --build` at the repo root); the backend answers on `http://localhost:8010` (port published in `docker-compose.yml`).
1. Run `curl -i http://localhost:8010/api/uptime` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is one JSON object with exactly two keys: `uptime_seconds`, an unquoted number such as `12.84`, and `started_at`, a quoted string such as `"2026-11-13T14:01:50.123456+00:00"`.
3. Run `curl -i -X POST http://localhost:8010/api/uptime` → the status line reads `405 Method Not Allowed`.

### Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `30.12`) → the value is 0 or greater.
2. Wait about one second, then run the same command again → `uptime_seconds` is larger than the first value by roughly 1 (for example `31.15`).

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → `started_at` is character-for-character identical in both responses while `uptime_seconds` grew.
2. Read `started_at` → it ends in `+00:00` (not `Z`, not another offset), and its time is roughly the current UTC time minus `uptime_seconds`.
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again → `started_at` is now a later timestamp than in step 1 and `uptime_seconds` is small (a few seconds).

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: a checkout of the feature branch; the stack running as Criterion 1.
1. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`.
2. Open `http://localhost:8010/docs` in a browser, expand `GET /api/uptime` → the 200 response schema is `UptimeResponse` with the two fields. (`started_at` may show as a plain string; that is expected and not a defect.)
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the summary line shows `0 failed`.
