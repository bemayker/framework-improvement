# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature: `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> Notes: router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The item's "How the measured run uses this item" block is operator process, not acceptance criteria, and nothing is planned from it.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: verified against `origin/main` (3b33c37). The commit exists and is an ancestor of main (`73e544c feat(TEST-06): Echo endpoint (#35)`, 2026-09-14, `backend/app/main.py | 6 ++++--`), so the premise that it merged is true. It is not true that its registration is still there: `git log -S echo_router origin/main -- backend/app/main.py` shows the echo registration added and removed twelve times since, most recently removed by `9dcba19 chore: reset the sandbox after release run 0.3.443 T8 (#326)`, and the last commit touching `main.py` on main is the reset `f43185e (#478)`. Main's registration block today holds exactly three routers, imported alphabetically on lines 19 to 21 (`health`, `notes`, `version`) and registered on lines 54 to 56 in the order `version_router`, `notes_router`, `health_router`; there is no echo router. Insertion point: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports (keeping them alphabetical), and `app.include_router(server_time_router)` goes after `app.include_router(health_router)` as the last registration, so the edit is two added lines and touches no existing line. The module docstring's list of registering features gains FEAT-1. What changed relative to the comment's picture: nothing of TEST-06 is on main to merge around, so a later TEST-06 build and this item will each add one import and one `include_router` line to the same block (a textual conflict, never a semantic one); the shared risk analysis flags the pair.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {\"echo\": \"<msg>\"} while you are in main.py, so the two registrations land together." → Not acted on because: `GET /api/echo` is the whole scope of TEST-06 ("Echo endpoint"), a separate open item in `feature_map.md` with its own branch, plan and acceptance criteria, and it is not among FEAT-1's acceptance criteria. `user_story_alignment.md` Section 3 bounds this plan to FEAT-1's criteria; folding TEST-06 in would ship TEST-06's work under FEAT-1's ID, leave TEST-06 open in the tracker with its code already merged, and collide with TEST-11 and BUG-05, which change the echo endpoint TEST-06 adds with opposite whitespace rules still unresolved. The comment also assumes in point 1 that the echo router is already on main, which contradicts asking for it here; read together, the request is to land both registrations at once, which serialising the two builds (shared risk analysis) achieves without merging the scopes. If the stakeholder still wants one PR, the route is to move TEST-06's criteria onto this item in the tracker and re-plan, not an unrecorded addition.
- Comment (tracker), point 3: "Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`. Reasons: the criterion says "explicit offset", and `+00:00` is a numeric offset where `Z` is a zone designator; it is what Python's own `datetime.isoformat()` emits for an aware UTC value, so a client comparing against `datetime.fromisoformat` round-trips it on every supported Python. The choice is stated in the schema, not left to Pydantic's default (Pydantic v2's JSON mode writes `Z` for UTC, so the default would silently pick the other answer): `ServerTimeResponse.now` is an `AwareDatetime` with a `field_serializer` that converts to UTC and returns `isoformat()`, and the module carries the constant `UTC_OFFSET_SUFFIX = "+00:00"` with a docstring saying why. Unit and integration tests assert the serialised `now` ends with exactly `+00:00` and does not end with `Z` (Testing Strategy).
- Comment (tracker), point 4: "Do not add a service module for this endpoint ... coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module is planned. Planned deviation, recorded: `coding_standards/backend_frontend.md` Section 2.2 (read for this plan) says the pattern applies "when the project includes a backend with data persistence", puts business logic and transactional boundaries in the Service layer, and forbids business logic in the Router. This endpoint reads the clock and formats it: no persistence, no transaction, no rule beyond formatting, which the schema owns. The clock read lives in the router module as a FastAPI dependency (`utc_now`), so the router function stays a one-line composition and tests replace the clock through `app.dependency_overrides` instead of patching a module. Note that I could not confirm the comment's "decision taken on TEST-06": TEST-06's plan is not on main and I did not read it, so the deviation rests on Section 2.2's own wording, not on that precedent. The same deviation goes into the PR description.

