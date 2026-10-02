# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature created 2026-09-07 for measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010). It exists to overlap a commit that will land on `main` during the run, not to be independent of it: it registers a router in `backend/app/main.py`, the file TEST-06 and TEST-07 also change. (The description refers to the item as "TEST-09"; its framework ID is FEAT-1.)
>
> **What:** `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> **Acceptance criteria** (below).
>
> **Notes:** Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> The description's "How the measured run uses this item" block is operator instructions and not part of the feature; it is deliberately not planned.

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback (if applicable)

First plan on this branch, on an item that carries comments: 6 tracker comments read (0 threaded replies), 1 actionable. A comment overrides the description where they disagree; read newest first.

- Comment (tracker, Florian Serneels, 2026-09-14), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-reading `backend/app/main.py` at `origin/main` = `70ae1e2`. Correction to the comment's premise: `73e544c8` (#35) is still an ancestor of `origin/main`, but its `main.py` change has since been reverted and re-landed several times (sandbox resets #44, #52, #60), so it no longer describes the file. The current registration block comes from `32170ac` (TEST-06, PR #62) and `70ae1e2` (TEST-07, PR #63). What changed since #35: `main.py` now also imports `uptime_router` and `capture_process_start`, the lifespan records `app.state.process_start` first, and `create_app()` registers routers in the order version, notes, health, echo, uptime. Insertion point: the import `from app.routers.server_time import router as server_time_router` goes in the alphabetical import block between the `notes` and `uptime` router imports; `app.include_router(server_time_router)` goes after `app.include_router(uptime_router)` (registration order is chronological); the module docstring's registration sentence gains "and FEAT-1 the server time router". Lifespan and CORS are untouched (CORS already allows `GET`). Also noted: an earlier FEAT-1 build merged as `ed48ef9` (#36) and was removed by the #44 reset, so nothing of FEAT-1 is on main now.
- Comment (tracker, same comment), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on: `GET /api/echo` already exists on main (`backend/app/routers/echo.py`, `backend/app/schemas/echo.py`, registered in `main.py`, tested in `backend/tests/unit/test_echo_unit.py` and `backend/tests/integration/test_echo_integration.py`, landed by TEST-06 `32170ac`). Re-adding it would duplicate delivered work, and it is outside FEAT-1's acceptance criteria (`user_story_alignment.md` Section 3). Nothing in this plan touches the echo files.
- Comment (tracker, same comment), point 3: "Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is pinned to `+00:00`, the same choice TEST-07's `UptimeResponse.started_at` made on main, so the API has one datetime convention. `ServerTimeResponse` states it three ways: the class docstring, the `now` field's `description`, and a `field_serializer("now")` returning `value.astimezone(UTC).isoformat()` (pydantic's default would emit `Z`). Tests assert the exact suffix: unit test asserts the full serialised string ends in `+00:00`, and the integration test asserts `body["now"].endswith("+00:00")` and `not body["now"].endswith("Z")`.
- Comment (tracker, same comment), point 4: "Do not add a service module for this endpoint ... Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/` module. The router calls stdlib `datetime.now(UTC)` and returns the schema, like TEST-06's echo router. Planned deviation from `coding_standards.md` Section 2.2 (Router -> Service -> Repository, "NO business logic" in the router), recorded here and to be repeated in the PR description: reading a clock is neither business logic nor a transactional boundary, per the stakeholder's instruction. Note for the reviewer: TEST-07's uptime endpoint on main does use a service module (`uptime_service.py`), so two shapes coexist; FEAT-1 follows echo's, by explicit instruction.
- Comment (tracker, five framework records of PRs #56, #50, #48 (plan PRs, closed) and #36 (built, merged 2026-09-14, later reset)) → Not acted on as requests (none asks for anything). Used as context: earlier plans pinned `+00:00` via a `field_serializer` and recorded "no service module" as a deviation; this plan reaches the same decisions afresh against main as it stands, for the reasons above.
- Merged since the last plan: n/a (fresh plan, branched from current main `70ae1e2`; no prior `plan.md` on this branch).

## Plan Overview
Backend only. One new read-only endpoint, `GET /api/time`, in a new router module `backend/app/routers/server_time.py`, returning a new Pydantic response schema `ServerTimeResponse` in `backend/app/schemas/server_time.py`. The router computes `datetime.now(UTC)` on every request and returns `{"now": "...+00:00", "timezone": "UTC"}`. The router is registered in `backend/app/main.py` after the uptime router. No service, repository, database, migration, dependency or frontend change. Module name `server_time` rather than `time` so the module never reads as the stdlib `time` module in imports and tracebacks.

Assumptions (no comment covers them): `timezone` is the constant string `"UTC"`, typed `Literal["UTC"]`; `now` keeps microsecond precision as `isoformat()` emits it (no truncation was asked for); the endpoint is unauthenticated like every other endpoint on main.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time. `APIRouter(prefix="/api", tags=["time"])`, `@router.get("/time", response_model=ServerTimeResponse)`, handler `get_time() -> ServerTimeResponse` returning `ServerTimeResponse(now=datetime.now(UTC))`. Same shape as `backend/app/routers/echo.py`.
- Schema: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (pydantic rejects a naive datetime, criterion 2's "never naive") and `timezone: Literal["UTC"] = "UTC"`. A `field_serializer("now")` returns `value.astimezone(UTC).isoformat()`, so any aware input is emitted as the equivalent UTC instant with the explicit `+00:00` suffix. The class docstring and the `now` field's `description` state the `+00:00` choice (Re-Plan Feedback point 3).
- Service layer: none. Planned deviation from `coding_standards.md` Section 2.2, by stakeholder instruction (Re-Plan Feedback point 4): reading the clock is not business logic nor a transactional boundary.
- Repository layer: none (no data access).
- Migrations: none.
- Registration: `backend/app/main.py`, import between the `notes` and `uptime` router imports, `app.include_router(server_time_router)` after `app.include_router(uptime_router)`, docstring sentence extended. Lifespan, CORS and the other registrations unchanged.
- Error handling: no custom exception; the only error path is FastAPI's own 405 for a non-GET method.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no path, query or body parameters.
- Response: 200, `application/json`, schema `ServerTimeResponse` (OpenAPI `#/components/schemas/ServerTimeResponse`):

```json
{"now": "2026-10-02T10:42:41.123456+00:00", "timezone": "UTC"}
```

  `now`: ISO 8601, always UTC, always ending in the explicit offset `+00:00` (never `Z`, never naive), computed per request. `timezone`: always the string `"UTC"`.
- Errors: `POST /api/time` (any non-GET) returns FastAPI's 405.

## Technology Selection
- `ServerTimeResponse` schema: chose a Pydantic `BaseModel` with `AwareDatetime` and a `field_serializer` calling stdlib `datetime.isoformat()` over pydantic's default datetime serialisation, because the default emits `Z` and the pinned offset is `+00:00`; the same installed mechanism TEST-07's `UptimeResponse` uses.
- Current time: chose stdlib `datetime.now(UTC)` over a time library (`arrow`, `pendulum`, `python-dateutil`), because the standard library covers an aware UTC timestamp and its ISO 8601 form; no new dependency.
- `server_time` router module: no stdlib call, native platform feature or installed dependency replaces an HTTP route, so it is built here on the installed FastAPI `APIRouter`.

## File Manifest

### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, `now: AwareDatetime` serialised as UTC with `+00:00`, `timezone: Literal["UTC"]`.
- [B] backend/app/routers/server_time.py: `GET /api/time` router returning `ServerTimeResponse(now=datetime.now(UTC))`.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (shape, exact `+00:00` suffix, offset conversion, naive rejection, non-UTC timezone rejection) and for `get_time()` (per-call freshness within the call window).
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time` (200 and shape, `+00:00` suffix, per-request freshness, OpenAPI `$ref`, 405 on POST).
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: import `server_time_router`, register it after `uptime_router`, extend the module docstring.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the app's custom routes, following the existing per-feature tests.

No dependency changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: neither lists API endpoints, and this feature changes no project structure, run configuration, dependency or test infrastructure. No E2E spec file: no criterion warrants E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `ServerTimeResponse` and the `get_time()` handler, no HTTP and no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_server_time_unit.py` (plus one new test in the existing `test_main_unit.py`)
  - Cases: dumps a fixed `datetime(2026, 10, 2, 10, 42, 41, 123456, tzinfo=UTC)` to exactly `{"now": "2026-10-02T10:42:41.123456+00:00", "timezone": "UTC"}` (exact suffix `+00:00`); an aware non-UTC input (`+02:00`) is emitted as the equivalent UTC instant ending `+00:00`; a naive datetime raises `ValidationError`; `timezone="Europe/Brussels"` raises `ValidationError`; `get_time()` called twice returns a `now` that lies between UTC timestamps taken immediately before and after each call, and the second call's `now` is later than the first's.
- Integration tests: `GET /api/time` through the session-scoped `client` fixture from `backend/tests/conftest.py`; no database needed (lifespan skips schema set-up when `DATABASE_URL` is unset).
  - Directory: backend/tests/integration/
  - Naming: `test_server_time_integration.py`
  - Cases: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`; `now` ends with `+00:00`, does not end with `Z`, and `datetime.fromisoformat(now).utcoffset() == timedelta(0)`; `now` lies within the request's before/after UTC window; two calls separated by `time.sleep(0.01)` return strictly increasing `now` values (microsecond resolution makes 10 ms sufficient and a strict `>` stronger than the criterion's "differ", without a one-second sleep in the suite); OpenAPI 200 schema is `{"$ref": "#/components/schemas/ServerTimeResponse"}` (the TEST-06/TEST-07 pattern); `POST /api/time` returns 405.
- E2E tests: Enabled per CLAUDE.md, but no criterion warrants E2E: no page in the frontend calls `/api/time` and none is asked for, so no criterion requires navigation or interaction through the UI. No spec file is planned.
  - Directory: e2e/tests/
  - File: none (would be `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a non-GET request returns 405), API-level steps.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | Integration | Verifying it needs no navigation or interaction: it is a router response, checked through the HTTP cycle. |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration + Unit | Verifying it needs no navigation or interaction: it is a serialisation rule (unit, exact `+00:00`) and a per-request handler behaviour (integration, two calls). |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: it is an OpenAPI `$ref` assertion against the app's generated schema. |
| 4 | Unit and integration tests cover shape, offset, freshness | Unit + Integration | Verifying it needs no navigation or interaction: it is satisfied by the two test files above existing and passing in the gate. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` = "UTC" |
| 2 | per request, UTC, explicit offset | covered at Integration + Unit, see Criterion coverage | Given the backend is running, When I GET /api/time twice a second apart, Then the two `now` values differ and both end in "+00:00" |
| 3 | Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When I read /openapi.json, Then the 200 response of GET /api/time references ServerTimeResponse |
| 4 | tests cover shape, offset, freshness | covered at Unit + Integration, see Criterion coverage | Given the repository, When I run the backend test suite, Then the server_time unit and integration tests pass |

## Manual verification plan

No criterion is verifiable through the application UI: no frontend page calls `/api/time`. Every check reads the HTTP response in a terminal with `curl` or in a browser address bar on the API URL. Backend host port is 8010 (`docker-compose.yml`).

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone`
Prerequisites: Docker running; repository on branch `feature/FEAT-1-server-time-endpoint`; from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows `backend` running; a terminal with `curl`.
1. Run `curl -i http://localhost:8010/api/time` → first line reads `HTTP/1.1 200 OK`; headers include `content-type: application/json`.
2. Read the body of the same response → a JSON object with exactly two keys, for example `{"now": "2026-10-02T10:42:41.123456+00:00", "timezone": "UTC"}` (whitespace may differ); `timezone` is exactly `"UTC"`.
3. Open `http://localhost:8010/api/time` in a browser address bar → the browser shows the same two-key JSON object.

### Criterion 2: `now` is computed per request, UTC with an explicit offset, never naive
Prerequisites: the backend from Criterion 1 is running.
1. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two JSON bodies print one after the other.
2. Compare the two `now` values → they differ, and the second is about one second later than the first.
3. Read the end of each `now` value → each ends with exactly `+00:00`: not `Z`, not a local offset such as `+02:00`, and never a bare time with no offset.
4. Run `date -u` immediately after a call and compare → `now` matches the current UTC time to within a second or two.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend from Criterion 1 is running.
1. Open `http://localhost:8010/docs` in a browser → the Swagger UI lists `GET /api/time` under the `time` tag.
2. Expand `GET /api/time` and read the 200 response → its schema is named `ServerTimeResponse` with fields `now` (string, date-time) and `timezone` (string, "UTC").
3. Open `backend/app/schemas/server_time.py` in the editor → it defines `class ServerTimeResponse(BaseModel)`, and `backend/app/routers/server_time.py` returns that class rather than a dict.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Not a UI behaviour; the observable check is the test run.
1. From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py` → all tests pass, none skipped.
2. Open the two files → there is a test asserting the exact `+00:00` suffix, one asserting the two-key shape, and one asserting two calls return different, increasing `now` values.
