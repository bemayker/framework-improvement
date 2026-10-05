# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> **What.** `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> **Notes.** Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (ClickUp task 123k99ctzxk. The description's measured-run preamble and its "How the measured run uses this item" operator block are instructions about measuring the framework, not part of the feature, and nothing is planned from them.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
One tracker comment carried four numbered points; one line per point. A tracker comment overrides the description where the two disagree; none of the four contradicts the acceptance criteria except point 2, which adds scope (see its line).

- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-derived against `origin/main` at `9e8d3ae`. The commit and PR the comment names are stale (the sandbox was reset); on current main TEST-06 landed as `da0ef8f` (PR #88, `main.py` +3/-1: echo import and `include_router(echo_router)`) and TEST-07 as `9e8d3ae` (PR #90, `main.py` +9/-1: uptime import, `include_router(uptime_router)`, and a `lifespan` line `app.state.process_start = uptime_service.capture_process_start()`). As main stands, imports are alphabetical (echo, health, notes, uptime, version) and `create_app()` registers in landing order (version, notes, health, echo, uptime). This plan therefore inserts the import `from app.routers.server_time import router as server_time_router` between the `notes` and `uptime` imports (alphabetical), appends `app.include_router(server_time_router)` after `app.include_router(uptime_router)` as the last registration, and adds FEAT-1 to the module docstring's list. The `lifespan` function and CORS middleware are untouched.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on because `GET /api/echo` already exists on main (`backend/app/routers/echo.py`, schema `backend/app/schemas/echo.py`, registered in `main.py` by TEST-06, `da0ef8f`). Adding it here would register a duplicate route, and it is outside FEAT-1's acceptance criteria (`user_story_alignment.md` Section 3). If a change to echo is wanted, it belongs to its own item (TEST-11 already covers echo trimming).
- Comment (tracker), point 3: "Pin the offset now ... decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is pinned to `+00:00`, never `Z`. Chosen because it is the established project convention (`backend/app/schemas/uptime.py` serialises `started_at` with `+00:00`, overriding Pydantic's default `Z`), and because `datetime.fromisoformat` and `datetime.isoformat` round-trip it natively. The schema states it in a `field_serializer` docstring and a module constant `UTC_OFFSET_SUFFIX = "+00:00"`; a unit test asserts the serialised value ends with exactly `+00:00` and contains no `Z`, and the integration test asserts the same suffix on the HTTP body.
- Comment (tracker), point 4: "Do not add a service module for this endpoint ... coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module and no repository. **Planned deviation from `coding_standards.md` Section 2.2:** Section 2.2 says Service contains business logic and applies transactional boundaries; the handler here reads `datetime.now(timezone.utc)` and wraps it in the response schema, which is neither business logic nor a transaction, so the router calls the clock directly, matching the TEST-06 echo router (no service). Recorded here and to be repeated in the build PR's description.

Merged-since: n/a (fresh plan, branch freshly created from `origin/main` at `9e8d3ae`; no `[merged-since]` lines).

## Plan Overview
One backend endpoint, no frontend, no database, no external integration. A new router `backend/app/routers/server_time.py` exposes `GET /api/time`; a new schema `backend/app/schemas/server_time.py` defines the response (`now` as an aware datetime serialised in UTC with `+00:00`, `timezone` fixed to `"UTC"`); `backend/app/main.py` imports and registers the router. Unit tests cover the schema and handler; integration tests cover the HTTP cycle, the suffix and per-request freshness; `test_main_unit.py` gains the route-registration assertion its siblings carry.

Module name `server_time` (not `time`): it avoids a module named like the stdlib `time`, which the test files import, and it is the file name the feature map's BUG-01 row already expects ("BUG-01 edits only `server_time.py`").

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time per request. `APIRouter(prefix="/api", tags=["time"])`, `@router.get("/time", response_model=ServerTimeResponse)`, sync handler `get_server_time() -> ServerTimeResponse` returning `ServerTimeResponse(now=datetime.now(timezone.utc))`.
- Schema: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (rejects naive datetimes at construction) and `timezone: Literal["UTC"] = "UTC"`; a `field_serializer("now")` returning `value.astimezone(timezone.utc).isoformat()` so the wire value is always UTC with the `+00:00` suffix, whatever offset the datetime carried.
- Service layer: none, by planned deviation (Re-Plan Feedback, point 4).
- Repository layer: none (no persistence).
- Migrations: none.
- Registration in `backend/app/main.py`: import placed between `notes` and `uptime` imports; `app.include_router(server_time_router)` appended after `app.include_router(uptime_router)`; module docstring gains "FEAT-1 the server time router".

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no parameters, no body.
- Response: 200, `application/json`, exactly two keys:

```json
{"now": "2026-10-05T14:36:55.123456+00:00", "timezone": "UTC"}
```

- `now`: ISO 8601, always UTC, always ending in `+00:00` (never `Z`, never naive); microseconds present whenever non-zero, as `datetime.isoformat` emits them.
- `timezone`: always the literal string `UTC`.
- Other methods: `POST /api/time` returns 405 (FastAPI default for a GET-only route).

## Technology Selection
- Current-time source: chose the standard library's `datetime.now(timezone.utc)` over any time library or a service wrapper; the stdlib covers an aware UTC timestamp completely, and no new dependency is added.
- Offset serialisation: chose Pydantic's `field_serializer` with stdlib `datetime.isoformat` (both already installed; the exact pattern `backend/app/schemas/uptime.py` uses) over a custom JSON encoder or string formatting; it pins `+00:00` in one place, the schema.
- Naive-datetime guard: chose Pydantic's built-in `AwareDatetime` type (installed) over a hand-written validator.
- Fixed `timezone` field: chose `typing.Literal["UTC"]` (stdlib) over an enum or a free string.
- Router and schema modules: no stdlib call, native platform feature or installed dependency replaces an endpoint; they are built here on FastAPI and Pydantic, both already installed.
- No new dependency is introduced, so no dependency manifest or lockfile changes.

## File Manifest
<!-- Phase tags per plan-feature Section 8's template. -->
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime`, `timezone: Literal["UTC"]`), `UTC_OFFSET_SUFFIX = "+00:00"` constant, `field_serializer` pinning the `+00:00` suffix.
- [B] backend/app/routers/server_time.py: `APIRouter(prefix="/api", tags=["time"])` with `GET /time` returning `ServerTimeResponse(now=datetime.now(timezone.utc))`.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (shape, `+00:00` suffix, non-UTC input converted, naive rejected, `timezone` other than `UTC` rejected) and the handler (returns schema, aware UTC `now`, two calls differ).
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests (200 and exact key set, `timezone` is `UTC`, `now` ends `+00:00` and parses with zero offset, `now` is within the request window, two requests differ and increase, `POST` returns 405).
- [G] e2e/uat/scenarios/FEAT-1_server-time-endpoint.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/FEAT-1_server-time-endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: add `from app.routers.server_time import router as server_time_router` between the `notes` and `uptime` imports; append `app.include_router(server_time_router)` after `app.include_router(uptime_router)`; add FEAT-1 to the module docstring's router list. `lifespan` and middleware unchanged.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the custom routes, matching the echo and uptime siblings.

No `[D]` entries: no acceptance criterion is assigned to E2E (see Criterion coverage), so no Playwright spec is planned.
No lockfile changes: no dependency is added or changed.
No `README.md` or `docs/DEVELOPMENT.md` changes: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists individual endpoints.

## Testing Strategy
- Unit tests: `ServerTimeResponse` serialisation and validation; `get_server_time` handler called directly (no HTTP).
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py`, so `test_server_time_unit.py`; route registration in the existing `test_main_unit.py`.
  - Cases: happy path (dump has exactly `now` and `timezone`, `timezone == "UTC"`); edge (a `+02:00` input serialises converted to UTC with `+00:00`; the suffix is exactly `+00:00` and the string contains no `Z`); error (naive `now` raises `ValidationError`; `timezone="CET"` raises `ValidationError`); freshness (two handler calls separated by `time.sleep(0.01)` give a strictly later second `now`; both are aware with zero `utcoffset()`).
- Integration tests: full HTTP cycle through the session-scoped `client` fixture in `backend/tests/conftest.py`; no database needed, so no database fixture is used.
  - Directory: `backend/tests/integration/`, file `test_server_time_integration.py`.
  - Cases: 200 with exactly the keys `now` and `timezone`; `timezone == "UTC"`; `now` ends with `+00:00`, does not end with `Z`, and `datetime.fromisoformat(now).utcoffset() == timedelta(0)`; `now` lies between UTC timestamps taken immediately before and after the request; two requests separated by `time.sleep(0.05)` return different `now` values and the second is later; `POST /api/time` returns 405.
- E2E tests: none planned. E2E Tests are ENABLED, but no criterion requires navigation or interaction through the UI (this endpoint has no screen), so per `testing_standards.md` Section 4 and Section 6 no browser spec is warranted. Testing the endpoint through Playwright's request API would bypass the UI, which Section 5 names as an integration test, not E2E.
  - Directory: `e2e/tests/` (no file for this feature).
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a non-GET method is rejected), validated for well-formedness, not executed.
  - Directory: `e2e/uat/scenarios/`, script in `e2e/uat/scripts/`.

