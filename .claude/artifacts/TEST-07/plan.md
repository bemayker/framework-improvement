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
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). Built and merged in measured run 2 by /deliver (PR #26, squash ffbfc12 on main). It is one of the two Arm E items again because playbook Section 4 step 3 requires the same items both times. Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Addressed by: not acted on, because its precondition is already met. A later framework notice on the item (2026-09-14) records the revert merged as 0ac6818 (#29), and the backend on the current base has no uptime router, schema, service or tests (`backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`; `backend/app/main.py` registers only those three). The plan therefore builds the feature from the code as it stands, with no reference to the reverted PR #26 implementation. The comment changes no acceptance criterion.
- The other 13 tracker comments are framework-generated "mayker-dev: PR opened for TEST-07" notices from earlier runs whose code is no longer on main; they carry no feedback on the feature and are not acted on.

## Plan Overview
One backend-only, read-only endpoint, `GET /api/uptime`, following the existing Router → Service layering the version and health endpoints use (`app/routers/version.py` → `app/services/version_service.py`, schema in `app/schemas/version.py`). No database, no repository, no migration, no frontend.

- A new service, `app/services/uptime_service.py`, owns a small immutable `ProcessClock` holding two readings taken at the same moment: the UTC wall-clock `started_at` (what the response reports) and a `time.monotonic()` reading (what elapsed time is measured from). Measuring elapsed time on the monotonic clock is what makes criterion 2 hold even if the host's wall clock is stepped backwards by NTP: `uptime_seconds` can never go negative or decrease.
- `create_app()` in `app/main.py` captures the clock once, as `app.state.process_clock = uptime_service.start_clock()`, and registers the new router. The production entrypoint is `uvicorn app.main:create_app --factory` (`backend/Dockerfile`), so `create_app()` runs exactly once per process start: that is application startup, and a restart produces a new `started_at`. Each request only reads `app.state.process_clock`; nothing recomputes it (criterion 3).
- A new schema, `app/schemas/uptime.py`, defines `UptimeResponse` (criterion 4): `uptime_seconds` is a float constrained `ge=0` (criterion 2's non-negative rule, also visible in the OpenAPI document), and `started_at` is typed as Pydantic's `AwareDatetime` and serialised with an explicit numeric offset.

Assumptions (recorded per `user_story_alignment.md`, ambiguity handling; none blocks):
1. "Serialised in UTC with an explicit offset" is read as the numeric offset `+00:00` (e.g. `2026-10-30T15:03:13.482911+00:00`). Pydantic v2's default for a UTC datetime is the `Z` designator; a `field_serializer` returning `value.isoformat()` emits `+00:00` instead, which satisfies both readings of "explicit offset". Fractional seconds are kept as `datetime.isoformat()` produces them.
2. "Captured at application startup" is implemented in `create_app()` rather than in the `lifespan` hook. Under the `--factory` entrypoint both run once per process; `create_app()` additionally guarantees the clock exists for any app instance, including a `TestClient` used without its context manager, so the endpoint can never 500 for a missing clock. The existing `lifespan` (database schema initialisation) is left untouched.
3. `uptime_seconds` is a JSON number (float seconds, unrounded). The criterion asks for a number, not an integer.
4. No other HTTP methods are added; FastAPI's default 405 for a non-GET request is the endpoint's only error case, as for `GET /api/version`.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/uptime`, returns the process uptime and start time (200, `UptimeResponse`). Router `app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, matching `app/routers/version.py`. The handler takes the `Request`, reads `request.app.state.process_clock`, and returns `UptimeResponse(uptime_seconds=uptime_service.uptime_seconds(clock), started_at=clock.started_at)`.
- Service layer: `app/services/uptime_service.py`.
  `ProcessClock`: frozen dataclass with `started_at: datetime` (timezone-aware, UTC) and `started_monotonic: float`.
  `start_clock() -> ProcessClock`: reads `datetime.now(UTC)` and `monotonic()` once each and returns them together.
  `uptime_seconds(clock: ProcessClock) -> float`: `monotonic() - clock.started_monotonic`. Import `monotonic` as `from time import monotonic` so unit and integration tests can patch `uptime_service.monotonic`, the same seam `test_version_service_unit.py` uses for `version_service.version`.
- Repository layer: none (no data access).
- Migrations: none.
- App wiring (`app/main.py`): import `uptime_service` and the uptime router; in `create_app()` set `app.state.process_clock = uptime_service.start_clock()` and add `app.include_router(uptime_router)` after the existing three `include_router` calls. Update the module docstring's list of feature registrations to name TEST-07. CORS, the lifespan and the other routers are unchanged.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `UptimeResponse`:

```json
{
  "uptime_seconds": 42.517,
  "started_at": "2026-10-30T15:03:13.482911+00:00"
}
```

  `uptime_seconds`: number, at least 0, seconds since the process started, measured on the monotonic clock. `started_at`: string, ISO 8601, UTC, explicit `+00:00` offset; identical on every response from the same process.
- Errors: a non-GET method returns FastAPI's default 405. No other error path exists: the endpoint reads no configuration and no database.

## Technology Selection
- Process start and elapsed-time clock (`uptime_service.ProcessClock`): chose the standard library (`datetime.now(UTC)` for `started_at`, `time.monotonic()` for elapsed time) over `psutil.Process().create_time()`, because psutil is not installed and a new dependency for two stdlib calls is unwarranted; `time.monotonic()` is chosen over subtracting wall-clock datetimes because only the monotonic clock guarantees criterion 2's non-negative, increasing value across a wall-clock step.
- Storing the captured clock: chose FastAPI's built-in `app.state` over a module-level global, because `app.state` scopes the clock to one app instance (each `create_app()` in the tests gets its own) with no new code.
- Response schema (`UptimeResponse`): chose Pydantic (installed with FastAPI, v2.13) with its `AwareDatetime` type and a `field_serializer` over hand-formatting the timestamp string in the router, because `AwareDatetime` rejects a naive datetime at construction and the serializer is one line.
- Router: FastAPI's `APIRouter` (installed), the same construct every existing router uses; no alternative needed.
- No new dependency is added, so no dependency manifest or lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic model (`uptime_seconds: float = Field(ge=0)`, `started_at: AwareDatetime`, serializer emitting the `+00:00` offset)
- [B] backend/app/services/uptime_service.py: `ProcessClock`, `start_clock()`, `uptime_seconds()`
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `app.state.process_clock`
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for `start_clock()` and `uptime_seconds()`
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for `UptimeResponse` validation and serialisation
- [B] backend/tests/integration/test_uptime_integration.py: router integration tests for `GET /api/uptime`
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/main.py: capture `app.state.process_clock` in `create_app()`, register the uptime router, update the module docstring
- [B] backend/tests/unit/test_main_unit.py: add tests that `create_app()` registers `/api/uptime` and gives each app instance its own captured clock

No lockfile changes: the feature adds no dependency (Technology Selection). No `README.md` or `docs/DEVELOPMENT.md` changes: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file keeps a per-endpoint list that a new endpoint would leave stale.

## Testing Strategy
- Unit tests: service and schema logic, all external clocks patched.
  `test_uptime_service_unit.py`: `start_clock()` returns a timezone-aware UTC `started_at` lying between two `datetime.now(UTC)` readings taken around the call, and records the patched `monotonic()` value (happy path); `uptime_seconds()` returns the patched difference, returns `0.0` when no time has elapsed (edge: boundary), and returns a larger value after the patched monotonic clock advances by 1.0 (criterion 2's increase, deterministic, no sleep); `ProcessClock` is frozen, so assigning `started_at` raises `FrozenInstanceError` (error case: the captured start cannot be mutated per request).
  `test_uptime_schema_unit.py`: a UTC `started_at` serialises via `model_dump(mode="json")` and `model_dump_json()` as a string ending in `+00:00` that `datetime.fromisoformat` parses back to the same instant (happy path); a non-UTC aware datetime is accepted and serialised with its own explicit offset, documenting that the serializer never drops the offset (edge case); a naive datetime raises `ValidationError` (error case); `uptime_seconds=-0.5` and `uptime_seconds="abc"` each raise `ValidationError` (error cases: the schema's `ge=0` bound and number type).
  `test_main_unit.py` additions: `/api/uptime` is among the registered routes; two `create_app()` calls produce two distinct `app.state.process_clock` objects.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `test_uptime_integration.py`, full HTTP request/response cycle through `TestClient`. No database is touched, so these run with or without `DATABASE_URL`; use a fresh `create_app()` inside `with TestClient(...)` (as `test_version_integration.py` does) where a test patches the clock, so the session-scoped `client` fixture is never mutated.
  `test_get_uptime_returns_200_with_uptime_seconds_and_started_at`: status 200, body keys exactly `{"uptime_seconds", "started_at"}`, `uptime_seconds` is an `int` or `float` (not `bool`) and is at least 0, `started_at` parses with `datetime.fromisoformat` (criteria 1, 2 non-negative).
  `test_get_uptime_increases_between_two_calls_a_second_apart`: patch `uptime_service.monotonic` so the second call reads 1.0 later than the first; assert the second `uptime_seconds` is greater than the first, by 1.0 within `pytest.approx` (criterion 2).
  `test_get_uptime_started_at_is_stable_across_requests_and_utc`: two calls return the identical `started_at` string; it ends with `+00:00`, its parsed `utcoffset()` is zero, it is not later than `datetime.now(UTC)` taken after the call, and it equals `app.state.process_clock.started_at` serialised with `isoformat()` (criterion 3: captured once, not per request).
  `test_get_uptime_started_at_differs_for_a_new_app_instance`: two apps from two `create_app()` calls (a simulated restart) each answer with their own `app.state.process_clock.started_at`, and the second app's `started_at` is not earlier than the first's (criterion 3: captured at startup, so a restart is visible).
  `test_get_uptime_response_schema_is_uptime_response`: the app's OpenAPI document (`GET /openapi.json`) declares the 200 response of `GET /api/uptime` as a `$ref` to `UptimeResponse`, and the live response body validates with `UptimeResponse.model_validate` (criterion 4).
  `test_post_uptime_returns_405_method_not_allowed`: the only error case of a read-only endpoint (router error-case coverage per `testing_standards.md` Section 4).
  - Directory: backend/tests/integration/
- E2E tests: none warranted. The E2E toggle is ENABLED, but no criterion involves navigation or interaction through the UI: no frontend consumes `GET /api/uptime` (`testing_standards.md` Section 6, fourth question, asked per criterion below). No spec file is planned, so the E2E smoke run has nothing of this feature's to execute.
  - Directory: e2e/tests/
  - File: none (would be `TEST-07_uptime_endpoint.spec.ts`; not created)
- UAT scenarios: one Gherkin scenario per acceptance criterion against the HTTP API at `http://localhost:8010`, plus one edge-case scenario (a restarted backend reports a new `started_at` and a reset uptime), mirroring the HTTP-level style of `TEST-02_health_endpoint.feature`.
  - Directory: e2e/uat/scenarios/ (scripts in e2e/uat/scripts/)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | verifying it needs no navigation or interaction: it is a router response shape, read in full through the HTTP cycle |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration (plus Unit for `uptime_seconds()`) | verifying it needs no navigation or interaction: it is service arithmetic on the monotonic clock, exercised over HTTP with the clock patched so the one-second gap is deterministic |
| 3 | `started_at` captured once at startup, not per request, serialised in UTC with an explicit offset | Integration (plus Unit for the schema serializer and `create_app()`) | verifying it needs no navigation or interaction: it is app-construction state and a serialisation rule, observable in the JSON body |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit and Integration | verifying it needs no navigation or interaction: it is a code-structure rule, checked by the schema's own unit tests and by the OpenAPI document naming `UptimeResponse` as the 200 response |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/uptime`, Then the status is 200 and the body has exactly `uptime_seconds` (a number) and `started_at` (an ISO 8601 string) |
| 2 | non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When a client calls GET `/api/uptime` twice one second apart, Then both `uptime_seconds` values are at least 0 and the second is larger than the first by about 1 |
| 3 | `started_at` captured once, UTC, explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When a client calls GET `/api/uptime` twice, Then `started_at` is identical in both and ends with `+00:00`; and after a backend restart it is later and `uptime_seconds` has reset (edge case) |
| 4 | response defined by a Pydantic schema | covered at Unit and Integration, see Criterion coverage | Given the backend's OpenAPI document, When a reader opens `/docs` or `/openapi.json`, Then GET `/api/uptime` documents its 200 response as `UptimeResponse` with fields `uptime_seconds` and `started_at` |

## Manual verification plan
No acceptance criterion is verifiable through the application UI: no frontend screen consumes `GET /api/uptime`. The observable check for criteria 1 to 3 is the HTTP response itself, read with `curl` in a terminal; criterion 4 is checked in the backend's own interactive API docs page and by running the feature's tests.

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
Prerequisites: Docker running; repository checked out on `feature/TEST-07-uptime-endpoint`; nothing else bound to host port 8010; from the repository root, `docker compose up -d --build` has completed and `docker compose ps` shows the `backend` service running.
1. In a terminal, run `curl -i http://localhost:8010/api/uptime` → the first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the response body → a JSON object with exactly two fields, for example `{"uptime_seconds":37.2041,"started_at":"2026-10-30T15:03:13.482911+00:00"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted date-time string.

### Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart
Prerequisites: the stack from criterion 1 is still up.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; echo; curl -s http://localhost:8010/api/uptime` → two JSON bodies print, one per line.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second is larger than the first by roughly 1 (between about 1.0 and 1.5, depending on how quickly the two requests ran).

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: the stack from criterion 1 is still up.
1. Run `curl -s http://localhost:8010/api/uptime`, wait about 3 seconds, and run it again → the two `started_at` values are character-for-character identical while `uptime_seconds` has grown by about 3.
2. Read the end of the `started_at` value → it ends in `+00:00` (an explicit UTC offset), not in `Z` and not with no offset at all.
3. Run `date -u` and compare with `started_at` → `started_at` is earlier than the current UTC time, close to when `docker compose up` brought the backend up.
4. Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is now later than the value from step 1 (roughly the restart time), and `uptime_seconds` is small again (a few seconds), which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack from criterion 1 is still up; `uv` installed on the host.
1. In a browser, open `http://localhost:8010/docs` → the Swagger UI page titled "Task Notes API" lists `GET /api/uptime` under the `uptime` tag.
2. Click `GET /api/uptime` to expand it → under Responses, code 200 shows the schema `UptimeResponse` with the fields `uptime_seconds` (number) and `started_at` (string, date-time).
3. Click "Try it out", then "Execute" → the Server response shows code 200 and a body with the two fields described in criterion 1.
4. Scroll to the Schemas section at the bottom of the page → `UptimeResponse` is listed.
5. Open `backend/app/schemas/uptime.py` in the repository → it defines the `UptimeResponse` Pydantic model the docs page named.
6. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py` → the summary line reports `0 failed` (a run with no failures prints no failed count at all, which also reads as 0 failed).
