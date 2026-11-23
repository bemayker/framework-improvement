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
> ## How the measured run uses this item (operator instructions, not part of the feature)
>
> (Operator steps for the measured run: plan before TEST-06 merges, re-plan after a comment, the merged-since check must not read `verdict=clean`, do not build before the re-plan is recorded. Not part of the feature; carried in the tracker item, not planned here.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`; the offset is pinned to `+00:00` (tracker comment point 3).
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py, the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: checked against `origin/main` at `7ce6e965`. The claim is true as history and false as current state. `73e544c8` (`feat(TEST-06): Echo endpoint (#35)`, 2026-09-14) is an ancestor of `origin/main` and did change `backend/app/main.py` (+6/-2) and add `backend/app/routers/echo.py`. Later sandbox resets removed it again: `ea5f29a5` (#316) re-added echo and `9dcba19b` (#326) removed it, and `backend/app/routers/echo.py` and `backend/app/schemas/echo.py` do not exist on `origin/main` today. The last commit to touch `main.py` is `06e9f14d` (#924, a reset after BUG-01's server-time attempts). On current main, `create_app()` registers exactly three routers in this order: `version_router`, `notes_router` and `health_router`, imported in alphabetical order (`health`, `notes`, `version`). Insertion point for this plan: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports, which keeps the alphabetical order, and `app.include_router(server_time_router)` goes after `app.include_router(health_router)`, the last line before `return app`. No echo line exists to anchor on or to conflict with.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on, for three reasons. (a) `/api/echo` is the whole scope of a separate work item, TEST-06 (`feature/TEST-06-echo-endpoint`), and two other items depend on it: TEST-11 (trim surrounding whitespace) and BUG-05 (keep surrounding whitespace). They specify opposite whitespace behaviour, and the feature map says to resolve that before building either. Shipping echo under FEAT-1 would pick a whitespace behaviour with no criterion to decide it and give the same route two owners. (b) The comment contradicts itself. Point 1 says echo has already merged, and point 2 asks for it to be added. On current main it is absent (point 1 above), so the right fix is to restore TEST-06 under its own ID, not to rebuild it under FEAT-1. (c) Echo shares no criterion with this item, so adding it here is the gold plating `user_story_alignment.md` Section 3 rules out. Assumption recorded instead of a blocking question: the reviewer of this plan PR can overrule this. If they do, it is a scope change recorded through `decision-record.sh scope`, and TEST-06's acceptance criteria must then be copied in, not reinvented.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is pinned to `+00:00`, not `Z`. Reasons: the criterion says "explicit offset", and `+00:00` is a numeric UTC offset while `Z` is a zone designator. `+00:00` also matches Python's own `datetime.isoformat()`. The installed Pydantic (2.13.4, per `backend/uv.lock`) serialises an aware UTC datetime with a `Z` suffix by default, so the choice is enforced in the schema rather than left to that default. `ServerTimeResponse` declares `now: AwareDatetime`, which rejects a naive value, and a `@field_serializer("now")` that converts to UTC and emits `isoformat(timespec="microseconds")`. The docstring states the `+00:00` choice. Tests assert the exact suffix with `endswith("+00:00")`, and that `Z` does not appear: unit `test_server_time_response_serialises_now_with_plus_00_00_suffix` and integration `test_get_time_now_ends_with_plus_00_00_offset`. Criterion 1 above now carries the pinned value.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/server_time_service.py` and no repository. The router reads the clock through a private module-level `_utc_now()` in `backend/app/routers/server_time.py` and returns a `ServerTimeResponse`. Recorded as a planned deviation under `## Backend Plan`. It departs from local precedent, because the other two endpoints with no database work, version and health, each have a service module. It does not depart from the standard: `coding_standards.md` Section 2.2 makes the pattern conditional on "a backend with data persistence" and says "The plan from `/plan-feature` determines which layers exist". This endpoint touches no persistence, and a clock read has no business rule or transactional boundary. I could not check TEST-06's plan against this premise: its code and plan are not on current main, and this planner reads no other item's plan. The deviation stands on Section 2.2's own wording. No ADR: it is a per-endpoint layering choice within what the standard allows, not an architecture change.
- Comment (tracker), the other 36 comments on the item: earlier "Plan PR opened" link comments posted by the framework, and one earlier autonomous-run answer. → Not acted on because they ask for nothing (as summarised in the dispatch; this planner does not read the tracker directly).

## Plan Overview
Backend only. Adds one read-only endpoint, `GET /api/time`, which returns the server's current UTC time as `{"now": "2026-11-23T10:14:34.123456+00:00", "timezone": "UTC"}`. Three pieces: a Pydantic response schema in `backend/app/schemas/server_time.py` that owns the shape and pins the `+00:00` offset; a router in `backend/app/routers/server_time.py` that reads the clock once per request; and the registration in `backend/app/main.py`. The tests are a schema unit test, a router integration test (shape, offset, per-request freshness, 405 on POST), and an updated app-factory unit test that asserts the route is registered. No database, no frontend, no external API and no new dependency. The module name `server_time` matches the name the downstream item BUG-01 already uses for this router.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time as `ServerTimeResponse` (status 200). `APIRouter(prefix="/api", tags=["time"])`, the same prefix shape as `backend/app/routers/version.py`. The route is `@router.get("/time", response_model=ServerTimeResponse)`, a sync `def get_server_time() -> ServerTimeResponse`, which returns `ServerTimeResponse(now=_utc_now())`. `_utc_now()` is a private module-level function, `return datetime.now(UTC)`, called inside the handler on every request and never at import time or in a default value. That call site is what makes criterion 2 hold. It also gives the integration test one seam to patch for a deterministic freshness check.
- Schema: `backend/app/schemas/server_time.py`, `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (pydantic, rejects a naive datetime at construction) and `timezone: Literal["UTC"] = "UTC"`, plus `@field_serializer("now")` returning `value.astimezone(UTC).isoformat(timespec="microseconds")`. Import `UTC` from `datetime` (Python 3.11+), not `timezone`, so the field named `timezone` shadows nothing. The docstring states that the offset is `+00:00`, never `Z`, and why. `timespec="microseconds"` keeps the string a fixed width, even on the rare microsecond value of 0 that plain `isoformat()` would shorten.
- Service layer: none. **Planned deviation** from the local precedent of `version_service.py` and `health_service.py`, made at the tracker's request (Re-Plan Feedback, point 4). `coding_standards.md` Section 2.2 applies the Router, Service, Repository pattern to a backend with data persistence, and leaves it to the plan to decide which layers exist. Reading the clock is neither business logic nor a transactional boundary, so a service module would be a pass-through. The PR description lists this deviation.
- Repository layer: none, no data access.
- Migrations: none.
- Registration (`backend/app/main.py`): add `from app.routers.server_time import router as server_time_router` between the `notes` and `version` imports, and `app.include_router(server_time_router)` after `app.include_router(health_router)`. Extend the module docstring's list of features that register routers with "FEAT-1 the server time router". Nothing else in `create_app()`, `lifespan` or the CORS middleware changes. `GET` is already in `allow_methods`.
- Out of scope, deliberately: any `Cache-Control` header. Stale caching of this response is the downstream item BUG-01's subject, not a criterion here.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters, no auth.
- Response: 200, `application/json`, defined by `ServerTimeResponse`:

```json
{"now": "2026-11-23T10:14:34.123456+00:00", "timezone": "UTC"}
```

`now` is ISO 8601 with microseconds and always ends in `+00:00`. `timezone` is always the literal `"UTC"`. Any other method on `/api/time` returns FastAPI's default 405.

## Technology Selection
- Current time source (`_utc_now()` in the router): chose the standard library `datetime.now(UTC)` over a third-party clock or time library (none installed, none needed), because the stdlib returns an aware UTC datetime directly.
- Offset pinning (`ServerTimeResponse.now` serializer): chose Pydantic's own `field_serializer` plus stdlib `isoformat()`, both already installed, over a custom JSON encoder or a hand-formatted string built with `strftime`. Pydantic's default emits `Z`, so some serializer is required. `isoformat` emits `+00:00` natively.
- Naive-datetime rejection: chose Pydantic's built-in `AwareDatetime` type (installed, pydantic 2.13.4) over a hand-written validator.
- No new dependency is added; nothing goes into `backend/pyproject.toml` or `backend/uv.lock`.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, with `now: AwareDatetime` serialised as UTC with a `+00:00` offset and `timezone: Literal["UTC"]`
- [B] backend/app/routers/server_time.py: `GET /api/time` router; `_utc_now()` reads the clock per request; no service layer (planned deviation)
- [B] backend/tests/unit/test_server_time_unit.py: schema unit tests for shape, the `+00:00` suffix, non-UTC aware input converted to UTC, and naive input rejected
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP-cycle tests for 200 and shape, the `+00:00` suffix, per-request freshness (patched and real clock), and 405 on POST
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the `notes` and `version` imports; `app.include_router(server_time_router)` after `health_router`; docstring line naming FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route`, asserting `/api/time` is among the app's custom route paths (same shape as the existing version and health checks)

No lockfile changes: this feature adds no dependency, so neither `backend/uv.lock` nor `frontend/package-lock.json` changes.
No documentation changes: neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. The feature changes no project structure, run configuration, dependency or test infrastructure; it adds one endpoint in the existing router layout.

## Testing Strategy
- Unit tests: `ServerTimeResponse` serialisation and validation in isolation, with no app and no clock. Cases: happy path (fields and values), the exact `+00:00` suffix, an edge case (aware datetime in a non-UTC zone serialised as the same instant in UTC), and an error case (naive datetime raises `ValidationError`). Also the app factory registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_server_time_unit.py` (and the existing `test_main_unit.py`)
- Integration tests: `GET /api/time` through the full FastAPI request/response cycle, using the session-scoped `client` fixture from `backend/tests/conftest.py`. No database is needed, so no `database_url` fixture is used. Cases: 200 with exactly the two keys and `timezone == "UTC"`; `now` parses with `datetime.fromisoformat`, is aware, has a zero offset and ends with `+00:00`; per-request freshness with a monkeypatched `app.routers.server_time._utc_now` that returns two fixed instants one second apart, so both responses reflect the patched values (proves the handler reads the clock per request, deterministically, with no sleep); the same property on the real clock, where two consecutive calls give strictly increasing `now`; and POST returns 405.
  - Directory: backend/tests/integration/
- E2E tests: no spec for this feature. E2E is ENABLED per CLAUDE.md, but no acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion): there is no frontend change, and calling the API directly from a browser spec would be a router integration test (`testing_standards.md` Section 5).
  - Directory: e2e/tests/
  - File: none (would be `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion, plus an edge case (POST returns 405), all API-level.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC, +00:00>", "timezone": "UTC"}` | Integration | `test_get_time_returns_200_with_now_and_utc_timezone`, `test_get_time_now_ends_with_plus_00_00_offset` | verifying it needs no navigation or interaction: it is a router response shape and status |
| 2 | `now` computed per request, serialised in UTC with an explicit offset, never naive | Integration + Unit | `test_get_time_now_is_computed_per_request`, `test_get_time_now_advances_between_real_requests`, `test_server_time_response_converts_non_utc_aware_datetime_to_utc`, `test_server_time_response_rejects_naive_datetime` | verifying it needs no navigation or interaction: it is per-request handler behaviour and a schema validation rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_server_time_response_dumps_now_and_timezone_fields`, `test_server_time_response_serialises_now_with_plus_00_00_suffix` | verifying it needs no navigation or interaction: it is a schema definition, checked directly on `ServerTimeResponse` |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit + Integration | `test_server_time_response_serialises_now_with_plus_00_00_suffix`, `test_get_time_returns_200_with_now_and_utc_timezone`, `test_get_time_now_ends_with_plus_00_00_offset`, `test_get_time_now_is_computed_per_request`, `test_create_app_registers_time_route` | verifying it needs no navigation or interaction: the criterion is about the test suite itself, met by the unit and integration tests named in rows 1 to 3 |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/time, Then the status is 200 and the body has `now` ending in `+00:00` and `timezone` equal to `UTC` |
| 2 | `now` computed per request, UTC, explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I GET /api/time twice about one second apart, Then the two `now` values differ and the second is later, and both end in `+00:00` |
| 3 | Body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When I open the OpenAPI schema, Then `/api/time` GET responds with the `ServerTimeResponse` component |
| 4 | Tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the repository at this branch, When I run the server-time unit and integration tests, Then the run passes |

## Manual verification plan
### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC, +00:00>", "timezone": "UTC"}`
No UI: this is an API response. The observable check is the HTTP response.
Prerequisites: the stack is running with `docker compose up -d --build` from the repo root, and the backend answers on `http://localhost:8010` (the port `docker-compose.yml` publishes).
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is exactly two keys, for example `{"now":"2026-11-23T10:14:34.123456+00:00","timezone":"UTC"}`. `timezone` is the string `UTC`.
3. Look at the end of the `now` value → it ends in `+00:00`, not `Z` and not a bare time with no offset.

### Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive
No UI: observable through two consecutive responses.
Prerequisites: as for criterion 1.
1. Run `curl -s http://localhost:8010/api/time`, wait about one second, then run it again → two bodies.
2. Compare the two `now` values → they differ, and the second is about one second later than the first.
3. Compare the hour in `now` with your machine's UTC time (`date -u` in the same terminal) → the hours match: the value is UTC, not the server's local time, and it ends in `+00:00`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the 200 response's schema is named `ServerTimeResponse`, with fields `now` (string, date-time) and `timezone`.
2. Open `backend/app/schemas/server_time.py` in the editor → it defines `class ServerTimeResponse(BaseModel)`, and its docstring states the `+00:00` offset choice.
3. Open `backend/app/routers/server_time.py` → the handler returns `ServerTimeResponse(...)` and builds no dict literal.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: the repository checked out at this branch, with `uv` installed.
1. From the repo root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → it contains `test_get_time_returns_200_with_now_and_utc_timezone` (shape), `test_get_time_now_ends_with_plus_00_00_offset` (offset) and `test_get_time_now_is_computed_per_request` (freshness).
