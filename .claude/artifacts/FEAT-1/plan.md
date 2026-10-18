# Implementation Plan, FEAT-1: VERIFY MDF-316: Server time endpoint

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
> ## How the measured run uses this item (operator instructions, not part of the feature)
>
> 1. `/plan-feature TEST-09` **before** Arm C's item (TEST-06) merges. Leave it at `plan_review`; a re-plan is only possible there (baseline Section 5.3).
> 2. After TEST-06 merges to `main` (its squash touches `backend/app/main.py`), post the re-plan comment on this item and run `/plan-feature TEST-09` again.
> 3. **Pass:** the merged-since check reports a non-clean verdict naming the overlapping commit, and the re-plan answers the comment point by point (MDF-008). **`verdict=clean` on this item is a failed setup, not a pass** (baseline Section 5.2).
> 4. Do not build it before step 3 has been recorded. Whether it is then built is the operator's choice; it is not one of the items the baseline's numbers are compared on.
>
> (Planner note: the "How the measured run uses this item" section is operator instruction and explicitly not part of the feature; nothing in it is scope. The four acceptance criteria below are the whole scope.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
Source: one actionable stakeholder comment on the ClickUp item (Florian Serneels), four numbered points, each answered below. The item carries 13 comments and 0 threaded replies; the other 12 are the framework's own "Plan PR opened for FEAT-1" link comments from earlier, since-reverted plan rounds, which ask for nothing and are not acted on. Their content (reuse of `UtcTimestamp`, no service module) was verified on disk rather than taken as instruction, and points 3 and 4 below reach the same answers on their own grounds.

- Comment (tracker): "1. TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-reading `backend/app/main.py` on `origin/main` at 694fed2 (this branch is identical to it for `backend/`). Squash 73e544c8 is no longer the commit that matters: TEST-06 was reverted and re-landed since, and the last commits on main touching the file are 957fda7 (TEST-06 echo, #190), cf617b3 (TEST-07 uptime, #191), 8bf8d81 (an earlier FEAT-1 build, #192) and 33b4dd7 (the revert of that FEAT-1 build, #213). What changed relative to the TEST-06 squash: the import block now carries `echo_router` and `uptime_router`, the lifespan hook captures `app.state.process_start` for TEST-07, `create_app()` registers five routers (version, notes, health, echo, uptime) after the CORS middleware, and no `/api/time` route or `server_time` import exists (the earlier FEAT-1 build is fully reverted). Insertion point on that file: the import `from app.routers.server_time import router as server_time_router` goes between the `notes_router` import (line 22) and the `uptime_router` import (line 23), keeping the alphabetical order; `app.include_router(server_time_router)` goes after `app.include_router(uptime_router)` (line 66) and before `return app` (line 67); the module docstring gains one clause naming FEAT-1. Nothing in the lifespan hook or the CORS block changes (`allow_methods` already includes GET).
- Comment (tracker): "2. Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on because: `GET /api/echo` already exists on main at 694fed2 with exactly that contract (`backend/app/routers/echo.py`, `EchoResponse` in `backend/app/schemas/echo.py`, registered as `app.include_router(echo_router)` on line 65 of `backend/app/main.py`, covered by `backend/tests/integration/test_echo_integration.py`), delivered by TEST-06, which is done. Adding it again would register a duplicate route, and it is also outside this item's four acceptance criteria (`user_story_alignment.md` Section 3). No echo file appears in this plan's File Manifest.
- Comment (tracker): "3. The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is pinned to `+00:00`, not `Z`. Reasons: `+00:00` is literally an explicit offset, it is what Python's `datetime.isoformat()` emits for an aware UTC value, and the API already uses it for `started_at` on `GET /api/uptime`, so one convention holds across the API. The choice is stated in `ServerTimeResponse`'s docstring in `backend/app/schemas/server_time.py`, and enforced by typing `now` as the existing `UtcTimestamp` from `backend/app/schemas/uptime.py` (an `AwareDatetime` with a JSON serializer that normalises to UTC and calls `isoformat()`; pydantic's own default would be `Z`). Tests asserting the exact suffix: `test_server_time_response_serialises_now_with_plus_00_00_suffix` (unit) and `test_get_time_now_ends_with_plus_00_00_offset` (integration), both asserting the value ends with `+00:00` and contains no `Z`.
- Comment (tracker): "4. Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/` module is planned. Planned deviation from `coding_standards.md` Section 2.2: the router reads the clock through a small FastAPI dependency, `get_utc_now()`, defined in `backend/app/routers/server_time.py`, and builds `ServerTimeResponse` itself. Section 2.2 places business logic and transactional boundaries in the Service layer; reading `datetime.now(timezone.utc)` is neither, there is no repository, and this matches TEST-06's echo router, which has no service either. The deviation is to be listed in the implementation PR description.
- Merged since the last plan: n/a (fresh plan, branched from current main: `origin/main` at 694fed2; the dispatch carried no `[merged-since]` lines).

## Plan Overview
One read-only backend endpoint, `GET /api/time`, returning the server's current UTC time and the literal timezone `UTC`. Layers touched: one new router module (with a clock dependency), one new Pydantic response schema, and the router registration in `backend/app/main.py`. No database, no service layer (planned deviation, see point 4 above), no frontend, no external integration, no new dependency. Tests: schema and router unit tests, a route-registration unit test in the existing `test_main_unit.py`, and router integration tests through the FastAPI TestClient. No E2E spec: no criterion involves UI navigation or interaction.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this feature renders nothing)

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time in UTC with an explicit `+00:00` offset and the literal timezone `UTC`, so a client can detect clock skew. Router `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time` declared with `response_model=ServerTimeResponse`, following the TEST-06 echo router shape.
- Clock: `get_utc_now() -> datetime` in the same router module returns `datetime.now(timezone.utc)` and is injected into the handler with `Depends(get_utc_now)`. FastAPI resolves dependencies on every request, so `now` is computed per request and never cached; the dependency also gives the tests a seam (`app.dependency_overrides`) to feed two instants one second apart without sleeping.
- Schema: `backend/app/schemas/server_time.py` defines `ServerTimeResponse(BaseModel)` with `now: UtcTimestamp` (imported from `app.schemas.uptime`, so a naive datetime is rejected and the JSON value is normalised to UTC and serialised with `+00:00`) and `timezone: Literal["UTC"] = "UTC"`. The docstring states the `+00:00` choice over `Z` (Re-Plan Feedback point 3). The router returns this model, never a dict.
- Registration: `backend/app/main.py` imports `server_time_router` between the notes and uptime router imports and calls `app.include_router(server_time_router)` after the uptime router, before `return app`; the module docstring adds FEAT-1 to its list (insertion point detailed in Re-Plan Feedback point 1).
- Service layer: none. Planned deviation from `coding_standards.md` Section 2.2, recorded in Re-Plan Feedback point 4: reading a clock is neither business logic nor a transactional boundary.
- Repository layer: none, no data access.
- Migrations: none.
- Error handling: no application error path exists; an unsupported method (for example POST) gets FastAPI's own 405, which the integration tests assert as the router error case.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no path, query or body parameters.
- Response: 200, `application/json`, schema `ServerTimeResponse`: `now` is a string in ISO 8601 `date-time` format, always UTC, always ending in `+00:00` (never `Z`, never naive), computed per request; `timezone` is always the string `UTC`. A non-GET method returns 405. Example:
```json
{"now": "2026-10-18T20:41:07.512834+00:00", "timezone": "UTC"}
```

## Technology Selection
- Current time source (`get_utc_now`): chose the standard library `datetime.now(timezone.utc)` over any time library (pendulum, arrow) or an NTP client, because the stdlib returns an aware UTC datetime directly and the feature reports the server clock as it is, not a corrected one.
- UTC `+00:00` serialisation of `now`: chose the already-installed pydantic type `UtcTimestamp` in `backend/app/schemas/uptime.py` (`AwareDatetime` plus a JSON serializer) over a new serializer or a hand-formatted string, because it already rejects naive values and emits `+00:00`, and reusing it keeps one timestamp convention across the API.
- `ServerTimeResponse` schema: chose a pydantic `BaseModel` (installed, required by criterion 3) with `typing.Literal["UTC"]` from the standard library for `timezone` over a free `str` field or an Enum, because a Literal both pins the value and publishes it in the OpenAPI schema.
- Router module and per-request injection: chose FastAPI `APIRouter` and `Depends` (installed) over a service module or a module-level clock, because the dependency is resolved on every request and is overridable in tests; no stdlib or native feature routes HTTP.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` with `now: UtcTimestamp` and `timezone: Literal["UTC"]`; docstring pins the `+00:00` offset over `Z`
- [B] backend/app/routers/server_time.py: `GET /api/time` router, `get_utc_now()` clock dependency, handler returning `ServerTimeResponse`
- [B] backend/tests/unit/test_server_time_schema_unit.py: schema shape, exact `+00:00` suffix, non-UTC input normalised to UTC, naive datetime rejected, non-UTC timezone value rejected
- [B] backend/tests/unit/test_server_time_router_unit.py: `get_utc_now()` returns an aware UTC datetime; the handler called with two instants one second apart returns two different `now` values one second apart
- [B] backend/tests/integration/test_server_time_integration.py: `GET /api/time` 200 and exact body keys, `+00:00` offset, per-request freshness (real clock and a dependency override one second apart), OpenAPI response schema, 405 on POST
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the notes and uptime imports, `app.include_router(server_time_router)` after the uptime router, docstring mentions FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route_with_server_time_response_model`, asserting `/api/time` is registered and declares `ServerTimeResponse`

No dependency changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` changes: the feature adds an endpoint but changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints.

## Testing Strategy
- Unit tests: the response schema (shape, exact `+00:00` suffix, normalisation of a `+02:00` input to UTC, naive datetime rejected, `timezone` other than `UTC` rejected), the router's clock dependency and handler (aware UTC value, two instants one second apart produce two different `now` values), and route registration in `create_app()` (`/api/time` declares `ServerTimeResponse`). Each tested function gets a happy path, an edge case and an error case (`testing_standards.md` Section 1.1).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_schema_unit.py`, `test_server_time_router_unit.py`, and the existing `test_main_unit.py`)
- Integration tests: the full HTTP cycle through the session-scoped `client` fixture in `backend/tests/conftest.py`: 200 with exactly the keys `now` and `timezone`; `now` ends in `+00:00`, contains no `Z`, and parses to an aware datetime with a zero UTC offset; `now` lies between two instants the test reads before and after its requests, and the second of two consecutive requests is strictly later; with `get_utc_now` overridden on a fresh `create_app()` to return two instants one second apart, the two bodies differ by exactly one second; `/openapi.json` declares `ServerTimeResponse` for `GET /api/time` with `now` as `format: date-time`; POST returns 405 (router error case, `testing_standards.md` Section 1.2). No database is involved, like the echo integration tests.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. E2E Tests is ENABLED, but no acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion), and an E2E test that calls the API directly is a router integration test (Section 5). No spec file is produced.
  - Directory: e2e/tests/
  - File: none (would be FEAT-1_server_time_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus an edge case (a POST returns 405), and the manual UAT script expanded from the Manual verification plan.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/time returns 200 with a body of `now` (ISO 8601 UTC with explicit offset) and `timezone` = `UTC` | Integration | Verifying it needs no navigation or interaction: it is a router response, checked through the HTTP TestClient |
| 2 | `now` is computed per request, serialised in UTC with an explicit offset, never naive | Integration and Unit | Verifying it needs no navigation or interaction: freshness is a router behaviour (two requests, and a clock override one second apart) and the offset and naive rejection are schema rules |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict | Unit and Integration | Verifying it needs no navigation or interaction: it is a structural fact, checked on the registered route's `response_model` and on the published OpenAPI schema |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | It is a criterion about the tests themselves: it is met by the unit and integration files above existing and passing, which no browser test can show |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/time returns 200 with `now` and `timezone` = `UTC` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the status is 200 and the body has exactly the keys now and timezone, with timezone equal to UTC |
| 2 | `now` is computed per request, UTC with explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the API is running, When a client requests GET /api/time twice one second apart, Then the two now values differ and each ends with +00:00 |
| 3 | Response body defined by a Pydantic schema | covered at Unit and Integration, see Criterion coverage | Given the API is running, When a client reads the OpenAPI document, Then GET /api/time declares the ServerTimeResponse schema with now as a date-time string |
| 4 | Unit and integration tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test files for FEAT-1, When the developer runs them with pytest, Then 0 tests fail |

## Manual verification plan
This feature has no screen of its own. The UI a person uses to verify it is the browser pointed at the API, plus FastAPI's built-in Swagger UI at `/docs`. Prerequisite for every block: the stack is running with `docker compose up -d --build` from the repository root, so the backend answers at `http://localhost:8010` (the `backend` service's published port in `docker-compose.yml`), and you know the current UTC time (for example from `https://time.is/UTC`).

