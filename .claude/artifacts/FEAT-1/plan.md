# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> **What.** `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> **Acceptance criteria.**
> - `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> - `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> - The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> - Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> **Notes.** Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The tracker description also carries a measured-run context paragraph and an "How the measured run uses this item" block of operator instructions. Those are not acceptance criteria and are not planned here.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Plan Overview
Backend only. One new read-only endpoint, `GET /api/time`, built in the same slice shape the existing `/api/version` endpoint uses on `main` today (router, schema, service; no repository, because nothing is persisted):

- `backend/app/services/server_time_service.py` computes the current instant as a timezone-aware UTC `datetime` on every call.
- `backend/app/schemas/server_time.py` defines `ServerTimeResponse` (`now`, `timezone`), with `now` typed as an aware datetime and serialised as ISO 8601 with an explicit `+00:00` offset.
- `backend/app/routers/server_time.py` exposes `GET /api/time` and returns the schema.
- `backend/app/main.py` registers the router after the three routers registered today (`version`, `notes`, `health`).

No database, no configuration value, no new dependency, no frontend change.

Assumptions recorded (no clarification channel on this run; `user_story_alignment.md` Section 4):
1. **"Following the TEST-06 shape"**: TEST-06's echo router is not on `main` at 49d70f8 (`backend/app/main.py` registers only `version`, `notes` and `health`, and there is no `routers/echo.py`). The plan therefore follows the shape of the routers that are on `main`, `routers/version.py` above all: `APIRouter(prefix="/api", tags=[...])`, a `response_model`, the router delegating to a service function and building the schema. If TEST-06 lands first, the registration line is still appended after whatever is registered then (see the shared risk analysis).
2. **"Explicit offset"**: the offset is serialised as `+00:00` (Python's `datetime.isoformat()` output for UTC), not `Z`. Both are valid ISO 8601, but `+00:00` is the literal numeric offset the criterion's wording asks for, and pinning one spelling makes the test assertion exact. Pydantic v2's default JSON serialisation of a UTC datetime emits `Z`, so the schema pins the spelling with a field serializer.
3. **"Two calls a second apart differ"**: verified without a fixed `sleep` in the automated tests (`testing_standards.md` Section 1.3 forbids hardcoded waits in E2E, and the same reasoning applies here): the unit test drives an injected clock to two different instants, and the integration test brackets a real request between two `datetime.now(UTC)` reads and checks two consecutive real requests are non-decreasing and not shared state. The one-second-apart check is done literally in the manual verification plan.
4. **Precision**: `now` keeps microseconds (the default `isoformat()` output). The criterion does not ask for truncation, and microseconds make the per-request difference observable even for rapid calls.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode is NONE; this item renders no UI).

