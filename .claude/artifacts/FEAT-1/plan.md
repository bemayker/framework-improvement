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
> (The tracker description's "How the measured run uses this item" block is operator instructions, explicitly not part of the feature, and is not planned.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: checked against the code, not the claim. 73e544c (`feat(TEST-06): Echo endpoint (#35)`) is in `origin/main`'s history and did add `from app.routers.echo import router as echo_router` and `app.include_router(echo_router)` to `create_app()`. But it is no longer on main as it now stands: the later sandbox reset 4971122 (`chore: reset the sandbox for release run 0.3.443 ... (#312)`) removed `backend/app/routers/echo.py`, `backend/app/schemas/echo.py`, the echo tests and the echo registration (and also the earlier FEAT-1, TEST-07 uptime and server_time files). On this branch (cut from `origin/main` at 96c40ac) `backend/app/main.py` imports `health_router`, `notes_router`, `version_router` and registers them in the order version, notes, health. What changed relative to the comment's premise: there is no echo registration to sit beside. Insertion point: add `from app.routers.server_time import router as server_time_router` between the `notes` and `version` imports (alphabetical, matching the existing block), and `app.include_router(server_time_router)` as the last line before `return app`, after `app.include_router(health_router)`. The module docstring's list of registered routers gets one clause for FEAT-1. No existing line is moved or rewritten.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on because: `GET /api/echo` is TEST-06's own scope (`.claude/feature_map.md` row TEST-06 "Echo endpoint", with TEST-11 and BUG-05 queued on top of it, which specify trimming vs keeping whitespace and would build against whichever echo contract exists). None of FEAT-1's four acceptance criteria asks for it, and `user_story_alignment.md` Section 3 forbids adding an unrequested endpoint; building it here would also fork the echo contract away from the item that owns it (TEST-06's plan carries a `max_length` 422 rule the comment's one-line spec does not mention) and would mark TEST-06's work as done under FEAT-1's PR. Assumption recorded instead of a blocking question: if the stakeholder wants echo back on main, the route is to re-open TEST-06 (its code was removed by reset #312), not to widen FEAT-1. FEAT-1 stays one router, one schema, its tests.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`. Reason: the criterion says "explicit offset", and `+00:00` is a numeric offset while `Z` is a zone designator; `+00:00` is also what Python's own `datetime.isoformat()` produces for a UTC-aware value. The choice is stated in `backend/app/schemas/server_time.py` as a module constant `UTC_OFFSET_SUFFIX = "+00:00"`, in the field description, and enforced by a `field_serializer` on `now`. This matters because Pydantic 2.13.4 (the version in `backend/uv.lock`) serialises a UTC datetime with a `Z` suffix by default in JSON mode, so without the serializer the response would silently say `Z`. Tests: a unit test asserts `model_dump(mode="json")["now"].endswith("+00:00")` and that it does not end in `Z`; an integration test asserts the HTTP body's `now` ends with exactly `+00:00`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/` module is planned. Verified the precedent: TEST-06's plan at 73e544c recorded exactly this deviation (no `echo_service.py`, "Section 2.2's Router → Service → Repository pattern is for business logic and transactional boundaries"). Section 2.2's actual text (read in `coding_standards/backend_frontend.md`) says the Router has "NO business logic", the Service "contains business logic" and holds "transactional boundaries"; it does not literally scope the pattern that way, so this is recorded below in `## Backend Plan` as a planned deviation with its reason rather than as conformance. The router keeps no logic beyond reading the clock and building the response model.

## Plan Overview
Backend only. Add `GET /api/time` as one router (`backend/app/routers/server_time.py`) and one Pydantic response schema (`backend/app/schemas/server_time.py`), registered in `create_app()` in `backend/app/main.py` the same way the version and health routers are. The router reads the clock on every request through a module-level `utc_now()` function (`datetime.now(timezone.utc)`), so nothing is computed at import time and tests can substitute the clock. The schema types `now` as Pydantic's `AwareDatetime` (a naive value is rejected at construction), types `timezone` as `Literal["UTC"]`, and serialises `now` converted to UTC with the pinned `+00:00` suffix. No frontend, no service or repository module, no database access, no migration, no new dependency. Tests: a unit module for the schema and the clock function, an integration module for the HTTP cycle, and one registration test added to the existing `test_main_unit.py` (the TEST-02 and TEST-05 precedent).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time as `ServerTimeResponse`. Router `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time() -> ServerTimeResponse` with `response_model=ServerTimeResponse`, body `return ServerTimeResponse(now=utc_now(), timezone="UTC")`. `utc_now()` is a public module-level function in the same router module returning `datetime.now(timezone.utc)`; the handler must call it through the module attribute so a `monkeypatch.setattr(server_time, "utc_now", ...)` takes effect.
- Schema: `backend/app/schemas/server_time.py` defines `UTC_OFFSET_SUFFIX = "+00:00"` and `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` and `timezone: Literal["UTC"]`, plus `@field_serializer("now")` returning `value.astimezone(timezone.utc).isoformat()`. A docstring states the pinned suffix and why (`+00:00` over `Z`, see Re-Plan Feedback point 3). A non-UTC aware input (for example `+02:00`) is converted to the same instant in UTC, never echoed with its own offset.
- Service layer: none. Planned deviation from `coding_standards.md` Section 2.2: no `backend/app/services/server_time_service.py`. Reading the system clock is not business logic and has no transactional boundary, so a service would be a one-line pass-through with nothing to test in isolation, which `user_story_alignment.md` Section 3 treats as gold plating; this follows the decision recorded on TEST-06's plan and the tracker comment (point 4). The existing routers keep a service only where there is logic to hold (version resolution, the database probe), so the local precedent agrees. Listed in the PR description as a deliberate deviation.
- Repository layer: none, no data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no parameters, no body.
- Response: 200, `application/json`, `ServerTimeResponse`:
  `{"now": "2026-10-24T05:40:28.123456+00:00", "timezone": "UTC"}`
  `now` is an ISO 8601 timestamp in UTC that always ends in exactly `+00:00` (never `Z`, never naive), computed at request time; microseconds appear when non-zero, per `isoformat()`. `timezone` is always the literal string `UTC`. Other methods on the path (for example POST) get FastAPI's 405.

## Technology Selection
- `GET /api/time` router (`backend/app/routers/server_time.py`): chose the standard library's `datetime.now(timezone.utc)` and the installed FastAPI `APIRouter` over any time library (`pendulum`, `arrow`) or an NTP client, because the stdlib already gives an aware UTC instant and the feature asks for the server's own clock.
- `ServerTimeResponse` schema (`backend/app/schemas/server_time.py`): chose the installed Pydantic's `AwareDatetime` type plus one `field_serializer` over a hand-written naive-check validator and over string formatting in the router, because `AwareDatetime` already rejects naive values and the serializer is the one place the `+00:00` suffix can be pinned against Pydantic's default `Z`.
- Clock service module: not created; chose calling the stdlib clock from the router over a net-new `services/server_time_service.py`, because there is no business logic or transaction for a service to own (recorded as the Section 2.2 deviation above).
- Dependencies: no new dependency; FastAPI and Pydantic are already installed (`backend/pyproject.toml`, `backend/uv.lock`).

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router with the `utc_now()` clock function
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema and the pinned `UTC_OFFSET_SUFFIX`
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (shape, `+00:00` suffix, naive rejected, non-UTC converted, `timezone` literal enforced) and for `utc_now()` (aware, UTC, advances between calls)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time` (200 and exact key set, exact suffix, per-request freshness, 405 on POST)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/main.py: import `server_time_router` and register it after `health_router` in `create_app()`; docstring clause for FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom paths

No dependency change, so no lockfile (`backend/uv.lock`, `package-lock.json`) is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds one route and changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints. No `[D]` file: no criterion is assigned to E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `ServerTimeResponse` and `utc_now()`. Schema: an aware UTC value dumps (`mode="json"`) to exactly the keys `now` and `timezone`; `now` ends with `+00:00` and not `Z`; `timezone == "UTC"`; a naive `datetime` raises `ValidationError` (error case); an aware `+02:00` value is serialised as the same instant in UTC with `+00:00` (edge case); `timezone="Europe/Brussels"` raises `ValidationError`. Clock: `utc_now()` returns a value whose `tzinfo` is not None and whose `utcoffset()` is zero; two calls are non-decreasing. Names follow `test_{method_or_action}_{scenario}_{expected_outcome}`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_server_time_unit.py`; the registration test goes in the existing `test_main_unit.py`
- Integration tests: `GET /api/time` through the session `client` fixture in `backend/tests/conftest.py` (no database needed). Cases: 200 with exactly the keys `{"now", "timezone"}` and `timezone == "UTC"`; `now` ends with `+00:00` and parses with `datetime.fromisoformat` to an aware value with zero offset; with the real clock, the returned `now` lies between a `datetime.now(timezone.utc)` taken just before and just after the request (proves request-time computation); per-request freshness, deterministic and without sleeping: `monkeypatch.setattr` on `app.routers.server_time.utc_now` with a fake returning `2026-10-24T05:00:00+00:00` then `2026-10-24T05:00:01+00:00`, two calls return those two distinct values exactly one second apart; `POST /api/time` returns 405 (the only reachable error case, as for `/api/version`).
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. E2E Tests is ENABLED, but no criterion requires navigation or interaction through the UI: the endpoint has no frontend surface, and an E2E test that calls the API directly is a router integration test (`testing_standards.md` Section 5). So no spec is written under `e2e/tests/`, and the per-feature edge-case spec does not apply because E2E is not warranted at all.
  - Directory: e2e/tests/
  - File: none (would be `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one scenario per criterion plus one edge case (two requests one second apart return different `now` values), written as API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration and Unit | verifying it needs no navigation or interaction: freshness is an HTTP-cycle behaviour (integration, fake clock), the offset and naive rejection are schema rules (unit) |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a code-structure rule, checked by unit tests constructing `ServerTimeResponse` and by the router's `response_model` exercised in integration |
| 4 | Unit and integration tests cover shape, offset and per-request freshness | Unit and Integration | verifying it needs no navigation or interaction: it is satisfied by the existence and passing of the two test modules themselves |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone`, with `timezone` = `UTC` |
| 2 | `now` per request, UTC, explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client sends GET /api/time twice one second apart, Then the two `now` values differ and both end in `+00:00` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API's OpenAPI document, When a reader looks up the GET /api/time 200 response, Then it references the `ServerTimeResponse` schema |
| 4 | Unit and integration tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the FEAT-1 unit and integration modules run, Then 0 tests fail |

## Manual verification plan
Prerequisites (shared by every block): Docker running; the stack up via `docker compose up -d --build` from the repository root; `docker compose ps` shows the `backend` service running; a terminal with `curl`; the backend is published on the host at `http://localhost:8010` (from `docker-compose.yml`). This feature has no UI, so every check below is an HTTP or terminal check rather than a click path.

### Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`
1. In the terminal, run `curl -s -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body printed after the headers → it is one JSON object with exactly two keys, `now` and `timezone`, for example `{"now":"2026-10-24T05:40:28.123456+00:00","timezone":"UTC"}`.
3. Check the `timezone` value → it is exactly the string `UTC`.
4. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the endpoint is listed and its 200 example shows `now` and `timezone`.

### Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive
1. Run `curl -s http://localhost:8010/api/time`, wait one second, and run the same command again → the two `now` values are different, and the second is about one second later than the first.
2. Look at the end of each `now` value → each ends in exactly `+00:00`, never in `Z` and never with no offset at all.
3. In the terminal, run `date -u +%Y-%m-%dT%H:%M:%S` right after a curl call → the date, hour and minute match the `now` the API returned (the server reports UTC, not the host's local time).

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)` with the fields `now` and `timezone`, and the constant `UTC_OFFSET_SUFFIX = "+00:00"`.
2. Open `backend/app/routers/server_time.py` → the route declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse(...)`, with no dict literal built in the handler.
3. Run `curl -s http://localhost:8010/openapi.json` and search the output for `ServerTimeResponse` → the schema appears under `components.schemas` and the `/api/time` 200 response references it.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
1. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the summary line reports `0 failed`, and no test in it is skipped (the module needs no database).
3. Open `backend/tests/integration/test_server_time_integration.py` → there is one test for the 200 shape, one asserting the `+00:00` suffix, and one for per-request freshness with a substituted clock.
