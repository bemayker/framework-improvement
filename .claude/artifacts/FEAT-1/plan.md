# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> Notes: Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The description's measured-run operator instructions, Arm D of measured run 3, are not part of the feature and are not planned.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker, 2026-09-14, Florian Serneels), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: I re-derived the insertion point from `backend/app/main.py` as it is on this branch, which is `origin/main` at `e262ed6`. `73e544c` is an ancestor of HEAD (`git merge-base --is-ancestor` says so), and its diff did add `backend/app/routers/echo.py`, `backend/app/schemas/echo.py` and an echo registration in `main.py`. **That change is no longer on main:** later sandbox resets deleted `routers/echo.py` (most recently `9dcba19`, #326), and the last commit to touch `main.py` is the reset `448324b` (#599). `create_app()` now registers exactly three routers, in this order: `version_router`, `notes_router`, `health_router` (lines 54 to 56). The module imports `app.routers.health`, `app.routers.notes` and `app.routers.version` in alphabetical order (lines 19 to 21). The plan therefore adds `from app.routers.server_time import router as server_time_router` after the `notes` import (keeping the alphabetical order), and `app.include_router(server_time_router)` after `app.include_router(health_router)` and before `return app`. It also extends the module docstring's list of registrations. Nothing about an echo router is assumed to exist.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on. This is a scope addition rather than a correction of FEAT-1's text, and none of FEAT-1's four acceptance criteria covers it, so `user_story_alignment.md` Section 3 (no gold plating) applies. The echo endpoint has items of its own in `feature_map.md`: TEST-06 (the endpoint, marked complete in the tracker, but its code is absent from main after the resets), and TEST-11 and BUG-05, which specify **opposite** whitespace behaviour for it (trim vs keep), with the map saying to resolve that before building both. Adding echo here would ship a third, unreviewed answer to an open contradiction under the wrong item ID. Echo should be re-delivered through TEST-06 (or its follow-ups) once that contradiction is settled. Assumption recorded: the commenter wanted the two registrations to land together to avoid a second `main.py` conflict, and the serialization note in `shared_risks.md` covers that risk without widening this item.
- Comment (tracker), point 3: "Pin it now ... decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: **pinned to `+00:00`.** That is the literal reading of the criterion's "explicit offset", and it is what Python's `datetime.isoformat()` produces for a UTC-aware value. Pydantic v2's default JSON serialization of a UTC datetime would emit `Z`, so the schema `backend/app/schemas/server_time.py` states the choice explicitly: `now: AwareDatetime` rejects a naive value at construction, and a `@field_serializer("now")` returns `value.astimezone(timezone.utc).isoformat()`, so output always ends in `+00:00` (for example `2026-11-06T10:38:10.123456+00:00`). The module and class docstrings name the choice and the reason. Exact-suffix tests: unit `test_server_time_response_serializes_now_with_plus_00_00_suffix` in `backend/tests/unit/test_server_time_unit.py`, and integration `test_get_time_now_ends_with_plus_00_00_offset` in `backend/tests/integration/test_server_time_integration.py`. Both assert `endswith("+00:00")` and that the string does not end with `Z`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint ... Record it as a planned deviation rather than leaving it silent." → Addressed by: **planned deviation from `coding_standards.md` Section 2.2 (Router -> Service -> Repository).** No `backend/app/services/` module and no repository for this endpoint. The router reads the clock itself through a module-level `utc_now()` function in `backend/app/routers/server_time.py` (one line, `datetime.now(timezone.utc)`). Reason: Section 2.2 places business logic and transactional boundaries in the service layer, and reading the system clock is neither: there is no rule, no persistence and no transaction. `utc_now` is a named seam only so the unit test can substitute a clock without sleeping. It is not a service. The PR description must list this deviation.
- Merged since the last plan: n/a (fresh plan, branched from current main `e262ed6`; the dispatch carried no `[merged-since]` lines). The 24 framework-posted "Plan PR opened" comments and the autonomous-run reply ask for nothing and are not acted on. They describe main on earlier dates, and this plan is derived from the files on `e262ed6`.

