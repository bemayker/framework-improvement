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
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. **It touches** **`main.py`****'s router registration, so it must not be built concurrently with another backend item that does the same.**
>
> ## How the measured run uses this item (operator instructions, not part of the feature)
>
> 1. `/plan-feature TEST-09` **before** Arm C's item (TEST-06) merges. Leave it at `plan_review`; a re-plan is only possible there (baseline Section 5.3).
> 2. After TEST-06 merges to `main` (its squash touches `backend/app/main.py`), post the re-plan comment on this item and run `/plan-feature TEST-09` again.
> 3. **Pass:** the merged-since check reports a non-clean verdict naming the overlapping commit, and the re-plan answers the comment point by point (MDF-008). **`verdict=clean`** **on this item is a failed setup, not a pass** (baseline Section 5.2).
> 4. Do not build it before step 3 has been recorded. Whether it is then built is the operator's choice; it is not one of the items the baseline's numbers are compared on.

The operator section is not feature scope and this plan builds nothing from it. Observation for the plan reviewer: its steps 1 and 2 name `/plan-feature TEST-09`, while this item is FEAT-1; read as a copy slip from an earlier item, not acted on.

## Acceptance Criteria
- [ ] AC1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] AC2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] AC3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] AC4: Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
This is the first plan on this branch (branched from `origin/main` at `62e1b544`, no `plan.md` existed), so the merged-since check is n/a by construction. The item carries one actionable human comment; its four points are answered one by one below. The other 35 comments are framework posts (plan-PR links from closed PRs, one earlier autonomous answer) and ask for nothing.

- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py, the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against `origin/main` at `62e1b544`. The premise is half true. `73e544c8 feat(TEST-06): Echo endpoint (#35)` IS an ancestor of main and its diff did change `backend/app/main.py` (6 lines) and add `backend/app/routers/echo.py`. But the sandbox reset commits since then (latest touching these paths: `9ce81d97`, also `d7663f0d`, `1463dc04`) removed that code again: at `62e1b544` there is no `backend/app/routers/echo.py`, no `backend/app/schemas/echo.py`, and no `server_time` router either. `main.py`'s registration block as it now stands is three calls, `include_router(version_router)`, `include_router(notes_router)`, `include_router(health_router)` (lines 56 to 58), with imports for health, notes and version (lines 20 to 22). What changed for this plan: nothing to merge around. The insertion point is one import line between the `notes` and `version` imports (alphabetical order the file already keeps) and one `app.include_router(server_time_router)` after `health_router`, plus a one-clause addition to the module docstring naming FEAT-1. If TEST-06's echo registration reappears on main before this is built, the edit stays additive (one new line in each block) and the builder rebases onto it rather than replacing it.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on, recorded as a scope decision. Reasons: (a) the echo endpoint is TEST-06's own work item (feature map row, branch `feature/TEST-06-echo-endpoint`), and TEST-11, BUG-05 and CHORE-05 are planned against TEST-06's echo files; building it under FEAT-1 would put two items on one deliverable and leave TEST-06's branch to collide with it; (b) none of FEAT-1's acceptance criteria asks for it, and `user_story_alignment.md` Section 3 plus `CLAUDE.md` Architecture Notes ("Keep every feature as small as possible") rule it out of this item; (c) the comment's own reason for it (land the two registrations together) rests on point 1's premise, which main no longer bears out. If the stakeholder wants echo back on main, the route is to re-run TEST-06, not to widen FEAT-1. The plan PR reviewer can overrule this; if so, add echo as a separate manifest group rather than folding it into the time router.
- Comment (tracker), point 3: "Pin the offset: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`. Reason: the criterion says "explicit offset", and `+00:00` is a numeric offset where `Z` is a zone designator; it is also what Python's `datetime.isoformat()` emits for UTC. Load-bearing detail: Pydantic 2.13.4 (installed, `backend/uv.lock`) serialises a UTC-aware datetime with `Z` by default, so the schema carries an explicit `field_serializer` for `now` and states the choice in its docstring and field description. Tests asserting the exact suffix: `test_server_time_response_serializes_now_with_plus_zero_offset_suffix` (unit) and `test_get_time_now_ends_with_plus_zero_offset` (integration, through FastAPI's response serialisation, which is where a silent fallback to `Z` would show).
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module; recorded below as a planned deviation. Two corrections to the premise, so the reviewer judges the deviation on the real text. First, `coding_standards.md` Section 2.2 does not itself scope the pattern to business logic: it applies the pattern "when the project includes a backend with data persistence", which this project does. What it does say is that the Router carries "NO business logic" and the Service carries business logic and transactional boundaries; reading the clock is neither, so the router keeps no business logic by having none to keep. Second, the repo's own precedent is split: TEST-05 (`version_service.py`) and TEST-02 (`health_service.py`) add a service for equally trivial endpoints, while TEST-06's file list (from the feature map's neighbours call) has no service. This plan follows TEST-06, as the comment asks. I did not open TEST-06's plan to confirm its stated reasoning; the planner does not read another item's plan.

### Planned deviation
- Layering: `GET /api/time` is Router plus Schema, no Service and no Repository. The clock read is a one-line module-level helper `utc_now()` in the router module, kept as a named function so tests can substitute the clock. Deviates from the TEST-02 and TEST-05 precedent of a service per endpoint; matches TEST-06. Not an ADR: it changes no architecture, only declines a layer for one endpoint with no logic, and is recorded here and under `## Scope changes`.

## Plan Overview
One read-only backend endpoint, `GET /api/time`, returning the server's current UTC time with a pinned `+00:00` offset and a constant `"timezone": "UTC"`. Backend only: a response schema in `backend/app/schemas/server_time.py`, a router in `backend/app/routers/server_time.py`, one registration in `backend/app/main.py`, and unit plus integration tests. No database, no frontend, no external API, no new dependency. The module name `server_time` matches what BUG-01 (this item's downstream) already expects.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns `ServerTimeResponse`; `APIRouter(prefix="/api", tags=["time"])`, `@router.get("/time", response_model=ServerTimeResponse)`, same shape as `backend/app/routers/version.py`.
- Router module `backend/app/routers/server_time.py`: a module-level `utc_now() -> datetime` returning `datetime.now(timezone.utc)`, and the handler `get_server_time()` returning `ServerTimeResponse(now=utc_now())`. The clock is read inside the handler on every call, never at import or at app creation, which is what AC2's freshness rests on.
- Schema `backend/app/schemas/server_time.py`: `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's type that rejects a naive datetime with a `ValidationError`) and `timezone: Literal["UTC"] = "UTC"`. A `@field_serializer("now")` returns `value.astimezone(timezone.utc).isoformat()`, so an aware non-UTC value is normalised to UTC and the output always ends in `+00:00`. Docstring and `Field(description=...)` state the `+00:00` choice and that `Z` is deliberately not used.
- `backend/app/main.py`: add `from app.routers.server_time import router as server_time_router` between the `notes` and `version` imports, and `app.include_router(server_time_router)` after `app.include_router(health_router)`; add FEAT-1 to the module docstring's list of features that register routers. Nothing else in the factory changes (CORS already allows GET).
- Service layer: none (planned deviation above).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `application/json`:
```json
{"now": "2026-11-19T10:00:00.123456+00:00", "timezone": "UTC"}
```
  `now` is ISO 8601, always UTC, always ending in `+00:00`, never `Z`, never naive. Microseconds appear when non-zero (Python `isoformat()` behaviour). Other methods on the path get FastAPI's 405.

## Technology Selection
- Clock read: chose the standard library `datetime.now(timezone.utc)` over any third-party time library, because the stdlib returns an aware UTC datetime directly and nothing else is needed.
- Naive-datetime guard: chose Pydantic's installed `AwareDatetime` type over a hand-written validator, because it rejects naive values with no custom code.
- Offset pinning: chose a Pydantic `field_serializer` calling stdlib `isoformat()` over Pydantic's default datetime serialisation, because the default emits `Z` and the pinned format is `+00:00`.
- Service module: none built (planned deviation); no net-new dependency, so `backend/pyproject.toml` and `backend/uv.lock` do not change.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, `AwareDatetime` `now`, `Literal["UTC"]` `timezone`, `+00:00` serializer.
- [B] backend/app/routers/server_time.py: `GET /api/time` router with the `utc_now()` clock helper.
- [B] backend/tests/unit/test_server_time_unit.py: schema unit tests (suffix, UTC normalisation, naive rejection, timezone constant).
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests (200 and shape, suffix, per-request freshness, 405, OpenAPI schema).
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script build-feature writes.

### Modified files
- [B] backend/app/main.py: import and register `server_time_router`; docstring names FEAT-1.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route`.