Assumption (recorded, not blocking): criterion 2's "two calls a second apart differ" is tested with a short sleep (10 ms unit, 50 ms integration) rather than a full second. `now` carries microsecond precision, so a shorter interval proves the same property and keeps the suite fast, as the TEST-07 uptime tests do. The manual verification plan uses the full one-second gap.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour over the HTTP cycle, which the integration tier exercises directly. |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration and Unit | No UI is involved: freshness and the `+00:00` suffix are observable on the HTTP body (integration) and on the schema and handler (unit). |
| 3 | Body defined by a Pydantic schema in `backend/app/schemas/` | Unit | It is a structural property of the code: the unit test asserts the handler returns a `ServerTimeResponse` instance and the schema validates and serialises; the review checks the router builds no bare dict. |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit and Integration | It is satisfied by the two test files themselves, which the test gate executes; no browser is involved. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone`, with `timezone` equal to `UTC` |
| 2 | Per request, UTC, explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/time twice one second apart, Then the two `now` values differ, the second is later, and each ends with `+00:00` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API docs at /docs, When I open GET /api/time, Then the 200 response is documented by the `ServerTimeResponse` schema with fields `now` and `timezone` |
| 4 | Tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When I run the server-time unit and integration tests, Then they all pass |
| Edge | Non-GET method rejected | covered at Integration | Given the backend is running, When I send POST /api/time, Then the status is 405 |

## Manual verification plan
This endpoint has no screen in the app, so every check runs against the backend directly: in a browser's address bar, with `curl`, and in FastAPI's interactive docs. The backend answers on `http://localhost:8010` in the Docker Compose stack (the port the TEST-07 UAT script uses).

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone: "UTC"`
Prerequisites: the stack is up (`docker compose up -d --build` at the repository root) and `http://localhost:8010/api/version` answers with a `version` value.
1. In a browser, open `http://localhost:8010/api/time` → a JSON object with exactly two keys, for example `{"now": "2026-10-05T14:36:55.123456+00:00", "timezone": "UTC"}`.
2. In a terminal, run `curl -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
3. Read the `timezone` value in that body → it is exactly `UTC`.

### Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive
Prerequisites: as Criterion 1.
1. In a terminal, run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two lines, each a JSON object.
2. Compare the two `now` values → they differ, and the second is about one second later than the first.
3. Read the end of each `now` value → each ends with exactly `+00:00`; neither ends with `Z`, and neither has no offset at all.
4. Compare the date and time of `now` with the current UTC time (for example, run `date -u` in the same terminal) → they match to within a few seconds, so the value is UTC and not local time.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. In a browser, open `http://localhost:8010/docs` and expand `GET /api/time` → the 200 response shows a schema named `ServerTimeResponse` with the fields `now` (string, date-time) and `timezone`.
2. Click "Try it out", then "Execute" → "Server response" shows Code `200` and a body with the same two keys.
3. Open `backend/app/routers/server_time.py` in the repository → the handler returns `ServerTimeResponse(...)` and builds no dict literal; `ServerTimeResponse` is imported from `app.schemas.server_time`.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Not verifiable through a UI: the observable check is the test run.
1. In a terminal at the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py` → every test passes, none is skipped (these tests need no database), and the summary line reports at least one test per file.
2. Open the two test files → each has at least one test asserting the key set, one asserting the `+00:00` suffix, and one asserting that two calls return different `now` values.

### Edge case: a non-GET method is rejected
Prerequisites: as Criterion 1.
1. In a terminal, run `curl -i -X POST http://localhost:8010/api/time` → the first line reads `HTTP/1.1 405 Method Not Allowed`.