## Plan Overview
One read-only backend endpoint, `GET /api/time`. It has a router (`backend/app/routers/server_time.py`) and a Pydantic response schema (`backend/app/schemas/server_time.py`), and is registered in `backend/app/main.py` after the health router. There is no service, repository or migration (planned deviation, Re-Plan Feedback point 4), no frontend change and no external integration. The tests are a new unit file (the schema serialization, naive rejection, and the handler with a substituted clock), a new integration file (the HTTP cycle, the shape, the `+00:00` suffix, per-request freshness, and 405 on POST), and one new route-registration assertion in the existing `test_main_unit.py`. The router file name `server_time.py` matches the path BUG-01 (which depends on FEAT-1) already expects.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`. It returns the server's current UTC time per request. The router is `APIRouter(prefix="/api", tags=["time"])` with `@router.get("/time", response_model=ServerTimeResponse)`, in the same shape as `routers/version.py`. The handler `get_server_time() -> ServerTimeResponse` returns `ServerTimeResponse(now=utc_now(), timezone="UTC")`. `utc_now()` is defined in the same module and returns `datetime.now(timezone.utc)`. It is called inside the handler, never at import time, so every request reads the clock afresh.
- Registration: in `backend/app/main.py`, add `from app.routers.server_time import router as server_time_router` between the `notes` and `version` imports. Add `app.include_router(server_time_router)` immediately after `app.include_router(health_router)`. Add "FEAT-1 the server time router" to the module docstring's list. CORS already allows `GET` (`allow_methods=["GET", "POST"]`), so the middleware needs no change.
- Schema: `backend/app/schemas/server_time.py`, `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (from `pydantic`) and `timezone: Literal["UTC"]`. It also has `@field_serializer("now") def serialize_now(self, value: datetime) -> str: return value.astimezone(timezone.utc).isoformat()`. The docstring pins the `+00:00` offset and explains why (`Z` is not used). An aware non-UTC input such as `+02:00` is normalised to UTC on output.
- Service layer: none, as a planned deviation from `coding_standards.md` Section 2.2 (see Re-Plan Feedback point 4). Reading a clock is neither business logic nor a transactional boundary.
- Repository layer: none (no persistence).
- Migrations: none.
- Errors: no input, so there is no 422 path. FastAPI answers 405 for a non-GET method, which the integration tests assert.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: `200 OK`, `application/json`, schema `ServerTimeResponse`:

```json
{"now": "2026-11-06T10:38:10.123456+00:00", "timezone": "UTC"}
```

`now` is an ISO 8601 timestamp in UTC that always ends in the explicit offset `+00:00` (never `Z`, never naive). Its fractional seconds come from `isoformat()` and are omitted only when the microsecond is exactly 0. `timezone` is always the literal string `UTC`. A POST (or other non-GET method) returns `405 Method Not Allowed`.

## Technology Selection
- Clock reading: chose the standard library `datetime.now(timezone.utc)` over any third-party time library, because the stdlib covers an aware UTC instant fully.
- Offset formatting: chose the stdlib `datetime.isoformat()` inside a Pydantic `field_serializer` (Pydantic is installed with FastAPI) over a hand-written format string. `isoformat()` on a UTC-aware value already yields `+00:00`.
- Naive rejection: chose Pydantic's built-in `AwareDatetime` type over a custom validator, because an installed dependency already enforces "never naive".
- Router and schema modules: no stdlib call, native platform feature or installed dependency replaces an endpoint, so they are built here, using the installed FastAPI and Pydantic. No new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router with the `utc_now()` clock seam and the `get_server_time` handler
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime` serialised with a pinned `+00:00` offset, `timezone: Literal["UTC"]`)
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema serialization (exact `+00:00` suffix, non-UTC input normalised, naive input rejected, non-UTC `timezone` value rejected) and for the handler with a substituted clock (per-request freshness)
- [B] backend/tests/integration/test_server_time_integration.py: integration tests over the real HTTP cycle (200 and exact keys, `+00:00` suffix and zero UTC offset, per-request freshness window, 405 on POST)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/main.py: import `server_time_router` and register it after `health_router`, and extend the module docstring's registration list
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the custom routes

No dependency changes, so no lockfile entry. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure, and neither document keeps a list of endpoints.

## Testing Strategy
- Unit tests: `ServerTimeResponse` serialization and validation, and the `get_server_time` handler with `utc_now` substituted via `monkeypatch`.
  - `test_server_time_response_serializes_now_with_plus_00_00_suffix` checks that a fixed UTC instant dumps (`model_dump(mode="json")`) to a string ending in `+00:00` and not `Z`, equal to the expected exact string.
  - `test_server_time_response_normalises_non_utc_offset_to_utc` (edge case) checks that a `+02:00` aware input dumps as the same instant with `+00:00`.
  - `test_server_time_response_rejects_naive_datetime` (error case) checks that a naive `datetime` raises `pydantic.ValidationError`.
  - `test_server_time_response_rejects_non_utc_timezone_label` (error case) checks that `timezone="Europe/Brussels"` raises `ValidationError`.
  - `test_get_server_time_reads_the_clock_per_call` replaces `utc_now` with a stub that yields two instants one second apart, calls `get_server_time()` twice, and asserts the two `now` values differ by exactly one second and `timezone == "UTC"`.
  - `test_create_app_registers_time_route` (in the existing `test_main_unit.py`) checks the route is registered.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the session `client` fixture (real FastAPI app, real HTTP cycle; no database needed).
  - `test_get_time_returns_200_with_now_and_utc_timezone` checks the 200 status and that the body keys are exactly `{"now", "timezone"}` with `timezone == "UTC"`.
  - `test_get_time_now_ends_with_plus_00_00_offset` checks that `now` ends with `+00:00` and not `Z`, and that `datetime.fromisoformat(now).utcoffset() == timedelta(0)`, which proves it is aware.
  - `test_get_time_now_is_computed_per_request` captures `datetime.now(timezone.utc)` before and after each of two consecutive requests. It asserts that each parsed `now` lies within its own before-and-after window and that the second `now` is later than the first. This proves a fresh clock read per request with no hardcoded sleep.
  - `test_post_time_returns_405_method_not_allowed` covers the error case.
  - Directory: backend/tests/integration/
- E2E tests: no spec for this feature. No acceptance criterion involves UI navigation or interaction, and no frontend consumes `/api/time` (Criterion coverage below gives each row's reason). The E2E toggle is ENABLED but no criterion's covering tier is E2E.
  - Directory: e2e/tests/
  - File: none (would be `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), and the manual script, both written against the curl checks in `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ (scenarios), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | Verifying it needs no navigation or interaction. It is a router response shape, checked over the real HTTP cycle, and no UI consumes it. |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration and Unit | Verifying it needs no navigation or interaction. Freshness and the `+00:00` offset are router and schema behaviour (an integration window test plus a unit clock-stub test), and naive rejection is a validation rule. |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction. It is a structural property: unit tests construct and serialise `ServerTimeResponse` directly, and the router declares it as `response_model`. |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit and Integration | It is a property of the test suite itself, satisfied by the named unit and integration tests above. A browser cannot observe it. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone`, with `timezone` equal to `UTC` |
