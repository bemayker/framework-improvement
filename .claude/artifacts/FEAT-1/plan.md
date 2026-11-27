# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> **What:** `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> **Acceptance criteria:**
> - `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> - `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> - The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> - Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> **Notes:** Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The item's "How the measured run uses this item" block is operator instructions, not part of the feature, and is not planned here.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against `origin/main` at `2ded6408` (this branch's base). Commit `73e544c8` ("feat(TEST-06): Echo endpoint (#35)", 2026-09-14) is an ancestor of `origin/main`, but its echo code is not on main today: `backend/app/routers/echo.py` and `backend/app/schemas/echo.py` were removed by later sandbox resets (last echo-touching commit on main is `9dcba19b`), and `git ls-tree origin/main backend/app/routers/` lists only `health.py`, `notes.py` and `version.py`. The last commit on main touching `backend/app/main.py` is `8f77092c` (a sandbox reset). What changed versus the item's assumption: there is no echo registration to sit beside. The block `create_app()` holds on main is `app.include_router(version_router)`, `app.include_router(notes_router)`, `app.include_router(health_router)`, and the router imports are `health`, `notes`, `version` in alphabetical order. Insertion point: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports (alphabetical), and `app.include_router(server_time_router)` goes after `app.include_router(health_router)`, the last line before `return app`. The module docstring's list of registering features gains one clause for FEAT-1. If TEST-06 (branch `feature/TEST-06-echo-endpoint`) re-lands first, its echo line and this line are adjacent appends to the same block: a trivial textual merge, which is why `shared_risks.md` flags the pair for serialization.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on: `/api/echo` is the whole scope of a separate work item, TEST-06 "Echo endpoint", which has its own branch (`feature/TEST-06-echo-endpoint`) and two downstream items that change its behaviour (TEST-11 trims whitespace, BUG-05 keeps it). Building it inside FEAT-1 would add an endpoint no FEAT-1 acceptance criterion asks for (`user_story_alignment.md` Section 3), create a second, competing implementation of TEST-06's files that would conflict with that branch, and leave TEST-06, TEST-11 and BUG-05 planned against code they did not produce. This comment adds scope rather than correcting the description, so the override rule does not apply to it. Assumption recorded: the requester's goal ("the two registrations land together") is met by serializing FEAT-1 and TEST-06 on `backend/app/main.py`, which `shared_risks.md` flags. Recorded as a scope decision under `## Scope changes`.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`, the numeric offset, over `Z`. Reasons: the criterion says "explicit offset" and `+00:00` is the numeric offset form; it is what Python's `datetime.isoformat()` produces for an aware UTC value; `datetime.fromisoformat()` round-trips it in every supported Python. The choice is stated in `backend/app/schemas/server_time.py` as a module constant `UTC_OFFSET_SUFFIX = "+00:00"` and a `field_serializer` on `now` that converts to UTC and calls `.isoformat()`. The serializer is required, not decoration: Pydantic 2 (locked at 2.13.4) serializes an aware UTC `datetime` with a `Z` suffix by default, so a bare `datetime` field would silently produce the other choice. Tests asserting the exact suffix: `test_server_time_response_serializes_now_with_plus_zero_offset_suffix` (unit) and `test_get_time_now_ends_with_plus_zero_offset_suffix` (integration). Both assert `endswith("+00:00")` and that the value does not end with `Z`. Recorded under `## Scope changes`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/` module is created. Planned deviation from `coding_standards.md` Section 2.2 (read for this plan, in `coding_standards/backend_frontend.md`): the endpoint has a Router and a Schema layer only, with no Service and no Repository. The clock read is a one-line module function, `current_utc_time()`, in `backend/app/routers/server_time.py`. Reasons: Section 2.2 puts business logic and transactional boundaries in the Service, and reading the system clock is neither; there is no data access, so there is no Repository either; and Section 2.2 itself says the plan decides which layers exist. Keeping the clock read in a named function, rather than inline in the handler, is what lets the unit and integration tests replace the clock to prove per-request freshness without sleeping. No ADR is written: this applies Section 2.2's own "the plan determines which layers exist" clause to one endpoint and changes no project-wide architecture. Also, the planner may write only under `.claude/artifacts/`. The deviation must be listed in the implementation PR's description. Recorded under `## Scope changes`.
- Merged since the last plan: n/a (fresh plan on a branch created from current `origin/main` at `2ded6408`; no previous plan exists for this branch, so there is no merged-since comparison to make).

