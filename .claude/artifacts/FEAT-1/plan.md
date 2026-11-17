# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature created 2026-09-07 for measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010). It exists to overlap a commit that will land on `main` during the run, not to be independent of it: it registers a router in `backend/app/main.py`, the file TEST-06 and TEST-07 also change.
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
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The item's "How the measured run uses this item" block is operator instructions, explicitly not part of the feature, and is not planned here.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: verified against git. The premise is historically true and currently stale. `73e544c8` ("feat(TEST-06): Echo endpoint (#35)", 2026-09-14) is an ancestor of `origin/main` and its stat does touch `backend/app/main.py` (6 lines) and `backend/tests/unit/test_main_unit.py`. But the echo code is not on main as it now stands: `backend/app/routers/echo.py` was deleted again by the sandbox resets `480f9bf`, `4971122` and `9dcba19`, and `origin/main` at `7fcd163` (this branch's base, identical to HEAD) has only `version`, `notes` and `health` routers. The registration block in `create_app()` today is the three lines `app.include_router(version_router)`, `app.include_router(notes_router)`, `app.include_router(health_router)`, with their three imports above `logger`. What changed relative to TEST-06's merge: there is no echo import or registration to sit beside. Insertion point: one import `from app.routers.server_time import router as server_time_router` after the `health` import (alphabetical with the existing block), and `app.include_router(server_time_router)` as the last line before `return app`. Purely additive; nothing existing is reordered or edited.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on. `GET /api/echo` is exactly TEST-06's feature ("Echo endpoint", its own tracker item and branch `feature/TEST-06-echo-endpoint`), and TEST-11 and BUG-05 are planned against TEST-06's echo files (`backend/app/routers/echo.py`, `backend/app/schemas/echo.py`) with opposite whitespace rules still unresolved between them (feature map). Building echo inside FEAT-1 would duplicate another item's scope with none of FEAT-1's acceptance criteria behind it (`user_story_alignment.md` Section 3), leave TEST-06 either redundant or conflicting, and pre-empt the TEST-11 and BUG-05 decision. Reasonable assumption recorded: the stakeholder wants echo on main; the way to get it is to (re)build TEST-06, not to fold it into FEAT-1. Recorded under `## Scope changes` as a declined addition.
- Comment (tracker), point 3: "The acceptance criterion says ISO 8601 UTC with explicit offset without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`, the numeric offset, which is the literal reading of "explicit offset" (`Z` is a zone designator, not an offset). Format pinned completely: `YYYY-MM-DDTHH:MM:SS.ffffff+00:00` (always six fractional digits, via `isoformat(timespec="microseconds")`), so the shape never varies when the microsecond happens to be zero. The choice is stated in the schema itself: a `field_serializer` on `now` plus a class docstring naming `+00:00`. This serializer is load-bearing, not cosmetic: Pydantic 2.13.4 (the locked version) serialises an aware UTC `datetime` with a `Z` suffix by default, so a bare `now: datetime` field would ship `Z`. Covered by `test_server_time_response_serialises_now_with_plus_00_00_suffix` (unit) and `test_get_time_now_ends_with_plus_00_00_offset` (integration), both asserting the exact suffix `+00:00` and that the string does not end in `Z`. Recorded under `## Scope changes`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/server_time_service.py`; the router reads the clock through a one-line module-level function `current_utc_time()` in `backend/app/routers/server_time.py`, which tests monkeypatch. Recorded as a planned deviation in `## Backend Plan` and under `## Scope changes`. Verified what I could: TEST-06's file list on its branch (feature-map neighbours call) has a router and a schema and no service, consistent with the comment; I did not open TEST-06's plan, so the decision's wording is the comment's, not mine. Note the deviation is from local precedent too: TEST-05 (`version_service.py`) and TEST-02 (`health_service.py`) each kept a service. The difference that justifies it here: those services absorb a failure mode (missing package metadata, an unreachable database); `datetime.now(UTC)` has none, so a service would be a pass-through. Section 2.2 as written applies the pattern "when the project includes a backend with data persistence" and places business logic and transactional boundaries in the service; this endpoint has neither.
- Merged since the last plan: n/a (fresh plan, branched from current main `7fcd163`; no `[merged-since]` lines).

## Plan Overview
One read-only backend endpoint, `GET /api/time`, returning the server's current UTC time and the literal zone name. Three layers touched: a Pydantic response schema in `backend/app/schemas/server_time.py`, a router in `backend/app/routers/server_time.py` (no service, see point 4), and one additive registration in `backend/app/main.py`. No database, no frontend, no external API, no new dependency. Tests: schema unit tests, one added app-factory unit test, router integration tests, plus the UAT artifacts. File names use `server_time`, which is the name the downstream item BUG-01 already expects (feature map: "BUG-01 registers a server_time router").

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this feature).

