# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> **What:** `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> **Acceptance criteria:**
> 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
> 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
> 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
>
> **Notes:** Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches `main.py`'s router registration, so it must not run concurrently with another backend item that does the same.
>
> **Source:** ClickUp task 123k99ctgcg (https://app.clickup.com/t/123k99ctgcg), tracker-resident under Work Item Source `hybrid`, status `to do` at plan time. Framework metadata (`feature_map.md`): branch `feature/TEST-07-uptime-endpoint`; depends_on: TEST-01 (done); scaffold: no; test_checkpoint: yes.

## Acceptance Criteria
- [ ] `GET /api/uptime` returns 200 with a JSON body of exactly two fields: `uptime_seconds` (a JSON number) and `started_at` (an ISO 8601 UTC timestamp string).
- [ ] `uptime_seconds` is non-negative (declared `ge=0` on the schema, so the bound is in the contract and the OpenAPI document) and a second call issued one second after a first reports a strictly larger value.
- [ ] `started_at` is captured once per process, at import of the uptime service module (which happens when `app.main` loads, before the first request), never recomputed per request, and serialised as an ISO 8601 string in UTC with the explicit offset `+00:00` (not Pydantic's default `Z` designator, and never a naive timestamp).
- [ ] The response body is defined by a Pydantic model `UptimeResponse` in `backend/app/schemas/uptime.py`, used as the endpoint's `response_model`; the router builds no bare dict.

## Re-Plan Feedback
No feedback exists to record on this first plan: the tracker item carries 0 comments (read with the pinned identifiers at dispatch time, `mcp_integration.md` Section 2 step 3), there is no PR yet so there are no PR review comments, and the branch was created from `origin/main` at 8794a99 minutes before this plan, so no `[merged-since]` notice applies.

## Plan Overview
Backend-only feature, one router, one service, one schema, their tests. Add `GET /api/uptime` to the FastAPI app as a new router (`backend/app/routers/uptime.py`, prefix `/api`, tags `["uptime"]`, the shape of `routers/version.py`) registered in `create_app()` in `backend/app/main.py`. The router calls `uptime_service.get_uptime()` and maps its frozen `UptimeReport` dataclass onto the response model `UptimeResponse` (`backend/app/schemas/uptime.py`), the same Router → Service split `routers/health.py` and `services/health_service.py` use (`coding_standards.md` Section 2.2: the elapsed-time computation and the captured-once state are business logic, so they live in the service, not the handler).

The service module `backend/app/services/uptime_service.py` captures the process start **once, at module import**: `STARTED_AT = datetime.now(timezone.utc)` and `_STARTED_MONOTONIC = monotonic()` as module-level constants. `get_uptime()` returns `UptimeReport(uptime_seconds=monotonic() - _STARTED_MONOTONIC, started_at=STARTED_AT)`. Import happens when `uvicorn app.main:app` loads the app module (which imports the router, which imports the service), i.e. at process startup, before any request. This satisfies criterion 3's "captured once, not recomputed per request" by construction: nothing in the request path assigns `STARTED_AT`.

The schema makes the contract self-enforcing rather than hand-checked: `uptime_seconds: float = Field(ge=0)` puts criterion 2's non-negative bound in the schema and the OpenAPI document; `started_at: AwareDatetime` rejects a naive timestamp at construction; and a `@field_serializer("started_at")` returning `value.astimezone(timezone.utc).isoformat()` guarantees criterion 3's "UTC with an explicit offset" (`...+00:00`) whatever tz-aware value reaches it.

No repository, no migration, no database involvement (the endpoint answers with or without `DATABASE_URL`, like `/api/version`), no frontend work, no new dependency, no settings change.

Recorded assumptions (the item is silent, the plan decides rather than blocks, `user_story_alignment.md` Section 4):
- "Application startup" is read as **process** startup, per the description's own words ("how long the process has been running"). A per-`create_app()` capture in `lifespan` (stored on `app.state`) was considered and rejected: `create_app()` is called several times per test process, which would yield several `started_at` values in one process and contradict the description; it would also widen the `main.py` edit beyond router registration. Consequence: `started_at` is identical across every `TestClient` in one pytest process, which the tests rely on rather than fight.
- `uptime_seconds` is a JSON number with fractional seconds (a Python `float`), not rounded or truncated; the criterion says `<number>` and names no precision.
- "Explicit offset" is read literally as a numeric offset (`+00:00`). Pydantic v2 serialises a UTC-aware datetime as `...Z` by default; `Z` is the ISO 8601 UTC designator, not an offset, so the schema carries a one-line field serializer producing `isoformat()` output. Microsecond precision is `isoformat()`'s default and is kept.
- Elapsed time is measured on the monotonic clock, `started_at` on the wall clock. The two are captured back to back at import and may differ by microseconds; an operator reading either is unaffected, and the monotonic clock is what makes criterion 2's "non-negative" and "increases" hold under an NTP step or a manual clock change.
- The endpoint has no failure path of its own; the only reachable error is 405 on a non-GET method (FastAPI default, as with `/api/version`, `/api/health`, `/api/echo`).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime` in `backend/app/routers/uptime.py`. `router = APIRouter(prefix="/api", tags=["uptime"])`; handler `get_uptime() -> UptimeResponse` decorated `@router.get("/uptime", response_model=UptimeResponse)`, body: `report = uptime_service.get_uptime()` then `return UptimeResponse(uptime_seconds=report.uptime_seconds, started_at=report.started_at)`. No business logic in the handler; it takes no parameters, so there is no request validation path.
- Service layer: `backend/app/services/uptime_service.py`. Module docstring explains **why** capture is at import (process start, once per process). Imports: `from dataclasses import dataclass`, `from datetime import datetime, timezone`, `from time import monotonic` (imported by name so a unit test can `monkeypatch.setattr(uptime_service, "monotonic", ...)`, the pattern `version_service` uses for `version`). Module constants: `STARTED_AT: datetime = datetime.now(timezone.utc)` (public, the value the router reports) and `_STARTED_MONOTONIC: float = monotonic()` (private reference point for elapsed time). `@dataclass(frozen=True) class UptimeReport: uptime_seconds: float; started_at: datetime` (the shape `health_service.HealthReport` uses; domain result kept separate from the response schema per `coding_standards.md` Section 2.2 point 4). `def get_uptime() -> UptimeReport: return UptimeReport(uptime_seconds=monotonic() - _STARTED_MONOTONIC, started_at=STARTED_AT)`. No clamping to zero: the monotonic clock cannot run backwards, and clamping would hide a defect rather than report one; the schema's `ge=0` is the contract's guard. Nothing to log: there is no failure path.
- Schema: `backend/app/schemas/uptime.py`. `from datetime import datetime, timezone`; `from pydantic import AwareDatetime, BaseModel, Field, field_serializer`. `class UptimeResponse(BaseModel)` with docstring naming the endpoint; fields `uptime_seconds: float = Field(ge=0)` (a "why" comment: the bound belongs in the contract, as `schemas/echo.py` does for its length bound) and `started_at: AwareDatetime`; method `@field_serializer("started_at") def serialize_started_at(self, value: datetime) -> str: return value.astimezone(timezone.utc).isoformat()` with a "why" comment (Pydantic's default `Z` is a designator, criterion 3 asks for an explicit offset, and normalising to UTC makes the UTC guarantee hold for any aware input).
- Registration: one `from app.routers.uptime import router as uptime_router` import (alphabetical among the existing router imports, after `notes`) and one `app.include_router(uptime_router)` line in `create_app()` in `backend/app/main.py`, after `app.include_router(echo_router)`; add one clause for TEST-07 to the module docstring's list of registering features. Nothing else in `main.py` changes; `lifespan` is untouched.
- Repository layer: none. No data access.
- Migrations: none.
- Logging and errors: nothing to log; no custom exception (`coding_standards.md` Section 2.3 applies to failure paths, and this feature has none).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no path, query, header or body parameters.
- Response 200, `application/json`, schema `UptimeResponse`:

  ```json
  {"uptime_seconds": 37.482911, "started_at": "2026-09-03T13:05:12.345678+00:00"}
  ```

  `uptime_seconds`: JSON number, `>= 0`, fractional seconds, strictly increasing across successive calls within one process. `started_at`: ISO 8601 string, UTC, offset spelled `+00:00`, microsecond precision, identical on every response from the same process, different after a process restart.
- OpenAPI (`GET /openapi.json`): the 200 response's `application/json` schema is `{"$ref": "#/components/schemas/UptimeResponse"}`; `components.schemas.UptimeResponse.properties.uptime_seconds` has `type` `number` and `minimum` `0`; `components.schemas.UptimeResponse.properties.started_at` has `type` `string` and `format` `date-time`; `required` lists both fields. This is the machine-readable proof that the bound and the body are declared rather than hand-coded.
- Any other method on the path: 405 (FastAPI default).

## Technology Selection
- Process-start capture (`STARTED_AT`, criterion 3): chose stdlib `datetime.now(timezone.utc)` evaluated once at import of `app/services/uptime_service.py` over (a) capturing in `lifespan` and storing on `app.state` (per app instance, not per process, and it widens the `main.py` edit beyond router registration), (b) `psutil.Process().create_time()` (a new dependency for one timestamp), and (c) reading `/proc/self/stat` (Linux-only; developers run this on macOS).
- Elapsed-time measurement (`uptime_seconds`, criterion 2): chose stdlib `time.monotonic()` delta from a reference captured at import over wall-clock subtraction `datetime.now(timezone.utc) - STARTED_AT`, because a wall-clock step (NTP correction, manual change) can make the difference negative or non-increasing, and criterion 2 requires both non-negative and increasing.
- Non-negative bound on `uptime_seconds`: chose Pydantic `Field(ge=0)` on the schema (installed with FastAPI; a declared constraint, visible in OpenAPI, the precedent `schemas/echo.py` set for its length bound) over an `if value < 0` check in the handler or service.
- Tz-aware guarantee on `started_at`: chose Pydantic's `AwareDatetime` type (installed) over a plain `datetime` field plus a hand-rolled `tzinfo is None` check, so a naive value is rejected at model construction by the library.
- UTC-with-explicit-offset serialisation (criterion 3): chose a Pydantic `@field_serializer` (installed) calling stdlib `datetime.astimezone(timezone.utc).isoformat()` over Pydantic's default serialisation (which emits `Z`, a designator rather than an offset) and over declaring `started_at: str` and formatting in the service (which would lose the `format: date-time` declaration in OpenAPI and move a serialisation concern into the business layer).
- Domain result `UptimeReport`: chose a stdlib `@dataclass(frozen=True)` (the `health_service.HealthReport` precedent) over returning the Pydantic response model from the service (would couple the service to the HTTP schema, `coding_standards.md` Section 2.2 point 4) and over a tuple (unnamed fields).
- Router module `backend/app/routers/uptime.py`: chose a dedicated `APIRouter` (installed FastAPI) over adding the route to an existing router (`version.py`, `health.py`), because the project's convention is one router module per endpoint and the item names its own router; no stdlib or platform alternative exists for an HTTP route.
- Response schema `UptimeResponse` in `backend/app/schemas/uptime.py`: chose a `pydantic.BaseModel` (installed, the shape of every file in `app/schemas/`) over a bare dict (forbidden by criterion 4) and over a stdlib `TypedDict` (not a Pydantic schema, which is what the criterion names).
- Tests: chose the installed `pytest`, `fastapi.testclient.TestClient` (installed `httpx`) through the existing session `client` fixture in `backend/tests/conftest.py`, pytest's built-in `monkeypatch` for the unit-level clock, stdlib `time.sleep(1)` for the integration test's one-second gap, and `client.get("/openapi.json").json()` for the contract assertions, over any new test or JSON-schema dependency. No new test dependency.
- No net-new dependency is added by this feature: `backend/pyproject.toml` and `backend/uv.lock` are untouched.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic response model for `GET /api/uptime`: `uptime_seconds: float = Field(ge=0)`, `started_at: AwareDatetime`, and the `started_at` field serializer producing `astimezone(timezone.utc).isoformat()` (criteria 1, 2, 3, 4).
- [B] backend/app/services/uptime_service.py: module-level `STARTED_AT` (UTC wall clock) and `_STARTED_MONOTONIC` captured once at import; frozen `UptimeReport` dataclass; `get_uptime()` returning the monotonic elapsed seconds and `STARTED_AT` (criteria 2 and 3).
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router, `response_model=UptimeResponse`, handler calls `uptime_service.get_uptime()` and maps the report onto the schema; no business logic (criteria 1 and 4).
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service with `uptime_service.monotonic` monkeypatched: reference plus 12.5 → `uptime_seconds == 12.5` and `started_at is uptime_service.STARTED_AT` (happy path); reference exactly → `0.0` (boundary edge case, the non-negative floor); two calls with the clock advanced by 1.0 between them → the second `uptime_seconds` is exactly 1.0 larger and both reports carry the same `started_at` object (criteria 2 and 3, "captured once"); `STARTED_AT.tzinfo is timezone.utc` and `STARTED_AT.utcoffset() == timedelta(0)` (criterion 3's UTC half at the source); `UptimeReport` is frozen, so assigning `report.uptime_seconds` raises `dataclasses.FrozenInstanceError` (error case).
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for the schema and its binding to the route: `UptimeResponse(uptime_seconds=1.5, started_at=datetime(2026, 9, 3, 12, 0, tzinfo=timezone.utc)).model_dump(mode="json") == {"uptime_seconds": 1.5, "started_at": "2026-09-03T12:00:00+00:00"}` (happy path, criterion 3's `+00:00`); a `+02:00` input serialises normalised to `...10:00:00+00:00` (edge case, UTC normalisation); `UptimeResponse` is a `pydantic.BaseModel` subclass whose `__module__` is `app.schemas.uptime` and the `/api/uptime` route in `app.routers.uptime.router.routes` has `response_model is UptimeResponse` (criterion 4, structure, the `test_echo_schema_unit.py` pattern); `uptime_seconds=-0.001` raises `pydantic.ValidationError` (error case, criterion 2's bound); a naive `datetime(2026, 9, 3, 12, 0)` for `started_at` raises `pydantic.ValidationError` (error case, criterion 3's aware requirement); `UptimeResponse()` with no fields raises `pydantic.ValidationError` (error case).
- [B] backend/tests/integration/test_uptime_integration.py: full HTTP cycle through the shared `client` fixture: `GET /api/uptime` → 200, `content-type` `application/json`, body keys exactly `{"uptime_seconds", "started_at"}`, `uptime_seconds` an `int | float` `>= 0`, `started_at` parses with `datetime.fromisoformat` to an aware datetime with `utcoffset() == timedelta(0)` and the raw string ends with `+00:00` (criteria 1 and 3); two requests with `time.sleep(1)` between them → the second `uptime_seconds` is strictly greater than the first and both responses carry the identical `started_at` string (criteria 2 and 3); `GET /openapi.json` → the 200 response `$ref`s `#/components/schemas/UptimeResponse`, `properties.uptime_seconds.minimum == 0`, `properties.started_at.format == "date-time"`, `required` lists both fields (criteria 2 and 4, from the outside); `POST /api/uptime` → 405 (read-only, matching the version, health and echo precedents). These tests need no database and must not use the `database_url` or `db_connection` fixtures.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (after `docker compose restart backend`, `started_at` moves later and `uptime_seconds` resets to a small value).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the uptime router and add one `app.include_router(uptime_router)` line in `create_app()` after the echo router; add TEST-07 to the module docstring's list of registering features. Nothing else changes; `lifespan` is untouched.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` asserting `/api/uptime` is among the app's custom route paths, in the shape of the existing version, health and echo cases.

No dependency manifest changes, so no lockfile is touched: FastAPI, Pydantic, pytest and httpx are already installed and cover every module above. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, and neither document lists the existing endpoints (checked: no `/api/` path appears in either).

## Testing Strategy
- Unit tests: the service and the schema, with no HTTP cycle and no app startup. Service (`test_uptime_service_unit.py`): `get_uptime()` with `uptime_service.monotonic` monkeypatched, covering the happy path (12.5 s elapsed), the zero boundary, the "advance by one second, uptime grows by one second, `started_at` unchanged" case that is criterion 2's arithmetic and criterion 3's captured-once property in deterministic form, the UTC-ness of `STARTED_AT`, and `FrozenInstanceError` on mutation as the error case (the service has no failure path of its own, so its error case is the immutability contract). Schema (`test_uptime_schema_unit.py`): serialisation to `+00:00` (happy path), UTC normalisation of a non-UTC aware input (edge), the model's location in `app.schemas.uptime` and its identity as the route's `response_model` (criterion 4 as a code-structure property), and `ValidationError` on a negative `uptime_seconds`, on a naive `started_at`, and on an empty construction (error cases). Plus the app-factory registration case added to the existing `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`, `test_uptime_schema_unit.py`; the route-registration case goes into the existing `test_main_unit.py`)
- Integration tests: the router through the full HTTP request/response cycle via the session-scoped `client` fixture in `backend/tests/conftest.py`. 200 with the exact two-field shape and a parseable UTC `started_at` ending in `+00:00` (criteria 1 and 3); two calls one real second apart (`time.sleep(1)`, the only sleep in the suite and the literal wording of criterion 2) with a strictly larger `uptime_seconds` and an identical `started_at` (criteria 2 and 3); OpenAPI declares `minimum: 0` on `uptime_seconds`, `format: date-time` on `started_at`, and `$ref`s `UptimeResponse` (criteria 2 and 4 from the outside); 405 on POST. Note for the builder: these tests need no database and must not use the `database_url` or `db_connection` fixtures, so they run with `DATABASE_URL` unset locally exactly as `test_version_integration.py` and `test_echo_integration.py` do; the `client` fixture's lifespan tolerates an unset `DATABASE_URL` with a logged warning.
  - Directory: backend/tests/integration/ (`test_uptime_integration.py`)
- E2E tests: not warranted for this feature, so no `e2e/tests/TEST-07_uptime_endpoint.spec.ts` is produced and no `[D]` manifest entry exists. `testing_standards.md` Section 6's fourth question, asked per criterion below, answers no four times: every criterion is an HTTP status/body behaviour of a backend endpoint that no UI consumes, so verifying it needs no navigation or interaction, and a browser spec would either call the API directly (Section 5's anti-pattern: that is a router integration test) or drive a page that does not exist. Section 4's per-feature edge-case spec obligation attaches only when E2E is warranted at all, so it does not attach here; the edge cases (zero boundary, UTC normalisation, one-second growth) are covered at unit and integration instead. This matches the TEST-02 and TEST-06 precedents, which produced no spec for their backend-only endpoints.
  - Directory: e2e/tests/ (nothing written there by this feature)
  - File: {feature_id}_{slug}.spec.ts naming would give `TEST-07_uptime_endpoint.spec.ts`; deliberately not produced, see above
