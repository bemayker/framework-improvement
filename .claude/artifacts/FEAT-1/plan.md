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
> 1. `/plan-feature TEST-09` **before** Arm C's item (TEST-06) merges. Leave it at `plan_review`; a re-plan is only possible there (baseline Section 5.3).
> 2. After TEST-06 merges to `main` (its squash touches `backend/app/main.py`), post the re-plan comment on this item and run `/plan-feature TEST-09` again.
> 3. **Pass:** the merged-since check reports a non-clean verdict naming the overlapping commit, and the re-plan answers the comment point by point (MDF-008). **`verdict=clean` on this item is a failed setup, not a pass** (baseline Section 5.2).
> 4. Do not build it before step 3 has been recorded. Whether it is then built is the operator's choice; it is not one of the items the baseline's numbers are compared on.

## Acceptance Criteria
- [ ] AC1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] AC2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] AC3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] AC4: Unit and integration tests cover the shape, the offset and the per-request freshness.

The offset is pinned by tracker comment point 3 (below): `now` always ends in the literal suffix `+00:00`, never `Z` and never a naive timestamp.

## Re-Plan Feedback
The item carries one actionable stakeholder comment (tracker, unresolved, newest of the actionable comments) with four numbered points; each is answered below. The other 34 tracker comments are the framework's own "Plan PR opened" notes for earlier, closed plan PRs and request nothing; they are not acted on for that reason. Per the rule that a comment overrides the description where the two disagree, points 3 and 4 are applied as amendments; point 2 is an addition rather than a disagreement and is decided on its merits (below).

- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against the branch base `26588ef2` (= `origin/main` at branch time). The premise holds only historically. `73e544c8` (feat(TEST-06): Echo endpoint, #35) is an ancestor of `main` and did add `backend/app/routers/echo.py`, `backend/app/schemas/echo.py` and an echo `include_router` line in `backend/app/main.py`, but later sandbox resets removed them again: the last change to `backend/app/routers/echo.py` is `9dcba19b` (chore: reset the sandbox after release run 0.3.443 T8, #326), which deleted it along with the echo, uptime and server_time registrations in `main.py`; the most recent commit touching `main.py` is `1463dc04` (#864, reset to reset-base-r2). What `main.py` holds now: three router imports (`health_router`, `notes_router`, `version_router`, lines 20-22, alphabetical by module) and three registrations in `create_app()` in the order `version_router`, `notes_router`, `health_router` (lines 56-58), followed by `return app`. No echo router is present on main today. Insertion point for this plan: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports (keeping the alphabetical order), and `app.include_router(server_time_router)` goes after `app.include_router(health_router)`, immediately before `return app`; the module docstring gains one sentence naming FEAT-1's registration. Because TEST-06 (tracker status "to test") may re-land its echo line in the same block, the shared-risk note stands: serialize the builds, and a build that finds an echo registration already present appends after it, never reorders it.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on, recorded as a scope change (`## Scope changes`) and flagged for the plan-PR reviewer. Reason: `GET /api/echo` is the entire scope of a separate, live tracker item, TEST-06 "Echo endpoint" (status "to test"), whose four acceptance criteria go further than this comment (422 on a missing `msg`, 422 above 200 characters with the bound stated in the schema, a Pydantic response schema). Building echo here would either duplicate TEST-06 with a weaker contract or silently absorb another item's criteria into FEAT-1, leaving two items owning one route and two branches editing the same echo files; that is the gold plating `user_story_alignment.md` Section 3 rules out, and the comment's premise (TEST-06 merged and present on main) no longer holds (point 1). Landing "together" is achieved by the serialization note instead: whichever of FEAT-1 and TEST-06 builds second adds one line after the other's registration. If the reviewer wants echo in FEAT-1 anyway, the change is: adopt TEST-06's four criteria verbatim as AC5-AC8, add `backend/app/schemas/echo.py`, `backend/app/routers/echo.py` and their tests to the manifest, and close TEST-06 as merged into FEAT-1; say so on the plan PR and the item is re-planned.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`. Reasons: it is the literal reading of "explicit offset" (a numeric offset rather than the `Z` designator), and it is what the standard library's `datetime.isoformat()` emits for an aware UTC datetime, so it needs no formatting code of our own. Pydantic 2.13.4 (the installed version, `backend/uv.lock`) would serialise a UTC `datetime` as `...Z` by default, so the schema states the choice explicitly: a `SERIALISED_UTC_OFFSET = "+00:00"` constant, the field's `description`, and a `@field_serializer("now")` that converts to UTC and returns `isoformat()`. Covered by `test_server_time_response_serialises_now_with_plus_zero_offset` (unit, asserts `endswith("+00:00")` and not `Z`) and `test_get_time_returns_200_with_now_and_utc_timezone` (integration, asserts the suffix on the real HTTP body).
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/server_time_service.py` and no repository. The premise checks out: TEST-06's squash `73e544c8` added a router and a schema and no service. `coding_standards.md` Section 2.2 (full text in `coding_standards/backend_frontend.md`) places business logic and transactional boundaries in the service layer; reading the clock is neither, and there is no persistence. The router holds a one-line `current_utc_time()` helper (`datetime.now(timezone.utc)`) so tests can substitute the clock. Recorded as a planned deviation under `## Backend Plan` and in `## Scope changes`; note this departs from the TEST-05 and TEST-02 precedent on main, which both have a service module.

Merged since the last plan: n/a (fresh plan, branched from current main `26588ef2`; no `[merged-since]` lines).

## Plan Overview
Backend only. One new read-only endpoint, `GET /api/time`, in a new router `backend/app/routers/server_time.py`, with its response defined by a new Pydantic schema `ServerTimeResponse` in `backend/app/schemas/server_time.py`, registered in `backend/app/main.py`. No database, no service layer (planned deviation, point 4), no frontend, no external API, no new dependency. Unit tests cover the schema (shape, `+00:00` suffix, naive rejection, conversion to UTC); integration tests cover the HTTP cycle (200 and shape, per-request freshness, 405 on POST); the app-factory unit test gains a registration assertion. UAT artifacts are produced per the toggles.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders no UI)