### Criterion 1: GET /api/time returns 200 with now (ISO 8601 UTC with explicit offset) and timezone UTC
Prerequisites: the stack is running as above.
1. Open `http://localhost:8010/docs` in a browser → the Swagger UI lists a `time` section containing `GET /api/time`.
2. Click `GET /api/time`, then `Try it out`, then `Execute` → the Responses panel shows `Code` 200.
3. Read the `Response body` → it has exactly two keys, `now` and `timezone`; `timezone` is `UTC`; `now` looks like `2026-10-18T20:41:07.512834+00:00` and matches the current UTC time to within a few seconds.

### Criterion 2: now is computed per request, in UTC with an explicit offset, never naive
Prerequisites: the stack is running as above.
1. Open `http://localhost:8010/api/time` in a browser tab → the JSON body appears; note the `now` value, for example `2026-10-18T20:41:07.512834+00:00`.
2. Check the end of that `now` value → it ends with `+00:00`; it does not end with `Z` and is never without an offset.
3. Wait at least one second, then reload the tab → a new `now` value appears that is later than the first one by about the time you waited, and still ends with `+00:00`.
4. Reload twice more, quickly → every reload shows a different, increasing `now`; it never repeats a previous value.

### Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/
Prerequisites: the stack is running as above.
1. Open `http://localhost:8010/docs` and scroll to the `Schemas` section at the bottom → a schema named `ServerTimeResponse` is listed.
2. Expand `ServerTimeResponse` → it shows `now` as a required `string($date-time)` and `timezone` as a `string` whose only allowed value is `UTC`.
3. Expand `GET /api/time` and read its 200 response → its schema is `ServerTimeResponse`, not an untyped object.
4. Observable check in the code: open `backend/app/routers/server_time.py` → the route is declared with `response_model=ServerTimeResponse` and returns a `ServerTimeResponse(...)`, and `backend/app/schemas/server_time.py` defines that class; there is no dict literal in the handler.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
This criterion is about the tests, so it is verified in a terminal, not in the UI.
Prerequisites: a checkout of the feature branch with `uv` installed; no database is needed for these files.
1. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_schema_unit.py tests/unit/test_server_time_router_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the summary line reports `0 failed` (no failures, no errors).
2. Open `backend/tests/integration/test_server_time_integration.py` → there is a test for the body shape, one asserting the value ends with `+00:00`, and two for per-request freshness (real clock, and a clock override one second apart).
3. Open `backend/tests/unit/test_server_time_schema_unit.py` → there is a test asserting the exact `+00:00` suffix and one rejecting a naive datetime.