## Backend Plan
- Endpoints: `GET /api/time` — report the server's current UTC time. Router `backend/app/routers/server_time.py`, `router = APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time() -> ServerTimeResponse` declared with `response_model=ServerTimeResponse`. The handler calls the service and returns `ServerTimeResponse(now=..., timezone="UTC")`; no dict is built in the router (criterion 3). Registered in `backend/app/main.py` `create_app()` with `app.include_router(server_time_router)` placed after `app.include_router(health_router)`, and its import `from app.routers.server_time import router as server_time_router` added beside the other router imports. Update the module docstring of `main.py` to mention FEAT-1's time router, matching how it lists the other features. The existing CORS middleware already allows `GET`; no change there.
- Service layer: `backend/app/services/server_time_service.py` with `UTC_TIMEZONE_NAME = "UTC"` and `get_current_utc_time() -> datetime`, returning `datetime.now(UTC)` (stdlib `datetime.UTC`). It is called once per request, so the value is never cached at import time or in module state (criterion 2). The clock is reached through the module-level `datetime` name so a unit test can monkeypatch it, the same seam `version_service.py` uses for `version`. If the returned value is ever naive the schema refuses it (see below), so a regression surfaces as a 500 in tests rather than as a wrong answer.
- Schema: `backend/app/schemas/server_time.py`, `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's aware-only datetime type, which rejects a naive value at construction) and `timezone: Literal["UTC"]`. A `@field_serializer("now")` converts the value to UTC (`value.astimezone(UTC)`) and returns `.isoformat()`, so the JSON is always `YYYY-MM-DDTHH:MM:SS.ffffff+00:00`, regardless of which aware offset the service handed in.
- Repository layer: none. Nothing is persisted; the endpoint needs no database and must answer with `DATABASE_URL` unset, like `/api/version`.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters, no headers required.
- Response: `200 OK`, `application/json`, body defined by `ServerTimeResponse`:

```json
{"now": "2026-11-09T16:53:24.123456+00:00", "timezone": "UTC"}
```

`now` is ISO 8601, always UTC, always with the explicit `+00:00` offset, recomputed per request. `timezone` is always the literal string `UTC`. Any other method on `/api/time` answers FastAPI's default `405 Method Not Allowed`.

## Technology Selection
- Current-time source (`server_time_service.get_current_utc_time`): chose the standard library's `datetime.now(datetime.UTC)` over any time library (none installed, and none needed), because the stdlib returns an aware UTC instant directly.
- ISO 8601 serialisation with explicit offset (`ServerTimeResponse.now` serializer): chose the standard library's `datetime.isoformat()` inside a Pydantic `field_serializer` over Pydantic's default datetime JSON encoding, because the default emits `Z` and the plan pins the numeric `+00:00` spelling; Pydantic is already installed (FastAPI dependency).
- Aware-only enforcement (`ServerTimeResponse.now` type): chose Pydantic's installed `AwareDatetime` type over a hand-written validator, because it already rejects naive datetimes.
- `timezone` field: chose `typing.Literal["UTC"]` (stdlib) over a custom enum or validator, because a single fixed value needs nothing more.
- Router and schema modules: no stdlib call, native platform feature or installed dependency replaces an endpoint module; they are built here on the installed FastAPI and Pydantic, in the existing `routers/` and `schemas/` layout.
- No new dependency is added, so `backend/pyproject.toml` and `backend/uv.lock` are untouched.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime` serialised as ISO 8601 with `+00:00`, `timezone: Literal["UTC"]`)
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` returning `datetime.now(UTC)` per call
- [B] backend/app/routers/server_time.py: `GET /api/time` router returning `ServerTimeResponse`
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC, per-call freshness via a monkeypatched clock)
- [B] backend/tests/unit/test_server_time_schema_unit.py: unit tests for the schema (shape, `+00:00` offset, non-UTC aware input normalised, naive input rejected, `timezone` literal enforced)
- [B] backend/tests/integration/test_server_time_integration.py: router tests through the HTTP cycle (200 shape, offset, per-request freshness, works with `DATABASE_URL` unset, 405 on POST)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation is ENABLED)

### Modified files
- [B] backend/app/main.py: import `server_time_router` and register it after `health_router` in `create_app()`; docstring names FEAT-1's router
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the app's custom routes

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) changes. `README.md` and `docs/DEVELOPMENT.md` need no edit: this item changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints. No E2E spec is produced (no criterion needs the UI; see Criterion coverage).

## Testing Strategy
- Unit tests: service and schema, all external state (the clock) monkeypatched.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_server_time_service_unit.py` and `test_server_time_schema_unit.py`; plus one new test in the existing `test_main_unit.py`.
  - Service: `test_get_current_utc_time_returns_aware_utc_datetime` (happy path: `tzinfo` is not None and `utcoffset()` is zero); `test_get_current_utc_time_reads_the_clock_on_every_call` (edge case: monkeypatch `server_time_service.datetime` with a stub whose `now()` returns two different instants on successive calls, assert the two results differ and the stub was called twice, which proves no caching); `test_get_current_utc_time_requests_utc_from_the_clock` (error-guarding case: the stub records the `tz` argument and returns a naive value when called without one, assert the service passed `UTC` so it can never produce a naive value).
  - Schema: `test_server_time_response_serialises_now_with_explicit_utc_offset` (happy path: `model_dump(mode="json")` gives `now` ending in `+00:00`, parseable by `datetime.fromisoformat` into an aware value, and `timezone == "UTC"`; asserts the key set is exactly `{"now", "timezone"}`); `test_server_time_response_normalises_a_non_utc_aware_value_to_utc` (edge case: an aware `+02:00` value is serialised as the same instant at `+00:00`); `test_server_time_response_rejects_a_naive_datetime` (error case: `pydantic.ValidationError`); `test_server_time_response_rejects_a_timezone_other_than_utc` (error case: `timezone="Europe/Brussels"` raises `ValidationError`).
  - App factory: `test_create_app_registers_time_route` in `test_main_unit.py`, using the existing `_collect_route_paths` helper.
- Integration tests: `GET /api/time` through the full FastAPI request/response cycle with the shared session `client` fixture from `backend/tests/conftest.py` (no database fixture: the endpoint touches none).
  - Directory: backend/tests/integration/
  - File: `test_server_time_integration.py`. `test_get_time_returns_200_with_now_and_timezone` (status 200, key set exactly `{"now", "timezone"}`, `timezone == "UTC"`); `test_get_time_now_is_utc_with_explicit_offset` (`now` matches `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?\+00:00$`, and `datetime.fromisoformat(now).utcoffset() == timedelta(0)`); `test_get_time_now_is_computed_per_request` (read `datetime.now(UTC)` before and after each of two consecutive requests; each `now` lies within its own bracket, and the second request's `now` is not earlier than the first request's after-bracket, which a value cached at startup or at the first request would fail); `test_get_time_answers_when_database_url_is_unset` (monkeypatch-delete `DATABASE_URL`, fresh `create_app()`, still 200, mirroring `test_version_integration.py`); `test_post_time_returns_405_method_not_allowed` (the only reachable error case: the endpoint takes no input).
