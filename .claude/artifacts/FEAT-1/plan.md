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
> (Operator instructions for the measured run; not feature scope, not planned here.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
Source: one actionable tracker comment (newest first; the other 16 tracker comments are framework-posted plan-PR link comments from earlier, reset runs and carry no instruction). A tracker comment overrides the description where the two disagree; each of its four points is answered below.

- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-reading `backend/app/main.py` on this branch (equal to `origin/main` at 6439eec). Commit 73e544c (`feat(TEST-06): Echo endpoint (#35)`) **is** an ancestor of this branch, but its registration is **no longer in the file**: the sandbox reset 9dcba19 (#326) later removed the `echo`, `server_time` and `uptime` imports and `include_router` calls (and the uptime `app.state.process_start` line). As the file now stands, `create_app()` registers exactly three routers, in this order: `version_router`, `notes_router`, `health_router` (lines 54 to 56), and imports them alphabetically (lines 19 to 21). Insertion point: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports (alphabetical, line 21), and `app.include_router(server_time_router)` goes immediately after `app.include_router(health_router)` (after line 56, before `return app`). The module docstring's list of registering features gains "FEAT-1 the server time router". Nothing else in the factory (lifespan, CORS middleware) changes. What changed versus the comment's premise: the TEST-06 echo registration it describes is not present on main today, so there is no echo line to sit beside.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on, because: the echo endpoint is the scope of a separate tracker item, TEST-06 (`feature/TEST-06-echo-endpoint` in `feature_map.md`), with its own dependants (TEST-11, BUG-05, CHORE-05) that specify contradictory whitespace behaviour still to be resolved. Building it under FEAT-1 adds an endpoint outside FEAT-1's four acceptance criteria (`user_story_alignment.md` Section 3, no gold plating; `review_standards.md` Section 3, no invented endpoints), and a squash under `feature/FEAT-1-...` would not move TEST-06 to Done, leaving that item open over code that already exists. This is a scope extension onto another item's work, not a correction of FEAT-1's criteria, so I read it as outside the "comment overrides description" rule. Assumption recorded instead of a blocking question: the echo endpoint is re-delivered under TEST-06's own ID. If the stakeholder wants it here regardless, a PR comment on this plan saying so triggers a re-plan that adds it (router, schema, tests and a fifth criterion).
- Comment (tracker), point 3: "Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinning **`+00:00`** with microsecond precision, e.g. `2026-10-27T19:44:51.123456+00:00`. Reason: the criterion says "explicit offset", and `+00:00` is the numeric offset form that the standard library's `datetime.isoformat()` produces and `datetime.fromisoformat()` round-trips on every supported Python. Mechanism in the schema (`backend/app/schemas/server_time.py`): `now` is typed `pydantic.AwareDatetime` (a naive datetime is rejected at construction), and a `@field_serializer("now")` returns `value.astimezone(timezone.utc).isoformat(timespec="microseconds")`. The serializer is required, not cosmetic: Pydantic v2's default JSON serialisation of a UTC datetime emits `Z`, so without it the wire format would silently be the other choice. `timespec="microseconds"` keeps the length fixed even when the microsecond is 0. Tests: a unit test asserts the exact string `2026-10-27T19:44:51.000000+00:00` for a fixed input and that it does not end in `Z`; an integration test asserts the live response matches `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+00:00$`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06 ... Record it as a planned deviation rather than leaving it silent." → Addressed by: no `services/server_time_service.py`. **Planned deviation** from `coding_standards.md` Section 2.2 (Router, Service, Repository): the router reads the clock through a one-line module-level function `current_utc_time()` in `backend/app/routers/server_time.py` and builds the schema; there is no service and no repository. Reason: Section 2.2 places business logic and transactional boundaries in the service, and reading the wall clock is neither; a service would be a pass-through. Verified against TEST-06's own plan at commit de8a77a ("Key decision 1: No service module ... a pass-through function with nothing to test beyond the router"). Counter-precedent noted honestly: TEST-05's `version_service.py` is a service for an equally logic-light endpoint, so the repo is not uniform here; this plan follows the comment and TEST-06. `current_utc_time()` exists as the test seam for per-request freshness, not as a layer.
- Merged since the last plan: n/a (fresh plan, branched from current main; no prior plan on this branch).

## Plan Overview
Backend only. One new GET endpoint, `/api/time`, in a new router `backend/app/routers/server_time.py`, returning a new Pydantic response schema `ServerTimeResponse` in `backend/app/schemas/server_time.py`. The router computes `datetime.now(timezone.utc)` on every request and returns `{"now": "<YYYY-MM-DDTHH:MM:SS.ffffff+00:00>", "timezone": "UTC"}`. The router is registered in `backend/app/main.py`'s `create_app()` after the health router. No service, no repository, no database, no migration, no frontend, no new dependency. Tests: unit tests for the schema (exact `+00:00` suffix, UTC conversion, naive rejected) and for per-request clock reads; one route-registration unit test in the existing `test_main_unit.py`; integration tests through the real HTTP cycle for shape, offset, freshness and 405 on POST. UAT artifacts per the build's Phase G.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/time`, report the server's current UTC time for client clock-skew detection. Router `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time()` declared with `response_model=ServerTimeResponse`, returning `ServerTimeResponse(now=current_utc_time())` (the `timezone` field defaults to `"UTC"`). `current_utc_time()` is a module-level function in the router returning `datetime.now(timezone.utc)`; it is called inside the handler, never at import time, so every request reads the clock afresh.
- Schema: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` and `timezone: Literal["UTC"] = "UTC"`, plus `@field_serializer("now")` returning `value.astimezone(timezone.utc).isoformat(timespec="microseconds")`. Docstring states the `+00:00` choice and why the serializer exists (point 3 above).
- Registration: in `backend/app/main.py`, add the import between the `notes` and `version` router imports and `app.include_router(server_time_router)` after `app.include_router(health_router)`; extend the module docstring's feature list.
- Service layer: none (planned deviation from `coding_standards.md` Section 2.2, see Re-Plan Feedback point 4).
- Repository layer: none (no data access).
- Migrations: none.
- Error handling: the endpoint takes no input and has no failure path of its own; FastAPI answers 405 to non-GET methods. It needs no database, so it answers when `DATABASE_URL` is unset (the app lifespan already only warns in that case).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query or path parameters.
- Response: 200, `application/json`, schema `ServerTimeResponse`. `now` is always UTC, always the `+00:00` offset form, always six fractional digits; `timezone` is always the literal `UTC`. Example:

```json
{"now": "2026-10-27T19:44:51.123456+00:00", "timezone": "UTC"}
```

- Errors: 405 Method Not Allowed for any method other than GET (FastAPI default).

## Technology Selection
- Current-time source: chose the standard library's `datetime.now(timezone.utc)` over any third-party time library (`pendulum`, `arrow`), because the standard library covers an aware UTC timestamp completely.
- ISO 8601 serialisation: chose the standard library's `datetime.isoformat(timespec="microseconds")` inside a Pydantic `field_serializer` over Pydantic's default datetime JSON encoding, because the default emits `Z` and the pinned format is `+00:00` (Re-Plan Feedback point 3); no new dependency.
- Naive-datetime guard: chose Pydantic's built-in `AwareDatetime` type (Pydantic is already installed through FastAPI) over a hand-written validator, because the installed type already rejects a naive value.
- Response schema `ServerTimeResponse`: chose a Pydantic `BaseModel` (installed through FastAPI, and required by criterion 3) over a dataclass or bare dict.
- Router module: no stdlib call, native platform feature or installed dependency covers a project route, so it is built here with FastAPI's installed `APIRouter`.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema with `AwareDatetime` `now`, `Literal["UTC"]` `timezone`, and the `+00:00` field serializer.
- [B] backend/app/routers/server_time.py: `GET /api/time` router with the `current_utc_time()` clock seam; no service.
- [B] backend/tests/unit/test_server_time_unit.py: schema serialisation (exact `+00:00` suffix, never `Z`, fixed microsecond width), non-UTC aware input converted to UTC, naive input rejected, `timezone` literal; handler reads the clock once per call (seam monkeypatched to two different instants yields two different `now` values).
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` matches the pinned regex and parses to a UTC offset of zero within a few seconds of the test clock, two requests return different `now` values with the second later than the first, POST returns 405.
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (no `DATABASE_URL`), UAT Generation ENABLED.

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the notes and version router imports; `app.include_router(server_time_router)` after the health router; docstring feature list extended.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom route paths, beside the existing version and health route tests.

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is regenerated. No project structure, run configuration, dependency or test infrastructure changes, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: the response schema (`+00:00` serialisation with fixed microsecond width, conversion of a non-UTC aware datetime to UTC, rejection of a naive datetime with `pydantic.ValidationError`, `timezone` literal default) and the router handler called directly with `current_utc_time` monkeypatched (per-call clock read; happy path, edge case of a zero-microsecond instant, error case of a naive clock value raising `ValidationError`). Plus one route-registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (here `test_server_time_unit.py`; `test_main_unit.py` extended)
- Integration tests: `GET /api/time` through the session `client` fixture from `backend/tests/conftest.py`: 200 and exact shape, pinned offset regex, parsed UTC offset zero, freshness across two requests, 405 on POST. No database needed, so no `database_url` fixture.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No acceptance criterion requires navigation or interaction through the UI: the endpoint has no frontend consumer (`testing_standards.md` Section 6, fourth question asked per criterion). No spec is written.
  - Directory: e2e/tests/
  - File: none (would be `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (endpoint answers with `DATABASE_URL` unset), and the manual script driven by `curl`.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}` | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked through the real HTTP cycle; no UI consumes the endpoint. |
| 2 | `now` is computed per request, serialised in UTC with an explicit offset, never naive | Unit and Integration | Verifying it needs no navigation or interaction: offset and naive rejection are schema rules (unit), per-request freshness is two HTTP calls (integration) plus the monkeypatched clock seam (unit). |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict | Unit | Verifying it needs no navigation or interaction: it is a code-structure property, checked by unit tests importing `ServerTimeResponse` from `app.schemas.server_time` and by the handler's `response_model`. |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | It is a statement about the unit and integration tiers themselves; the files listed above are its coverage, executed by the test gate and CI. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | Covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/time`, Then the status is 200 and the body has exactly `now` and `timezone`, with `timezone` equal to `UTC` |
| 2 | `now` per request, UTC, explicit offset, never naive | Covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/time` twice one second apart, Then the two `now` values differ, the second is later, and both end in `+00:00` |
| 3 | Body defined by a Pydantic schema in `backend/app/schemas/` | Covered at Unit, see Criterion coverage | Given the backend is running, When a client fetches `/openapi.json`, Then `/api/time`'s 200 response references the `ServerTimeResponse` schema |
| 4 | Unit and integration tests cover shape, offset, freshness | Covered at Unit and Integration, see Criterion coverage | Given the backend dependencies are installed, When the FEAT-1 unit and integration test files are run, Then the run reports 0 failed |

## Manual verification plan
No acceptance criterion is verifiable through the UI: no screen consumes `GET /api/time`. The observable check is the HTTP response, read with `curl` against the compose stack (backend published on host port 8010 by `docker-compose.yml`).

Prerequisites (all criteria): Docker running; repository on branch `feature/FEAT-1-server-time-endpoint`; from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows the `backend` service running.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
1. In a terminal run `curl -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the body → it has exactly two keys, `now` and `timezone`, for example `{"now":"2026-10-27T19:44:51.123456+00:00","timezone":"UTC"}`; `timezone` is exactly `UTC`.

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
1. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two bodies print.
2. Compare the two `now` values → they differ, and the second is about one second later than the first.
3. Check the end of each `now` value → each ends in `+00:00` (never `Z`, never without an offset) and has exactly six digits after the decimal point.
4. Compare the hour with UTC on your machine (`date -u +%H:%M`) → the `now` hour and minute match UTC, not your local time zone.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Not verifiable through the UI; the observable check is the OpenAPI document and the source.
1. Run `curl -s http://localhost:8010/openapi.json` and search the output for `ServerTimeResponse` → the `/api/time` GET 200 response references `#/components/schemas/ServerTimeResponse`, and that component lists the properties `now` and `timezone`.
2. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)`; open `backend/app/routers/server_time.py` → the route declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, not a dict literal.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: `uv` installed on the host.
1. From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the summary line reports `0 failed` (no database is required for these files).
2. Open `backend/tests/unit/test_server_time_unit.py` → a test asserts the exact string `2026-10-27T19:44:51.000000+00:00` for a fixed instant, and a test asserts two calls with different clock instants return different `now` values.
3. Open `backend/tests/integration/test_server_time_integration.py` → tests assert the response keys, the `+00:00` regex, and that two requests return different `now` values.

Teardown: `docker compose down`.
