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
> - `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> - `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> - The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> - Unit and integration tests cover the shape, the offset and the per-request freshness.
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

The "How the measured run uses this item" block is operator instructions and is not scope: the four acceptance criteria below are the whole of it.

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
The item carries 11 tracker comments and 0 threaded replies. Ten are the framework's own "Plan PR opened for FEAT-1" link comments and one autonomous-run reply from earlier runs of this sandbox, which was since reset (none of that work is on main: there is no `server_time.py` on main at cf617b3); they ask nothing and are not acted on. One comment is actionable, a four-point re-plan request, and a tracker comment overrides the description where the two disagree. Each point is answered below, one line each.

- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." — Addressed by: the insertion point is derived against `origin/main` at cf617b3. Correction of fact: 73e544c (PR #35) is still in main's ancestry, but its edit to `backend/app/main.py` was superseded by two sandbox resets; the registration block as it now stands was last shaped by 957fda7 (TEST-06, PR #190) and cf617b3 (TEST-07, PR #191). What changed since the earlier FEAT-1 attempt (a40e653, reverted by 6df779d): imports are `echo`, `health`, `notes`, `uptime`, `version` in alphabetical module order, registrations run version, notes, health, echo, uptime, and the lifespan hook now captures the uptime process start. FEAT-1 therefore inserts `from app.routers.server_time import router as server_time_router` between the `notes` and `uptime` imports (alphabetical), appends `app.include_router(server_time_router)` after `app.include_router(uptime_router)`, and adds one clause to the module docstring. The lifespan hook and the CORS middleware are not touched.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." — Not acted on: `GET /api/echo` already ships on main (`backend/app/routers/echo.py`, `backend/app/schemas/echo.py`, registered in `backend/app/main.py` by TEST-06, 957fda7, PR #190) with a 200-character limit on `msg`. Adding it again would duplicate shipped work, and it is outside the four acceptance criteria of FEAT-1 (scope containment). No echo file appears in the File Manifest.
- Comment (tracker), point 3: "The acceptance criterion says ISO 8601 UTC with explicit offset without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." — Addressed by: the offset is pinned to `+00:00`, never `Z`. It is the form the project already emits for its other timestamp (`started_at` on `GET /api/uptime`), so one API never spells UTC two ways. The schema states the choice: `ServerTimeResponse.now` is typed with the existing `UtcTimestamp` annotated type from `backend/app/schemas/uptime.py` (whose serializer normalises to UTC and emits `+00:00`, overriding pydantic's default `Z`), and a comment on the field names the `+00:00` choice. Tests assert the exact suffix: the unit test compares the full serialised string (ending `+00:00`), and the integration test asserts `now` ends with `+00:00` and does not end with `Z`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2’s Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." — Addressed by: planned deviation, recorded here and in the Backend Plan. No `backend/app/services/` module is added. The router `backend/app/routers/server_time.py` calls `datetime.now(timezone.utc)` and returns a `ServerTimeResponse`, the same shape as `backend/app/routers/echo.py` on main. Section 2.2 (in `rules/coding_standards/backend_frontend.md`) puts business logic and transactional boundaries in the service; this endpoint has neither, and no repository (no persistence).
- Merged since the last plan: n/a (fresh plan, branched from current main at cf617b3; no `[merged-since]` lines were carried).

## Plan Overview
Backend only. One read-only endpoint, `GET /api/time`, in a new router `backend/app/routers/server_time.py` that returns a new Pydantic response schema `ServerTimeResponse` in `backend/app/schemas/server_time.py`. `now` is read from the clock on every request and serialised in UTC with the `+00:00` offset by reusing the project's existing `UtcTimestamp` type; `timezone` is the constant `UTC`. The router is registered in `backend/app/main.py` after the uptime router. No service layer (planned deviation, Re-Plan Feedback point 4), no repository, no migration, no database, no frontend, no external API, no new dependency. Tests: unit (schema shape, exact offset, naive rejection, handler freshness with a stubbed clock, route registration) and integration (HTTP 200 shape, offset suffix, two calls a second apart differ, OpenAPI schema, 405 on POST). No E2E spec: no criterion involves the UI. UAT artifacts are produced by Phase G.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time so a client can detect clock skew against the API. Router `backend/app/routers/server_time.py`: `router = APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time() -> ServerTimeResponse` decorated `@router.get("/time", response_model=ServerTimeResponse)`, body `return ServerTimeResponse(now=datetime.now(timezone.utc))`. The clock is read inside the handler, so every request gets a fresh value (criterion 2); nothing is cached at module or app level.
- Schema: `backend/app/schemas/server_time.py` defines `class ServerTimeResponse(BaseModel)` with `now: UtcTimestamp` (imported from `app.schemas.uptime`; `AwareDatetime` rejects a naive value, its serializer converts to UTC and emits the `+00:00` offset) and `timezone: Literal["UTC"] = "UTC"`. A comment on `now` states the pinned `+00:00` choice over `Z` (Re-Plan Feedback point 3). The module does not import `datetime.timezone`, so the field name `timezone` shadows nothing.
- Registration: `backend/app/main.py` imports `from app.routers.server_time import router as server_time_router` between the `notes` and `uptime` imports and calls `app.include_router(server_time_router)` after `app.include_router(uptime_router)`; the module docstring gains "and FEAT-1 the server time router".
- Service layer: none. Planned deviation from `coding_standards.md` Section 2.2 (Router, Service, Repository): reading a clock is neither business logic nor a transactional boundary, matching the TEST-06 echo router on main (Re-Plan Feedback point 4).
- Repository layer: none (no persistence).
- Migrations: none.
- Error handling: the only reachable error is a wrong method; FastAPI answers 405 on its own. No custom exception is needed.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no path, query or body parameters.
- Response: 200, `application/json`, schema `ServerTimeResponse`, both fields required: `now` (string, `format: date-time`, always ending `+00:00`, microseconds present when non-zero, as Python `isoformat` emits them) and `timezone` (string, always `UTC`). Example:
```json
{"now": "2026-10-17T09:15:02.123456+00:00", "timezone": "UTC"}
```
- Errors: POST, PUT, PATCH or DELETE on `/api/time` returns 405 Method Not Allowed (FastAPI default).

## Technology Selection
- Current time source: chose the standard library `datetime.now(timezone.utc)` over any time library or NTP client, because rung 1 covers an aware UTC instant fully; no new dependency.
- UTC serialisation with an explicit offset: chose the existing `UtcTimestamp` annotated type in `backend/app/schemas/uptime.py` (rung 3, a module the project already has) over a new serializer in `server_time.py` or pydantic's default `Z` output, because it already rejects naive values, normalises to UTC, emits `+00:00` and keeps `format: date-time` in OpenAPI. It is imported, not moved: moving it to a shared schema module would edit TEST-07's file for no gain on a feature this small.
- Constant `timezone` field: chose `typing.Literal["UTC"]` (standard library, rung 1) over a custom enum or validator, because a literal pins the value and publishes it in the schema in one line.
- `ServerTimeResponse` schema: chose pydantic `BaseModel` (rung 3, already installed with FastAPI) over a bare dict, which criterion 3 forbids anyway.
- `server_time` router: no stdlib call, native platform feature or installed dependency replaces a FastAPI route; it is built here with the installed FastAPI `APIRouter`, following `backend/app/routers/echo.py`.
- Service module: none, by planned deviation (Re-Plan Feedback point 4).

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` with `now: UtcTimestamp` (pinned `+00:00` offset, comment says so) and `timezone: Literal["UTC"] = "UTC"`.
- [B] backend/app/routers/server_time.py: `GET /api/time` router; reads `datetime.now(timezone.utc)` per request and returns `ServerTimeResponse`.
- [B] backend/tests/unit/test_server_time_schema_unit.py: schema unit tests; exact JSON for a fixed UTC instant (full string ending `+00:00`, `timezone` is `UTC`, exactly two keys), a `+02:00` input normalised to the same instant in UTC, a naive datetime rejected with `ValidationError`, a `timezone` other than `UTC` rejected.
- [B] backend/tests/unit/test_server_time_router_unit.py: handler unit tests with the clock stubbed (monkeypatch `app.routers.server_time.datetime` with a stub whose `now` returns two different aware instants); two calls return two different `now` values, `now` is requested with `timezone.utc`, and the return value is a `ServerTimeResponse`, not a dict.
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle through the shared `client` fixture; 200 with exactly the keys `now` and `timezone`, `timezone` equals `UTC`, `now` parses with `datetime.fromisoformat`, has a zero UTC offset, ends with `+00:00` and not `Z`, and lies between instants taken just before and just after the request; two calls one second apart (`time.sleep(1.0)`) return different values and the second is at least one second later; the OpenAPI 200 response references `ServerTimeResponse` with `now` as `string`, `format: date-time`, and both fields required; POST returns 405.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge-case scenario (POST returns 405); UAT Generation is ENABLED.
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the `notes` and `uptime` imports, `app.include_router(server_time_router)` after the uptime registration, docstring clause naming FEAT-1.
- [B] backend/tests/unit/test_main_unit.py: one test, `test_create_app_registers_time_route_with_server_time_response_model`, asserting `/api/time` is registered and declares `ServerTimeResponse`, in the shape of the existing echo and uptime tests.

No dependency changes, so no lockfile (`backend/uv.lock`, `package-lock.json`) is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists endpoints. No E2E spec file is listed and there is no `[D]` entry: no criterion requires navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: the response schema (exact serialised shape, the exact `+00:00` suffix, UTC normalisation, naive rejection, `timezone` pinned to `UTC`), the handler (fresh `now` per call with a stubbed clock, returns the schema rather than a dict), and the app factory (route registered with its response model). No service layer exists to cover.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_schema_unit.py`, `test_server_time_router_unit.py`, existing `test_main_unit.py`)
- Integration tests: the router through the full HTTP request/response cycle: 200 shape, offset suffix, per-request freshness across a one-second gap, OpenAPI schema, 405 on POST. No database is involved, so the tests use the shared session `client` fixture and need no backing service.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI; no frontend screen calls `GET /api/time` (`testing_standards.md` Section 6, fourth question, asked per criterion below). Calling the API from a browser spec would be a router integration test in the slowest tier (`testing_standards.md` Section 5).
  - Directory: e2e/tests/ (no file for this feature)
  - File: none (would have been `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), validated for well-formedness in CI; plus the manual UAT script.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/time returns 200 with now (ISO 8601 UTC, explicit offset) and timezone UTC | Integration (plus Unit for the serialised shape) | Verifying it needs no navigation or interaction: it is an HTTP response shape, checked through the real request cycle. |
| 2 | now is computed per request, serialised in UTC with an explicit offset, never naive | Integration (plus Unit for the stubbed-clock freshness, the `+00:00` suffix and naive rejection) | Verifying it needs no navigation or interaction: it is router and schema behaviour, and no UI shows the value. |
| 3 | The response body is a Pydantic schema in backend/app/schemas/, not a bare dict | Unit (route declares `ServerTimeResponse`, handler returns it) plus Integration (OpenAPI references the schema) | Verifying it needs no navigation or interaction: it is a code-structure rule visible in the route metadata and the OpenAPI document. |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration (the test files above, run by the test gate) | Verifying it needs no navigation or interaction: it is satisfied by the existence and passing of those unit and integration tests. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with now and timezone | Covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly the keys now and timezone, with timezone UTC |
| 2 | now fresh per request, UTC, explicit offset | Covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client calls GET /api/time twice one second apart, Then the two now values differ, the second is later, and both end in +00:00 |
| 3 | Pydantic schema, not a bare dict | Covered at Unit and Integration, see Criterion coverage | Given the published OpenAPI document, When a reader inspects GET /api/time, Then its 200 response references the ServerTimeResponse schema with now and timezone required |
| 4 | Unit and integration tests cover shape, offset, freshness | Covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the FEAT-1 unit and integration test files run, Then they report 0 failed |

## Manual verification plan
No criterion is verifiable through the application UI: no frontend screen calls `GET /api/time`. Each block gives the observable HTTP check instead, made with `curl` in a terminal or the same URL in a browser address bar. The backend answers on `http://localhost:8010`, the host port `docker-compose.yml` publishes for the `backend` service.

### Criterion 1: GET /api/time returns 200 with now (ISO 8601 UTC with explicit offset) and timezone UTC
Prerequisites: Docker running; repository on branch `feature/FEAT-1-server-time-endpoint`; from the repository root `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running; a terminal with `curl`.
1. In a terminal, run `curl -i http://localhost:8010/api/time` and read the first response line → it reads `HTTP/1.1 200 OK`.
2. Read the `content-type` header of the same response → it is `application/json`.
3. Read the response body → a JSON object with exactly two keys, `now` and `timezone`, and nothing else.
4. Read `timezone` → it is the string `UTC`.
5. Read `now` → a quoted string shaped like `2026-10-17T09:15:02.123456+00:00`: a date, the letter `T`, a time, and the offset `+00:00`.
6. Paste `http://localhost:8010/api/time` into a browser address bar → the page shows the same two-key JSON object.

### Criterion 2: now is computed per request, serialised in UTC with an explicit offset, never naive
Prerequisites: as for Criterion 1.
1. In a terminal, run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two JSON lines are printed.
2. Compare the two `now` values → they differ, and the second is about one second later than the first.
3. Read the end of each `now` string → both end in `+00:00`: not `Z`, and not a time with no offset at all.
4. Run `date -u +%Y-%m-%dT%H:%M:%S` immediately after `curl -s http://localhost:8010/api/time` → the date and time in `now` match the UTC clock to within a couple of seconds (it is UTC, not the machine's local time).
5. Repeat step 1 three more times → every call returns a new `now`; the value never stays the same across calls a second apart.

### Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/, not by a bare dict in the router
Prerequisites: as for Criterion 1, plus a browser.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the 200 response schema is named `ServerTimeResponse`, with `now` (string, format date-time) and `timezone` (string), both required.
2. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)` with the fields `now` and `timezone`, and a comment stating the `+00:00` offset choice.
3. Open `backend/app/routers/server_time.py` → the route decorator names `response_model=ServerTimeResponse` and the handler returns a `ServerTimeResponse`, not a dict literal; there is no import from `app.services`.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: repository on branch `feature/FEAT-1-server-time-endpoint`; `uv` installed. No database is needed for these files.
1. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_schema_unit.py tests/unit/test_server_time_router_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the summary line reports `0 failed`.
2. Open `backend/tests/unit/test_server_time_schema_unit.py` → a test asserts the full serialised `now` string ending in `+00:00` (shape and exact offset).
3. Open `backend/tests/unit/test_server_time_router_unit.py` → a test calls the handler twice with a stubbed clock and asserts the two `now` values differ (per-request freshness).
4. Open `backend/tests/integration/test_server_time_integration.py` → tests assert the 200 shape, the `+00:00` suffix (and not `Z`), and two calls one second apart returning different values.
