# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature created 2026-09-07 for **measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010)**. It exists to **overlap** a commit that will land on `main` during the run, not to be independent of it: it registers a router in `backend/app/main.py`, the file TEST-06 and TEST-07 also change. That overlap is the whole point (measured run 2 chose its Arm D item for independence and MDF-010 went unmeasured for the third time; `docs/measurement-baseline-0.3.132.md` Section 5.2).
>
> **What**
>
> `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> **Acceptance criteria**
>
> * `GET /api/time` returns 200 with a JSON body of two keys: `now`, an ISO 8601 UTC timestamp with explicit offset, and `timezone`, the string `UTC`. [The original spells this body as a JSON literal; it is elided here because the plan writer refuses a brace beside a quote, and is reproduced verbatim in the API Contract below.]
> * `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> * The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> * Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> **Notes**
>
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. **It touches main.py router registration, so it must not be built concurrently with another backend item that does the same.**
>
> **How the measured run uses this item (operator instructions, not part of the feature)**: four operator steps about planning before and re-planning after TEST-06 merges, the pass bar for the merged-since check, and not building before that is recorded. They are operator instructions, not acceptance criteria, and this plan takes no scope from them.

## Acceptance Criteria
- [ ] 1. GET /api/time returns 200 with a body of exactly two keys, `now` (ISO 8601 UTC with explicit offset) and `timezone` (the string `UTC`).
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in backend/app/schemas/, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
The item carries one actionable tracker comment, a four-point re-plan request, recorded below one line per point. Its text is quoted per point; where it spells a JSON body or a braced placeholder, that fragment is elided in square brackets because the plan writer refuses a brace beside a quote, and its Router, Service, Repository arrows are rendered as commas.