No dependency changes, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: no change to project structure, run configuration, dependencies or test infrastructure. No E2E spec: no criterion needs the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: the `ServerTimeResponse` schema in isolation (no app, no clock): exact `+00:00` suffix, a non-UTC aware value normalised to UTC, a naive value rejected with `ValidationError`, `timezone` fixed to `"UTC"`; plus the app factory registering `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py → `test_server_time_unit.py`
- Integration tests: the router through the full HTTP cycle with the session `client` fixture from `backend/tests/conftest.py` (no database needed; the lifespan skips schema setup when `DATABASE_URL` is unset): 200 and exact key set, `+00:00` suffix through FastAPI's serialisation, per-request freshness with `monkeypatch.setattr` on `app.routers.server_time.utc_now` returning two instants one second apart (deterministic, no sleep), an unpatched pair of calls whose parsed values are non-decreasing and UTC, `POST /api/time` gives 405, and the OpenAPI document declares `ServerTimeResponse` as the 200 schema (AC3 observed at the boundary, not only by reading code).
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py → `test_server_time_integration.py`
- E2E tests: none. The toggle is ENABLED, but no acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, asked per criterion); a spec calling the API directly is an integration test (`testing_standards.md` Section 5).
  - Directory: e2e/tests/
  - File: none written for FEAT-1.
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (naive or `Z` never appears), verified by HTTP request since there is no UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | `test_get_time_returns_200_with_now_and_utc_timezone`, `test_post_time_returns_405_method_not_allowed`, `test_create_app_registers_time_route` | verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration | `test_get_time_computes_now_per_request`, `test_get_time_successive_calls_are_utc_and_non_decreasing`, `test_get_time_now_ends_with_plus_zero_offset`, `test_server_time_response_rejects_naive_datetime`, `test_server_time_response_normalises_aware_non_utc_to_utc` | verifying it needs no navigation or interaction: it is per-request router behaviour and a schema serialisation rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_server_time_response_serializes_now_with_plus_zero_offset_suffix`, `test_server_time_response_timezone_is_fixed_utc`, `test_get_time_openapi_declares_server_time_response_schema` | verifying it needs no navigation or interaction: it is a schema definition, observed through the OpenAPI document |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit | `test_server_time_response_serializes_now_with_plus_zero_offset_suffix`, `test_get_time_returns_200_with_now_and_utc_timezone`, `test_get_time_now_ends_with_plus_zero_offset`, `test_get_time_computes_now_per_request` | verifying it needs no navigation or interaction: it is a statement about the unit and integration tiers themselves, met by the tests named in rows 1 to 3 |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the API is running, When I GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone`, with `timezone` equal to "UTC" |
| 2 | per request, UTC, explicit offset | covered at Integration, see Criterion coverage | Given the API is running, When I GET /api/time twice about a second apart, Then the two `now` values differ and both end in "+00:00" |
| 3 | Pydantic schema | covered at Unit, see Criterion coverage | Given the API is running, When I open /openapi.json, Then the 200 response of GET /api/time references the ServerTimeResponse schema |
| 4 | tests cover shape, offset, freshness | covered at Unit, see Criterion coverage | Given the backend test suite, When I run the server time unit and integration tests, Then they pass |

## Manual verification plan
No acceptance criterion can be verified through the UI: FEAT-1 adds no screen. Every check below is an HTTP request or a test run against the backend.

### Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`
Prerequisites: the backend is running locally (`uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this endpoint.
1. In a terminal, run `curl -s -i http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK` and `content-type` is `application/json`.
2. Read the body → it has exactly two keys, `now` and `timezone`, and `timezone` is `"UTC"`.
3. Run `curl -s -i -X POST http://localhost:8000/api/time` → the status line reads `405 Method Not Allowed`.

### Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8000/api/time`, wait about one second, run it again → the two `now` values differ, and the second is later than the first.
2. Read the end of each `now` value → both end in `+00:00`; neither ends in `Z` and neither lacks an offset.
3. Compare `now` with the output of `date -u +%Y-%m-%dT%H:%M:%S` run at the same moment → the date and time agree to within a second or two.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8000/docs` in a browser and expand `GET /api/time` → the 200 response shows the schema `ServerTimeResponse` with fields `now` (string, date-time) and `timezone`.
2. Open `backend/app/routers/server_time.py` → the handler returns a `ServerTimeResponse`, not a dict literal, and `ServerTimeResponse` is imported from `app.schemas.server_time`.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. Read the test names in `-v` output of the same command → they include `test_get_time_computes_now_per_request`, `test_get_time_now_ends_with_plus_zero_offset` and `test_server_time_response_serializes_now_with_plus_zero_offset_suffix`.

## Scope changes

- 2026-11-19 Declined the tracker comment's request to add GET /api/echo in backend/app/main.py and a new echo router; no echo file is in the File Manifest. Reason: echo is TEST-06's own item (TEST-11, BUG-05 and CHORE-05 build on its files), no FEAT-1 criterion asks for it, and CLAUDE.md Architecture Notes keep each feature minimal.
- 2026-11-19 Pinned the AC1 and AC2 "explicit offset" to +00:00 (never Z) in backend/app/schemas/server_time.py with a field_serializer, asserted by backend/tests/unit/test_server_time_unit.py and backend/tests/integration/test_server_time_integration.py. Reason: tracker comment point 3 asked for the choice to be pinned; +00:00 is a numeric offset, and Pydantic 2.13 would otherwise emit Z.
- 2026-11-19 No service module for GET /api/time: backend/app/routers/server_time.py reads the clock through a module-level utc_now() helper, deviating from the TEST-02 and TEST-05 service-per-endpoint precedent and matching TEST-06. Reason: tracker comment point 4; reading the clock is neither business logic nor a transactional boundary.
