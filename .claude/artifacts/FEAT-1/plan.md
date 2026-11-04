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
> (The feature text's "How the measured run uses this item" block is operator instructions, not part of the feature, and is not planned here.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against the branch, which is `origin/main` at 7d159cd. Commit 73e544c (`feat(TEST-06): Echo endpoint (#35)`, 2026-09-14) is an ancestor of main and did change `backend/app/main.py` (4 insertions, 2 deletions), but it is no longer the state of that file: the last commits touching `backend/app/main.py` are 892a631 (sandbox reset for release run 0.3.478), e0e048f (BUG-01) and 1f1df4f (a reset), and the file as it now stands imports and registers exactly three routers, in this order: `version_router`, `notes_router`, `health_router`, inside `create_app()` after the CORS middleware. There is no echo router on main (`backend/app/routers/` holds `health.py`, `notes.py`, `version.py` only), and no `server_time` router either. What changed for this plan: nothing of TEST-06's registration remains to conflict with, so the insertion point is one new import `from app.routers.server_time import router as server_time_router` after the `version_router` import (alphabetical, matching the existing block) and one `app.include_router(server_time_router)` appended after `app.include_router(health_router)`. The module docstring's registration sentence gains FEAT-1. The serialize-with-other-main.py-items warning in shared_risks.md still stands.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → not acted on because it is a second feature, not a correction of this one: none of FEAT-1's four criteria disagrees with it, so the comment-overrides-description rule does not apply, and `user_story_alignment.md` Section 3 (no gold plating) bounds this plan to FEAT-1's criteria. The echo endpoint is its own work item, TEST-06 ("Echo endpoint", `feature/TEST-06-echo-endpoint`), and two further items, TEST-11 (trims whitespace) and BUG-05 (keeps whitespace), specify contradictory behaviour for that same endpoint and have to be resolved first; building it here would pre-empt all three and ship an echo endpoint with no plan, no criteria and no review of its own. Assumption recorded instead of a blocking question: the stakeholder wants echo delivered, and the route for that is re-opening or building TEST-06, not widening FEAT-1.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`. Reason: the criterion asks for an explicit offset, `+00:00` is a numeric offset where `Z` is a designator, and it is what Python's own `datetime.isoformat()` produces for an aware UTC value. Pydantic 2.13.4 (installed) would otherwise serialise a UTC `datetime` with a `Z` suffix, so the schema does not leave it to the default: `ServerTimeResponse.now` is an `AwareDatetime` (naive values rejected) with a `field_serializer` that converts to UTC and returns `isoformat()`, and the schema's docstring and a module constant `UTC_OFFSET_SUFFIX = "+00:00"` state the choice. Unit and integration tests assert `now.endswith("+00:00")` exactly, and that it does not end with `Z`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module; the router reads the clock through a one-line module-level function `utc_now()` in `backend/app/routers/server_time.py` (a seam the tests patch). Recorded as a planned deviation under `## Backend Plan`. Note: TEST-06's code is not on main, so the "decision taken on TEST-06" could not be read; the deviation rests on `coding_standards.md` Section 2.2 itself (business logic in the Service, transactional boundaries there, nothing for this endpoint), not on TEST-06.
- Comment (tracker), 23 framework-posted "Plan PR opened for FEAT-1: {url}" notices from earlier sandbox states → not acted on because they ask for nothing; each referenced plan PR was closed by a sandbox reset.

## Plan Overview
One backend endpoint, `GET /api/time`, with no database, no configuration and no frontend. Three net-new backend files (router, schema, and their tests) plus the router registration in `backend/app/main.py` and one route-registration test in the existing `backend/tests/unit/test_main_unit.py`. The router answers with a `ServerTimeResponse` Pydantic model whose `now` is an aware UTC `datetime` serialised with a pinned `+00:00` suffix and whose `timezone` is the literal `"UTC"`. The clock is read per request through `utc_now()`, so freshness is a property of the handler, not of startup.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/time` returns 200 with `ServerTimeResponse`; registered in `backend/app/main.py` via `app.include_router(server_time_router)` after `health_router` (insertion point re-checked against main at 7d159cd, see Re-Plan Feedback point 1). The router uses `APIRouter(prefix="/api", tags=["time"])` like `routers/version.py` and `routers/health.py`, with `response_model=ServerTimeResponse`. Any non-GET method answers 405 (FastAPI's default), which is the endpoint's only error case.
- Router module `backend/app/routers/server_time.py`: `def utc_now() -> datetime: return datetime.now(UTC)` (stdlib `datetime.UTC`), and `def get_server_time() -> ServerTimeResponse: return ServerTimeResponse(now=utc_now(), timezone="UTC")`. The handler calls `utc_now()` on every request; nothing is cached at module or app level.
- Schema module `backend/app/schemas/server_time.py`: `UTC_OFFSET_SUFFIX = "+00:00"`; `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` and `timezone: Literal["UTC"]`, plus `@field_serializer("now")` returning `value.astimezone(UTC).isoformat()` so the wire value always ends in `+00:00` (never `Z`, never naive). The class docstring states the `+00:00` choice and why.
- Service layer: none. **Planned deviation from `coding_standards.md` Section 2.2** (Router → Service → Repository): that pattern places business logic and transactional boundaries in the Service, and this endpoint has neither, it reads the system clock and wraps it in a schema. A service module holding one `datetime.now(UTC)` call would add a layer with nothing in it. Requested by the tracker comment, point 4. The PR description lists this deviation.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `application/json`, body `{"now": "2026-11-04T19:05:12.345678+00:00", "timezone": "UTC"}`. `now` is ISO 8601, always in UTC, always ending in the explicit offset `+00:00`, with microsecond precision when the clock supplies it. `timezone` is always the string `UTC`. Any other method on `/api/time` returns 405.

## Technology Selection
- Current time in UTC (`utc_now()` in the router): chose the standard library `datetime.now(datetime.UTC)` over adding a time library (pendulum, arrow), because the stdlib returns an aware UTC value directly and nothing more is needed.
- ISO 8601 serialisation with `+00:00`: chose the standard library `datetime.isoformat()` inside a Pydantic `field_serializer` over Pydantic's default `datetime` serialisation, because the installed Pydantic (2.13.4) emits `Z` for UTC and the comment pins `+00:00`.
- Naive-datetime rejection: chose the installed Pydantic's `AwareDatetime` type over a hand-written validator, because it already rejects naive values.
- Response schema `ServerTimeResponse`: chose a Pydantic `BaseModel` (installed with FastAPI) over a bare dict, as criterion 3 requires; no alternative rung applies.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` (`now: AwareDatetime` serialised with `+00:00`, `timezone: Literal["UTC"]`) and `UTC_OFFSET_SUFFIX`
- [B] backend/app/routers/server_time.py: `utc_now()` clock seam and the `GET /api/time` handler returning `ServerTimeResponse`
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema serialisation (shape, `+00:00` suffix, naive rejection, non-UTC input converted) and the handler's per-call clock read with `utc_now` patched
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time` (200 and shape, exact `+00:00` suffix, per-request freshness, 405 on POST)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import `server_time_router` and register it with `app.include_router(server_time_router)` after `health_router`; add FEAT-1 to the module docstring's registration sentence
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom routes

No dependency changes, so no lockfile (`backend/uv.lock`) is regenerated.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints.

## Testing Strategy
- Unit tests: `ServerTimeResponse` serialisation and the router handler with the clock patched. Schema: a UTC value dumps (`model_dump(mode="json")`) to exactly `{"now": "...+00:00", "timezone": "UTC"}` (happy path); a non-UTC aware value (for example `+02:00`) is converted and dumped with `+00:00` and the correct UTC instant (edge case); a naive `datetime` raises `ValidationError` and a `timezone` other than `"UTC"` raises `ValidationError` (error cases); the dumped `now` ends with `+00:00` and not with `Z`. Handler: with `utc_now` monkeypatched to return two distinct instants one second apart, two calls to `get_server_time()` return those two instants (proves the clock is read per call); `utc_now()` itself returns an aware value whose `utcoffset()` is zero. Plus `test_create_app_registers_server_time_route` in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (here `test_server_time_unit.py`)
- Integration tests: `GET /api/time` through the session `client` fixture: 200, body keys exactly `{"now", "timezone"}`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with zero offset and the string ends with exactly `+00:00`; freshness, with `app.routers.server_time.utc_now` monkeypatched to return two instants one second apart, two consecutive requests return two different `now` values matching them; real-clock freshness, the `now` of a real request lies between test-side `datetime.now(UTC)` readings taken just before and just after it (proves it is computed at request time, not at startup); `POST /api/time` returns 405. No database needed: the tests do not use `database_url`. No fixed sleeps.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion involves navigation or interaction through the UI (there is no frontend change), so per `testing_standards.md` Section 6 every criterion is covered at unit or integration level, recorded per criterion below. No file under e2e/tests/ is created.
  - Directory: e2e/tests/
  - File: none (would be e2e/tests/FEAT-1_server_time_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), verified against the HTTP API, since the feature has no UI.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}` | Integration | verifying it needs no navigation or interaction: it is a router response over the real HTTP cycle, and there is no UI for it |
| 2 | `now` is computed per request, serialised in UTC with an explicit offset, never naive | Unit and Integration | verifying it needs no navigation or interaction: freshness is the handler reading the clock per call (unit, patched clock; integration, patched and real clock), the offset is a schema serialisation rule |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a schema definition, checked by validating and dumping `ServerTimeResponse` directly, and by the review against the router |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests above existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the status is 200 and the body has `now` and `timezone` equal to "UTC" |
| 2 | `now` is fresh per request, UTC, explicit offset | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time twice a second apart, Then the two `now` values differ and each ends with "+00:00" |
| 3 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the API's OpenAPI document, When the /api/time GET response is inspected, Then it references the ServerTimeResponse schema |
| 4 | Tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the FEAT-1 unit and integration tests run, Then 0 fail |

## Manual verification plan
Criterion 1 to 3 cannot be verified through the UI: there is no frontend change. The observable check is the HTTP response, read with curl against the running backend.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
Prerequisites: the stack is running (`docker compose up -d` from the repository root) and the backend answers on its published host port (8010, as `docker-compose.yml` publishes it; a handover rebuild on free ports may publish another, read it with `docker compose port backend 8010`).
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is a JSON object with exactly two keys, `now` (for example `"2026-11-04T19:05:12.345678+00:00"`) and `timezone` with the value `"UTC"`.

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/time`, wait about one second, then run the same command again → two bodies.
2. Compare the two `now` values → they differ, and the second is about one second later than the first.
3. Read the end of each `now` value → each ends with exactly `+00:00` (not `Z`, and never without an offset).
4. Compare the hour of `now` with the current UTC time (`date -u` in the terminal) → they match to within a few seconds, whatever the machine's local time zone.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/openapi.json` and find the `/api/time` path → its `get` 200 response references `#/components/schemas/ServerTimeResponse`.
2. Open `backend/app/schemas/server_time.py` → it defines `ServerTimeResponse` with `now` and `timezone`, and its docstring states the `+00:00` choice; `backend/app/routers/server_time.py` returns that model, not a dict.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: `uv` installed; no database is needed for these tests.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the run ends with `0 failed` (no failures reported).
2. Open `backend/tests/integration/test_server_time_integration.py` → it contains tests asserting the body shape, the exact `+00:00` suffix, and two requests returning different `now` values.
