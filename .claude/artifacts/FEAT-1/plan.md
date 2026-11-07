# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature created 2026-09-07 for **measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010)**. It exists to **overlap** a commit that will land on `main` during the run, not to be independent of it: it registers a router in `backend/app/main.py`, the file TEST-06 and TEST-07 also change. That overlap is the whole point (measured run 2 chose its Arm D item for independence and MDF-010 went unmeasured for the third time; `docs/measurement-baseline-0.3.132.md` Section 5.2).
>
> ## What
>
> `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> ## Acceptance criteria
>
> * `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> * `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> * The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> * Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> ## Notes
>
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. **It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.**
>
> (The description's "How the measured run uses this item" block is operator instructions for the framework's own measurement, not part of the feature, and is deliberately not planned.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: this is a first plan on this branch, so there is no previous insertion point; the insertion point is derived from `backend/app/main.py` at origin/main ecaacc6 (this branch's base). Read-only git found: 73e544c (feat(TEST-06): Echo endpoint, #35) IS an ancestor of origin/main and touched `backend/app/main.py` (6 lines) plus `backend/app/routers/echo.py` and `backend/app/schemas/echo.py`; but its echo code is NO LONGER PRESENT on main: later sandbox-reset commits (the first touching main.py after it being 61a424f, "reset the sandbox for measured run 4", most recently 873e0f3) rewound the backend, and `git ls-tree origin/main backend/app/routers` lists only health.py, notes.py and version.py. So what changed relative to the comment's premise: the router-registration block at ecaacc6 is imports at lines 19 to 21 (`health_router`, `notes_router`, `version_router`) and `create_app()` calls `app.include_router(version_router)`, `(notes_router)`, `(health_router)` at lines 54 to 56, with no echo router. FEAT-1 inserts `from app.routers.server_time import router as server_time_router` between the notes and version imports (alphabetical) and `app.include_router(server_time_router)` after `app.include_router(health_router)` (append, matching the existing one-call-per-router shape), and updates the module docstring's list of registering features. The "TEST-06 shape" the description names is followed as it exists on main today, i.e. the same router-module shape as `routers/version.py` (an `APIRouter(prefix="/api", tags=[...])` with one `@router.get(..., response_model=...)`).
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on because it is outside FEAT-1's four acceptance criteria (scope containment, `user_story_alignment.md` Section 3): an echo endpoint is TEST-06's own work item (and TEST-11 and BUG-05 specify contradictory whitespace behaviour for it that is unresolved), so building it here would ship an unreviewed, contradictory spec under FEAT-1's ID. Recommended route: re-open or re-build TEST-06 as its own item; FEAT-1's main.py edit is two lines and does not block it.
- Comment (tracker), point 3: "Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is pinned to `+00:00`, because it is a numeric offset (the criterion's literal "explicit offset") rather than the `Z` designator, and it is what Python's `datetime.isoformat()` emits for an aware UTC value. Pydantic v2's default JSON serialiser would emit `Z` for a UTC datetime, so the schema states the choice explicitly: a module constant `UTC_OFFSET_SUFFIX = "+00:00"`, a docstring saying so, and a `@field_serializer("now")` that returns `value.astimezone(UTC).isoformat()`. Unit test `test_server_time_response_serialises_now_with_plus_zero_offset` and integration test `test_get_time_now_ends_with_plus_zero_offset` assert `endswith("+00:00")` and that the string does not end with `Z`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. ... Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module is planned; the router reads `datetime.now(UTC)` and builds the schema. Recorded as a planned deviation from `coding_standards.md` Section 2.2 (Router has "NO business logic"; Router, Service, Repository applies "when the project includes a backend with data persistence"): reading the clock is neither business logic nor a transactional boundary, the endpoint touches no persistence, and a one-line service would be a hasty abstraction against Section 1's KISS. The builder must list it as a deviation in the PR description. Test consequence: freshness is unit-tested by monkeypatching the router module's `datetime` name, not a service function.

## Plan Overview
One backend-only endpoint, `GET /api/time`, in a new router module registered in the app factory, with its response body defined by a new Pydantic schema that pins the UTC offset to `+00:00` and rejects naive datetimes. No service, repository, migration, frontend, or dependency change. Unit tests cover the schema (shape, offset suffix, naive rejection) and the router function (per-request clock read, registration); integration tests cover the full HTTP cycle (200 and shape, offset, freshness across two calls, 405 on POST). No database is needed by the endpoint.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time as `ServerTimeResponse`. Router `backend/app/routers/server_time.py`: `router = APIRouter(prefix="/api", tags=["time"])`, `@router.get("/time", response_model=ServerTimeResponse)`, handler `get_server_time() -> ServerTimeResponse` returning `ServerTimeResponse(now=datetime.now(UTC))` (module imports `from datetime import UTC, datetime`, so tests can monkeypatch `server_time.datetime`). Computed inside the handler on every call, never at import time or as a default captured once.
- Schema `backend/app/schemas/server_time.py`: `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (pydantic's `AwareDatetime` rejects a naive value with a ValidationError) and `timezone: Literal["UTC"] = "UTC"`; constant `UTC_OFFSET_SUFFIX = "+00:00"`; `@field_serializer("now")` returning `value.astimezone(UTC).isoformat()`, which normalises any aware input to UTC and always ends in `+00:00`.
- App factory `backend/app/main.py`: import `server_time_router` and `app.include_router(server_time_router)` after the health router (insertion point detailed in Re-Plan Feedback point 1); docstring updated to name FEAT-1.
- Service layer: none, planned deviation from `coding_standards.md` Section 2.2 (Re-Plan Feedback point 4).
- Repository layer: none, no persistence.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query or path parameters.
- Response: 200, `application/json`, example `{"now": "2026-11-07T17:00:48.123456+00:00", "timezone": "UTC"}`. `now` is ISO 8601, always UTC, always ending in `+00:00` (never `Z`, never naive); fractional seconds are present when the clock has them (isoformat's default). Any other method on the path returns 405.

## Technology Selection
- UTC timestamp: chose the standard library's `datetime.now(UTC)` over any time library, because the stdlib covers it fully.
- Offset pinning and naive rejection: chose pydantic's installed `AwareDatetime` type and `field_serializer` (pydantic ships with fastapi, already installed) over hand-written validation or a new dependency.
- Router and schema modules: no stdlib call, native platform feature or installed dependency replaces a FastAPI router and a Pydantic model; they are the project's existing pattern, built here.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router, reads the UTC clock per request
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` schema, `AwareDatetime` now, `Literal["UTC"]` timezone, `+00:00` serializer
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema and the router handler
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time`
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual UAT script

### Modified files
- [B] backend/app/main.py: import and register `server_time_router` after the health router; docstring names FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`

No lockfile changes: this feature adds no dependency, so neither `backend/uv.lock` nor `frontend/package-lock.json` is regenerated.
No `README.md` or `docs/DEVELOPMENT.md` edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `ServerTimeResponse` and the router handler, in isolation (no HTTP, no clock dependency where it matters).
  - `test_server_time_response_serialises_now_with_plus_zero_offset`: an aware UTC datetime dumps (`model_dump(mode="json")`) to a string ending in `+00:00`, not `Z`.
  - `test_server_time_response_converts_non_utc_aware_value_to_utc`: edge case, an aware `+02:00` value serialises as the same instant in `+00:00`.
  - `test_server_time_response_rejects_naive_datetime`: error case, a naive datetime raises `ValidationError`.
  - `test_server_time_response_shape_has_now_and_timezone_utc`: keys are exactly `now` and `timezone`, `timezone == "UTC"`.
  - `test_get_server_time_reads_the_clock_on_every_call`: monkeypatch `app.routers.server_time.datetime` with a stub whose `now(tz)` returns successive values one second apart; two handler calls return different `now` values, and the stub received `UTC`.
  - `test_create_app_registers_server_time_route` in `test_main_unit.py`: `/api/time` is among the app's custom paths.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_server_time_unit.py`
- Integration tests: full HTTP cycle through the session `client` fixture (no database required by the endpoint).
  - `test_get_time_returns_200_with_now_and_timezone_utc`: status 200, keys exactly `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with `utcoffset() == timedelta(0)`.
  - `test_get_time_now_ends_with_plus_zero_offset`: the raw `now` string ends with `+00:00` and not `Z`.
  - `test_get_time_returns_a_fresh_value_per_request`: two sequential requests; the second parsed `now` is strictly later than the first (microsecond resolution makes this deterministic without a fixed sleep).
  - `test_post_time_returns_405_method_not_allowed`: error case.
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. The E2E toggle is ENABLED, but no criterion involves navigation or interaction through the UI (no frontend consumes `/api/time`), so per `testing_standards.md` Section 6 no criterion's covering tier is E2E and no spec is written.
  - Directory: e2e/tests/
  - File: not produced (would be `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus a POST-405 edge case, verified by HTTP request rather than browser.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | Integration | verifying it needs no navigation or interaction: it is a router response shape, read over HTTP |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Unit and Integration | verifying it needs no navigation or interaction: freshness is a clock read per handler call, the offset and naive rejection are schema behaviour |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a code-structure property, checked by the schema unit tests plus review of the router's `response_model` |
| 4 | Unit and integration tests cover shape, offset, freshness | Unit and Integration | verifying it needs no navigation or interaction: it is satisfied by the existence and passing of the tests listed above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/time, Then the status is 200 and the body has `now` and `timezone` "UTC" |
| 2 | per request, UTC, explicit offset | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When I GET /api/time twice a second apart, Then the two `now` values differ and both end in "+00:00" |
| 3 | Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When I open /openapi.json, Then GET /api/time's 200 response references the ServerTimeResponse schema |
| 4 | tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the backend checkout, When I run the server-time unit and integration tests, Then 0 failed |

## Manual verification plan
None of the criteria is verifiable through the UI: no frontend screen consumes `GET /api/time`, so each check reads the HTTP response with `curl` or a browser address bar against the running stack (`docker compose up`, backend on host port 8010).

### Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`
Prerequisites: the stack is running (`docker compose up -d`), and `docker compose ps` shows the backend container up.
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body printed under the headers → it is one JSON object with exactly two keys, `now` (a timestamp such as `2026-11-07T17:00:48.123456+00:00`) and `timezone` with the value `"UTC"`.

### Criterion 2: `now` is computed per request, UTC with an explicit offset, never naive
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/time`, wait about one second, then run the same command again → two bodies are printed.
2. Compare the two `now` values → the second is about one second later than the first; they are not identical.
3. Look at the end of each `now` value → each ends in exactly `+00:00`, never in `Z` and never with no offset at all.
4. Run `date -u +%H:%M:%S` in the same terminal and compare it with the hour, minute and second in a fresh `now` → they agree to within a second or two, confirming the value is UTC rather than the machine's local time.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs` in a browser → the Swagger UI lists `GET /api/time` under the `time` tag.
2. Expand `GET /api/time` and read its 200 response schema → it is named `ServerTimeResponse` with fields `now` (string, date-time) and `timezone` (string, `UTC`).
3. Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` → the schema class `ServerTimeResponse` lives in the schemas file, and the router declares `response_model=ServerTimeResponse` and returns an instance of it, not a dict.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: a backend checkout with `uv` installed.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the run ends with `0 failed`.
2. Open the two new test files → there is at least one test asserting the response shape, one asserting the `+00:00` suffix, and one asserting two calls return different `now` values.
