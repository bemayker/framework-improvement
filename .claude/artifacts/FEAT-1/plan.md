# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> ## What
>
> `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> ## Acceptance criteria
>
> *   `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> *   `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> *   The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> *   Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> ## Notes
>
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.

(The tracker description's opening paragraph and its "How the measured run uses this item" block are operator instructions for a measured run, not part of the feature; nothing is planned from them.)

Tracker: https://app.clickup.com/t/123k99ctzxk

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against the checked-out commit c225856 (= `origin/main`). Commit 73e544c (`feat(TEST-06): Echo endpoint (#35)`) is in main's history, but later sandbox resets (most recently a3a1d7b, `chore: release run 0.3.460 P1 reset ...`) removed its code: on current main `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, there is no `routers/echo.py` or `schemas/echo.py`, and `backend/app/main.py` imports and registers exactly three routers, `version_router`, `notes_router`, `health_router` (lines 19 to 21 and 54 to 56). So what changed since the comment was written is that the echo registration the comment refers to is no longer there. Insertion point, as main now stands: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports (alphabetical, line 20 to 21), and `app.include_router(server_time_router)` goes after `app.include_router(health_router)` (line 56), before `return app`. The builder must re-read `main.py` at build time and keep any registration that has landed by then.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on because: no FEAT-1 acceptance criterion asks for an echo endpoint, and `user_story_alignment.md` Section 3 (scope containment, no gold plating) bounds this plan to the item's criteria. `GET /api/echo` is TEST-06's own scope (feature_map row "TEST-06 Echo endpoint"), and TEST-11 and BUG-05 are planned against TEST-06's echo files with contradictory whitespace behaviour; shipping an echo endpoint under FEAT-1 would land those files under the wrong item and pre-empt that unresolved contradiction. Recommendation recorded for the plan reviewer: if the echo endpoint is wanted, deliver it through TEST-06 (or add it to FEAT-1's acceptance criteria on the tracker, then re-plan).
- Comment (tracker), point 3: "Pin the offset ... decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`. The criterion asks for an "explicit offset", and the numeric form states the offset literally rather than through the `Z` designator; it is also what Python's `datetime.isoformat()` produces for an aware UTC value. Pydantic v2's default JSON for a UTC datetime is `Z`, so the schema does not rely on the default: `TimeResponse.now` carries a `field_serializer` that converts to UTC and emits `isoformat(timespec="microseconds")`, and the module constant `UTC_OFFSET_SUFFIX = "+00:00"` names the choice in the schema file. Unit and integration tests assert `body["now"].endswith("+00:00")` and that it does not end in `Z`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. ... coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module. **Planned deviation from `coding_standards.md` Section 2.2 (and from the sibling `version` router, which calls `version_service`):** the router module reads the clock itself through a small `current_utc_time()` function. Section 2.2 places business logic and transactional boundaries in the Service layer and data access in the Repository layer; this endpoint has neither (no persistence, no transaction, no rule beyond "read the clock in UTC"), so a service would be a pass-through. The router stays free of business logic: it reads the clock and builds the schema. The deviation is to be repeated in the build PR description.
- Comment (tracker), the remaining 20 top-level comments (framework-posted "Plan PR opened for FEAT-1: ..." notes from earlier plan runs, plus one autonomous run's reply) → Not acted on because: they report earlier runs' PRs and request no change.
- Merged since the last plan: n/a (fresh plan, branched from current main c225856; no `[merged-since]` lines).

## Plan Overview
One backend-only, read-only endpoint, `GET /api/time`, returning the server's current UTC time with an explicit `+00:00` offset and the literal `timezone: "UTC"`. Three new production files' worth of change, kept as small as the architecture note asks: a Pydantic response schema in `backend/app/schemas/server_time.py`, a router in `backend/app/routers/server_time.py` (no service, no repository, no database), and one import plus one `include_router` line in `backend/app/main.py`. Tests: unit tests for the schema's serialisation and the router's per-request clock read, integration tests through the full HTTP cycle, and a registration check in the existing `test_main_unit.py`. No frontend, no external API, no configuration, no new dependency. Module name `server_time` (not `time`) so it never reads as the stdlib `time` module.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time in UTC. Router `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time()` with `response_model=TimeResponse`, same shape as `routers/version.py`.
- Service layer: none, by planned deviation (see Re-Plan Feedback, point 4). The router module defines `current_utc_time() -> datetime` returning `datetime.now(timezone.utc)`; the handler calls it on every request (never at import time or in a module-level constant), so each response carries a fresh value. Keeping the clock read behind that function is what lets a unit test substitute it.
- Schema (`backend/app/schemas/server_time.py`): `TimeResponse(BaseModel)` with `now: AwareDatetime` (pydantic's aware-only type: a naive datetime raises a `ValidationError`, which is the "never naive" guard) and `timezone: Literal["UTC"] = "UTC"`. A `@field_serializer("now")` returns `value.astimezone(timezone.utc).isoformat(timespec="microseconds")`, so the wire format is always `YYYY-MM-DDTHH:MM:SS.ffffff+00:00` whatever offset the input carried. Module constant `UTC_OFFSET_SUFFIX = "+00:00"` and the docstring state the pinned choice.
- Registration (`backend/app/main.py`): import `server_time_router` alphabetically between the notes and version imports; `app.include_router(server_time_router)` after `app.include_router(health_router)`. Add FEAT-1 to the module docstring's list of features that register routers. Nothing else in `create_app()` changes. CORS is unchanged: the endpoint is a GET, already in `allow_methods`.
- Repository layer: none (no data access).
- Migrations: none.
- Error handling: the endpoint takes no input, so its only error path is FastAPI's own 405 for a non-GET method; no custom exception is introduced.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters, no headers required.
- Response: `200 OK`, `application/json`, body defined by `TimeResponse`:

```json
{"now": "2026-11-01T04:50:22.123456+00:00", "timezone": "UTC"}
```

  `now`: ISO 8601, always UTC, always the explicit `+00:00` suffix (never `Z`, never naive), microsecond precision, computed per request. `timezone`: always the literal string `UTC`.
- Errors: `405 Method Not Allowed` for any other method (FastAPI default).

## Technology Selection
- Current UTC time: chose the standard library's `datetime.now(timezone.utc)` over any time library (pendulum, arrow), because the stdlib returns an aware UTC datetime and no installed or new dependency adds anything.
- Response schema and "never naive" guard: chose `pydantic.AwareDatetime` plus a `field_serializer`, both from pydantic, which FastAPI already installs, over a hand-written validator or a bare `str` field, because the installed dependency already rejects naive datetimes and controls serialisation.
- Offset formatting: chose stdlib `datetime.isoformat(timespec="microseconds")` over pydantic's default JSON datetime encoding, because the default emits `Z` and the pinned format is `+00:00`.
- Router: no stdlib call, native platform feature or installed dependency replaces a FastAPI router; built here as a FastAPI `APIRouter`, the project's installed framework.
- No new dependency; `backend/pyproject.toml` and `backend/uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `TimeResponse` Pydantic schema (`now: AwareDatetime` serialised as UTC `+00:00`, `timezone: Literal["UTC"]`) and the `UTC_OFFSET_SUFFIX` constant.
- [B] backend/app/routers/server_time.py: `GET /api/time` router with `current_utc_time()` and the `get_server_time()` handler, no service.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (shape, `+00:00` suffix, conversion of a non-UTC aware input to UTC, naive input rejected) and for the handler reading the clock per call (substituted `current_utc_time`).
- [B] backend/tests/integration/test_server_time_integration.py: integration tests through the HTTP cycle (200 and exact key set, `timezone == "UTC"`, `now` parses as aware UTC and ends in `+00:00`, two requests return strictly increasing values bracketed by the test's own clock reads, POST returns 405).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from this plan's `## Manual verification plan`.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED).

### Modified files
- [B] backend/app/main.py: import `server_time_router` and register it with `app.include_router(server_time_router)` after the health router; add FEAT-1 to the module docstring.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom route paths.

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `TimeResponse` serialisation (keys exactly `now` and `timezone`; `timezone == "UTC"`; a fixed aware UTC input serialises to the exact string `2026-01-02T03:04:05.000006+00:00`; a `+02:00` aware input serialises converted to UTC with `+00:00`; the output never ends in `Z`; a naive datetime raises `ValidationError`), and the handler (with `current_utc_time` monkeypatched to return two different fixed instants on successive calls, two `get_server_time()` calls return those two values, proving the clock is read per call and not cached). Route registration in `test_main_unit.py`. Names follow `test_{action}_{scenario}_{expected_outcome}`. No database needed.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (here `test_server_time_unit.py`)
- Integration tests: through the session `client` fixture in `backend/tests/conftest.py` (no database fixture: the endpoint needs none): `GET /api/time` returns 200 with exactly the keys `now` and `timezone`; `timezone == "UTC"`; `now` parses with `datetime.fromisoformat`, is aware with `utcoffset() == timedelta(0)`, and ends in `+00:00`; freshness: record `before = datetime.now(timezone.utc)`, make two requests, record `after`, assert `before <= first < second <= after` (microsecond precision makes two requests strictly ordered without any sleep); `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (here `test_server_time_integration.py`)
- E2E tests: not warranted. E2E is ENABLED in `CLAUDE.md`, but no criterion involves navigation or interaction through the UI: no frontend consumes `GET /api/time`, and a spec calling the API directly would be a router integration test (`testing_standards.md` Section 5). No spec file is produced.
  - Directory: e2e/tests/
  - File: none for this feature (naming would be `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge case (a non-GET method returns 405), validated for well-formedness only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour, and no UI consumes the endpoint |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Unit and Integration | verifying it needs no navigation or interaction: the offset and naive rejection are schema serialisation rules (unit), and freshness is two HTTP requests (integration) |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a code-structure property, checked by the unit tests importing and serialising `TimeResponse` and by the router's `response_model` |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | verifying it needs no navigation or interaction: the criterion is about the test suite itself, satisfied by the two test files above passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone`, with `timezone` "UTC" |
| 2 | `now` per request, UTC, explicit offset, never naive | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client calls GET /api/time twice one second apart, Then both `now` values end in "+00:00" and the second is later than the first |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When a client reads /openapi.json, Then the 200 response of GET /api/time references the `TimeResponse` schema |
| 4 | Tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the repository is checked out, When the FEAT-1 unit and integration test files are run, Then 0 tests fail |

## Manual verification plan
No acceptance criterion is verifiable through the UI: no frontend screen consumes `GET /api/time`. Each block below gives the observable check instead, read with `curl` against the running stack.

Shared prerequisites: Docker running; repository on branch `feature/FEAT-1-server-time-endpoint`; from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows `db` healthy and `backend` running; the backend answers on `http://localhost:8010` (the host port `docker-compose.yml` publishes).

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
Prerequisites: the shared prerequisites above.
1. In a terminal run `curl -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the body → it is one JSON object with exactly two keys, for example `{"now":"2026-11-01T04:50:22.123456+00:00","timezone":"UTC"}`: `timezone` is exactly `UTC`, and `now` is today's date and the current UTC time (compare with `date -u` in the same terminal; within a few seconds).

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
Prerequisites: the shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` → two JSON bodies print.
2. Compare the two `now` values → the second is about one second later than the first; they are not identical.
3. Look at the end of each `now` value → each ends in exactly `+00:00`; neither ends in `Z`, and neither lacks an offset (a value such as `2026-11-01T04:50:22.123456` with nothing after the digits would be naive and is a fail).

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Prerequisites: the shared prerequisites above.
1. Run `curl -s http://localhost:8010/openapi.json` and find the `/api/time` entry under `paths` → its `get` → `responses` → `200` content schema is a `$ref` to `#/components/schemas/TimeResponse`.
2. Find `TimeResponse` under `components` → `schemas` → it lists the properties `now` (string, `date-time` format) and `timezone`.
3. Open `backend/app/schemas/server_time.py` → it defines `class TimeResponse(BaseModel)`; open `backend/app/routers/server_time.py` → the handler is declared with `response_model=TimeResponse` and returns a `TimeResponse(...)`, with no dict literal as the response.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: `uv` installed; dependencies synced (`uv sync --directory backend`). No database is needed for these test files.
1. From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed` (no failures and no errors).
2. Open `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` → there is at least one test asserting the exact key set and `timezone == "UTC"` (shape), at least one asserting `now` ends in `+00:00` (offset), and at least one asserting two calls return different, increasing `now` values (freshness).