## Plan Overview
Backend only. One new router module (`GET /api/time`), one new Pydantic response schema, one two-line registration in `backend/app/main.py`, and tests at the unit and integration tiers. No service, repository, migration, database access, frontend change, external API or new dependency. The router reads the clock per request through a FastAPI dependency; the schema owns the UTC conversion and the pinned `+00:00` suffix. Module names follow `server_time`, which is the router path `feature_map.md`'s BUG-01 row already expects (`backend/app/routers/server_time.py`).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time in UTC so a client can measure clock skew. Router `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, `@router.get("/time", response_model=ServerTimeResponse)`, same shape as `routers/version.py`. Registered in `backend/app/main.py` after `health_router` (Re-Plan Feedback, point 1).
- Service layer: none, by planned deviation (Re-Plan Feedback, point 4). The router module defines `def utc_now() -> datetime: return datetime.now(UTC)` and the endpoint takes `now: Annotated[datetime, Depends(utc_now)]` and returns `ServerTimeResponse(now=now)`. Because the dependency runs on every request, `now` is computed per request, never at import or startup.
- Schema: `backend/app/schemas/server_time.py`, `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic rejects a naive value with a `ValidationError`, so a naive time can never reach the wire) and `timezone: Literal["UTC"] = "UTC"`. A `@field_serializer("now")` returns `value.astimezone(UTC).isoformat()`, so an aware non-UTC value is still emitted in UTC and the suffix is always `+00:00`. Module constant `UTC_OFFSET_SUFFIX = "+00:00"` documents the pinned choice. `isoformat()` keeps microseconds when non-zero, so the timestamp shape is `YYYY-MM-DDTHH:MM:SS[.ffffff]+00:00`.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query or path parameters.
- Response: 200, `application/json`, body defined by `ServerTimeResponse`:

```json
{"now": "2026-11-02T15:50:05.123456+00:00", "timezone": "UTC"}
```

`now` always ends with `+00:00`, never `Z` and never without an offset. Other methods on the path answer 405 (FastAPI default), which is the only reachable error.

## Technology Selection
- Current time in UTC (`utc_now`): chose the standard library's `datetime.now(UTC)` over any time library, because the stdlib covers an aware UTC timestamp completely.
- Naive-value guard: chose Pydantic's `AwareDatetime` (installed, via FastAPI) over a hand-written validator, because it already rejects naive datetimes.
- Offset serialisation: chose a `field_serializer` calling stdlib `datetime.isoformat()` over Pydantic's default JSON datetime serialisation, because the default writes `Z` and the pinned contract is `+00:00`.
- Clock injection for tests: chose FastAPI's `Depends` with `app.dependency_overrides` (installed) over a service module or monkeypatching, because it is the framework's own substitution point and needs no new layer.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router with the `utc_now` clock dependency
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` schema, `AwareDatetime` field, `+00:00` serializer and `UTC_OFFSET_SUFFIX` constant
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (suffix, UTC conversion, naive rejection, timezone literal) and `utc_now`
- [B] backend/tests/integration/test_server_time_integration.py: router tests through the HTTP cycle (200 shape, suffix, per-request freshness, 405)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual UAT script

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the `notes` and `version` imports, `app.include_router(server_time_router)` after `health_router`, FEAT-1 added to the module docstring
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom routes

No lockfile change applies: no dependency is added or changed, so `backend/uv.lock` and `frontend/package-lock.json` stay untouched. No `README.md` or `docs/DEVELOPMENT.md` change applies: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file keeps an endpoint catalogue to extend.