## Backend Plan
- Endpoints: `GET /api/time` returns the server's current UTC time (`ServerTimeResponse`). Router `APIRouter(prefix="/api", tags=["time"])`, handler `get_time()` declared with `response_model=ServerTimeResponse`, returning `ServerTimeResponse(now=current_utc_time())`. `current_utc_time()` is a module-level function in the router returning `datetime.now(timezone.utc)`; the handler looks it up at call time so a test can monkeypatch `app.routers.server_time.current_utc_time`. No query parameters, no request body.
- Schema: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's aware-datetime type, so a naive value raises `ValidationError` at construction) and `timezone: Literal["UTC"] = "UTC"`. A `@field_serializer("now")` returns `value.astimezone(timezone.utc).isoformat()`, so the JSON value is always UTC with the literal `+00:00` suffix even if handed a non-UTC aware datetime. Module constant `SERIALISED_UTC_OFFSET = "+00:00"`, referenced in the field `description` and the class docstring, states the choice (point 3).
- Service layer: none. Planned deviation from `coding_standards/backend_frontend.md` Section 2.2: the Router, Service, Repository pattern holds business logic and transactional boundaries; reading the system clock is neither, and nothing is persisted (tracker comment point 4, following TEST-06's decision).
- Repository layer: none (no data access).
- Migrations: none.
- App factory: `backend/app/main.py` imports `server_time_router` between the notes and version imports and calls `app.include_router(server_time_router)` after the health registration, before `return app`; the module docstring names FEAT-1. Nothing else in `create_app()` or the CORS middleware changes (`allow_methods` already includes GET).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: none (no query parameters, no body)
- Response: 200, `application/json`, schema `ServerTimeResponse`:

```json
{"now": "2026-11-18T00:48:50.123456+00:00", "timezone": "UTC"}
```

  `now` is ISO 8601, always UTC, always ending `+00:00`, fractional seconds present when non-zero (as `isoformat()` emits them); `timezone` is always the string `UTC`. Any other method on `/api/time` returns FastAPI's standard 405.

## Technology Selection
- Current-time source (`current_utc_time()` in the router): chose the standard library's `datetime.now(timezone.utc)` over any time library or service, because the stdlib returns an aware UTC datetime directly; no installed dependency or new one is needed.
- `+00:00` serialisation (`@field_serializer` in `ServerTimeResponse`): chose the stdlib `datetime.isoformat()` inside a Pydantic serializer over Pydantic's default datetime serialisation (installed dependency, emits `Z` for UTC) and over a hand-written format string, because the default does not produce the pinned suffix and `isoformat()` produces it with no formatting code of our own.
- Naive-datetime guard: chose Pydantic's installed `AwareDatetime` type over a hand-rolled validator, because the installed dependency already rejects naive values.
- `ServerTimeResponse` schema and `server_time` router modules: no stdlib call, native platform feature or installed dependency replaces them; they are the feature, built on FastAPI and Pydantic, which the project already installs. No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime`, `timezone: Literal["UTC"]`), `SERIALISED_UTC_OFFSET` constant and the `+00:00` field serializer
- [B] backend/app/routers/server_time.py: `GET /api/time` router with `current_utc_time()` and `get_time()`
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for `ServerTimeResponse` (shape, `+00:00` suffix, naive rejection, conversion of a non-UTC aware value to UTC, `timezone` literal)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time` (200 and shape, per-request freshness, request-time window, 405 on POST, OpenAPI response schema)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import `server_time_router` and register it after `health_router`; docstring names FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`

No lockfile entry: the feature adds no dependency, so neither `backend/pyproject.toml` nor `backend/uv.lock` changes. No `README.md` or `docs/DEVELOPMENT.md` entry: the feature changes no project structure, run configuration, dependency or test infrastructure. No E2E spec: no criterion needs browser navigation or interaction (see `### Criterion coverage`).

## Testing Strategy
- Unit tests: `ServerTimeResponse` in isolation, with fixed datetimes (no clock, no HTTP): the JSON shape has exactly the keys `now` and `timezone`; `now` ends with `+00:00` and not `Z`; a naive datetime raises `ValidationError`; an aware non-UTC datetime (for example `2026-11-18T02:00:00+02:00`) serialises as `2026-11-18T00:00:00+00:00`; `timezone` is `UTC`. Plus one app-factory assertion that `/api/time` is registered.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_server_time_unit.py`
- Integration tests: `GET /api/time` through the session-scoped `client` fixture (`backend/tests/conftest.py`; no database needed, the lifespan already tolerates an unset `DATABASE_URL`): 200 with exactly `now` and `timezone`, `now` parses with `datetime.fromisoformat`, has `utcoffset() == timedelta(0)` and ends `+00:00`; freshness by monkeypatching `app.routers.server_time.current_utc_time` to return two different instants one second apart on consecutive calls and asserting the two bodies differ accordingly (deterministic, no sleep); a real-clock test asserting `now` falls between UTC timestamps taken immediately before and after the request (proves it is computed at request time); 405 on `POST /api/time`; the OpenAPI document's 200 response for `/api/time` references `ServerTimeResponse`.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E Tests is ENABLED, but no criterion involves UI navigation or interaction: the item has no frontend.
  - Directory: e2e/tests/
  - File: none (would be `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (POST returns 405), verified against the running API.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | `test_get_time_returns_200_with_now_and_utc_timezone`, `test_post_time_returns_405_method_not_allowed` | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | `now` computed per request, UTC, explicit offset, never naive | Integration + Unit | `test_get_time_computes_now_per_request`, `test_get_time_now_falls_within_request_window`, `test_server_time_response_serialises_now_with_plus_zero_offset`, `test_server_time_response_rejects_naive_datetime`, `test_server_time_response_converts_non_utc_offset_to_utc` | verifying it needs no navigation or interaction: freshness is a router behaviour and the offset is a schema serialisation rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit + Integration | `test_server_time_response_dumps_now_and_timezone_only`, `test_get_time_openapi_declares_server_time_response` | verifying it needs no navigation or interaction: it is a schema definition and the router's declared response model |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit + Integration | `test_server_time_response_dumps_now_and_timezone_only`, `test_server_time_response_serialises_now_with_plus_zero_offset`, `test_get_time_computes_now_per_request`, `test_create_app_registers_server_time_route` | verifying it needs no navigation or interaction: it is a statement about the test suite, met by the unit and integration tests named in rows 1 to 3 |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the API is running, When I request `GET /api/time`, Then the status is 200 and the body has exactly `now` and `timezone` equal to `UTC` |
| 2 | `now` per request, UTC, `+00:00`, never naive | covered at Integration + Unit, see Criterion coverage | Given the API is running, When I request `GET /api/time` twice about a second apart, Then the two `now` values differ and both end in `+00:00` |
| 3 | Body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit + Integration, see Criterion coverage | Given the API is running, When I open the OpenAPI document, Then the 200 response of `/api/time` references `ServerTimeResponse` |
| 4 | Unit and integration tests cover shape, offset, freshness | covered at Unit + Integration, see Criterion coverage | Given the backend test suite, When I run the server-time unit and integration test files, Then the run passes |

## Manual verification plan
This item has no UI. Every criterion is verified against the running API with a browser address bar or a terminal, and criterion 4 by running the tests.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
Prerequisites: the stack is running (`docker compose up -d --build` at the repo root); the backend answers on `http://localhost:8010`.
1. In a browser, open `http://localhost:8010/api/time` → the page shows a JSON object with exactly two keys, `now` and `timezone`.
2. Read `timezone` → its value is the string `UTC`.
3. In a terminal, run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/time` → it prints `200`.
4. Edge case: run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/time` → it prints `405`.

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
Prerequisites: as for criterion 1.
1. Open `http://localhost:8010/api/time` and note the `now` value → it looks like `2026-11-18T00:48:50.123456+00:00` and ends in exactly `+00:00` (not `Z`, and never without an offset).
2. Wait about one second and reload the page → `now` has a later value than in step 1, still ending in `+00:00`.
3. Compare the date and time in `now` with the current UTC time (for example `date -u` in a terminal) → they agree to within a few seconds, which shows the value is UTC and not the machine's local time.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for criterion 1.
1. Open `http://localhost:8010/docs` and expand `GET /api/time` → the 200 response's schema is named `ServerTimeResponse`, with fields `now` (string, date-time) and `timezone`.
2. Open `backend/app/schemas/server_time.py` in the repository → it defines `class ServerTimeResponse(BaseModel)` with the `+00:00` choice stated in the module.
3. Open `backend/app/routers/server_time.py` → the handler declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, not a dict literal.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: a checkout of this branch with `uv` installed; no database is needed for these files.
1. From the repo root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Read the test names in those files → they include the shape test (`test_server_time_response_dumps_now_and_timezone_only`), the offset test (`test_server_time_response_serialises_now_with_plus_zero_offset`) and the freshness test (`test_get_time_computes_now_per_request`).

## Scope changes

- 2026-11-18 Tracker comment point 2 asked to add GET /api/echo?msg={text} (backend/app/routers/echo.py, backend/app/schemas/echo.py, backend/app/main.py) to FEAT-1; not taken on, so no echo files are in the File Manifest. Reason: GET /api/echo is the whole scope of the separate live tracker item TEST-06 (status "to test"), whose criteria are stricter (422 on missing msg, 422 above 200 characters); building it here would duplicate or weaken another item's contract (user_story_alignment.md Section 3), and its premise that TEST-06 is on main no longer holds after sandbox reset 9dcba19b. Flagged for the plan-PR reviewer, who can reverse it by adopting TEST-06's four criteria.
- 2026-11-18 Planned deviation: no service module for GET /api/time (no backend/app/services/server_time_service.py); the clock read lives in backend/app/routers/server_time.py as current_utc_time(). Reason: tracker comment point 4, following TEST-06; coding_standards.md Section 2.2 places business logic and transactional boundaries in the service layer, and reading the system clock is neither.
- 2026-11-18 The offset in criteria 1 and 2 is pinned to the literal suffix +00:00 (stated in backend/app/schemas/server_time.py via SERIALISED_UTC_OFFSET and a field serializer). Reason: tracker comment point 3 asked for it to be pinned; +00:00 is the literal reading of "explicit offset" and is what the stdlib isoformat() emits, whereas Pydantic's default would emit Z.
