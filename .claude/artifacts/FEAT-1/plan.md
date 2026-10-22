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
> (The description's "How the measured run uses this item" block is operator instructions, explicitly "not part of the feature", and is not planned.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), stakeholder re-plan request, point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-derived from `backend/app/main.py` at this branch's base, `origin/main` = 129bca3 (HEAD and `origin/main` resolve to the same sha). `73e544c` is a real commit ("feat(TEST-06): Echo endpoint (#35)", 2026-09-14), but it belongs to an earlier round that a later sandbox reset reverted; the TEST-06 code on main today arrived as 23a8605 (PR #270), followed by TEST-07 as 129bca3 (PR #271). What changed in `main.py` since the file held only version, notes and health: 23a8605 added `from app.routers.echo import router as echo_router` and `app.include_router(echo_router)` (+3/-1); 129bca3 added `from app.routers.uptime import router as uptime_router`, `from app.services.uptime_service import capture_startup`, the `app.state.startup = capture_startup()` first statement of `lifespan`, `app.include_router(uptime_router)`, and docstring lines (+11/-5). The insertion point is therefore: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `uptime` router imports (lines 22 and 23, keeping the block alphabetical), and `app.include_router(server_time_router)` goes after `app.include_router(uptime_router)` (line 64), the last registration, immediately before `return app`. The module docstring's list (lines 7-8, "TEST-06 the echo router, and TEST-07 the uptime router plus the startup mark.") gains FEAT-1's time router. `lifespan` and the CORS middleware are not touched: the new endpoint needs no startup state and is a GET, which `allow_methods=["GET", "POST"]` already allows.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on, for two reasons. First, it is already delivered: `backend/app/routers/echo.py` on this branch defines `GET /api/echo` with a required `msg` query parameter (`Query(max_length=ECHO_MSG_MAX_LENGTH)`) returning `EchoResponse(echo=msg)`, and `main.py` line 63 registers it (TEST-06, 23a8605, PR #270, with its own unit and integration tests). Re-adding it would duplicate a route FastAPI would then register twice. Second, it is TEST-06's scope and not one of FEAT-1's four acceptance criteria (`user_story_alignment.md` Section 3). The point's own premise, that the registrations "land together", is moot because the echo registration has already landed. Nothing in this plan touches the echo files.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: **pinned to `Z`.** `now` is serialised as ISO 8601 with the `Z` zero-offset designator, e.g. `2026-10-22T17:29:35.123456Z`, never `+00:00` and never naive. Reasons: it is pydantic's own JSON form of an aware UTC datetime, so no custom serializer is needed, and a serializer would replace `format: date-time` in the OpenAPI document with a bare string (the residual TEST-07 recorded); and it matches `GET /api/uptime`'s `started_at`, so the API's two timestamps share one format. `Z` is RFC 3339's spelling of a zero offset and Python 3.12's `datetime.fromisoformat` parses it to `utcoffset() == timedelta(0)`. The choice is stated in `ServerTimeResponse`'s class docstring and in the `now` field's `Field(description=...)` (so it reaches the OpenAPI document too), and enforced in the schema by a field validator that converts any aware value to UTC. Tests assert the exact suffix: a unit test asserts `model_dump(mode="json")["now"] == "2026-10-22T17:29:35Z"` for a fixed instant, that it `endswith("Z")` and does not contain `+00:00`, and that a `+02:00` input is dumped as the equivalent `Z` instant; an integration test asserts the live response's `now` ends with `Z`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module and no repository. Recorded as a **planned deviation** under Backend Plan. I read `coding_standards/backend_frontend.md` Section 2.2 before citing it: it applies the pattern "when the project includes a backend with data persistence", puts business logic and transactional boundaries in the Service, and parameter validation via schemas in the Router. This project does have persistence (notes), so the pattern applies to the project, and this endpoint has neither business logic nor a transaction nor data access: its whole work is one `datetime.now(UTC)` call. The TEST-06 plan (`.claude/artifacts/TEST-06/plan.md`, Backend Plan) took the same decision for echo ("a pass-through service module would be a layer with nothing in it"). The clock read lives in a one-line module-level function in the router file, `current_utc_time()`, so tests can patch it without patching `datetime`. Note for the reviewer: the siblings are not uniform (TEST-05's version and TEST-07's uptime do have services, because each holds logic: package metadata lookup, monotonic arithmetic); FEAT-1 follows echo, which the feature's Notes name as the shape to follow.
- Comment (tracker), fourteen framework notices "Plan PR opened for FEAT-1: ..." from earlier sandbox rounds → not acted on: they request nothing, and every plan and build they link was reverted by a later sandbox reset; this branch was created fresh from `origin/main` at 129bca3 and no FEAT-1 code exists on it (`backend/app/routers/` holds echo, health, notes, uptime and version only).
- Merged since the last plan: n/a. This is a fresh plan, no earlier `plan.md` exists on this branch, and the dispatch carried no `[merged-since]` lines. The overlap point 1 asks about is answered above against main as it now stands.

## Plan Overview
Backend only. One new read-only endpoint, `GET /api/time`, in TEST-06's router plus schema shape:

- `backend/app/schemas/server_time.py` defines `ServerTimeResponse` (`now: AwareDatetime`, normalised to UTC by a field validator; `timezone: Literal["UTC"] = "UTC"`).
- `backend/app/routers/server_time.py` defines `current_utc_time()` (returns `datetime.now(UTC)`) and the `GET /api/time` handler, which calls it on every request and returns a `ServerTimeResponse` instance (never a dict).
- `backend/app/main.py` imports and registers the router after the uptime router.

No database, no frontend, no service, no new dependency. The router file is named `server_time.py` (not `time.py`, which would shadow nothing at import but reads as the stdlib module in tracebacks and imports); `.claude/feature_map.md`'s BUG-01 row already refers to the file by that name.

Assumptions (`user_story_alignment.md` Section 4):
- "Explicit offset" is satisfied by the `Z` designator (pinned per point 3 above).
- "Two calls a second apart differ" is verified deterministically by patching `current_utc_time` to two instants one second apart, plus one unpatched test proving the value is read at request time (it lies between timestamps taken immediately before and after the request), so no test sleeps.
- `timezone` is the constant string `"UTC"`, declared as `Literal["UTC"]` so the OpenAPI document states it is fixed.
- The route is `GET` only; any other method returns FastAPI's 405.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, 200, `ServerTimeResponse`. Router `backend/app/routers/server_time.py`: `router = APIRouter(prefix="/api", tags=["time"])`; `@router.get("/time", response_model=ServerTimeResponse)`; handler `get_server_time() -> ServerTimeResponse` returning `ServerTimeResponse(now=current_utc_time())`. `current_utc_time() -> datetime` is a module-level function returning `datetime.now(UTC)`, looked up by name at call time so a test's `monkeypatch.setattr(server_time, "current_utc_time", ...)` takes effect. Module docstring: `"""Router for GET /api/time (FEAT-1)."""`.
- Registration in `backend/app/main.py`: import `from app.routers.server_time import router as server_time_router` between the notes and uptime router imports; `app.include_router(server_time_router)` after `app.include_router(uptime_router)`; module docstring's feature list gains "and FEAT-1 the time router". Nothing else in the file changes.
- Service layer: none. **Planned deviation from `coding_standards.md` Section 2.2 (Router -> Service -> Repository)**, recorded at the stakeholder's request (Re-Plan Feedback point 4): the endpoint holds no business logic and no transactional boundary, only a clock read, so a service module would be a layer with nothing in it. Same decision as TEST-06's echo endpoint. The builder lists it in the PR description's deviations.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no parameters, no body.
- Response: 200, `application/json`, schema `ServerTimeResponse`:
  ```json
  {"now": "2026-10-22T17:29:35.123456Z", "timezone": "UTC"}
  ```
  `now`: string, `format: date-time`, the server's current UTC instant read when the request is handled, ISO 8601 with the `Z` zero-offset designator (microseconds present when non-zero, as pydantic emits them). `timezone`: string, always `"UTC"`. Both required.
- Other methods (e.g. `POST /api/time`): 405, FastAPI's default body.

## Technology Selection
- Reading the current time (`routers/server_time.current_utc_time`): chose the standard library's `datetime.now(UTC)` over any dependency; nothing else is needed.
- Serialising `now` with an explicit UTC offset: chose pydantic's built-in `AwareDatetime` and its default JSON serialisation (installed with FastAPI) over a hand-written `field_serializer` producing `+00:00`, because the default already emits ISO 8601 with `Z` and keeps `format: date-time` in the OpenAPI document, which a serializer's `-> str` annotation would replace.
- Rejecting naive values and normalising to UTC: chose `AwareDatetime` (rejects naive) plus a pydantic `field_validator` calling `astimezone(UTC)` over a check in the handler, because the schema is where criterion 3 puts the contract.
- Constant `timezone` field: chose `typing.Literal["UTC"]` (stdlib) over a free `str`, so the fixed value is declared rather than conventional.
- Service module: none chosen (see Backend Plan's planned deviation); no stdlib call or dependency is needed beyond the clock read.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime = Field(description=...)` naming the `Z` format, a `field_validator("now")` converting to UTC, and `timezone: Literal["UTC"] = "UTC"`; class docstring states the pinned `Z` choice and why.
- [B] backend/app/routers/server_time.py: `current_utc_time()` and the `GET /api/time` router returning `ServerTimeResponse`.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema, the clock function and the OpenAPI declaration (see Testing Strategy).
- [B] backend/tests/integration/test_server_time_integration.py: router tests through the shared `client` fixture (see Testing Strategy).
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the time router between the notes and uptime imports, `app.include_router(server_time_router)` after the uptime registration, docstring list extended.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route`, asserting `/api/time` is among the custom route paths, in the same shape as the echo and uptime tests.

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints. No E2E spec is produced, because no criterion's covering tier is E2E (Criterion coverage below).

## Testing Strategy
- Unit tests: `backend/tests/unit/test_server_time_unit.py`, schema and clock function, no lifespan needed except the OpenAPI test, which calls `create_app().openapi()` like `test_uptime_unit.py`.
  - `test_server_time_response_serializes_now_with_z_suffix`: happy path, `ServerTimeResponse(now=datetime(2026, 10, 22, 17, 29, 35, tzinfo=UTC)).model_dump(mode="json")` equals `{"now": "2026-10-22T17:29:35Z", "timezone": "UTC"}`; the `now` string `endswith("Z")`, does not contain `"+00:00"`, and `datetime.fromisoformat` of it has `utcoffset() == timedelta(0)` (the exact-suffix test point 3 asks for).
  - `test_server_time_response_keeps_microseconds_before_z`: edge case, an instant with `microsecond=123456` dumps as `"2026-10-22T17:29:35.123456Z"`.
  - `test_server_time_response_normalises_non_utc_offset_to_z`: edge case, `now=datetime(2026, 10, 22, 19, 29, 35, tzinfo=timezone(timedelta(hours=2)))` dumps as `"2026-10-22T17:29:35Z"`.
  - `test_server_time_response_with_naive_now_raises_validation_error`: error case, a naive datetime raises `ValidationError`.
  - `test_server_time_response_with_other_timezone_raises_validation_error`: error case, `timezone="Europe/Brussels"` raises `ValidationError`.
  - `test_current_utc_time_returns_aware_utc_now`: happy path, `tzinfo` is not None, `utcoffset() == timedelta(0)`, and it lies between `datetime.now(UTC)` readings taken before and after the call.
  - `test_openapi_declares_server_time_response_fields`: `create_app().openapi()`; the `/api/time` GET 200 response `$ref`s a component (looked up by the name the `$ref` names, no hardcoded suffix) whose `now` is `type: string` with `format: date-time`, whose `timezone` is a string constrained to `"UTC"` (`const` or a one-item `enum`, whichever pydantic emits), and whose `required` includes `now` (and `timezone` if pydantic lists a defaulted field as required in serialisation mode; assert `now` strictly and `timezone`'s presence in `properties`).
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py`
  - Also: `backend/tests/unit/test_main_unit.py` gains `test_create_app_registers_time_route`.
- Integration tests: `backend/tests/integration/test_server_time_integration.py`, the real HTTP cycle through the session-scoped `client` fixture in `backend/tests/conftest.py`. No database needed.
  - `test_get_time_returns_200_with_now_and_timezone`: status 200, body keys exactly `{"now", "timezone"}`, `timezone == "UTC"`, `now` ends with `"Z"`, and `datetime.fromisoformat(now).utcoffset() == timedelta(0)`.
  - `test_get_time_returns_different_now_for_calls_a_second_apart`: `monkeypatch.setattr(server_time, "current_utc_time", ...)` to `2026-10-22T17:29:35Z`, call; then to one second later, call; the two `now` strings differ and their parsed difference is exactly `timedelta(seconds=1)`. Deterministic, no sleep.
  - `test_get_time_reads_the_clock_at_request_time`: unpatched; take `before = datetime.now(UTC)`, call, take `after`; the parsed `now` satisfies `before <= now <= after`, which proves it is computed per request rather than at import or startup.
  - `test_post_time_returns_405`: error case, `POST /api/time` returns 405.
  - Directory: `backend/tests/integration/`
- E2E tests: E2E Tests is ENABLED, but not warranted. No criterion requires navigation or interaction through the UI: the endpoint has no frontend consumer and the item adds none (`testing_standards.md` Section 6, fourth question asked per criterion; Section 4's E2E row is scoped to E2E-tier criteria).
  - Directory: `e2e/tests/`
  - File: none (would be `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one scenario per criterion plus one edge case (a non-GET method returns 405), written in API terms like TEST-06's and TEST-07's.
  - Directory: `e2e/uat/scenarios/` (`FEAT-1_server_time_endpoint.feature`), manual script in `e2e/uat/scripts/` (`FEAT-1_server_time_endpoint_uat_script.md`).

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | Integration | verifying it needs no navigation or interaction: it is a router request/response cycle with no UI consumer |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration (plus Unit for the `Z` suffix, the UTC normalisation and the naive rejection) | verifying it needs no navigation or interaction: it is router behaviour over a patched clock and the schema's serialisation |
| 3 | Body defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict | Unit | verifying it needs no navigation or interaction: it is the schema's declaration and the generated OpenAPI document |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit and Integration | verifying it needs no navigation or interaction: the criterion is the existence and passing of the two backend test modules named above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/time, Then the status is 200 and the body holds exactly `now` and `timezone` with `timezone` equal to "UTC" |
| 2 | per request, UTC, explicit offset, never naive | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/time twice a second apart, Then the two `now` values differ by about one second and each ends in "Z" |
| 3 | Pydantic schema, not a bare dict | covered at Unit, see Criterion coverage | Given the OpenAPI document, When I read the /api/time 200 response, Then it references `ServerTimeResponse` with `now` as a date-time string |
| 4 | tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the repository, When I run the FEAT-1 unit and integration test files, Then they report 0 failed |

## Manual verification plan
No UI consumes this endpoint, so every criterion is verified against the running backend with curl, the OpenAPI document and the test suite, as TEST-06's and TEST-07's scripts were.

Shared prerequisites for every block: Docker running; repository on `feature/FEAT-1-server-time-endpoint`; from the repository root `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running, published on `http://localhost:8010` (the `8010:8010` mapping in `docker-compose.yml`); a terminal with `curl` and `python3`.

### Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`
Prerequisites: the shared prerequisites above.
1. Run `curl -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers.
2. Read the body printed by step 1 → one JSON object with exactly two keys: `now`, a quoted string such as `"2026-10-22T17:29:35.123456Z"`, and `timezone`, the string `"UTC"`; nothing else.

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
Prerequisites: the shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two JSON bodies are printed.
2. Compare the two `now` values → they differ, and the second is about one second later than the first (between 1.0 and roughly 1.2 seconds, allowing for curl's own time).
3. Read either `now` value → it ends in `Z` (the pinned zero-offset designator); it never ends in `+00:00` and never ends with no designator at all.
4. Run `python3 -c "from datetime import datetime; print(datetime.fromisoformat('PASTE_NOW_HERE').utcoffset())"`, replacing `PASTE_NOW_HERE` with a `now` value from step 1 → it prints `0:00:00`.
5. Run `date -u +%Y-%m-%dT%H:%M:%SZ` and immediately `curl -s http://localhost:8010/api/time` → `now` matches the printed UTC time to within a couple of seconds (the container and host share the host clock).

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict
Prerequisites: the shared prerequisites above.
1. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (its docstring and field description name the `Z` format) and `timezone: Literal["UTC"]`.
2. Open `backend/app/routers/server_time.py` → the route declares `response_model=ServerTimeResponse` and returns `ServerTimeResponse(...)`, not a dict literal; there is no import from `app.services`.
3. Run `curl -s http://localhost:8010/openapi.json` and find `paths`, `/api/time`, `get`, `responses`, `200` → its schema is a `$ref` to a `components.schemas` entry named for `ServerTimeResponse`; in it `now` is `"type": "string"` with `"format": "date-time"` and `timezone` is restricted to `"UTC"`.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: the repository checked out on `feature/FEAT-1-server-time-endpoint`, `uv` installed; no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the run reports `0 failed` for those three files.
2. Open `backend/tests/unit/test_server_time_unit.py` → it contains a test asserting the exact `Z` suffix (`test_server_time_response_serializes_now_with_z_suffix`) and one rejecting a naive datetime.
3. Open `backend/tests/integration/test_server_time_integration.py` → it contains the shape test (`test_get_time_returns_200_with_now_and_timezone`) and the two freshness tests (`test_get_time_returns_different_now_for_calls_a_second_apart`, `test_get_time_reads_the_clock_at_request_time`).
