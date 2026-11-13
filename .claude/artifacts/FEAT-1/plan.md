# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> **What:** `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> **Notes:** Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (Source: ClickUp task 123k99ctzxk. The item's own "How the measured run uses this item" section is labelled by the item as operator instructions and not part of the feature, so it is not planned here. Its opening paragraph describes why the item exists, not what it delivers.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Plan Overview
Backend only, one read-only endpoint, no database, no frontend, no external API. Three small net-new modules in the existing Router to Service to Schema layering, mirroring the TEST-05 version slice already on `main` (`routers/version.py`, `services/version_service.py`, `schemas/version.py`): the TEST-06 echo slice the item names as its model is not on `main` after the sandbox reset, so the version slice, which has the same shape, is the in-repo precedent followed.

- `backend/app/services/server_time_service.py` computes the current time as a timezone-aware UTC `datetime`, on every call (no module-level value, no cache).
- `backend/app/schemas/server_time.py` defines `ServerTimeResponse` with `now: AwareDatetime` (Pydantic rejects a naive value at construction) and `timezone: Literal["UTC"]`, plus a field serializer that emits `now` through `datetime.isoformat()`, which yields the explicit `+00:00` offset.
- `backend/app/routers/server_time.py` exposes `GET /api/time` and returns `ServerTimeResponse`; registered in `backend/app/main.py` with one import and one `include_router` line.

Decisions and assumptions:
- **Offset spelling `+00:00`, not `Z`.** [Certain] Pydantic 2.13 (the locked version) serialises an aware UTC `datetime` as `...Z` by default. `Z` is a valid ISO 8601 UTC designator, but the criterion asks for an "explicit offset", so the plan pins `+00:00` through a field serializer to remove the ambiguity. Recorded as an assumption: if a reviewer reads `Z` as satisfying the criterion, the serializer is the one line to drop.
- **File naming `server_time`.** BUG-01 (depends on FEAT-1) names `backend/app/routers/server_time.py` and its registration in `main.py` in its `feature_map.md` row, so the slice uses that name to keep BUG-01's plan valid.
- **Out of scope:** the `Cache-Control: no-store` header is BUG-01's fix, not one of these four criteria, so it is not added here (`user_story_alignment.md` Section 3). No `timezone` query parameter, no other zones, no frontend display.
- **Error handling:** the endpoint takes no input and touches no external resource, so its only reachable error response is 405 on a non-GET method; no custom exception is introduced.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time and the literal zone name `UTC`, status 200. Router `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, handler `get_time() -> ServerTimeResponse` with `response_model=ServerTimeResponse`, no business logic in the router.
- Service layer: `backend/app/services/server_time_service.py`: a private `_utc_now()` returning `datetime.now(UTC)` (stdlib `datetime.UTC`), and a public `get_server_time() -> datetime` that calls `_utc_now()` on every invocation. `_utc_now` is a module attribute so unit and integration tests replace the clock with `monkeypatch.setattr`, the same seam `version_service.version` uses.
- Schema: `backend/app/schemas/server_time.py`: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime`, `timezone: Literal["UTC"] = "UTC"`, and `@field_serializer("now")` returning `value.astimezone(UTC).isoformat()` so the body always carries `+00:00`.
- Registration: `backend/app/main.py`: `from app.routers.server_time import router as server_time_router` and `app.include_router(server_time_router)` after the existing three `include_router` calls; the module docstring's list of registered routers gains FEAT-1. No other change to `create_app`, the lifespan or CORS (`allow_methods` already includes `GET`).
- Repository layer: none, the endpoint reads no data.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query or path parameters.
- Response: 200, `application/json`, body defined by `ServerTimeResponse`:

```json
{"now": "2026-11-13T14:57:56.123456+00:00", "timezone": "UTC"}
```

  `now` is ISO 8601, always in UTC, always with the explicit `+00:00` offset, computed at request time. `timezone` is always the string `UTC`. Any other method on `/api/time` answers 405.