## Plan Overview
A backend-only slice: a new read-only endpoint `GET /api/time`, built from one Pydantic response schema and one router, then registered in the FastAPI app factory. There is no database access, no service module (point 4), no frontend and no external integration. The schema pins the serialized offset to `+00:00` and rejects naive datetimes. The router reads the clock on every request through a replaceable module function. Tests: unit tests for the schema and for the router function, router integration tests through the real HTTP cycle, and one route-registration assertion in the existing app-factory unit test. UAT artifacts follow (Gherkin enabled). No E2E spec, because no criterion involves UI navigation or interaction.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`. It reports the server's current UTC time per request. It takes no input, needs no database and no authentication. Any other method on the path gets FastAPI's default 405.
- Router (`backend/app/routers/server_time.py`): `router = APIRouter(prefix="/api", tags=["time"])`, the same shape as `backend/app/routers/version.py`. A module-level function `current_utc_time() -> datetime` returns `datetime.now(UTC)`, using `from datetime import UTC, datetime`. Handler: `@router.get("/time", response_model=ServerTimeResponse)` on `def get_server_time() -> ServerTimeResponse`, which returns `ServerTimeResponse(now=current_utc_time())`. The handler looks up `current_utc_time` as a module global at call time, so `monkeypatch.setattr("app.routers.server_time.current_utc_time", ...)` replaces it. That call-time lookup is also what makes the value per request: nothing is computed at import time.
- Schema (`backend/app/schemas/server_time.py`): `UTC_OFFSET_SUFFIX = "+00:00"`, with a docstring stating the `+00:00`-over-`Z` decision. The model is `class ServerTimeResponse(BaseModel)` with these members:
  - `now: AwareDatetime` (Pydantic's aware-datetime type, so a naive value raises `ValidationError`).
  - `timezone: Literal["UTC"] = "UTC"`.
  - `@field_serializer("now")` returning `value.astimezone(UTC).isoformat()`, so the JSON value always carries the `+00:00` suffix and never Pydantic's default `Z`.

  The field is named `timezone`, so import `UTC` from `datetime` and do not import `timezone` in this module, to avoid shadowing. Keep `isoformat()` at its default precision (microseconds when non-zero), because it is the same function the tests compare against.
- Service layer: none, a planned deviation from `coding_standards.md` Section 2.2, recorded under tracker point 4 above and in `## Scope changes`.
- Repository layer: none, no data access.
- Migrations: none.
- App factory (`backend/app/main.py`): import and `include_router(server_time_router)` at the insertion point recorded under tracker point 1, and add FEAT-1 to the module docstring's list. No change to the CORS middleware: `allow_methods=["GET", "POST"]` already admits GET.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters, no path parameters.
- Response: `200 OK`, `application/json`, body defined by `ServerTimeResponse`:

```json
{"now": "2026-11-27T14:13:48.123456+00:00", "timezone": "UTC"}
```

  `now` is always ISO 8601, always UTC, always ends in `+00:00`, never `Z`, never naive. `timezone` is always the literal string `UTC`. When the clock reads a whole second, `now` has no fractional part (`2026-11-27T14:13:48+00:00`), which is `isoformat()`'s behaviour. A client parses it with any ISO 8601 parser.
- Errors: `405 Method Not Allowed` for any method other than GET (FastAPI default). No other error path exists: the endpoint takes no input and touches no dependency.

## Technology Selection
- Current UTC time (`current_utc_time()` in `backend/app/routers/server_time.py`): chose the standard library's `datetime.now(UTC)` over any third-party time library (`arrow`, `pendulum`). The stdlib call returns an aware UTC datetime, which is everything the criterion needs.
- Offset formatting (`field_serializer` on `ServerTimeResponse.now`): chose the standard library's `datetime.isoformat()` inside a Pydantic `field_serializer` (Pydantic is already installed through FastAPI) over Pydantic's default datetime serialization. The default emits `Z`, and the plan pins `+00:00` (tracker point 3).
- Naive-datetime rejection: chose Pydantic's installed `AwareDatetime` type over a hand-written validator. It already refuses a naive value with a `ValidationError`.
- Response schema `ServerTimeResponse` (`backend/app/schemas/server_time.py`): the criterion mandates a Pydantic schema, and Pydantic is already installed, so there was no alternative to weigh.
- Router `backend/app/routers/server_time.py`: no stdlib call, native platform feature or installed dependency replaces a project route, so it is built here on FastAPI's installed `APIRouter`.
- No new dependency is added, so `backend/pyproject.toml` and `backend/uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, `UTC_OFFSET_SUFFIX = "+00:00"`, `AwareDatetime` `now` field with its `+00:00` serializer, `timezone` literal `UTC`
- [B] backend/app/routers/server_time.py: `GET /api/time` router with the `current_utc_time()` clock function and the `get_server_time` handler
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (shape, `+00:00` suffix, UTC conversion, naive rejection) and for the router function (per-call freshness)
- [B] backend/tests/integration/test_server_time_integration.py: router integration tests through the real HTTP cycle (200 shape, offset suffix, per-request freshness, real-clock currency, 405)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the `notes` and `version` imports, `app.include_router(server_time_router)` after `health_router`, docstring gains FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the app's custom routes

No E2E spec is listed: no criterion's covering tier is E2E (see `### Criterion coverage`). No lockfile is listed, because the feature adds no dependency and `backend/pyproject.toml` is unchanged. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and adds one route to an existing router directory.