- Comment (tracker, point 1): "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py, the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-deriving the insertion point from `backend/app/main.py` as it stands on this branch (cut from `origin/main` at 95a2c80). The squash the comment names (73e544c8, PR #35) belongs to the pre-reset history (reset by be69c77, PR #164) and is not on current main; TEST-06 is on main as 375a655 (PR #167) and TEST-07 as 95a2c80 (PR #168), and both changed `main.py`. What changed: TEST-06 added `from app.routers.echo import router as echo_router` (now line 19) and `app.include_router(echo_router)` (line 64); TEST-07 added `from app.routers.uptime import router as uptime_router` (line 22), `from app.services import uptime_service` (line 24), the `app.state.uptime_start` capture at the top of `lifespan`, and `app.include_router(uptime_router)` (line 65, now the last registration). The router imports are alphabetical, so the FEAT-1 import goes between the notes import (line 21) and the uptime import (line 22), and `app.include_router(server_time_router)` goes after the uptime registration (after line 65, before `return app`). The module docstring (lines 3 to 8) gains one clause naming FEAT-1. `lifespan`, the CORS middleware (`allow_methods` already includes GET) and every existing registration stay untouched.
- Comment (tracker, point 2): "Also add a GET /api/echo endpoint [query parameter msg, braced placeholder elided] returning [a JSON body with one key echo holding the message, elided] while you are in main.py, so the two registrations land together." → Not acted on, because that endpoint is already on main: TEST-06 (375a655, PR #167) ships `backend/app/routers/echo.py` with `GET /api/echo?msg=...` returning `EchoResponse(echo=msg)`, its schema `backend/app/schemas/echo.py`, its registration in `main.py` and its tests. Adding it again would duplicate a delivered endpoint, and it is outside FEAT-1's four acceptance criteria (`user_story_alignment.md` Section 3). Any further echo change belongs to its own item (TEST-11 already owns the echo whitespace change).
- Comment (tracker, point 3): "The acceptance criterion says ISO 8601 UTC with explicit offset without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is pinned to `Z`. ISO 8601 and RFC 3339 both define `Z` as the explicit zero offset of UTC, so it satisfies criterion 2 and is never naive. It was chosen over `+00:00` for two reasons. First, it is what Pydantic writes for an aware UTC datetime by default, so the schema keeps a plain `AwareDatetime` with no custom serializer and the OpenAPI document keeps `format: date-time`. Second, it matches the one other timestamp this API already serves, `started_at` on `GET /api/uptime` (TEST-07, `backend/app/schemas/uptime.py`), so a client parses both the same way. The choice is stated in `ServerTimeResponse` (docstring and the `now` field description), and the schema normalises any aware value to UTC so the suffix is a property of the schema, not of caller discipline. Tests assert the exact suffix at both tiers: `test_server_time_response_serialises_now_with_z_suffix` and `test_server_time_response_normalises_non_utc_offset_to_z` (unit) and `test_get_server_time_now_ends_with_z_suffix` (integration, full-match pattern ending in a literal `Z`, and `+00:00` absent).
- Comment (tracker, point 4): "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2 Router, Service, Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module is created, and this is recorded as a planned deviation in the Backend Plan below. `coding_standards.md` Section 2.2 puts business logic and transactional boundaries in the Service layer; reading the clock is neither, there is no repository or database access, and the router only builds the response schema. This matches TEST-06 (`backend/app/routers/echo.py`, no service). TEST-07 has `uptime_service` because it holds application state captured at startup, which this feature does not.
- Comment (tracker, 8 comments): framework link comments of the form "Plan PR opened for FEAT-1" (PRs #36, #48, #50, #56, #64, #91, #145) and one autonomous-run handover note, from runs before the sandbox reset (be69c77, PR #164) → Not acted on, because they are link records of plans no longer on main and ask for nothing.
- Merged since the last plan: n/a (fresh plan, branched from current main at 95a2c80). TEST-06 and TEST-07 changes to `backend/app/main.py` are already in this base and are accounted for in point 1 above.
- Assumption (no comment covers it): the clock is read with the standard library, `datetime.now(UTC)`, at full microsecond precision; no rounding to whole seconds is applied, because no criterion asks for it and microseconds make two calls a second apart differ by construction.

## Plan Overview
Backend only, in the TEST-06 shape. One new router, `backend/app/routers/server_time.py`, exposing `GET /api/time`, whose handler reads the clock on every request with `datetime.now(UTC)` and returns a `ServerTimeResponse`. One new Pydantic response schema, `backend/app/schemas/server_time.py`: `now` is an `AwareDatetime` (a naive value is rejected) normalised to UTC by an after-validator, so it always serialises with the `Z` suffix, and `timezone` is `Literal` of the single value `UTC`. The router is registered in `backend/app/main.py` after the uptime router, with its import between the notes and uptime imports. No service module (planned deviation, Backend Plan), no repository, no database access, no frontend, no external API and no new dependency. Tests: unit tests for the schema (shape, Z suffix, UTC normalisation, naive rejection, timezone literal), for the per-request clock read with a stubbed clock, and for the OpenAPI declaration; integration tests through the real HTTP cycle for the shape, the exact suffix, the aware UTC parse and per-request freshness; one registration assertion in the existing app-factory unit test. No infrastructure scaffolding: FEAT-1 is not the scaffold item (TEST-01 is, and it is done; `backend/`, `frontend/` and `e2e/` exist).

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders nothing).

## Backend Plan
- Endpoints: `GET /api/time` (router prefix `/api`, path `/time`, tag `time`, `response_model=ServerTimeResponse`). Handler `get_server_time() -> ServerTimeResponse` returns `ServerTimeResponse(now=datetime.now(UTC), timezone="UTC")`. The clock is read inside the handler body, so every request reads it afresh (criterion 2); nothing is computed at import time or cached. `datetime` and `UTC` are imported at module level (`from datetime import UTC, datetime`), which is also the seam the unit freshness test stubs.
- Schemas: `backend/app/schemas/server_time.py` defines `class ServerTimeResponse(BaseModel)` with two required fields (criterion 3): `now: Annotated[AwareDatetime, AfterValidator(_as_utc), Field(description=...)]`, where `_as_utc` returns the value converted with `.astimezone(UTC)`, and `timezone: Literal["UTC"]`. The docstring and the `now` field description state the pinned format: UTC, ISO 8601, always ending in `Z` (Pydantic default JSON mode for an aware UTC datetime), never `+00:00` and never naive. No custom serializer, so the OpenAPI document keeps `type: string, format: date-time` for `now`, as `UptimeResponse.started_at` does.
- Registration: `backend/app/main.py` adds `from app.routers.server_time import router as server_time_router` between line 21 (notes import) and line 22 (uptime import), keeping the imports alphabetical, and `app.include_router(server_time_router)` after line 65 (`app.include_router(uptime_router)`), before `return app`. The module docstring gains the clause `and FEAT-1 the server time router`. `lifespan` and the CORS middleware are untouched.
- Service layer: none. **Planned deviation from `coding_standards.md` Section 2.2**, recorded at the request of the tracker comment (point 4): Section 2.2 puts business logic and transactional boundaries in the Service layer, and reading the clock is neither, so a pass-through `server_time_service` would be an abstraction with nothing in it (`coding_standards.md` Section 1, KISS). Same decision as TEST-06. The builder carries this deviation into the PR description.
- Repository layer: none. No database access.
- Migrations: none.
- Error responses: none specific. The endpoint takes no parameters, so there is no validation 4xx path; FastAPI defaults apply (405 for a non-GET method, handled by the framework). No custom exception handler is added.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time` (backend at http://localhost:8010 under `docker compose`)
- Request: no query parameters, no body, no headers beyond the defaults.
- Response 200: `ServerTimeResponse`, exactly two keys. `now` is a string, ISO 8601 date-time in UTC ending in `Z`, with up to six fractional-second digits (for example `2026-10-16T03:33:49.123456Z`). `timezone` is the string `UTC`. The body as the feature text spells it, with its placeholder:
```json
{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}
```
- Response 200, an example of the pinned format:
```json
{"now": "2026-10-16T03:33:49.123456Z", "timezone": "UTC"}
```
- Errors: none specific to this endpoint (no parameters to validate).

## Technology Selection
- Reading the current time: chose the standard library `datetime.now(UTC)` (Python 3.12, `datetime.UTC`) over any time or date package, because the standard library covers an aware UTC timestamp completely; no dependency is added.
- `backend/app/schemas/server_time.py` (`ServerTimeResponse`): chose a Pydantic `BaseModel` (installed through FastAPI) over a bare dict or a stdlib `dataclass`, because criterion 3 names a Pydantic schema and FastAPI serialises and documents a `response_model` from it.
- The never-naive rule: chose Pydantic `AwareDatetime` (installed) over a hand-written tzinfo check, because the type already rejects a naive value at validation.
- The `Z` suffix: chose Pydantic default JSON serialisation of an aware UTC datetime plus a one-line `AfterValidator` that converts to UTC, over a custom `field_serializer` or a `+00:00` string format, because the default already writes `Z` and keeps `format: date-time` in the OpenAPI document; a serializer would add code and change the documented type.
- The `timezone` value: chose `typing.Literal` of `UTC` (stdlib) over a free `str` or an `Enum`, because one fixed value needs no enum and the literal is documented in the OpenAPI schema.
- `backend/app/routers/server_time.py`: chose FastAPI `APIRouter` (installed), the shape TEST-06 and TEST-07 established; no stdlib call or native platform feature serves an HTTP route, so nothing substitutes it.
- Service module: none is created; building the response in the router was chosen over a pass-through `server_time_service`, because reading the clock is neither business logic nor a transactional boundary (planned deviation, Backend Plan).
- Dependencies: none added. FastAPI, Pydantic and pytest are already installed (`backend/pyproject.toml`).

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` with `now` (AwareDatetime normalised to UTC, serialised with the Z suffix, the choice stated in docstring and field description) and `timezone` (Literal UTC) (criteria 1 to 3)
- [B] backend/app/routers/server_time.py: `GET /api/time`, `response_model=ServerTimeResponse`, reads `datetime.now(UTC)` per request, no service (criteria 1 to 3)
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema shape, Z suffix, UTC normalisation, naive rejection, timezone literal, the per-request clock read with a stubbed clock, and the OpenAPI declaration (criterion 4)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for the 200 shape, the exact Z suffix, the aware UTC parse and per-request freshness (criterion 4)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus the non-UTC-offset normalisation edge case (UAT Generation ENABLED)
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the notes and uptime imports, `app.include_router(server_time_router)` after the uptime registration, one docstring clause naming FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom routes

No lockfile changes: the feature adds no dependency, so `backend/uv.lock` and `frontend/package-lock.json` are untouched.
No documentation edit: `README.md` and `docs/DEVELOPMENT.md` list no individual endpoints and this feature changes no project structure, run configuration, dependency or test infrastructure, so build-feature Section 15 has nothing to update.
No E2E spec file: no criterion is assigned to the E2E tier (see Criterion coverage).

## Testing Strategy
- Unit tests: the schema, the per-request clock read and the OpenAPI declaration, with no database and no lifespan run.
  - `test_server_time_response_serialises_now_with_z_suffix` (happy path, offset: a `ServerTimeResponse` built from 2026-10-16 03:33:49 UTC dumps in JSON mode with `now` exactly `2026-10-16T03:33:49Z` and `timezone` exactly `UTC`, and the dump has exactly the two keys `now` and `timezone`)
  - `test_server_time_response_normalises_non_utc_offset_to_z` (edge case: 05:33:49 at offset +02:00 dumps as `2026-10-16T03:33:49Z`, so the suffix is a schema property)
  - `test_server_time_response_rejects_naive_now` (error case: a naive datetime raises `pydantic.ValidationError`)
  - `test_server_time_response_rejects_timezone_other_than_utc` (error case: `timezone` set to `Europe/Brussels` raises `pydantic.ValidationError`)
  - `test_get_server_time_reads_the_clock_on_every_request` (freshness: monkeypatch `app.routers.server_time.datetime` with a stub whose `now(tz)` returns 03:33:49 UTC on the first call and 03:33:50 UTC on the second; two requests through `TestClient(create_app())`, built without the context manager so the lifespan and its database step do not run; the two `now` values are exactly one second apart, which proves the handler reads the clock per request rather than once)
  - `test_openapi_declares_server_time_response_schema` (criterion 3: in `create_app().openapi()` the `/api/time` GET 200 response references `ServerTimeResponse`; `now` is `type: string, format: date-time`; `timezone` is a string restricted to `UTC`; both are required)
  - `test_create_app_registers_server_time_route` added to the existing `test_main_unit.py`
  - Directory: backend/tests/unit/
  - Naming: test_module_unit.py per CLAUDE.md, here `test_server_time_unit.py`
- Integration tests: the router through the real HTTP request/response cycle with the shared session-scoped `client` fixture from `backend/tests/conftest.py`. The endpoint touches no database, so no database fixture is requested.
  - `test_get_server_time_returns_200_with_now_and_utc_timezone` (criterion 1: status 200, JSON keys exactly `now` and `timezone`, `timezone` equals `UTC`)
  - `test_get_server_time_now_ends_with_z_suffix` (criterion 2, offset: `now` full-matches the pattern date, `T`, time, optional fraction of 1 to 6 digits, then a literal `Z`; the string contains no `+00:00`)
  - `test_get_server_time_now_parses_as_aware_utc` (criterion 2, never naive: `datetime.fromisoformat(now)` has a non-None `tzinfo` and `utcoffset()` equal to zero)
  - `test_get_server_time_now_is_computed_per_request` (criterion 2, freshness without sleeping: take the test clock before, make two requests, take the test clock after; assert before is at most the first `now`, the first is at most the second, and the second is at most after. A value fixed at import or startup would fall before the window)
  - Directory: backend/tests/integration/
  - Naming: test_module_integration.py per CLAUDE.md, here `test_server_time_integration.py`
- E2E tests: no criterion is assigned to E2E. No screen calls `/api/time` and the feature adds no frontend, so no criterion needs navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, asked per criterion). No spec file is written.
  - Directory: e2e/tests/ (unused by this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the non-UTC-offset normalisation edge case, phrased as HTTP requests and responses because there is no UI; the manual script expands the Manual verification plan below.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/time returns 200 with now and timezone UTC | Integration | No UI consumes the endpoint: it is a router request/response behaviour, verified fully through the HTTP cycle |
| 2 | now computed per request, UTC with explicit offset, never naive | Integration, plus Unit for the exact suffix, the normalisation and the stubbed-clock freshness | A response-value property with no navigation or interaction; the stubbed clock gives a deterministic one-second difference no browser test could |
| 3 | Response body defined by a Pydantic schema in backend/app/schemas/ | Unit | A structural property of the schema module and its OpenAPI declaration, checked without HTTP or a browser; the integration tests also exercise it as the response model |
| 4 | Unit and integration tests cover shape, offset and per-request freshness | Unit and Integration | It is a criterion about the test suite itself, satisfied by the named unit and integration tests above, not by a user interaction |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/time returns 200 with now and timezone UTC | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/time, Then the status is 200 and the JSON has exactly the keys now and timezone, with timezone UTC |
| 2 | now per request, UTC with explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/time twice a second apart, Then both now values end in Z and the second is one second or more later than the first |
| 3 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When I read the OpenAPI document, Then GET /api/time responds with the ServerTimeResponse schema, now a date-time string and timezone restricted to UTC |
| 4 | Tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the repository, When I run the server time unit and integration test files, Then the run reports 0 failed |

## Manual verification plan
No screen of the task-notes app calls this endpoint, so every criterion is verified against the HTTP response itself: in a browser address bar, in FastAPI interactive docs at http://localhost:8010/docs, or with curl. All four blocks share these prerequisites.

Prerequisites: on branch `feature/FEAT-1-server-time-endpoint` (or `main` once merged), from the repository root run `docker compose up -d --build`, then `docker compose ps` until `backend` reports running. The backend answers on http://localhost:8010 (docker-compose.yml publishes 8010). A terminal with `curl`, `date` and `python3`.

### Criterion 1: GET /api/time returns 200 with now and timezone UTC
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers.
2. Read the response body of step 1 → a JSON object with exactly two keys: `now`, a timestamp string such as `2026-10-16T03:33:49.123456Z`, and `timezone`, whose value is the string `UTC`. No other key is present.
3. Open http://localhost:8010/api/time in a browser → the page shows the same two keys, with `now` close to the current UTC time.

### Criterion 2: now is computed per request, UTC with an explicit offset, never naive
1. Run `date -u +%Y-%m-%dT%H:%M:%S` → note the current UTC time, for example `2026-10-16T03:33:49`.
2. Run `curl -s http://localhost:8010/api/time` → `now` matches the time from step 1 to within a few seconds (the clock of the host running the container), and its last character is `Z`. It does not end in `+00:00`, and it is never a timestamp without an offset.
3. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two bodies; the second `now` is one second or more later than the first. Both end in `Z` and both carry `timezone` `UTC`.
4. Copy one `now` value from step 3 and run `python3 -c "import datetime; print(datetime.datetime.fromisoformat('PASTE_NOW_HERE').utcoffset())"` with the value in place of PASTE_NOW_HERE → it prints `0:00:00`, which shows the value parses as an aware UTC time.

### Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/
This is a code-structure property with no UI behaviour; the observable checks are the OpenAPI document and the module.
1. Open http://localhost:8010/docs, expand `GET /api/time`, look under `Responses` for code `200` → the schema is named `ServerTimeResponse` with two required properties, `now` (string, date-time) and `timezone` (string, the single allowed value `UTC`).
2. Open http://localhost:8010/openapi.json and find `components`, then `schemas`, then `ServerTimeResponse` → `now` has `type` `string` and `format` `date-time`, `timezone` is restricted to `UTC`, and both appear under `required`.
3. Open `backend/app/schemas/server_time.py` → `class ServerTimeResponse(BaseModel)` with fields `now` and `timezone`; its docstring and the `now` description state the `Z` suffix. Open `backend/app/routers/server_time.py` → it declares `response_model=ServerTimeResponse`, returns a `ServerTimeResponse`, never a dict literal, and imports no service module.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
This criterion is about the test suite, so the check is running it.
1. Prerequisite: a PostgreSQL reachable through `DATABASE_URL` is not needed for these files; the endpoint touches no database.
2. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
3. Open `backend/tests/unit/test_server_time_unit.py` → it contains `test_server_time_response_serialises_now_with_z_suffix`, `test_server_time_response_normalises_non_utc_offset_to_z` and `test_get_server_time_reads_the_clock_on_every_request`. Open `backend/tests/integration/test_server_time_integration.py` → it contains `test_get_server_time_now_ends_with_z_suffix` and `test_get_server_time_now_is_computed_per_request`.