| 2 | `now` per request, UTC, explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/time twice a second apart, Then the two `now` values differ and each ends with `+00:00` |
| 3 | Body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend source, When I open backend/app/schemas/server_time.py, Then `ServerTimeResponse` defines `now` and `timezone` and the router uses it as its response model |
| 4 | Unit and integration tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When I run the server-time unit and integration tests, Then 0 tests fail |

## Manual verification plan
No criterion is verifiable through the UI, because no frontend screen consumes `GET /api/time`. The observable checks below use `curl` against the compose stack (backend published on host port `8010` by `docker-compose.yml`) and read the files and test output.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
Prerequisites: Docker running, repository on `feature/FEAT-1-server-time-endpoint`, `docker compose up -d --build` run from the repo root, and `docker compose ps` showing `backend` running.
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the response body → it is a JSON object with exactly two keys, `now` and `timezone`, for example `{"now":"2026-11-06T10:38:10.123456+00:00","timezone":"UTC"}`. `timezone` is exactly `UTC`.

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
Prerequisites: the stack from Criterion 1 is still up.
1. Run `curl -s http://localhost:8010/api/time`, wait about one second, then run it again → two bodies are printed.
2. Compare the two `now` values → they differ, and the second is about one second later than the first.
3. Read the last six characters of each `now` → both are exactly `+00:00` (not `Z` and not missing, which would be a naive time).
4. Compare the date and hour of `now` with `date -u` run in the same terminal → they match the current UTC time, not your local time.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Not UI-verifiable. It is a code-structure property. The observable check is the source:
1. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime`, `timezone: Literal["UTC"]`, and a `field_serializer` for `now` whose docstring names the `+00:00` offset.
2. Open `backend/app/routers/server_time.py` → the route is declared with `response_model=ServerTimeResponse` and the handler returns `ServerTimeResponse(...)`, with no dict literal.
3. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the response schema is named `ServerTimeResponse`.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Not UI-verifiable. The observable check is the test run:
1. From the repo root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py` → the output reports `0 failed`, and the tests include `test_server_time_response_serializes_now_with_plus_00_00_suffix` and `test_get_server_time_reads_the_clock_per_call`.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the output reports `0 failed` for `test_get_time_returns_200_with_now_and_utc_timezone`, `test_get_time_now_ends_with_plus_00_00_offset`, `test_get_time_now_is_computed_per_request` and `test_post_time_returns_405_method_not_allowed`.
3. Edge case: run `curl -i -X POST http://localhost:8010/api/time` → the first line reads `HTTP/1.1 405 Method Not Allowed`.
