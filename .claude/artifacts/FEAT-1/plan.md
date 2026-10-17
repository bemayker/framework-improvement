# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> **FEAT-1: Server time endpoint** (ClickUp task 123k99ctzxk, status to do, no tags)
>
> A small backend feature created 2026-09-07 for measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010). It exists to overlap a commit that lands on `main` during the run: it registers a router in `backend/app/main.py`, the file TEST-06 and TEST-07 also change.
>
> **What.** `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> **Acceptance criteria.** Listed verbatim under `## Acceptance Criteria` below.
>
> **Notes.** Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The description's section "How the measured run uses this item" holds operator instructions for a measurement and is explicitly not part of the feature; nothing in this plan derives from it.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
Section 3 fetched 12 top-level tracker comments and 0 threaded replies. This is a first plan on the current branch (FEAT-1 was built, merged and then reverted by 33b4dd7, PR #213), planned against `main` at 33b4dd7 as it stands now. A tracker comment overrides the description where the two disagree.

- Comment (tracker), eleven framework-written "Plan PR opened for FEAT-1: ..." link comments from earlier, since-reverted plan rounds → Not acted on as requests: they ask for nothing. Read as history only.
- Comment (tracker), newest of those link comments: "Plan PR opened for FEAT-1: https://github.com/bemayker/framework-improvement/pull/192 — This is a fresh plan against main at cf617b3, after TEST-06 (#190) and TEST-07 (#191) merged. The plan's ## Re-Plan Feedback section answers each point of the four-point comment. Point 1: the insertion point was re-derived against current main. The import goes between the notes and uptime router imports, and the registration goes after uptime_router. Point 2: adding GET /api/echo is not acted on, because TEST-06 already put it on main. Point 3: the offset is pinned to +00:00 by reusing the UtcTimestamp type from backend/app/schemas/uptime.py. Unit and integration tests assert it as an exact suffix. Point 4: there is no service module. This is recorded as a planned deviation from coding_standards.md Section 2.2." → Informational record of a reverted plan, not a request. Each decision it records was re-derived from the code on this branch below rather than copied; all four still hold against 33b4dd7.
- Comment (tracker), the one actionable comment, unresolved: "Re-plan requested before build. Four points, please answer each one explicitly in the revised plan." → Answered point by point in the next four lines.
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: insertion point re-derived from `backend/app/main.py` on this branch (equal to current main, 33b4dd7). What changed since the item was written: main now imports and registers five routers, version, notes, health, echo (TEST-06) and uptime (TEST-07), and the lifespan hook captures `app.state.process_start` (TEST-07). The imports are alphabetical by module (`echo`, `health`, `notes`, `uptime`, `version`), so `from app.routers.server_time import router as server_time_router` goes between the `notes` and `uptime` import lines. Registration is in merge order, so `app.include_router(server_time_router)` goes as the last line before `return app`, after `app.include_router(uptime_router)`. The module docstring gains one clause naming FEAT-1 and the time router. The lifespan hook and the CORS middleware are untouched.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on because `GET /api/echo` already exists on main: TEST-06 (merged, status done) added `backend/app/routers/echo.py`, `backend/app/schemas/echo.py` (`EchoResponse`, 200-character `msg` limit) and its registration in `backend/app/main.py`, with tests in `backend/tests/integration/test_echo_integration.py`. Adding it again would register a duplicate router on the same path, and it is outside FEAT-1 acceptance criteria (`user_story_alignment.md` Section 3). FEAT-1 adds only `GET /api/time`.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is pinned to `+00:00`, never `Z`. Reason: it is the explicit numeric offset the criterion asks for, and it matches the convention main already serves, since `GET /api/uptime` emits `started_at` with `+00:00` through the `UtcTimestamp` alias in `backend/app/schemas/uptime.py`. The new `ServerTimeResponse` declares `now: UtcTimestamp`, reusing that alias rather than re-declaring the serializer, and its docstring states the `+00:00` choice. Exact-suffix assertions: unit test `test_server_time_response_serialises_now_with_plus_zero_offset` asserts the full string `2026-10-17T09:15:02.123456+00:00` for a fixed UTC instant, and integration test `test_get_time_now_ends_with_plus_zero_offset` asserts the live body value `endswith("+00:00")` and does not end with `Z` (see `## Testing Strategy`).
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router → Service → Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: planned deviation from `coding_standards.md` Section 2.2 (Layered Architecture, in `rules/coding_standards/backend_frontend.md`). FEAT-1 adds no service and no repository module: the router calls `datetime.now(timezone.utc)` and returns a `ServerTimeResponse`. Section 2.2 places business logic and transactional boundaries in the service and data access in the repository; reading the clock is neither, there is no persistence, and TEST-06 (`echo.py`) takes the same router-plus-schema shape on main. Section 2.2's own router rule (no business logic in the router) still holds, because the router does no computation beyond reading the clock. Also recorded under `## Backend Plan`.
- Merged since the last plan: n/a. This is a fresh plan branched from current main (33b4dd7); there is no earlier plan on this branch for main to have overtaken, so the merged-since check is empty by construction rather than clean.

## Plan Overview
One read-only backend endpoint, `GET /api/time`, and nothing else. Three backend files are created and one is modified: a Pydantic response schema `ServerTimeResponse` in `backend/app/schemas/server_time.py` (reusing the existing `UtcTimestamp` alias, so `now` always serialises in UTC with a `+00:00` offset and a naive value is rejected), a router in `backend/app/routers/server_time.py` that builds the response from `datetime.now(timezone.utc)` on every request, and the router import plus registration in `backend/app/main.py`. No service, repository, migration, database access, frontend change, external API or new dependency. Tests: a schema unit test file, a route-registration unit test added to `test_main_unit.py`, and an integration test file through the shared `TestClient`. No criterion needs the UI, so no E2E spec is written; the UAT Gherkin scenarios and the manual UAT script verify the endpoint over HTTP.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this feature renders nothing).

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time in UTC so a client can detect clock skew. Router `backend/app/routers/server_time.py` with `router = APIRouter(prefix="/api", tags=["time"])` and one handler `get_time() -> ServerTimeResponse` decorated `@router.get("/time", response_model=ServerTimeResponse)`, the TEST-06 `echo.py` shape. The handler body is a single statement returning `ServerTimeResponse(now=datetime.now(timezone.utc))`, evaluated inside the handler so every request reads the clock afresh (criterion 2). No default value, module-level constant, `lru_cache` or app-state capture holds the time.
- Schema: `backend/app/schemas/server_time.py` defines `class ServerTimeResponse(BaseModel)` with `now: UtcTimestamp` (imported from `app.schemas.uptime`) and `timezone: Literal["UTC"] = "UTC"`. `UtcTimestamp` is `AwareDatetime`, so a naive datetime fails validation, and its JSON serializer converts to UTC and emits `isoformat()`, giving the pinned `+00:00` offset (never `Z`). The class docstring states that `now` is serialised in UTC with the explicit `+00:00` offset. `Literal["UTC"]` rejects any other value at construction and publishes a one-value constraint in the OpenAPI document.
- Registration: `backend/app/main.py` imports `from app.routers.server_time import router as server_time_router` between the `notes` and `uptime` router imports, and calls `app.include_router(server_time_router)` after `app.include_router(uptime_router)`. The module docstring gains a clause naming FEAT-1 and the time router. Nothing else in `main.py` changes.
- Service layer: none, a planned deviation from `coding_standards.md` Section 2.2 (tracker comment point 4). Reading the clock is neither business logic nor a transactional boundary, and there is no persistence; TEST-06 echo takes the same router-plus-schema shape on main.
- Repository layer: none, no data access.
- Migrations: none.
- Errors: no error path specific to this endpoint. Unsupported methods get FastAPI 405 and are covered by one integration test.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no path parameters, no query parameters, no body.
- Response: 200, `application/json`, body serialised from `ServerTimeResponse`, always exactly two keys. `now` is an ISO 8601 string, the server time at the moment the request was handled, in UTC, always ending in the explicit offset `+00:00`, with microseconds when the clock has them. `timezone` is the string `UTC`, always. In the OpenAPI document the 200 response references `ServerTimeResponse`; `now` is `type: string, format: date-time` and listed in `required`; `timezone` is a string property restricted to the single value `UTC` with default `UTC` (whether it also appears in `required` is the installed FastAPI and Pydantic default for a field with a default, and tests do not assert it). Example body:

```json
{"now": "2026-10-17T09:15:02.123456+00:00", "timezone": "UTC"}
```

## Technology Selection
- Current-time source in `backend/app/routers/server_time.py`: chose the standard library `datetime.now(timezone.utc)` (rung 1) over any time or clock dependency, because it returns an aware UTC datetime per call, which is all criteria 1 and 2 need. No new dependency.
- UTC serialisation with the pinned `+00:00` offset in `backend/app/schemas/server_time.py`: chose the existing `UtcTimestamp` alias from `backend/app/schemas/uptime.py` (rung 3, built on Pydantic, already installed) over a second hand-written serializer or a `Z`-suffixed Pydantic default, because it already rejects naive datetimes, normalises to UTC, emits `+00:00` and publishes `format: date-time`, and reusing it keeps the two time-bearing endpoints on one convention.
- `timezone` field: chose `typing.Literal["UTC"]` (rung 1, standard library) over an `Enum` class or a free `str`, because one fixed value needs no new type and a free string would accept a wrong value.
- `ServerTimeResponse` model and the router: Pydantic `BaseModel` and FastAPI `APIRouter`, both already installed (rung 3); no stdlib or native alternative produces a validated, OpenAPI-published response model, so nothing else was considered.
- Test tooling: pytest, FastAPI `TestClient` and the shared `client` fixture in `backend/tests/conftest.py`, all already installed; per-request freshness is checked with stdlib `time.sleep` like the TEST-07 uptime tests, so no time-freezing library is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, `now: UtcTimestamp` (reused from `app.schemas.uptime`, pinned `+00:00` offset, naive rejected) and `timezone: Literal["UTC"] = "UTC"`, docstring stating the offset choice.
- [B] backend/app/routers/server_time.py: `GET /api/time` router (`prefix="/api"`, `response_model=ServerTimeResponse`) returning `ServerTimeResponse(now=datetime.now(timezone.utc))` per request; no service module (planned deviation, `coding_standards.md` Section 2.2).
- [B] backend/tests/unit/test_server_time_schema_unit.py: unit tests for `ServerTimeResponse` serialisation: exact `+00:00` string for a fixed UTC instant, a `+02:00` input normalised to the same UTC instant, a naive datetime rejected, a non-`UTC` timezone value rejected, `timezone` defaulting to `UTC`.
- [B] backend/tests/integration/test_server_time_integration.py: integration tests through the shared `TestClient` for criteria 1, 2 and 4: 200 with exactly the two keys, `timezone` equal to `UTC`, `now` ending in `+00:00` and parsing as aware with zero offset and close to the test clock, two calls a second apart differing by at least one second, OpenAPI declaring `ServerTimeResponse`, and `POST /api/time` returning 405.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus the edge case that the offset is `+00:00` and not `Z` (UAT Generation ENABLED).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from this plan's `## Manual verification plan`.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the `notes` and `uptime` router imports, register it after `uptime_router`, and add a docstring clause naming FEAT-1.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route_with_server_time_response_model`, asserting `/api/time` is among the custom routes and its route `response_model` is `ServerTimeResponse` (criterion 3).

