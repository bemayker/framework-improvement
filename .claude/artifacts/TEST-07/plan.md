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
- [ ] 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker): 25 tracker comments, filtered by the main session: 24 are framework pull-request link comments from earlier runs and 1 is an operator note about a past sandbox state reset. → Addressed by: not acted on, because none states a requirement or correction to the four criteria; no comment line was passed to this dispatch.
- Merged since the last plan: n/a (fresh plan, branched from current main 7397b07, no prior plan.md).
- Assumption (start capture point): "captured once at application startup" is implemented as module-level constants in `backend/app/services/uptime_service.py`, captured when the module is first imported. `app.main` imports the uptime router (which imports the service) at process start, before uvicorn serves any request, so the value is fixed once per process and never recomputed per request. Chosen over storing it on `app.state` in the lifespan because it needs no request-scoped plumbing and stays one value per process even when tests call `create_app()` repeatedly.
- Assumption (offset spelling): "explicit offset" is rendered as `+00:00` (Python `datetime.isoformat()` on a timezone-aware UTC value, e.g. `2026-11-13T05:51:31.123456+00:00`), not Pydantic v2's default `Z` suffix. `Z` is also valid ISO 8601 UTC, but `+00:00` is unambiguously a numeric offset, which is the reading the criterion's wording ("offset") most directly asks for. Enforced by a `field_serializer` on the schema.
- Assumption (uptime clock): `uptime_seconds` is computed from `time.monotonic()` against a monotonic start reading, not by subtracting wall-clock datetimes, so a system clock adjustment can never make it negative or jump backwards (criterion 2's non-negative guarantee). It is a float, unrounded.

## Plan Overview
One read-only backend endpoint, `GET /api/uptime`, following the existing version-endpoint slice (router, service, schema). A small service module captures the process start time (UTC wall clock for `started_at`, monotonic reading for elapsed time) once at import, and exposes a function returning the current uptime. A Pydantic response schema in `backend/app/schemas/uptime.py` defines the body and serialises `started_at` with an explicit `+00:00` offset. The router is registered in `backend/app/main.py`. No database, no frontend, no external API, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns `UptimeResponse` with status 200. Router `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, mirroring `backend/app/routers/version.py`.
- Service layer: `backend/app/services/uptime_service.py`.
  - Module-level constants captured once at import: `STARTED_AT: datetime = datetime.now(timezone.utc)` and `_STARTED_MONOTONIC: float = time.monotonic()`.
  - `get_started_at() -> datetime`: returns `STARTED_AT` (never recomputed).
  - `get_uptime_seconds() -> float`: returns `max(0.0, time.monotonic() - _STARTED_MONOTONIC)`. The clamp is a guard, not expected behaviour: monotonic time never goes backwards, but the criterion promises non-negative and the guard makes that a property of the code rather than of the platform.
  - Call `time.monotonic` through the `time` module reference (`time.monotonic()`, not `from time import monotonic`) so unit tests can monkeypatch it.
- Schema: `backend/app/schemas/uptime.py`, `class UptimeResponse(BaseModel)` with `uptime_seconds: float` (`Field(ge=0)`) and `started_at: datetime`, plus `@field_serializer("started_at")` returning `value.astimezone(timezone.utc).isoformat()`, so the JSON always carries `+00:00`.
- Router function `get_uptime() -> UptimeResponse`: `UptimeResponse(uptime_seconds=uptime_service.get_uptime_seconds(), started_at=uptime_service.get_started_at())`.
- Registration: `backend/app/main.py` imports `from app.routers.uptime import router as uptime_router` and adds `app.include_router(uptime_router)` after the existing three; update the module docstring's list of registering features with one line for TEST-07. The lifespan and CORS middleware are untouched (`allow_methods` already includes GET).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: 200, `application/json`:

```json
{"uptime_seconds": 12.483019, "started_at": "2026-11-13T05:51:31.123456+00:00"}
```

- `uptime_seconds`: number (float), >= 0, increases monotonically across calls within one process.
- `started_at`: string, ISO 8601, UTC, always ends in `+00:00`; identical on every call within one process, changes only when the process restarts.
- Other methods on `/api/uptime` return FastAPI's default 405.

## Technology Selection
- Start-time capture and elapsed time: chose the standard library (`datetime.now(timezone.utc)` and `time.monotonic()`) over any dependency or a database row, because the stdlib covers both completely; no installed or new dependency was considered necessary.
- Response schema: chose Pydantic (already installed via FastAPI, 2.13.4 in `backend/uv.lock`) with a `field_serializer` over a hand-built dict or a custom JSON encoder, because the criterion requires a Pydantic schema and the serializer is the native Pydantic v2 hook for the offset format.
- Router and service modules: no stdlib call, native platform feature or installed dependency replaces a FastAPI route, so they are built here on the existing FastAPI install; no new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema with the `+00:00` serializer for `started_at`
- [B] backend/app/services/uptime_service.py: process start capture (UTC datetime and monotonic reading) and `get_uptime_seconds` / `get_started_at`
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service and the schema serialisation
- [B] backend/tests/integration/test_uptime_integration.py: router integration tests over the real HTTP cycle
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-07/uat_script.md: the copy of the manual UAT script build-feature writes

### Modified files
- [B] backend/app/main.py: import and register the uptime router; one docstring line for TEST-07
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route`

No dependency changes, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure, and neither file lists endpoints today.

## Testing Strategy
- Unit tests: service layer and schema, with `time.monotonic` monkeypatched on the `uptime_service` module's `time` reference (no real waiting).
  - `test_get_uptime_seconds_returns_elapsed_since_start`: happy path, monotonic patched to start + 5.0 returns 5.0.
  - `test_get_uptime_seconds_increases_between_calls`: patched clock advanced by 1.0 between two calls, second value is greater by 1.0.
  - `test_get_uptime_seconds_never_negative_when_clock_reads_before_start`: error/guard case, patched clock below the start reading returns 0.0.
  - `test_get_started_at_returns_same_value_on_repeated_calls`: two calls return the identical object, equal to `uptime_service.STARTED_AT`.
  - `test_started_at_is_timezone_aware_utc`: `STARTED_AT.utcoffset() == timedelta(0)`.
  - `test_uptime_response_serialises_started_at_with_explicit_utc_offset`: `UptimeResponse(...).model_dump(mode="json")["started_at"]` ends with `+00:00` and round-trips through `datetime.fromisoformat` to the original instant.
  - `test_uptime_response_rejects_negative_uptime`: `UptimeResponse(uptime_seconds=-1, ...)` raises `ValidationError`.
  - `test_create_app_registers_uptime_route` (in `test_main_unit.py`): `/api/uptime` is among the app's custom routes.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: the router over the real HTTP cycle with the session `client` fixture; no database needed.
  - `test_get_uptime_returns_200_with_uptime_and_started_at`: status 200, body keys exactly `{"uptime_seconds", "started_at"}`, `uptime_seconds` is a number >= 0, `started_at` parses with `datetime.fromisoformat` and has offset zero.
  - `test_get_uptime_increases_between_calls_one_second_apart`: two calls separated by `time.sleep(1)`, second `uptime_seconds` greater than the first (the criterion's literal "a second apart"; one deliberate real second in the integration tier, not a UI wait).
  - `test_get_uptime_started_at_is_stable_across_requests`: two calls return the identical `started_at` string, ending in `+00:00`.
  - `test_get_uptime_body_matches_uptime_response_schema`: `UptimeResponse.model_validate(response.json())` succeeds, and the OpenAPI document at `/openapi.json` references `UptimeResponse` for `/api/uptime`.
  - `test_post_uptime_returns_405_method_not_allowed`: the only reachable error case on an input-less read-only endpoint.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion involves navigation or interaction through the UI; the feature has no frontend. Every criterion is covered at unit or integration level per the table below.
  - Directory: e2e/tests/
  - File: none (no spec is written for TEST-07)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), API-level wording like `TEST-02_health_endpoint.feature`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | `test_get_uptime_returns_200_with_uptime_and_started_at` | verifying it needs no navigation or interaction: it is a router response over HTTP, with no UI |
| 2 | `uptime_seconds` non-negative and increases between two calls a second apart | Integration, Unit | `test_get_uptime_increases_between_calls_one_second_apart`, `test_get_uptime_seconds_increases_between_calls`, `test_get_uptime_seconds_never_negative_when_clock_reads_before_start` | verifying it needs no navigation or interaction: it is service arithmetic plus a router response |
| 3 | `started_at` captured once at startup, not recomputed, UTC with explicit offset | Integration, Unit | `test_get_uptime_started_at_is_stable_across_requests`, `test_get_started_at_returns_same_value_on_repeated_calls`, `test_uptime_response_serialises_started_at_with_explicit_utc_offset` | verifying it needs no navigation or interaction: it is a service invariant and a serialisation rule |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration, Unit | `test_get_uptime_body_matches_uptime_response_schema`, `test_uptime_response_rejects_negative_uptime` | verifying it needs no navigation or interaction: it is a schema definition checked against the live response and the OpenAPI document |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body has uptime_seconds and started_at |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice a second apart, Then both uptime_seconds are >= 0 and the second is greater |
| 3 | `started_at` fixed at startup, UTC with offset | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then started_at is identical and ends in +00:00, and after a backend restart it is later |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I open /docs, Then GET /api/uptime documents the UptimeResponse schema |

## Manual verification plan
This feature has no UI; each block is verified through the running backend's HTTP API and its built-in Swagger page at `http://localhost:8010/docs`. Where the steps say "the backend", that is the API started with `docker compose up -d` from the repo root (or `uv run --directory backend uvicorn app.main:app --port 8010`).

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the backend is running on port 8010; no database or seed data is needed.
1. Run `curl -i http://localhost:8010/api/uptime` in a terminal → the first line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present.
2. Read the body printed below the headers → it is one JSON object with exactly two keys, `uptime_seconds` (a number such as `42.81`) and `started_at` (a string such as `2026-11-13T05:51:31.123456+00:00`).
3. Open `http://localhost:8010/docs` in a browser, expand `GET /api/uptime`, click "Try it out" then "Execute" → the "Server response" shows code `200` and the same two-key body.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: the backend is running on port 8010.
1. Run `curl -s http://localhost:8010/api/uptime` → note the `uptime_seconds` value, e.g. `42.81`; it is 0 or greater.
2. Wait about one second, then run `curl -s http://localhost:8010/api/uptime` again → `uptime_seconds` is larger than the first value by roughly one second, e.g. `43.83`, and still 0 or greater.

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: the backend is running on port 8010.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → `started_at` is the identical string in both responses, while `uptime_seconds` differs.
2. Read the end of the `started_at` string → it ends in `+00:00` (UTC, explicit offset), not in a local offset such as `+01:00` and not with no offset at all.
3. Restart the backend (`docker compose restart backend`, or stop and start uvicorn), wait until it answers, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is now a later timestamp than in step 1, and `uptime_seconds` is small (a few seconds).

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend is running on port 8010; the repository is checked out.
1. Open `backend/app/schemas/uptime.py` in an editor → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`.
2. Open `http://localhost:8010/docs`, expand `GET /api/uptime`, and look at the 200 response's schema → it is named `UptimeResponse` and lists `uptime_seconds` (number) and `started_at` (string, date-time).
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py tests/unit/test_main_unit.py` from the repo root → the run ends with `0 failed`.