## Backend Plan
- Endpoints: `GET /api/time`, read-only, no parameters, always 200. The router is `APIRouter(prefix="/api", tags=["time"])` with `@router.get("/time", response_model=ServerTimeResponse)`, same shape as `backend/app/routers/version.py`.
- Clock: `def current_utc_time() -> datetime: return datetime.now(UTC)` (stdlib `datetime.UTC`) at module level in the router. The endpoint calls it on every request and returns `ServerTimeResponse(now=current_utc_time())`. Nothing is computed at import time or cached, which is what makes criterion 2's per-request freshness hold.
- Schema `ServerTimeResponse` (`backend/app/schemas/server_time.py`):
  - `now: AwareDatetime` (pydantic's type, rejects a naive datetime at construction, so "never naive" is enforced by the schema, not by convention).
  - `timezone: Literal["UTC"] = "UTC"`.
  - `@field_serializer("now")` returning `value.astimezone(UTC).isoformat(timespec="microseconds")`, so output is always UTC with the `+00:00` suffix, even if an aware non-UTC value is ever passed in. Docstring states the pinned format.
- Service layer: none. Planned deviation from `coding_standards.md` Section 2.2 (Router, Service, Repository), per the tracker comment point 4: reading the clock is neither business logic nor a transactional boundary, and has no failure mode for a service to absorb.
- Repository layer: none (no persistence).
- Migrations: none.
- Registration: `backend/app/main.py`, import after the `health` import and `app.include_router(server_time_router)` after `app.include_router(health_router)`. Update the module docstring's list of features that register routers (one clause, "FEAT-1 the server time router"). CORS `allow_methods=["GET", "POST"]` already covers GET; no middleware change.
- Error handling: the only reachable error is a wrong method, which FastAPI answers 405 itself. No custom exception.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `application/json`:

```json
{"now": "2026-11-17T00:30:43.123456+00:00", "timezone": "UTC"}
```

  `now` always matches `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+00:00$`; `timezone` is always the string `UTC`. Any other method returns 405.

## Technology Selection
- Current UTC time: chose stdlib `datetime.now(UTC)` over any time library (none needed; stdlib covers it in one call).
- Offset formatting: chose stdlib `datetime.isoformat(timespec="microseconds")` inside a pydantic `field_serializer` (installed dependency, pydantic 2.13.4) over pydantic's default datetime serialisation, because the default emits `Z` and the plan pins `+00:00`.
- Naive-datetime rejection: chose pydantic's `AwareDatetime` (installed dependency) over a hand-written validator.
- `backend/app/routers/server_time.py` and `backend/app/schemas/server_time.py`: no stdlib call, native feature or installed dependency replaces a route and its schema, so they are built here on the installed FastAPI and pydantic.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` with `now: AwareDatetime`, `timezone: Literal["UTC"]`, and the `+00:00` field serializer.
- [B] backend/app/routers/server_time.py: `GET /api/time` router and the `current_utc_time()` clock function.
- [B] backend/tests/unit/test_server_time_schema_unit.py: schema unit tests (exact `+00:00` suffix, naive rejected, non-UTC offset converted, timezone literal).
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle tests (shape, offset, real-clock window, per-request freshness, 405).
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios (UAT Generation ENABLED).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: import and register `server_time_router` after the health router; docstring clause.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`.

No lockfile changes: the feature adds no dependency, so `backend/uv.lock` and `frontend/package-lock.json` are untouched.
No `README.md` or `docs/DEVELOPMENT.md` edit: neither lists API endpoints, and the feature changes no project structure, run configuration, dependency or test infrastructure.
No E2E spec file: no criterion has E2E as its covering tier (see `### Criterion coverage`).

## Testing Strategy
- Unit tests: `ServerTimeResponse` serialisation and validation in isolation (no app, no clock): exact `+00:00` suffix and fixed-width format for a given UTC instant; a naive datetime raises `pydantic.ValidationError`; an aware `+02:00` value serialises as the same instant in UTC with `+00:00`; `timezone` defaults to and dumps as `UTC`. Plus one app-factory test that `/api/time` is registered.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_schema_unit.py`; `test_main_unit.py` extended)
- Integration tests: through the session `client` fixture in `backend/tests/conftest.py` (no database needed): 200 and exact key set; `now` ends in `+00:00`, parses with `datetime.fromisoformat`, has `utcoffset() == timedelta(0)`; `now` lies between a UTC timestamp taken just before and just after the request (proves the real clock is read); per-request freshness by monkeypatching `app.routers.server_time.current_utc_time` to return two different instants on consecutive calls and asserting the two responses differ and match them (no `sleep`, deterministic); `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The feature has no UI; every criterion is an API behaviour (`testing_standards.md` Section 6, fourth question asked per criterion, answered no for all four).
  - Directory: e2e/tests/
  - File: none for this feature
- UAT scenarios: one scenario per criterion plus one edge-case scenario (wrong method returns 405), API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: UTC` | Integration | `test_get_time_returns_200_with_now_and_timezone`, `test_get_time_now_ends_with_plus_00_00_offset` | verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration | `test_get_time_computes_now_per_request`, `test_get_time_now_is_current_server_time`, `test_server_time_response_rejects_naive_datetime`, `test_server_time_response_converts_non_utc_offset_to_utc` | verifying it needs no navigation or interaction: it is router behaviour plus a schema validation rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_server_time_response_serialises_now_with_plus_00_00_suffix`, `test_server_time_response_timezone_is_utc` | verifying it needs no navigation or interaction: it is a schema definition, exercised directly |
| 4 | Unit and integration tests cover shape, offset and per-request freshness | Integration | `test_get_time_returns_200_with_now_and_timezone`, `test_get_time_now_ends_with_plus_00_00_offset`, `test_get_time_computes_now_per_request`, `test_server_time_response_serialises_now_with_plus_00_00_suffix`, `test_create_app_registers_server_time_route` | it is a statement about the test suite itself, satisfied by the unit and integration tests listed |

Additional edge case, not a criterion: `test_post_time_returns_405_method_not_allowed` (integration).

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` with `timezone` = `UTC` |
| 2 | per request, UTC, explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/time twice one second apart, Then the two `now` values differ and both end in `+00:00` |
| 3 | Pydantic schema | covered at Unit, see Criterion coverage | Given the running API, When I open its OpenAPI document, Then `/api/time` responds with the `ServerTimeResponse` schema |
| 4 | tests cover shape, offset, freshness | covered at Integration, see Criterion coverage | Given the backend test suite, When I run the FEAT-1 test files, Then they pass |

## Manual verification plan
This feature has no UI, so no criterion can be verified by clicking through the app; each block below uses the API directly from a terminal, which is the observable check.

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone: UTC`
Prerequisites: the stack is up with `docker compose up -d --build` from the repo root, and the backend answers on `http://localhost:8010` (the port `docker-compose.yml` publishes).
1. Run `curl -s -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and `content-type` is `application/json`.
2. Read the body → it has exactly two keys, `now` and `timezone`, and `timezone` is the string `UTC`, for example `{"now":"2026-11-17T00:30:43.123456+00:00","timezone":"UTC"}`.

### Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/time`, wait one second, run it again → the two `now` values differ, the second later than the first by about one second.
2. Look at the end of each `now` value → both end in exactly `+00:00`, never `Z`, and have six digits after the decimal point.
3. Run `date -u +%Y-%m-%dT%H:%M:%S` in the same terminal → its output matches the date and the hour and minute of the latest `now` (the server reports UTC, not local time).
4. Run `curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8010/api/time` → prints `405`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → its 200 response shows the schema `ServerTimeResponse` with fields `now` (string, date-time) and `timezone` (string, `UTC`).
2. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)`, and its docstring names the `+00:00` format; `backend/app/routers/server_time.py` returns a `ServerTimeResponse`, not a dict.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: `uv` installed; no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → it contains `test_get_time_now_ends_with_plus_00_00_offset` and `test_get_time_computes_now_per_request`; `backend/tests/unit/test_server_time_schema_unit.py` contains `test_server_time_response_serialises_now_with_plus_00_00_suffix`.

## Scope changes

- 2026-11-17 Pinned the ambiguous "explicit offset" in criteria 1 and 2 to `+00:00` (never `Z`), fixed-width `YYYY-MM-DDTHH:MM:SS.ffffff+00:00`, stated by a field serializer in backend/app/schemas/server_time.py and asserted by exact-suffix tests in backend/tests/unit/test_server_time_schema_unit.py and backend/tests/integration/test_server_time_integration.py. Reason: tracker comment point 3 asked for the choice to be pinned; `+00:00` is the literal reading of "explicit offset", and pydantic 2.13.4 would otherwise emit `Z`.
- 2026-11-17 No service module for GET /api/time; backend/app/routers/server_time.py reads the clock through its own `current_utc_time()` function, a planned deviation from coding_standards.md Section 2.2's Router, Service, Repository pattern. Reason: tracker comment point 4; reading the clock is neither business logic nor a transactional boundary and has no failure mode for a service to absorb.
- 2026-11-17 Declined the tracker comment's request (point 2) to add GET /api/echo in backend/app/main.py, backend/app/routers/echo.py and backend/app/schemas/echo.py alongside FEAT-1; no file is added for it. Reason: that endpoint is TEST-06's own work item, TEST-11 and BUG-05 are planned against its files, and no FEAT-1 acceptance criterion covers it (user_story_alignment.md Section 3).
