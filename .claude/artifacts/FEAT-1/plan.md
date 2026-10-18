# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature created 2026-09-07 for measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010). It exists to overlap a commit that will land on main during the run, not to be independent of it: it registers a router in backend/app/main.py, the file TEST-06 and TEST-07 also change.
>
> What: GET /api/time reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> Acceptance criteria:
> 1. GET /api/time returns 200 with a JSON body whose `now` field is an ISO 8601 UTC timestamp with explicit offset and whose `timezone` field is the string UTC.
> 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> 3. The response body is defined by a Pydantic schema in backend/app/schemas/, not by a bare dict in the router.
> 4. Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> Notes: Router under backend/app/routers/, registered in backend/app/main.py, following the TEST-06 shape. It touches main.py's router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The tracker description also carries a section titled "How the measured run uses this item (operator instructions, not part of the feature)". It is operator process, not product scope, and nothing in this plan derives from it.)

## Acceptance Criteria
- [ ] 1. GET /api/time returns 200 with a JSON body whose `now` field is an ISO 8601 UTC timestamp with explicit offset and whose `timezone` field is the string UTC.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in backend/app/schemas/, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
The item carries 14 tracker comments and 0 threaded replies. Thirteen are framework-posted notices (twelve plan-PR link comments and one /deliver delivery report) and ask for nothing. One is actionable, tagged tracker, and is a four-point re-plan request; each point is answered below. Where the comment and the description disagree, the comment wins (mcp_integration.md Section 2 step 3); where a point asks for work outside FEAT-1's acceptance criteria, user_story_alignment.md Section 3 decides, and the reason is stated.

- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py, the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." Addressed by: the insertion point is derived from backend/app/main.py as it stands on origin/main at c31a4b0, not from the commit the comment names. What changed since the comment was written: main now carries both TEST-06 (echo router, PR #222) and TEST-07 (uptime router plus the app.state.uptime_start mark captured in create_app, PR #223). The router imports are alphabetical by module (echo, health, notes, uptime, version), so the new import `from app.routers.server_time import router as server_time_router` goes between the notes and the uptime import lines. The include_router calls are in landing order (version, notes, health, echo, uptime), so `app.include_router(server_time_router)` is appended after `app.include_router(uptime_router)`, immediately before `return app`. The module docstring gains one clause naming FEAT-1 and the time router. Nothing else in main.py changes (lifespan, CORS middleware and the uptime start mark are untouched).
- Comment (tracker), point 2: "Also add a GET /api/echo?msg=:text endpoint returning an echo field holding the message while you are in main.py, so the two registrations land together." (JSON example in the original comment paraphrased here; the plan file cannot hold a brace beside a quote.) Not acted on, for two reasons. First, GET /api/echo already exists on main: backend/app/routers/echo.py, backend/app/schemas/echo.py and its registration in main.py all landed with TEST-06 (PR #222), with the exact contract the comment describes (msg required, response body with a single echo field). Adding it again would duplicate a delivered endpoint. Second, it is outside FEAT-1's four acceptance criteria, so planning it here would be gold plating (user_story_alignment.md Section 3). No echo file appears in the File Manifest.
- Comment (tracker), point 3: "The acceptance criterion says ISO 8601 UTC with explicit offset without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." Addressed by: the offset is pinned to `+00:00`, never `Z`. Reasons: it is the explicit numeric offset the criterion asks for, it is what Python datetime.isoformat() emits for a UTC-aware value, and it matches the precedent already on main, where TEST-07 pins started_at to `+00:00` with a field_serializer (backend/app/schemas/uptime.py), so the API emits one timestamp format. The choice is stated in backend/app/schemas/server_time.py: `now` is an AwareDatetime (naive input rejected) with a JSON-mode field_serializer that converts to UTC and emits isoformat(), and the class and serializer docstrings say `+00:00`, not `Z`. Covered by a unit test asserting the exact serialised string for a fixed instant (ending `+00:00`), a unit test that a non-UTC aware input serialises to the same instant ending `+00:00`, and an integration test asserting the live response value ends with `+00:00` and does not end with `Z`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router, Service, Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." Addressed by: no service module and no repository are planned. Planned deviation from coding_standards.md Section 2.2: the router reads the clock itself, `datetime.now(timezone.utc)`, inside the handler, and returns a ServerTimeResponse. Section 2.2 places business logic and transactional boundaries in the service layer and data access in the repository; reading the system clock is neither, there is no persistence, and a one-call service would be an abstraction with no logic in it (coding_standards.md Section 1, KISS). This mirrors TEST-06 (backend/app/routers/echo.py, no service). The deviation is also to be listed in the implementation PR description. Note the contrast with TEST-07, which did add backend/app/services/uptime_service.py: that service holds real logic (a start mark on two clocks, a non-negative elapsed computation); FEAT-1 has none.
- Merged since the last plan: n/a. This is a fresh plan on a branch freshly created from origin/main at c31a4b0; there is no earlier plan on this branch and no merged-since line was passed.

## Plan Overview
One read-only backend endpoint, GET /api/time, and nothing else. Layers touched: a new router module (backend/app/routers/server_time.py) that reads the UTC clock per request and returns a new Pydantic response schema (backend/app/schemas/server_time.py, fields `now` and `timezone`), registered in backend/app/main.py. No service, repository, migration, database access, frontend or external integration (see the planned deviation in Re-Plan Feedback point 4). The serialised offset is pinned to `+00:00` in the schema (Re-Plan Feedback point 3). Tests: one new unit file and one new integration file for the endpoint, plus one test added to the existing app-factory unit file asserting the route is registered. UAT artifacts (Gherkin scenarios and manual script) are produced at Phase G; there is no browser E2E spec because no criterion involves the UI.

## Frontend Plan
No frontend changes required.

- Components to create/modify: none
- Routes: none
- State management: none
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: GET /api/time, reports the server current time in UTC so a client can detect clock skew against the API. Router `backend/app/routers/server_time.py` with `router = APIRouter(prefix="/api", tags=["time"])` and one handler `get_server_time() -> ServerTimeResponse`, decorated `@router.get("/time", response_model=ServerTimeResponse)`. The handler calls `datetime.now(timezone.utc)` on every invocation (never cached, never computed at import or at app creation, which is what makes criterion 2 hold) and returns `ServerTimeResponse(now=that_value, timezone="UTC")`. No query parameters, no request body, no dependencies.
- Schema: `backend/app/schemas/server_time.py`, class `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (a naive datetime is rejected with ValidationError) and `timezone: Literal["UTC"]` (any other string is rejected). A `@field_serializer("now", when_used="json")` returns `value.astimezone(timezone.utc).isoformat()`, so the JSON value always carries the explicit `+00:00` offset, never `Z` and never naive; its docstring states that choice. Same mechanism as UptimeResponse in backend/app/schemas/uptime.py, so the API serialises every timestamp one way. Define a module constant for the timezone label only if the builder needs it in two places; the Literal type is the contract.
- Service layer: none, by planned deviation from coding_standards.md Section 2.2 (Re-Plan Feedback point 4): reading the clock is neither business logic nor a transactional boundary, as on TEST-06.
- Repository layer: none (no persistence).
- Migrations: none.
- App registration: backend/app/main.py gains the import `from app.routers.server_time import router as server_time_router`, placed between the notes and the uptime router imports (alphabetical by module), and `app.include_router(server_time_router)` appended after `app.include_router(uptime_router)` (landing order). The module docstring adds that FEAT-1 registers the time router. No other change to the factory.
- Error handling: none of its own. The only non-200 outcomes are FastAPI built-ins (405 for a non-GET method). No new exception class.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no query parameters, no body.
- Response: 200, `application/json`, body defined by ServerTimeResponse: `now` (string, ISO 8601, UTC, always ending `+00:00`, fractional seconds present when the clock reading has a non-zero microsecond part, as isoformat emits them) and `timezone` (string, always exactly `UTC`). Exactly these two fields. A POST, PUT or DELETE to the same path returns 405. Example:

```json
{"now": "2026-10-19T09:15:03.123456+00:00", "timezone": "UTC"}
```

## Technology Selection
- Current-time source (router handler): chose the standard library `datetime.now(timezone.utc)` over any time or clock dependency, because the stdlib returns a timezone-aware UTC value directly; no installed or new dependency is needed.
- ServerTimeResponse schema (backend/app/schemas/server_time.py): chose Pydantic (already installed with FastAPI) with `AwareDatetime`, `Literal["UTC"]` and a `field_serializer` over a hand-written dict or a custom validator, because Pydantic already rejects naive datetimes and wrong literals, and criterion 3 requires a Pydantic schema; the serializer is the stdlib `isoformat()` on a UTC value, the same rung TEST-07 used.
- `+00:00` serialisation: considered reusing a shared timestamp type from backend/app/schemas/uptime.py; none exists there (UptimeResponse pins its offset with a field_serializer local to the class, not with a reusable type), so the same three-line serializer is written in the new schema rather than refactoring TEST-07 code inside FEAT-1. A shared type is a /refactor candidate, not a FEAT-1 change.
- Router module (backend/app/routers/server_time.py): no stdlib call, native platform feature or installed dependency covers an endpoint, so it is built here on FastAPI APIRouter, as every existing router is.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: APIRouter with prefix /api and GET /time, reads datetime.now(timezone.utc) per request and returns ServerTimeResponse with timezone UTC; no service (planned deviation, Re-Plan Feedback point 4).
- [B] backend/app/schemas/server_time.py: ServerTimeResponse with now (AwareDatetime) and timezone (Literal UTC), plus the JSON-mode field_serializer pinning the `+00:00` offset; docstring states the choice.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (exact two-field shape, exact `+00:00` suffix for a fixed instant, non-UTC aware input converted to the same instant ending `+00:00`, naive now rejected, timezone other than UTC rejected), the route declaration (one /api/time route whose response_model is ServerTimeResponse), and the handler (two direct calls with a patched clock return the two different clock readings, proving the value is read per call).
- [B] backend/tests/integration/test_server_time_integration.py: integration tests through the TestClient (`client` fixture in backend/tests/conftest.py): 200 with exactly now and timezone, timezone equals UTC, now parses with fromisoformat, ends with `+00:00` and not `Z`, has a zero utcoffset, and lies between instants read just before and just after the call; two calls one second apart return different now values with the second later; POST /api/time returns 405.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus at least one edge case (UAT Generation is ENABLED).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import server_time_router between the notes and uptime router imports (alphabetical), append app.include_router(server_time_router) after the uptime registration (landing order), and add FEAT-1 to the module docstring. Nothing else changes.
- [B] backend/tests/unit/test_main_unit.py: add test_create_app_registers_time_route asserting /api/time is among the app custom route paths, in the same shape as the existing echo and uptime registration tests.

No browser E2E spec: no acceptance criterion involves navigation or interaction through the UI (see Criterion coverage), and the existing backend-only items TEST-02, TEST-06 and TEST-07 carry none either.
No lockfile changes: this feature adds no dependency.
README.md and docs/DEVELOPMENT.md: neither needs an edit, because this feature changes no project structure, run configuration, dependency or test infrastructure (build-feature Section 15 condition); it adds one endpoint inside the existing layout.

## Testing Strategy
- Unit tests: the ServerTimeResponse schema (shape, exact `+00:00` serialisation, conversion of a non-UTC aware value, rejection of a naive now and of a timezone other than UTC), the route declaration (response_model is ServerTimeResponse), the handler read per call with the clock patched, and the app factory registering /api/time. Happy path, edge case and error case per tested unit (testing_standards.md Section 1.1). No database, no network.
  - Directory: backend/tests/unit/
  - Naming: test_server_time_unit.py (pattern test_module_unit.py); plus one test added to the existing test_main_unit.py
- Integration tests: GET /api/time through the real HTTP request and response cycle with the session-scoped `client` fixture: 200 and shape, the live offset suffix, the value bracketed by the test clock, per-request freshness across a one-second interval, and 405 on POST (testing_standards.md Section 1.2 router tests; no 404 or 422 case exists for a parameterless GET). Needs no database: the endpoint touches none, so these tests run without DATABASE_URL.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. E2E Tests is ENABLED, but no acceptance criterion requires navigation or interaction through the UI (testing_standards.md Section 6, fourth question asked per criterion), and no screen consumes /api/time. No spec file is produced.
  - Directory: e2e/tests/
  - File: none (would be FEAT-1_server_time_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus edge cases (POST returns 405; repeated call returns a later now), validated for well-formedness in CI; and the manual UAT script.
  - Directory: e2e/uat/scenarios/ (scenarios), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/time returns 200 with now as an ISO 8601 UTC timestamp with explicit offset and timezone equal to UTC | Integration | Verifying it needs no navigation or interaction: it is a router response (status, fields, values) checked through the HTTP cycle, and no UI shows it |
| 2 | now is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive | Integration and Unit | Verifying it needs no navigation or interaction: freshness is two HTTP calls one second apart (integration) plus the handler read per call with a patched clock, and the offset and naive rejection are serializer and validation rules (unit) |
| 3 | The response body is defined by a Pydantic schema in backend/app/schemas/, not by a bare dict | Unit | Verifying it needs no navigation or interaction: it is a code-structure fact, asserted by the route response_model being ServerTimeResponse and by the schema validating and serialising |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | Verifying it needs no navigation or interaction: it is satisfied by the existence and passing of test_server_time_unit.py and test_server_time_integration.py, each covering the three named properties |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with now (ISO 8601 UTC, explicit offset) and timezone UTC | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly now and timezone, now ends with +00:00 and timezone is UTC |
| 2 | now computed per request, UTC with explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client sends GET /api/time twice one second apart, Then the two now values differ, the second is later, and both end with +00:00 |
| 3 | Response body defined by a Pydantic schema in backend/app/schemas/ | covered at Unit, see Criterion coverage | Given the API documentation at /docs, When the GET /api/time operation is expanded, Then its 200 response schema is ServerTimeResponse with fields now and timezone |
| 4 | Unit and integration tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the FEAT-1 unit and integration test files are run, Then 0 tests fail |

## Manual verification plan
This is a backend-only feature: no screen consumes /api/time, so each check is a terminal curl, a browser address bar on the JSON URL, the API docs page, or a file read.

### Criterion 1: GET /api/time returns 200 with a JSON body whose now field is an ISO 8601 UTC timestamp with explicit offset and whose timezone field is the string UTC
Prerequisites: Docker running; repository on branch `feature/FEAT-1-server-time-endpoint` (or main once merged); from the repository root run `docker compose up -d --build`, then `docker compose ps` until the backend service shows running; the backend answers on `http://localhost:8010` (published by docker-compose.yml).
1. In a terminal run `curl -i http://localhost:8010/api/time` → the first response line is `HTTP/1.1 200 OK` and the content-type header is `application/json`.
2. Read the body under the headers → exactly two fields, `now` and `timezone`, and nothing else; `timezone` is the string `UTC`.
3. Read the `now` value → it has the shape `2026-10-19T09:15:03.123456+00:00` (date, `T`, time, optional fractional seconds) and ends with `+00:00`, never with `Z` and never without an offset; its date and time match the current UTC time shown by `date -u` in the same terminal to within a few seconds.
4. Open `http://localhost:8010/api/time` in a browser address bar → the page shows the same two-field JSON, `timezone` is `UTC` and `now` ends with `+00:00`.

### Criterion 2: now is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
Prerequisites: same stack as Criterion 1, backend running on `http://localhost:8010`.
1. Run `curl -s http://localhost:8010/api/time` and note the `now` value → a timestamp ending `+00:00`.
2. Wait at least one second, then run `curl -s http://localhost:8010/api/time` again and note `now` → it differs from step 1 and is about one second (or more) later; it also ends with `+00:00`.
3. Refresh `http://localhost:8010/api/time` in the browser three times → `now` changes on each refresh and never loses its `+00:00` suffix.

### Criterion 3: The response body is defined by a Pydantic schema in backend/app/schemas/, not by a bare dict in the router
Prerequisites: the repository checked out on the feature branch; for step 4, the stack from Criterion 1 running.
1. Open `backend/app/schemas/server_time.py` → `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` and `timezone: Literal["UTC"]`, and a JSON-mode serializer on `now` whose docstring says it emits `+00:00`, not `Z`.
2. Open `backend/app/routers/server_time.py` → the decorator declares `response_model=ServerTimeResponse`, `ServerTimeResponse` is imported from `app.schemas.server_time`, and the handler returns a `ServerTimeResponse(...)` instance, not a dict literal; the handler reads `datetime.now(timezone.utc)` itself and no services module is imported.
3. Open `backend/app/main.py` → the server_time router import sits between the notes and uptime imports, and `app.include_router(server_time_router)` is the last registration, after the uptime one.
4. Open `http://localhost:8010/docs` and expand `GET /api/time` → the 200 response schema is `ServerTimeResponse` with fields `now` (string, date-time) and `timezone` (string, UTC).

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: `uv` installed and backend dependencies synced (`uv sync --directory backend`); no database is needed for these files.
1. From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → `0 failed` across those three files.
2. Open `backend/tests/unit/test_server_time_unit.py` → it has a test asserting the exact serialised `now` string for a fixed instant, ending `+00:00`, a test for the two-field shape, and a test that a naive `now` is rejected.
3. Open `backend/tests/integration/test_server_time_integration.py` → it has a test asserting the live `now` ends with `+00:00` and the body has exactly `now` and `timezone`, and a test that makes two calls one second apart and asserts the two `now` values differ.