No lockfile changes: the feature adds no dependency, so `backend/uv.lock`, `backend/pyproject.toml` and `frontend/package-lock.json` are untouched.
No `README.md` or `docs/DEVELOPMENT.md` edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API endpoints.
No E2E spec file: no acceptance criterion needs navigation or interaction through the UI (see `### Criterion coverage`).

## Testing Strategy
- Unit tests: the `ServerTimeResponse` schema and the route registration, no HTTP and no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_server_time_schema_unit.py` (the TEST-07 `test_uptime_schema_unit.py` precedent) plus one test added to the existing `test_main_unit.py`.
  - `test_server_time_response_serialises_now_with_plus_zero_offset`: happy path, a fixed instant `datetime(2026, 10, 17, 9, 15, 2, 123456, tzinfo=timezone.utc)` dumped with `model_dump(mode="json")` gives `now` equal to exactly `2026-10-17T09:15:02.123456+00:00` and `timezone` equal to `UTC`. This is the exact-suffix assertion tracker comment point 3 asks for.
  - `test_server_time_response_normalises_non_utc_aware_now_to_utc`: edge case, the same instant given at `+02:00` serialises to the same `+00:00` string.
  - `test_server_time_response_rejects_naive_now`: error case, a naive datetime raises `ValidationError` (criterion 2, never naive).
  - `test_server_time_response_rejects_timezone_other_than_utc`: error case, `timezone="Europe/Brussels"` raises `ValidationError`.
  - `test_server_time_response_defaults_timezone_to_utc`: edge case, constructing with `now` only gives `timezone` equal to `UTC`.
  - `test_create_app_registers_time_route_with_server_time_response_model` in `test_main_unit.py`: `/api/time` is among the custom routes and its `response_model` is `ServerTimeResponse` (criterion 3).
- Integration tests: `GET /api/time` through the full request/response cycle with the session `client` fixture from `backend/tests/conftest.py`. No database is involved, so these tests need no `DATABASE_URL` and never skip.
  - Directory: backend/tests/integration/
  - File: `test_server_time_integration.py`
  - `test_get_time_returns_200_with_now_and_utc_timezone`: status 200, `content-type` is `application/json`, the body keys are exactly `now` and `timezone`, and `timezone` equals `UTC` (criterion 1).
  - `test_get_time_now_ends_with_plus_zero_offset`: the body `now` string ends with `+00:00` and does not end with `Z` (criteria 1 and 2, the pinned offset as an exact suffix on the live response).
  - `test_get_time_now_is_aware_utc_and_taken_at_request_time`: take `before = datetime.now(timezone.utc)`, call the endpoint, take `after`; `datetime.fromisoformat(now)` has `utcoffset()` equal to `timedelta(0)` and lies between `before` and `after` (criterion 2, computed per request and never naive).
  - `test_get_time_now_differs_between_calls_a_second_apart`: two calls separated by `time.sleep(1.0)`; the parsed values differ and the second is at least one second later than the first (criterion 2 freshness).
  - `test_openapi_declares_server_time_response_schema`: in `/openapi.json`, the `/api/time` GET 200 response references `#/components/schemas/ServerTimeResponse`, `now` is `type` string with `format` date-time and is in `required`, and `timezone` is a property (criterion 3).
  - `test_post_time_returns_405_method_not_allowed`: the only reachable error case, the endpoint is read-only.