## Testing Strategy
- Unit tests: `ServerTimeResponse` and `utc_now`, no HTTP, no database. Happy path: a UTC-aware value serialises (`model_dump(mode="json")`) to a string ending in exactly `+00:00`, not `Z`, and `timezone` is `"UTC"`. Edge cases: an aware non-UTC value (e.g. `+02:00`) serialises to the same instant in UTC with `+00:00`; a value with zero microseconds still carries the offset. Error case: a naive `datetime` raises `pydantic.ValidationError`. `utc_now()` returns a datetime whose `utcoffset()` is `timedelta(0)`. Plus the route-registration test in `test_main_unit.py`.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` (`test_server_time_unit.py`, and the existing `test_main_unit.py`)
- Integration tests: `GET /api/time` through the real HTTP cycle with the session `client` fixture (no database needed). Shape: status 200 and the JSON keys are exactly `{"now", "timezone"}` with `timezone == "UTC"`. Offset: `now` matches `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?\+00:00$` and `datetime.fromisoformat(now).utcoffset() == timedelta(0)`. Freshness, deterministic: a fresh `create_app()` with `app.dependency_overrides[utc_now]` returning two instants one second apart; two requests return two different `now` values exactly one second apart (no sleep). Freshness, real clock: `now` lies between UTC timestamps taken immediately before and after the request, which fails if the time were computed once at import or startup. Error case: `POST /api/time` returns 405.
  - Directory: `backend/tests/integration/`
- E2E tests: not warranted. No criterion involves navigation or interaction through a UI: the feature adds no frontend, and a browser test calling the API directly is a router integration test (`testing_standards.md` Section 5), so every criterion is covered at integration or unit level.
  - Directory: `e2e/tests/` (no spec written for this item)
  - File: none (`FEAT-1_server_time_endpoint.spec.ts` would be the name; not produced)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a second request a second later returns a later `now`), and the manual script, both from the Manual verification plan below.
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | No UI exists for it: it is a router response, verified through the HTTP cycle |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration and Unit | No navigation or interaction: freshness and offset are router and schema behaviour; naive rejection is a schema validation rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | No navigation or interaction: it is a structural property, verified by serialising `ServerTimeResponse` directly and by the router's `response_model` |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit and Integration | It is a statement about the test suite itself, satisfied by the two test files above and checked by running them |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` = "UTC" |
| 2 | `now` per request, UTC, explicit offset | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client sends GET /api/time twice a second apart, Then the two `now` values differ and both end with "+00:00" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API's OpenAPI document, When a reviewer looks up GET /api/time, Then its 200 response references the `ServerTimeResponse` schema |
| 4 | Tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the server time unit and integration tests run, Then 0 tests fail |

## Manual verification plan
This item has no UI, so every criterion is verified against the running API or the test suite. Prerequisites for all blocks: the stack is running (`docker compose up -d` from the repository root) and the backend answers on its published port; the steps write it as `http://localhost:8000`, substitute the port your compose file publishes.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
Prerequisites: backend running, a terminal with `curl`.
1. Run `curl -i http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it has exactly two keys, for example `{"now":"2026-11-02T15:50:05.123456+00:00","timezone":"UTC"}`; `timezone` is the string `UTC`.
3. Run `curl -i -X POST http://localhost:8000/api/time` → status `405 Method Not Allowed`.

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
Prerequisites: backend running, a terminal with `curl`.
1. Run `curl -s http://localhost:8000/api/time` → note the `now` value; it ends with exactly `+00:00` (not `Z`, and not without an offset).
2. Wait about one second and run the same command again → the new `now` is later than the first by roughly one second and also ends with `+00:00`.
3. Compare the hour in `now` with `date -u` in the same terminal → they agree, which shows the value is UTC and not the server's local time.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Not verifiable through a UI. Observable check:
1. Open `http://localhost:8000/docs` in a browser and expand `GET /api/time` → the 200 response schema is named `ServerTimeResponse`, with fields `now` (string, date-time) and `timezone`.
2. Open `backend/app/schemas/server_time.py` → it defines `ServerTimeResponse`, and `backend/app/routers/server_time.py` declares `response_model=ServerTimeResponse` and returns no bare dict.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Not verifiable through a UI. Observable check:
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → it contains a test asserting the exact `+00:00` suffix, a test asserting the response keys, and a test asserting two requests return different `now` values.