## Technology Selection
- Current UTC time: chose the standard library's `datetime.now(datetime.UTC)` over any third-party time library (`pendulum`, `arrow`), because the stdlib returns an aware UTC value directly and nothing else is needed.
- ISO 8601 serialisation with explicit offset: chose stdlib `datetime.isoformat()` inside a Pydantic `field_serializer` over hand-formatting with `strftime`, because `isoformat()` on an aware value already emits `+00:00` and Pydantic (installed) already owns the response serialisation.
- Naive-value guard: chose Pydantic's built-in `AwareDatetime` type (installed dependency) over a hand-written validator, because it rejects a naive `datetime` at construction with no extra code.
- Router, service and schema modules: no stdlib call, native platform feature or installed dependency replaces them; they are built here with FastAPI and Pydantic, both already installed. No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime` serialised with `+00:00`, `timezone: Literal["UTC"]`)
- [B] backend/app/services/server_time_service.py: `_utc_now()` clock seam and `get_server_time()` returning an aware UTC datetime per call
- [B] backend/app/routers/server_time.py: `GET /api/time` router returning `ServerTimeResponse`
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC, per-call freshness, clock seam)
- [B] backend/tests/unit/test_server_time_schema_unit.py: unit tests for the schema (shape, `+00:00` serialisation, naive value rejected, non-UTC aware value normalised)
- [B] backend/tests/integration/test_server_time_integration.py: integration tests through the HTTP cycle (200 and shape, explicit offset, per-request freshness, 405)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios (UAT Generation is ENABLED)

### Modified files
- [B] backend/app/main.py: import and register `server_time_router`; add FEAT-1 to the module docstring's router list
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route`, asserting `/api/time` is among the app's custom routes

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists individual endpoints. No E2E spec is produced, because no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: the service (`get_server_time` returns an aware UTC value; two calls with a replaced clock return the two clock values, proving no caching) and the schema (serialised `now` ends in `+00:00`, a naive `datetime` raises `ValidationError`, a non-UTC aware value serialises in UTC, `timezone` is `UTC`); plus the app-factory registration check. Error case per tested function: naive datetime rejected (schema); service has no failure mode beyond the clock, its edge case is per-call freshness.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through FastAPI's `TestClient` (the shared session-scoped `client` fixture in `backend/tests/conftest.py`): 200 with exactly the keys `now` and `timezone`; `now` parses with `datetime.fromisoformat`, is aware, has `utcoffset() == timedelta(0)` and the raw string ends in `+00:00`; freshness with `_utc_now` replaced by a clock yielding two values one second apart (asserting the two responses carry those two values, so nothing caches between requests, with no `sleep`), plus a real-clock pair asserting the second `now` is not earlier than the first; `POST /api/time` answers 405. No database is touched.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through a UI: no frontend consumes `/api/time` (`testing_standards.md` Section 6, fourth question asked per criterion; a spec calling the API directly would be the anti-pattern its Section 5 names).
  - Directory: e2e/tests/
  - File: none for this feature
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a non-GET method answers 405), verified by HTTP request, not UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | Integration | `test_get_time_returns_200_with_now_and_utc_timezone`, `test_create_app_registers_time_route` | verifying it needs no navigation or interaction: it is a router's HTTP response, and no UI consumes it |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration | `test_get_time_now_carries_explicit_utc_offset`, `test_get_time_computes_now_per_request`, `test_get_time_now_does_not_go_backwards_between_requests`, `test_get_server_time_returns_a_fresh_value_per_call`, `test_server_time_response_rejects_naive_datetime` | verifying it needs no navigation or interaction: it is serialisation and per-call computation in the service and schema |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_server_time_response_serialises_now_with_plus_zero_offset`, `test_server_time_response_normalises_non_utc_aware_value_to_utc` | verifying it needs no navigation or interaction: it is the schema's own behaviour, and the router's `response_model` is asserted through criterion 1's integration test |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit | `test_get_server_time_returns_timezone_aware_utc`, `test_server_time_response_rejects_naive_datetime` | verifying it needs no navigation or interaction: it is a property of the test suite itself, met by the unit and integration ids on rows 1 to 3 |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` equal to `UTC` |
| 2 | `now` per request, UTC, explicit offset, never naive | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time twice about a second apart, Then both `now` values end in `+00:00` and the second is later than the first |
| 3 | Body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When a client reads the OpenAPI document, Then GET /api/time's 200 response references the `ServerTimeResponse` schema |
| 4 | Tests cover shape, offset and freshness | covered at Unit, see Criterion coverage | Given the repository, When the server-time unit and integration test files are run, Then 0 tests fail |

## Manual verification plan
No criterion is verifiable through the UI: no frontend screen consumes `GET /api/time`. The observable check is the HTTP response, read with `curl` against the compose stack's backend on host port 8010 (the port `README.md` names), and the test files run with `uv`.

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone: "UTC"`
Prerequisites: from the repository root, `docker compose up -d --build` has run and `docker compose ps` shows `backend` running; a terminal with `curl`.
1. Run `curl -i http://localhost:8010/api/time` → the first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body → it is one JSON object with exactly two keys, `now` and `timezone`, for example `{"now":"2026-11-13T14:57:56.123456+00:00","timezone":"UTC"}`; `timezone` is exactly `UTC`.
3. Run `curl -i -X POST http://localhost:8010/api/time` → `HTTP/1.1 405 Method Not Allowed` (edge case: the endpoint is read-only).

### Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive
Prerequisites: as for criterion 1.
1. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two JSON bodies are printed.
2. Compare the two `now` values → both end in `+00:00` (not `Z`, and never without an offset), and the second is about one second later than the first; they are not equal.
3. Run `date -u +%Y-%m-%dT%H:%M:%S` on the host immediately after → the printed UTC time matches the second `now` to within a few seconds, confirming the value is UTC and not the host's local time.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for criterion 1.
1. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)` with fields `now` and `timezone`.
2. Open `backend/app/routers/server_time.py` → the handler declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse(...)`, with no dict literal built in the router.
3. Run `curl -s http://localhost:8010/openapi.json | grep -o 'ServerTimeResponse' | head -1` → prints `ServerTimeResponse`, showing the schema is what the API publishes for this route.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: `uv` installed on the host; no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_service_unit.py tests/unit/test_server_time_schema_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed` for those four files.
2. Open `backend/tests/integration/test_server_time_integration.py` → it contains the shape test (`test_get_time_returns_200_with_now_and_utc_timezone`), the offset test (`test_get_time_now_carries_explicit_utc_offset`) and the freshness tests (`test_get_time_computes_now_per_request`, `test_get_time_now_does_not_go_backwards_between_requests`).