- E2E tests: none warranted. E2E Tests is ENABLED, but no frontend screen calls `GET /api/time` and no criterion requires navigation or interaction through the UI; every criterion is covered at integration or unit level (see `### Criterion coverage`). An E2E spec that called the API directly would be a router integration test (`testing_standards.md` Section 5), so no file is written under `e2e/tests/`.
  - Directory: e2e/tests/
  - File: none (`FEAT-1_server_time_endpoint.spec.ts` is not created).
- UAT scenarios: one Gherkin scenario per acceptance criterion plus the edge case that `now` ends in `+00:00` and not `Z`, phrased as HTTP requests against the running backend, and the manual UAT script expanded from `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ (`FEAT-1_server_time_endpoint.feature`), e2e/uat/scripts/ (`FEAT-1_server_time_endpoint_uat_script.md`)
- Test gate: `uv run --directory backend pytest -q && npm --prefix frontend test`; the new tests need no backing service.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` (ISO 8601 UTC, explicit offset) and `timezone` equal to `UTC` | Integration | Verifying it needs no navigation or interaction: it is the router response, checked through the HTTP test client, and no screen calls this endpoint. |
| 2 | `now` is computed per request, serialised in UTC with an explicit offset, never naive | Integration (freshness, live offset), Unit (exact `+00:00` serialisation, naive rejected) | Verifying it needs no navigation or interaction: freshness is a router behaviour across two requests, and the offset and naive rejection are schema validation rules. |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict | Unit (route `response_model`, schema behaviour), Integration (OpenAPI document) | Verifying it needs no navigation or interaction: it is a structural property of the route and its schema, invisible in any UI. |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | It is a criterion about the test suite itself: satisfied by the two new test files above and the added `test_main_unit.py` test running with 0 failed in the test gate. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` equal to `UTC` | covered at Integration, see Criterion coverage | Given the backend is running, When I send GET /api/time, Then the status is 200 and the body holds exactly `now` and `timezone`, with `timezone` equal to `UTC` |
| 2 | `now` is per request, UTC, explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I send GET /api/time twice a second apart, Then the two `now` values differ and each ends in `+00:00` |
| 3 | Body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When I read the OpenAPI document, Then the 200 response of GET /api/time references the `ServerTimeResponse` schema |
| 4 | Unit and integration tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the repository on the feature branch, When I run the FEAT-1 test files, Then the run reports 0 failed |

## Manual verification plan
No acceptance criterion is verifiable through the UI: no frontend screen calls `GET /api/time`. Each block gives the observable HTTP check instead, made with `curl` in a terminal or the same URL in a browser address bar.

Shared prerequisites for every block: Docker and Docker Compose running; the repository on branch `feature/FEAT-1-server-time-endpoint`; from the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running; the backend answers on `http://localhost:8010` (the host port `docker-compose.yml` publishes); a terminal with `curl` and `date`.

