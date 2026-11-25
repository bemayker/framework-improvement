# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature created 2026-09-07 for **measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010)**. It exists to **overlap** a commit that will land on `main` during the run, not to be independent of it: it registers a router in `backend/app/main.py`, the file TEST-06 and TEST-07 also change.
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
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The item's "How the measured run uses this item" block is operator instructions, not part of the feature, and is not planned.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker, 2026-09-14), point 1, "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against `origin/main` at `6c3179ea`. Commit `73e544c8` (feat(TEST-06): Echo endpoint, #35) is in main's history, but its effect on the tree is gone: later sandbox resets removed it (the last main commit touching `backend/app/routers/echo.py` is the reset `9dcba19b`, #326, and `backend/app/main.py` was last changed by the reset `c1c4a83c`, #1001). Today `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, there is no `echo.py` or `schemas/echo.py`, and `create_app()` registers exactly `version_router`, `notes_router`, `health_router`, in that order, after the CORS middleware. TEST-06 itself is `to test` in the tracker (in review, not on main). What changed versus the comment's premise: there is no echo registration to sit beside. Insertion point: one import `from app.routers.server_time import router as server_time_router` after the `health_router` import (line 20), and one `app.include_router(server_time_router)` after `app.include_router(health_router)` (line 58). The module docstring's list of registering features gains FEAT-1. Nothing else in `main.py` changes.
- Comment (tracker, 2026-09-14), point 2, "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on, recorded as a scope change under `## Scope changes`. A comment overrides the description where they disagree, but this one does not correct FEAT-1, it adds another item's deliverable: `GET /api/echo` is exactly TEST-06's scope (its own tracker item, currently `to test`, whose branch already carries `backend/app/routers/echo.py`, `backend/app/schemas/echo.py` and their tests). Building it here would put the same paths on two open branches, a guaranteed conflict, and would force a whitespace choice that TEST-11 (trim, cancelled) and BUG-05 (trim, complete in the tracker but its fix absent from main) specify against TEST-06's code. The comment's own rationale ("so the two registrations land together") rests on point 1's premise that TEST-06's registration is already on main, which is not true today. `user_story_alignment.md` Section 3 keeps FEAT-1 bounded to its criteria. **The plan PR reviewer is asked to confirm:** echo stays with TEST-06 and is not added to FEAT-1. If the reviewer wants it here instead, a re-plan adds it as a fifth criterion with TEST-06's four criteria copied verbatim and TEST-06 closed as superseded.
- Comment (tracker, 2026-09-14), point 3, "Pin it now ... decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is pinned to `+00:00`. Reason: the criterion asks for an "explicit offset", and `+00:00` is a numeric offset where `Z` is a zone designator; it is also what Python's `datetime.isoformat()` emits for UTC. Pydantic 2.13 (installed, `backend/uv.lock`) serialises a UTC datetime with `Z` by default, so the choice must be stated in the schema: `ServerTimeResponse.now` is an `AwareDatetime` with a `field_serializer` that converts to UTC and returns `isoformat()`, and the schema's docstring names the `+00:00` suffix. Tests `test_server_time_response_serialises_now_with_plus_00_00_suffix` (unit) and `test_get_time_now_ends_with_plus_00_00_offset` (integration) assert the exact suffix, and that `Z` is absent.
- Comment (tracker, 2026-09-14), point 4, "Do not add a service module for this endpoint ... Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/` module is planned; the router reads the clock directly with `datetime.now(timezone.utc)`. Planned deviation from `coding_standards.md` Section 2.2 (Router, Service, Repository): that pattern is stated for a backend with data persistence and puts business logic and transactional boundaries in the service; reading the system clock is neither, and there is no repository. This matches the TEST-06 shape the feature's Notes name (TEST-06's file list is a router and a schema, no service). Recorded under `## Backend Plan` and `## Scope changes`.
- Other tracker comments (37 framework "Plan PR opened for FEAT-1" link comments, PRs #36 to #983, all closed; one earlier autonomous answer to the four points, PR #36) → not acted on: they describe plans against earlier states of main, which has been reset since. Every point above was re-verified against `6c3179ea`.
- Merged since the last plan: n/a (fresh plan, branched from current main `6c3179ea`; no earlier plan on this branch).

## Plan Overview
Backend-only. One new read-only endpoint, `GET /api/time`, in a new router `backend/app/routers/server_time.py` with its response schema in `backend/app/schemas/server_time.py`, registered in `backend/app/main.py`'s `create_app()` after the health router. No service, repository, migration, configuration or dependency change, and no frontend work. Tests: unit (schema serialisation, per-call clock read, route registration) and integration (full HTTP cycle through `TestClient`). No E2E spec, because no criterion involves UI navigation or interaction.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time; the router is `APIRouter(prefix="/api", tags=["time"])`, the route is `@router.get("/time", response_model=ServerTimeResponse)`, mirroring `backend/app/routers/version.py`.
- Service layer: none, a planned deviation from `coding_standards.md` Section 2.2 (tracker comment point 4): the handler builds `ServerTimeResponse(now=datetime.now(timezone.utc))`. The clock is read inside the handler on every call (never at import time, never cached), which is what makes `now` per request. No `Cache-Control` header is added: not in the criteria (BUG-01 is the downstream item about edge caching).
- Schema: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (pydantic rejects a naive datetime at construction) and `timezone: Literal["UTC"] = "UTC"`; a `@field_serializer("now")` returns `now.astimezone(timezone.utc).isoformat()`, so the JSON value always ends in `+00:00` even if an aware non-UTC datetime is passed. The docstring states the `+00:00` choice and why `Z` is not used.
- Repository layer: none (no persistence).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters
- Response: 200, `application/json`:

```json
{"now": "2026-11-25T03:14:15.926535+00:00", "timezone": "UTC"}
```

`now` is ISO 8601, always UTC, always suffixed `+00:00` (never `Z`, never naive); microseconds appear when non-zero, as `isoformat()` emits them. Any other method on `/api/time` returns 405 (FastAPI default).

## Technology Selection
- Current time source: chose the standard library's `datetime.now(timezone.utc)` over any third-party time library (`pendulum`, `arrow`), because the stdlib covers an aware UTC timestamp completely.
- Naive-datetime rejection: chose the installed pydantic's `AwareDatetime` type over a hand-written validator, because pydantic 2.13 (already a dependency) provides it.
- `+00:00` serialisation: chose pydantic's `field_serializer` plus stdlib `isoformat()` over a custom JSON encoder or response class, because it states the choice in the schema itself, as tracker comment point 3 asks.
- Service module: none built (tracker comment point 4); the router calls the stdlib directly.
- No new dependency, so no lockfile change.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, `now: AwareDatetime` serialised with a `+00:00` suffix, `timezone: Literal["UTC"]`
- [B] backend/app/routers/server_time.py: `GET /api/time` router reading the clock per request
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema serialisation, naive rejection, non-UTC conversion and the per-call clock read
- [B] backend/tests/integration/test_server_time_integration.py: integration tests for the HTTP cycle, the exact suffix, freshness across calls a second apart, and 405 on POST
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import `server_time_router` after the health import and `app.include_router(server_time_router)` after the health registration; docstring names FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the custom routes

No dependency changes, so no lockfile is touched.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: schema serialisation (`+00:00` suffix, no `Z`, `timezone` literal), naive-datetime rejection, conversion of an aware non-UTC value to UTC, the handler reading the clock on each call (the router module's `datetime` is monkeypatched with a stub returning two different instants, so no sleep is needed), and route registration in `create_app()`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_unit.py`; registration test added to the existing `test_main_unit.py`)
- Integration tests: `GET /api/time` through the session `client` fixture from `backend/tests/conftest.py`: 200 with exactly the two keys, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with `utcoffset() == timedelta(0)` and ends with `+00:00`; two calls separated by `time.sleep(1)` return strictly increasing `now` values at least one second apart; `POST /api/time` returns 405. No database is needed (the endpoint must answer with `DATABASE_URL` unset, as the version endpoint does).
  - Directory: backend/tests/integration/
- E2E tests: no spec. E2E is ENABLED, but no criterion requires navigation or interaction through the UI (there is no frontend change), so per `testing_standards.md` Section 6 each criterion is covered at unit or integration level.
  - Directory: e2e/tests/ (unused by this feature)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), verified against the API.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | `test_get_time_returns_200_with_now_and_utc_timezone` | verifying it needs no navigation or interaction: it is a router response over HTTP |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Unit + Integration | `test_get_server_time_reads_clock_on_every_call`, `test_server_time_response_rejects_naive_datetime`, `test_server_time_response_converts_non_utc_offset_to_utc`, `test_get_time_two_calls_a_second_apart_differ`, `test_get_time_now_ends_with_plus_00_00_offset` | verifying it needs no navigation or interaction: it is a schema rule and a router behaviour |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_server_time_response_serialises_now_with_plus_00_00_suffix`, `test_get_server_time_returns_server_time_response` | verifying it needs no navigation or interaction: it is a code-structure property checked on the handler's return type |
| 4 | Unit and integration tests cover the shape, the offset and the freshness | Unit + Integration | `test_server_time_response_serialises_now_with_plus_00_00_suffix`, `test_get_server_time_reads_clock_on_every_call`, `test_get_time_returns_200_with_now_and_utc_timezone`, `test_get_time_now_ends_with_plus_00_00_offset`, `test_get_time_two_calls_a_second_apart_differ` | verifying it needs no navigation or interaction: it is satisfied by the named tests existing and passing |

Additional tests outside the criterion map: `test_create_app_registers_time_route` (unit, registration) and `test_post_time_returns_405_method_not_allowed` (integration, the endpoint's only reachable error case).

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` = "UTC" |
| 2 | per-request, UTC, explicit offset | covered at Unit + Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time twice a second apart, Then the two `now` values differ and both end in `+00:00` |
| 3 | Pydantic schema | covered at Unit, see Criterion coverage | Given the backend source, When a reviewer opens backend/app/schemas/server_time.py, Then `ServerTimeResponse` defines `now` and `timezone` and the router returns it |
| 4 | tests cover shape, offset, freshness | covered at Unit + Integration, see Criterion coverage | Given the repository, When the FEAT-1 unit and integration test files run, Then the run passes |

## Manual verification plan
No criterion has a UI; every check below is done against the API on the running stack (`docker compose up -d` from the repository root; the backend publishes port 8010 per `docker-compose.yml`) or by running tests.

### Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`
Prerequisites: the stack is up and `curl http://localhost:8010/api/version` answers 200.
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is a JSON object with exactly two keys, `now` (a timestamp such as `2026-11-25T03:14:15.926535+00:00`) and `timezone` with the value `UTC`.

### Criterion 2: `now` is computed per request, UTC with an explicit offset, never naive
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/time`, wait about one second, and run it again → the two `now` values differ, and the second is about one second later than the first.
2. Look at the end of each `now` value → each ends in `+00:00`; neither ends in `Z` and neither lacks an offset.
3. Compare the time part with `date -u` run in the same terminal → the hour and minute match UTC, not the machine's local time zone.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Not verifiable through a UI; the observable check is the source.
1. Open `backend/app/schemas/server_time.py` → it defines `ServerTimeResponse` with `now` and `timezone`, and its docstring states the `+00:00` choice.
2. Open `backend/app/routers/server_time.py` → the route declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, not a dict.

### Criterion 4: unit and integration tests cover the shape, the offset and the freshness
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py` → the summary line reports no failed or errored test, and the command exits 0.
2. Open both test files → there is a test asserting the body's two keys, one asserting the exact `+00:00` suffix, and one asserting that two calls a second apart differ.

## Scope changes

- 2026-11-25 Tracker comment point 2 (add GET /api/echo?msg={text} in backend/app/main.py, backend/app/routers/echo.py, backend/app/schemas/echo.py) is not taken into FEAT-1; the plan adds no echo files. Reason: the echo endpoint is TEST-06's own scope, open in review (`to test`) with those exact paths on its branch, so building it here duplicates an open item and guarantees a conflict; the plan PR reviewer is asked to confirm.
- 2026-11-25 No service module for GET /api/time; backend/app/routers/server_time.py reads datetime.now(timezone.utc) directly, a planned deviation from coding_standards.md Section 2.2. Reason: tracker comment point 4; reading the clock is neither business logic nor a transactional boundary, and there is no repository, matching the TEST-06 router-plus-schema shape.
- 2026-11-25 The criterion's "explicit offset" is pinned to +00:00 (not Z), stated in backend/app/schemas/server_time.py through a field_serializer and asserted by an exact-suffix test. Reason: tracker comment point 3; +00:00 is a numeric offset and pydantic's default would emit Z.
