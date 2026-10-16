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
> *   `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> *   `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> *   The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> *   Unit and integration tests cover the shape, the offset and the per-request freshness.
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
> (Plan note: the operator block above is run instruction, not feature scope; the four acceptance criteria are the whole contract.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with a JSON object of exactly two keys: `now` (ISO 8601 UTC with explicit offset) and `timezone` (the string `UTC`). Restated without the inline JSON for a write-path reason; the verbatim criterion is in `## Feature` above and the exact body in `## API Contract`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-reading `backend/app/main.py` on this branch (cut from `origin/main` at `6df779d`; the insertion point was checked against the file, not against the cited sha). What changed since FEAT-1 was first planned: TEST-06 added `from app.routers.echo import router as echo_router` (line 19) and `app.include_router(echo_router)` (line 64); TEST-07 then added `from app.routers.uptime import router as uptime_router` (line 22), `from app.services import uptime_service` (line 24), the uptime start mark in `lifespan`, and `app.include_router(uptime_router)` (line 65); the module docstring (lines 3 to 7) now names each registering feature. Insertion point on main as it stands: the import `from app.routers.server_time import router as server_time_router` goes between the notes import (line 21) and the uptime import (line 22), keeping the alphabetical order of the router imports; `app.include_router(server_time_router)` goes after `app.include_router(uptime_router)` (line 65) and before `return app`; the docstring sentence gains FEAT-1 the server time router. `lifespan`, the CORS middleware and every existing registration stay untouched. `backend/tests/unit/test_main_unit.py` gains one registration test after `test_create_app_registers_uptime_route`. The reverted FEAT-1 commit `a40e653` is not on main and nothing from it is assumed present.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on because the endpoint is already on main: `backend/app/routers/echo.py`, `backend/app/schemas/echo.py` (`EchoResponse`, `MAX_ECHO_MSG_LENGTH = 200`) and `app.include_router(echo_router)` at line 64 of `backend/app/main.py` were delivered by TEST-06, with `backend/tests/unit/test_echo_unit.py`, `backend/tests/integration/test_echo_integration.py` and `test_create_app_registers_echo_route`. Adding it again would register a second `GET /api/echo` route and duplicate merged work, and it is outside the four acceptance criteria of FEAT-1 (`user_story_alignment.md` Section 3). No echo file is in this plan.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinning `Z`. `now` is always UTC and always ends in `Z`, never `+00:00` and never naive (example `2026-10-16T06:12:03.481920Z`). Chosen over `+00:00` for consistency with main: `backend/app/schemas/uptime.py` types `started_at` as `AwareDatetime` and relies on Pydantic default JSON mode, which writes a UTC value with `Z`, asserted by `test_uptime_response_serialises_utc_started_at_with_z_offset`. `Z` is the ISO 8601 UTC designator, so it satisfies the explicit-offset criterion. The choice is stated in the `ServerTimeResponse` docstring and in the `Field` description of `now`; `AwareDatetime` rejects a naive value and an after-validator normalises any aware value to UTC so the suffix cannot drift to another offset. Tests assert the exact suffix: the serialised string ends with `Z` and does not contain `+00:00`, at unit level (schema) and integration level (HTTP body).
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/server_time_service.py`; the router reads the clock through a one-line module-level helper `_utc_now()` in `backend/app/routers/server_time.py`. Recorded as a planned deviation under `## Backend Plan` → Service layer, with the reason: `coding_standards.md` Section 2.2 puts business logic and transactional boundaries in the service, and reading the clock is neither; this matches TEST-06 (`backend/app/routers/echo.py` has no service). The deviation is stated again in the router module docstring so the reviewer finds it in the diff.
- Comment (tracker), the nine framework-written report comments (plan PR links for PRs #169, #145, #91, #64, #56, #50, #48, #36 and one delivery report for PR #36): → Not acted on because they ask for nothing; they record how earlier plans answered the four-point comment above, which this plan answers itself.

## Plan Overview
Backend only. One new router module `backend/app/routers/server_time.py` serving `GET /api/time`, one new response schema `backend/app/schemas/server_time.py` (`ServerTimeResponse`: `now` as an aware UTC datetime serialised with the `Z` suffix, `timezone` as the literal `UTC`), and the router registered in `backend/app/main.py` after the uptime router. No service, no repository, no database, no migration, no frontend, no external API, no new dependency. The clock is read with the standard library on every request, so two calls a second apart differ. Tests: unit (schema shape, `Z` suffix, naive rejection, UTC normalisation, per-request clock read, OpenAPI schema reference, route registration) and integration (HTTP 200 body shape, exact suffix, freshness across two requests). E2E is not warranted: no criterion involves the UI. UAT artifacts are produced per the toggle.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/time`, returns the server current time in UTC. Router `backend/app/routers/server_time.py`, `router = APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time() -> ServerTimeResponse` declared with `response_model=ServerTimeResponse`, returning `ServerTimeResponse(now=_utc_now(), timezone="UTC")`. `_utc_now()` is a module-level one-liner returning `datetime.now(UTC)`; it exists so tests can substitute the clock with `monkeypatch.setattr`, and it is called inside the handler on every request (never at import time, never cached), which is what makes `now` per-request.
- Schema: `backend/app/schemas/server_time.py`, `class ServerTimeResponse(BaseModel)` with `now: Annotated[AwareDatetime, AfterValidator(_as_utc), Field(description=...)]` and `timezone: Literal["UTC"]`. `_as_utc` returns `value.astimezone(UTC)`. Docstring and Field description state the pinned format: ISO 8601 in UTC, always ending in `Z`, never `+00:00`, never naive. No custom serializer, so the OpenAPI document keeps `format: date-time`, as for the uptime endpoint.
- Registration: `backend/app/main.py`, import between the notes and uptime router imports, `app.include_router(server_time_router)` after `app.include_router(uptime_router)`, docstring updated (see `## Re-Plan Feedback` point 1).
- Service layer: none. **Planned deviation from `coding_standards.md` Section 2.2** (Router, Service, Repository): that pattern places business logic and transactional boundaries in the service, and reading the clock is neither, so there is no `server_time_service.py`, matching the TEST-06 echo router. Stated in the router module docstring as well.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no path, query or body parameters.
- Response: 200, `application/json`, body defined by `ServerTimeResponse`. `now` is a string, ISO 8601, UTC, always ending in `Z` (fractional seconds present when the clock has them); `timezone` is always the string `UTC`. No other keys. Example:
```json
{"now": "2026-10-16T06:12:03.481920Z", "timezone": "UTC"}
```

## Technology Selection
- Clock read (`_utc_now` in the router): chose the standard library `datetime.now(UTC)` over a new time-mocking dependency such as freezegun or time-machine (neither is installed), because the clock is substituted in tests with pytest `monkeypatch` on the one helper, which pytest already provides.
- `ServerTimeResponse` schema: chose the installed Pydantic `AwareDatetime` plus an `AfterValidator` normalising to UTC over a hand-written string formatter or custom serializer, because Pydantic already rejects naive values and writes UTC as `Z` in JSON mode (the same mechanism `UptimeResponse` uses on main), and a custom serializer would drop `format: date-time` from the OpenAPI document.
- `timezone` field: chose `typing.Literal["UTC"]` (standard library) over a free `str` with a hand check, because the type itself then rejects any other value and documents the constant in OpenAPI.
- Router module: no stdlib call, native platform feature or installed dependency replaces it; it is the installed FastAPI `APIRouter`, the shape every endpoint on main uses.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, `now` aware UTC datetime pinned to the `Z` suffix, `timezone` literal `UTC`, with `_as_utc` normaliser
- [B] backend/app/routers/server_time.py: `GET /api/time` router, `_utc_now()` clock helper, docstring recording the planned no-service deviation
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (shape, `Z` suffix, no `+00:00`, naive rejected, non-UTC offset normalised, timezone literal), per-request clock read through the handler, OpenAPI schema reference
- [B] backend/tests/integration/test_server_time_integration.py: HTTP tests for 200 and exact body keys, `Z` suffix and parsed zero offset, freshness across two requests with a substituted clock, non-decreasing real clock
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the notes and uptime imports, `app.include_router(server_time_router)` after the uptime registration, docstring names FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the custom routes

No dependency changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `ServerTimeResponse` serialises an aware UTC datetime with the exact `Z` suffix and no `+00:00` (happy path); a value at `+02:00` is normalised to the same instant in UTC and ends in `Z` (edge); a naive datetime raises `ValidationError` (error); `timezone` other than `UTC` raises `ValidationError` (error); `model_dump(mode="json")` has exactly the keys `now` and `timezone`; calling `get_server_time()` twice with `_utc_now` monkeypatched to return two instants one second apart yields two different `now` values (per-request read, no caching); the OpenAPI document references `ServerTimeResponse` for `GET /api/time` with `now` as `string`/`date-time` and `timezone` as const or enum `UTC`; `create_app()` registers `/api/time` (in `test_main_unit.py`).
  - Directory: backend/tests/unit/
  - Naming: test_server_time_unit.py (and the existing test_main_unit.py)
- Integration tests: through the session-scoped `client` fixture in `backend/tests/conftest.py` (no database needed; startup skips schema initialisation when `DATABASE_URL` is unset): `GET /api/time` returns 200, `application/json`, and a body whose keys are exactly `now` and `timezone` with `timezone == "UTC"`; `now` matches the ISO 8601 pattern ending in `Z`, contains no `+00:00`, and parses with `datetime.fromisoformat` to an aware value with zero UTC offset within a few seconds of the test clock; two requests with `app.routers.server_time._utc_now` monkeypatched to return instants one second apart return different `now` values; two requests on the real clock return a second `now` not earlier than the first.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No acceptance criterion requires navigation or interaction through the UI, and no screen calls this endpoint; a browser spec calling the API directly would be a router integration test (`testing_standards.md` Section 5). No spec file is written.
  - Directory: e2e/tests/
  - File: none (FEAT-1_server_time_endpoint.spec.ts would be the name if one were warranted)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (the suffix is `Z` and never `+00:00`), verified against the HTTP response.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` (`UTC`) | Integration | verifying it needs no navigation or interaction: it is the HTTP status and body of one router call |
| 2 | `now` is computed per request, UTC with explicit offset, never naive | Integration and Unit | verifying it needs no navigation or interaction: freshness is two router calls with a substituted clock, and the offset is a schema serialisation rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is the schema class and the OpenAPI reference to it |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit and Integration | verifying it needs no navigation or interaction: it is satisfied by the two backend test files existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` (`UTC`) | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` with `timezone` equal to `UTC` |
| 2 | `now` is per request, UTC with explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the API is running, When a client requests GET /api/time twice a second apart, Then the two `now` values differ and each ends in `Z` |
| 3 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the API is running, When a reader opens the OpenAPI document, Then GET /api/time responds with the `ServerTimeResponse` schema |
| 4 | Tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the server time unit and integration tests run, Then 0 failed |

## Manual verification plan
No screen of the task-notes app calls this endpoint, so every criterion is verified against the HTTP response itself (terminal with curl, or the interactive docs at http://localhost:8010/docs), not through the UI.

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone` (`UTC`)
Prerequisites: the stack is up (`docker compose up -d` at the repository root) and the backend answers on http://localhost:8010; a terminal with `curl` and `python3`.
1. Run `curl -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers.
2. Run `curl -s http://localhost:8010/api/time | python3 -m json.tool` → a JSON object with exactly two keys: `now`, holding a quoted string such as `2026-10-16T06:12:03.481920Z`, and `timezone`, holding the quoted string `UTC`, and nothing else.
3. Open http://localhost:8010/docs in a browser, expand `GET /api/time`, click `Try it out` then `Execute` → the response code shown is 200 and the response body shows the same two keys.

### Criterion 2: `now` is computed per request, UTC with explicit offset, never naive
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two JSON lines are printed and their `now` values differ, the second one about one second later than the first.
2. Read the last characters of each `now` value from step 1 → each ends in `Z`; neither ends in `+00:00`, and neither ends in a bare digit (which would be a naive timestamp with no offset).
3. Run `date -u +%Y-%m-%dT%H:%M:%S` immediately after another `curl -s http://localhost:8010/api/time` → the date and time in `now` match the printed UTC time to within a few seconds (not shifted by the local timezone).

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for Criterion 1; the repository checked out on the feature branch.
1. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)` with fields `now` and `timezone`, and its docstring states that `now` always ends in `Z`.
2. Open `backend/app/routers/server_time.py` → the handler is declared with `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, not a dict.
3. Open http://localhost:8010/docs, expand `GET /api/time`, select the `Schema` tab of the 200 response → it is named `ServerTimeResponse`, with `now` as a `string` of format `date-time` and `timezone` as `UTC`.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: `uv` installed; run from the repository root. The integration file needs no database.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed` (no error, and no test of these files skipped).
2. Open `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` → there is at least one test each for the body shape, the exact `Z` suffix (asserting no `+00:00`), and two calls returning different `now` values.