- UAT scenarios: one Gherkin scenario per acceptance criterion (four) plus one edge-case scenario (a backend restart moves `started_at` later and resets `uptime_seconds`), validated for well-formedness on merge, not executed as browser tests. The manual script is expanded from `## Manual verification plan` below.
  - Directory: e2e/uat/scenarios/ (Gherkin, `TEST-07_uptime_endpoint.feature`), e2e/uat/scripts/ (manual script, `TEST-07_uptime_endpoint_uat_script.md`)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour over the real HTTP request/response cycle (status, content type, exact key set, field types), and no UI consumes the endpoint |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration | Same: two real requests one second apart over the HTTP cycle, plus the `minimum: 0` declaration read off `/openapi.json`; a browser adds nothing and no page issues this request. The unit tier additionally proves the arithmetic deterministically with a monkeypatched clock |
| 3 | `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset | Unit | A code-structure and serialisation property: `STARTED_AT` is a module constant that two `get_uptime()` calls return by identity, and `UptimeResponse.model_dump(mode="json")` yields `...+00:00` for a UTC input and normalises a non-UTC aware input; neither needs an HTTP cycle, so unit is the cheapest tier. The integration tier corroborates from the outside (identical `started_at` across two responses, string ends `+00:00`) |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | A code-structure property: import `app.schemas.uptime.UptimeResponse`, assert it is a `BaseModel` in that module and that the `/api/uptime` route's `response_model is UptimeResponse`; needs no HTTP cycle. The integration tier's OpenAPI `$ref` assertion confirms the same fact from the outside |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime, Then the response is HTTP 200 `application/json` with exactly the fields `uptime_seconds` (a number) and `started_at` (an ISO 8601 UTC string) |
| 2 | `uptime_seconds` non-negative and increasing a second apart | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime, waits one second, and requests it again, Then both `uptime_seconds` values are `>= 0` And the second is strictly greater than the first |
| 3 | `started_at` captured once at startup, serialised in UTC with explicit offset | covered at Unit, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime twice, Then both responses carry the identical `started_at` And it ends with `+00:00` And parses as an aware UTC timestamp |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When a client reads GET /openapi.json, Then the 200 response of `/api/uptime` references the component schema `UptimeResponse`, And that component declares `uptime_seconds` (number, minimum 0) and `started_at` (string, date-time) |

## Manual verification plan
None of the four criteria is verifiable through the UI: no frontend consumes `GET /api/uptime`, so the observable check for each is the HTTP response itself, read with `curl` or a browser address bar, plus the OpenAPI document the backend serves at `/openapi.json`. Backend host port is 8010 (`docker-compose.yml`, service `backend`). The `db` service state is irrelevant: the endpoint opens no database connection.

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
Prerequisites: Docker running; the stack up via `docker compose up -d --build` from the repository root on branch `feature/TEST-07-uptime-endpoint`; `docker compose ps` shows `backend` running.
1. In a terminal, run `curl -i "http://localhost:8010/api/uptime"` → the first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json`.
2. Read the response body → a JSON object with exactly two keys, in the shape `{"uptime_seconds":12.345678,"started_at":"2026-09-03T13:05:12.345678+00:00"}` (your numbers and timestamp will differ): `uptime_seconds` is a number, `started_at` is a quoted timestamp string.
3. Alternatively open `http://localhost:8010/api/uptime` in a browser → the page shows the same two-field JSON object.

### Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart
Prerequisites: criterion 1 just verified, stack still up.
1. Run `curl -s "http://localhost:8010/api/uptime"; echo; sleep 1; curl -s "http://localhost:8010/api/uptime"; echo` → two JSON lines are printed one second apart.
2. Compare the two `uptime_seconds` values → both are `>= 0`, and the second is larger than the first by roughly one second (for example `41.207113` then `42.219850`).
3. Run `curl -s http://localhost:8010/openapi.json` and locate `components` → `schemas` → `UptimeResponse` → `properties` → `uptime_seconds` → it carries `"type":"number"` and `"minimum":0`. This is the declared bound; a check hand-rolled in the handler would not appear here.

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: stack still up.
1. Run `curl -s "http://localhost:8010/api/uptime"; echo; curl -s "http://localhost:8010/api/uptime"; echo` → two JSON lines.
2. Compare the two `started_at` values → they are character-for-character identical (the value is captured once, not per request), while the two `uptime_seconds` values differ.
3. Read the `started_at` string → it has the shape `2026-09-03T13:05:12.345678+00:00`: a date, a `T`, a time with fractional seconds, and the explicit offset `+00:00` at the end. It does not end in `Z` and it does not lack an offset.
4. Run `date -u +%Y-%m-%dT%H:%M` in the same terminal → the printed UTC date and hour match the date and hour of `started_at` up to the minute at which the backend container last started (the value is UTC, not local time; on a machine in UTC+2 the local hour would be two higher).
5. Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then `curl -s "http://localhost:8010/api/uptime"; echo` → `started_at` is now a later timestamp than in step 1 and `uptime_seconds` is a small value (a few seconds), which is the restart an operator is meant to be able to see.
6. Open `backend/app/services/uptime_service.py` in the repository → `STARTED_AT = datetime.now(timezone.utc)` is a module-level assignment, and `get_uptime()` reads `STARTED_AT` without reassigning it.

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: stack still up; repository checked out.
1. Open `backend/app/schemas/uptime.py` in the repository → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus a `@field_serializer("started_at")` method.
2. Open `backend/app/routers/uptime.py` → the route decorator reads `@router.get("/uptime", response_model=UptimeResponse)` and the handler returns `UptimeResponse(...)`, not a dict literal.
3. Run `curl -s http://localhost:8010/openapi.json` and locate `paths` → `/api/uptime` → `get` → `responses` → `200` → `content` → `application/json` → `schema` → it reads `{"$ref":"#/components/schemas/UptimeResponse"}`; and `components` → `schemas` → `UptimeResponse` exists with `properties.uptime_seconds` (`"type":"number"`) and `properties.started_at` (`"type":"string"`, `"format":"date-time"`) and `"required":["uptime_seconds","started_at"]`.
4. Open `http://localhost:8010/docs` in a browser → under the `uptime` tag, expand `GET /api/uptime` → the 200 response's "Example Value | Schema" toggle names the schema `UptimeResponse`.