- E2E tests: not warranted for this item. E2E Tests is ENABLED in `CLAUDE.md`, but no acceptance criterion involves navigation or interaction through the UI (no frontend consumes `/api/time`), so per `testing_standards.md` Section 6 every criterion is covered at unit or integration level and no spec is written. Calling the API from a Playwright spec would be a router integration test in disguise, which Section 5 lists as an anti-pattern.
  - Directory: e2e/tests/ (no file added)
  - File: none (`FEAT-1_server_time_endpoint.spec.ts` is not produced)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (the endpoint answers with no database configured), phrased against the HTTP response, since there is no UI.
  - Directory: e2e/uat/scenarios/ (Gherkin) and e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | Verifying it needs no navigation or interaction: it is a router response, checked through the real HTTP cycle |
| 2 | `now` is computed per request, UTC with an explicit offset, never naive | Unit and Integration | Verifying it needs no navigation or interaction: freshness is a service behaviour (unit, controlled clock) and the offset is a serialisation rule (unit schema test, integration response check) |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a structural property, checked by the schema unit tests exercising `ServerTimeResponse` directly and by the router's `response_model` |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | Verifying it needs no navigation or interaction: the criterion is satisfied by the unit and integration test files listed above existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the response is 200 with exactly the keys now and timezone, and timezone is UTC |
| 2 | `now` is per request, UTC, explicit offset, never naive | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time twice about a second apart, Then each now ends in +00:00 and the second is about one second later than the first |
| 3 | Response defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When the OpenAPI document is fetched, Then GET /api/time's 200 response references the ServerTimeResponse schema |
| 4 | Unit and integration tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the FEAT-1 unit and integration test files run, Then 0 failed |

## Manual verification plan
No acceptance criterion is verifiable through the UI: no frontend screen consumes `GET /api/time`. The observable check for each is the HTTP response, read with `curl` in a terminal against the compose stack (backend published on host port `8010` by `docker-compose.yml`).

Prerequisites for every block: Docker running; repository on branch `feature/FEAT-1-server-time-endpoint`; from the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows `backend` running and `db` healthy; a terminal with `curl` and `python3`.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
Prerequisites: the stack above is up.
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the response body → it has exactly two keys, for example `{"now":"2026-11-09T16:53:24.123456+00:00","timezone":"UTC"}`: `timezone` is exactly `UTC`, and `now` is a date and time close to the current UTC time on your clock (compare with `date -u`).
3. Run `curl -i -X POST http://localhost:8010/api/time` → `HTTP/1.1 405 Method Not Allowed` (edge case: the endpoint is read-only).

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
Prerequisites: the stack above is up.
1. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two JSON bodies are printed.
2. Compare the two `now` values → both end in `+00:00` (never without an offset, never with a different offset), and the second is about one second later than the first (for example `...16:53:24.12...+00:00` then `...16:53:25.13...+00:00`); they are not identical.
3. Run `curl -s http://localhost:8010/api/time | python3 -c "import json,sys; from datetime import datetime; print(datetime.fromisoformat(json.load(sys.stdin)['now']).utcoffset())"` → prints `0:00:00`, confirming the value parses as an aware datetime at UTC.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Prerequisites: the stack above is up.
1. Open `backend/app/schemas/server_time.py` in an editor → it defines `class ServerTimeResponse(BaseModel)` with the fields `now` and `timezone`.
2. Open `backend/app/routers/server_time.py` → the `GET /time` route declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse(...)` instance; no `{...}` dict literal is returned.
3. Run `curl -s http://localhost:8010/openapi.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['paths']['/api/time']['get']['responses']['200']['content']['application/json']['schema'])"` → prints a `$ref` ending in `ServerTimeResponse`.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: `uv` installed on the host; the backing database is not needed for these files (they touch no database).
1. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_service_unit.py tests/unit/test_server_time_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the summary line reports `0 failed` and no errors.
2. Open `backend/tests/integration/test_server_time_integration.py` → it contains a shape test (`test_get_time_returns_200_with_now_and_timezone`), an offset test (`test_get_time_now_is_utc_with_explicit_offset`) and a freshness test (`test_get_time_now_is_computed_per_request`).
3. Open `backend/tests/unit/test_server_time_service_unit.py` and `backend/tests/unit/test_server_time_schema_unit.py` → the freshness test (`test_get_current_utc_time_reads_the_clock_on_every_call`) and the offset test (`test_server_time_response_serialises_now_with_explicit_utc_offset`) are present.