### Criterion 1: `GET /api/time` returns 200 with `now` (ISO 8601 UTC with explicit offset) and `timezone` equal to `UTC`
Prerequisites: the shared prerequisites above.
1. Run `curl -i http://localhost:8010/api/time` and read the first response line → it reads `HTTP/1.1 200 OK`.
2. Read the `content-type` header of the same response → it is `application/json`.
3. Read the response body → a JSON object with exactly two keys, `now` and `timezone`, and nothing else.
4. Read `timezone` → it is the string `UTC`.
5. Read `now` → a quoted string shaped like `2026-10-17T09:15:02.123456+00:00`: a date, the letter `T`, a time with fractional seconds, and the offset `+00:00`.
6. Paste `http://localhost:8010/api/time` into a browser address bar → the page shows the same two-key JSON object.

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
Prerequisites: the shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two lines of output, each a JSON object.
2. Compare the two `now` values → they differ, and the second is about one second later than the first (for example `...T09:15:02.1...` then `...T09:15:03.1...`).
3. Read the end of each `now` string → both end in exactly `+00:00`: not `Z`, and not a time with no offset at all.
4. Run `date -u +%Y-%m-%dT%H:%M:%S` immediately followed by `curl -s http://localhost:8010/api/time` → the date and time part of `now` matches the `date -u` output to within a second or two, which shows the value is UTC and not the machine local time.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Prerequisites: the shared prerequisites above; a browser.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the 200 response schema is named `ServerTimeResponse`, with `now` (string, format date-time) and `timezone` (string, default `UTC`).
2. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)` with the fields `now` (typed `UtcTimestamp`) and `timezone`, and its docstring states the `+00:00` offset.
3. Open `backend/app/routers/server_time.py` → the route decorator names `response_model=ServerTimeResponse` and the handler returns a `ServerTimeResponse(...)` built from `datetime.now(timezone.utc)`, not a dict literal.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: the repository on the feature branch, with `uv` installed; no database or running stack is needed.
1. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the summary line reports `0 failed`, and no test is skipped in `test_server_time_integration.py`.
2. Open `backend/tests/unit/test_server_time_schema_unit.py` → it contains `test_server_time_response_serialises_now_with_plus_zero_offset`, asserting the full string ending in `+00:00` (shape and offset).
3. Open `backend/tests/integration/test_server_time_integration.py` → it contains `test_get_time_returns_200_with_now_and_utc_timezone` (shape), `test_get_time_now_ends_with_plus_zero_offset` (offset) and `test_get_time_now_differs_between_calls_a_second_apart` (freshness).