## Testing Strategy
- Unit tests: `ServerTimeResponse` serialization and validation, and the router function `get_server_time` called directly with the clock replaced. No database, no HTTP. Also one route-registration assertion in the existing app-factory unit test.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_server_time_unit.py`
  - Cases: `test_server_time_response_serializes_now_with_plus_zero_offset_suffix` (happy path: `datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC)` dumps in JSON mode to exactly `{"now": "2026-01-02T03:04:05+00:00", "timezone": "UTC"}`, ends with `+00:00`, not `Z`), `test_server_time_response_converts_non_utc_aware_time_to_utc` (edge: a `+02:00` input at 05:04:05 serializes as `2026-01-02T03:04:05+00:00`), `test_server_time_response_rejects_naive_datetime` (error: `datetime(2026, 1, 2, 3, 4, 5)` with no tzinfo raises `pydantic.ValidationError`), `test_server_time_response_timezone_is_utc` (edge: `timezone` defaults to `UTC`, and `timezone="CET"` raises `ValidationError`), `test_get_server_time_reads_clock_on_every_call` (freshness: monkeypatch `current_utc_time` to return `t` then `t + timedelta(seconds=1)`, call `get_server_time()` twice, the two `now` values differ by exactly one second), and `test_create_app_registers_time_route` in `test_main_unit.py`.
- Integration tests: `GET /api/time` through the session `client` fixture in `backend/tests/conftest.py`. The endpoint needs no database, and the app's lifespan skips schema setup when `DATABASE_URL` is unset, so these tests need no backing service.
  - Directory: backend/tests/integration/
  - Cases: `test_get_time_returns_200_with_now_and_utc_timezone` (status 200, key set exactly `{"now", "timezone"}`, `timezone == "UTC"`, `datetime.fromisoformat(now).utcoffset() == timedelta(0)`), `test_get_time_now_ends_with_plus_zero_offset_suffix` (raw string ends with `+00:00`, does not end with `Z`), `test_get_time_computes_now_per_request` (monkeypatch `app.routers.server_time.current_utc_time` to yield `2026-11-27T14:00:00+00:00` then `2026-11-27T14:00:01+00:00`, two requests, the bodies carry exactly those two strings), `test_get_time_now_is_read_at_request_time` (real clock: `before = datetime.now(UTC)`, request, `after = datetime.now(UTC)`, `before <= parsed now <= after`, which proves the value is not fixed at import time), `test_post_time_returns_405_method_not_allowed` (the router's only reachable error case).
  - The freshness tests replace the clock rather than sleeping a second, so they are deterministic and cost no wall time. The real-clock test is the check that the replaced function is the one production uses.
- E2E tests: no spec. The E2E toggle is ENABLED, but no acceptance criterion requires navigation or interaction through a UI: there is no frontend change, and an E2E test that calls the API directly is an integration test (`testing_standards.md` Section 5).
  - Directory: e2e/tests/ (nothing added)
  - File: none
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge case (a POST gets 405), API-level steps. Also the manual UAT script expanded from `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ (scenarios), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}` | Integration | `test_get_time_returns_200_with_now_and_utc_timezone`, `test_get_time_now_ends_with_plus_zero_offset_suffix`, `test_create_app_registers_time_route` | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | `now` is computed per request, serialised in UTC with an explicit offset, never naive | Integration | `test_get_time_computes_now_per_request`, `test_get_time_now_is_read_at_request_time`, `test_get_server_time_reads_clock_on_every_call`, `test_server_time_response_rejects_naive_datetime`, `test_server_time_response_converts_non_utc_aware_time_to_utc` | verifying it needs no navigation or interaction: freshness is a router behaviour, and UTC and naive rejection are schema rules |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router | Unit | `test_server_time_response_serializes_now_with_plus_zero_offset_suffix`, `test_server_time_response_timezone_is_utc` | verifying it needs no navigation or interaction: it is a schema definition, exercised directly, plus the `response_model` the review reads in the router |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit | `test_server_time_response_serializes_now_with_plus_zero_offset_suffix`, `test_get_server_time_reads_clock_on_every_call`, `test_get_time_returns_200_with_now_and_utc_timezone`, `test_get_time_now_ends_with_plus_zero_offset_suffix`, `test_get_time_computes_now_per_request` | verifying it needs no navigation or interaction: it is a property of the test suite itself, met by the unit and integration tests named in rows 1 to 3 |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: UTC` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` with `timezone` equal to `UTC` |
| 2 | `now` is per request, UTC, explicit offset, never naive | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time twice a second apart, Then the two `now` values differ and both end in `+00:00` |
| 3 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the API's OpenAPI document, When a reader opens the `/api/time` GET response, Then it references the `ServerTimeResponse` schema |
| 4 | Unit and integration tests cover shape, offset, freshness | covered at Unit, see Criterion coverage | Given the backend test suite, When the FEAT-1 unit and integration test files run, Then the run passes |

## Manual verification plan
This feature has no UI. Each criterion is verified with an HTTP client against the running backend, or by reading the OpenAPI document or running the tests. The steps use `curl` and assume the compose stack, where the backend is published on `http://localhost:8010` (`docker-compose.yml`). Substitute the port if your stack runs elsewhere.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
Prerequisites: the stack is up (`docker compose up -d --build` from the repo root) and `curl http://localhost:8010/api/version` answers 200.
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body → it is one JSON object with exactly two keys, for example `{"now":"2026-11-27T14:13:48.123456+00:00","timezone":"UTC"}`, and no other keys.
3. Check `timezone` → its value is exactly `UTC`.
4. Check `now` → it is an ISO 8601 date-time (date, `T`, time), and it is within a few seconds of the current UTC time shown by `date -u` in the same terminal.

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two JSON bodies print.
2. Compare the two `now` values → they differ, and the second is about one second later than the first.
3. Look at the end of each `now` value → each ends with exactly `+00:00`. Neither ends with `Z`, and neither has no offset at all.
4. Run `curl -i -X POST http://localhost:8010/api/time` → the status line reads `405 Method Not Allowed` (edge case: the endpoint is read-only).

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Not verifiable through a UI. Check it in the API's own schema document and the code instead.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the 200 response's schema is `ServerTimeResponse`, with the fields `now` (string, date-time format) and `timezone` (string, `UTC`).
2. Open `backend/app/routers/server_time.py` → the route declares `response_model=ServerTimeResponse` and the handler returns a `ServerTimeResponse(...)`, with no dict literal.
3. Open `backend/app/schemas/server_time.py` → it defines `ServerTimeResponse` and `UTC_OFFSET_SUFFIX = "+00:00"`.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Not a UI behaviour. The observable check is a passing test run.
1. From the repo root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary line reports no failed and no errored test, and the command exits 0.
2. Open `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` → each contains a test asserting the response shape, a test asserting the exact `+00:00` suffix, and a test asserting that `now` differs across calls.

## Scope changes

- 2026-11-27 Declined the tracker comment's request (point 2) to add GET /api/echo in this item: no backend/app/routers/echo.py or backend/app/schemas/echo.py is created, and backend/app/main.py registers only the server time router. Reason: /api/echo is the whole scope of work item TEST-06 (its own branch, with TEST-11 and BUG-05 downstream of it), no FEAT-1 acceptance criterion asks for it, and serializing FEAT-1 with TEST-06 on backend/app/main.py meets the goal of landing the registrations together.
- 2026-11-27 Pinned the explicit offset of now to +00:00, not Z, per tracker comment point 3: backend/app/schemas/server_time.py states it as UTC_OFFSET_SUFFIX with a field_serializer, and backend/tests/unit/test_server_time_unit.py and backend/tests/integration/test_server_time_integration.py assert the exact suffix. Reason: the criterion left the offset spelling open, and Pydantic 2 would otherwise emit Z by default.
- 2026-11-27 No service module for GET /api/time, a planned deviation from the Router, Service and Repository layering, per tracker comment point 4: the clock read is current_utc_time() in backend/app/routers/server_time.py and no backend/app/services/ file is created. Reason: reading the clock is neither business logic nor a transactional boundary, there is no data access, and the plan decides which layers exist.
