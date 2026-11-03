# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> Notes (from the item): Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The item's "How the measured run uses this item" block is operator instructions, not acceptance criteria, and is not part of this plan's scope.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker, 2026-09-14, Florian Serneels), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against `origin/main` at c6684ce (this branch's base, same commit). 73e544c is an ancestor of main, but its echo registration is no longer there: the sandbox resets removed it, most recently 34d49a5 (#510, "reset sandbox to the 0.3.467 start state"), which is also the last commit to touch `backend/app/main.py`. Main today imports and registers exactly three routers, in this order: `version_router`, `notes_router`, `health_router`. There is no `echo.py`, no `uptime.py` and no `server_time.py` under `backend/app/routers/` on main or on this branch (`git ls-tree` on both refs lists only `health.py`, `notes.py`, `version.py`; the dispatch's statement that `uptime.py` is on this branch did not hold when read). Insertion point: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports (alphabetical, as the existing block is), and `app.include_router(server_time_router)` goes after `app.include_router(health_router)`, the last line before `return app`. Nothing else in `main.py` changes (CORS already allows `GET`).
- Comment (tracker, 2026-09-14, Florian Serneels), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on because: the echo endpoint is TEST-06's scope (feature_map row TEST-06 "Echo endpoint"), no FEAT-1 acceptance criterion asks for it, and two open items (TEST-11 trim, BUG-05 keep whitespace) specify contradictory behaviour for that same endpoint, so building it inside FEAT-1 would pick an answer neither of those items has settled (`user_story_alignment.md` Section 3, no gold plating). Assumption recorded instead of a blocking question: the echo endpoint lands through TEST-06. The plan PR reviewer is asked to confirm; if the reviewer overrides this, echo is added as its own router, schema and tests under a re-plan, not folded silently into this manifest.
- Comment (tracker, 2026-09-14, Florian Serneels), point 3: "Pin it now ... decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`. The schema `ServerTimeResponse` types `now` as Pydantic's `AwareDatetime` (a naive value is rejected at construction) and carries a `field_serializer` that converts to UTC and emits `datetime.isoformat()`, whose UTC form ends in `+00:00`. The serializer is required, not decorative: Pydantic 2.13 (the locked version) serialises a UTC datetime with a `Z` suffix by default, so without it the wire format would silently be `Z`. Chosen over `Z` because the criterion says "explicit offset" and `+00:00` is the numeric offset itself. Unit and integration tests assert `now.endswith("+00:00")` and that it does not end in `Z`.
- Comment (tracker, 2026-09-14, Florian Serneels), point 4: "Do not add a service module for this endpoint ... Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module and no repository. Planned deviation from `coding_standards.md` Section 2.2 (Router, Service, Repository): that pattern is scoped to business logic and transactional boundaries, and reading the clock is neither. The router reads the clock through a one-line module-level helper `current_utc_time()` in `backend/app/routers/server_time.py`, which exists so a unit test can substitute the clock; it is not a service layer. The PR description must list this deviation.
- Comment (tracker, 2026-11-02, framework): the "Plan PR opened for FEAT-1: .../pull/483" answer from an earlier run → Not acted on because: it requests nothing; it is context only. Each point above was decided afresh from main at c6684ce, and point 1's state differs from that answer (main was at 3b33c37 then).
- Comment (tracker, the remaining 21 framework comments): "Plan PR opened for FEAT-1: ..." links from earlier runs whose PRs were closed → Not acted on because: they are link notices and request nothing.
- Merged since the last plan: n/a (fresh plan, branched from current main c6684ce; no existing plan to compare).

## Plan Overview
A backend-only feature: one new FastAPI router serving `GET /api/time`, one new Pydantic response schema pinning the UTC `+00:00` serialisation, registration of the router in `backend/app/main.py`, and unit plus integration tests. No database, no service layer (planned deviation, Re-Plan Feedback point 4), no frontend, no external integration, no new dependency.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time in UTC with an explicit `+00:00` offset and the literal timezone name `UTC`. Router `backend/app/routers/server_time.py`, `router = APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time() -> ServerTimeResponse` declared with `response_model=ServerTimeResponse`, returning `ServerTimeResponse(now=current_utc_time())`. The clock is read inside the handler, per request, never at import time.
- Clock helper: `current_utc_time() -> datetime` in the same router module, returning `datetime.now(timezone.utc)`. Module-level so the unit test can monkeypatch it.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` and `timezone: Literal["UTC"] = "UTC"`, plus `@field_serializer("now")` returning `value.astimezone(timezone.utc).isoformat()`. The class docstring states the choice: always UTC, always the `+00:00` suffix, never `Z`, never naive.
- Registration: `backend/app/main.py`, import `server_time_router` between the notes and version imports; `app.include_router(server_time_router)` after `app.include_router(health_router)`. Update the module docstring's list of routers by one clause naming FEAT-1's time router.
- Service layer: none. Planned deviation from `coding_standards.md` Section 2.2, recorded in Re-Plan Feedback point 4 and to be listed in the PR description.
- Repository layer: none, no data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `application/json`:

```json
{"now": "2026-11-04T12:34:56.789012+00:00", "timezone": "UTC"}
```

  `now` is ISO 8601, always in UTC, always ending in `+00:00` (never `Z`, never without an offset), with microseconds as `datetime.isoformat()` emits them (omitted only when the microsecond is exactly zero). `timezone` is always the string `UTC`. Any other method on `/api/time` answers FastAPI's 405.

## Technology Selection
- Current time: chose the standard library's `datetime.now(timezone.utc)` over any time library (such as `pendulum` or `arrow`), because the standard library already produces an aware UTC datetime.
- Offset pinning and naive rejection: chose Pydantic's own `AwareDatetime` type and `field_serializer`, both in the already installed Pydantic 2.13.4, over a hand-written validator or a string field formatted in the router, because they put the rule in the schema as criterion 3 and comment point 3 ask.
- Freshness test: chose pytest's built-in `monkeypatch` on `current_utc_time` (unit) and a real one-second `time.sleep` (integration) over adding `freezegun` or `time-machine`, because neither is installed and the built-ins cover the need.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, `AwareDatetime` field with a `+00:00` UTC serializer and `timezone: Literal["UTC"]`.
- [B] backend/app/routers/server_time.py: `GET /api/time` router and the `current_utc_time()` clock helper.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (shape, `+00:00` suffix, conversion to UTC from a non-UTC aware value, naive rejection) and the handler (per-request clock read via monkeypatch).
- [B] backend/tests/integration/test_server_time_integration.py: integration tests for `GET /api/time` through the full HTTP cycle (200 shape, `+00:00` suffix, two calls a second apart differ, 405 on POST).
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `server_time_router` and register it after `health_router`; one clause added to the module docstring.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the custom routes.

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` changes: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file keeps a list of endpoints.

## Testing Strategy
- Unit tests: the schema and the router handler in isolation, no HTTP and no database. Schema: serialising an aware UTC datetime gives the exact `YYYY-MM-DDTHH:MM:SS.ffffff+00:00` string and `timezone` `UTC`; an aware non-UTC value (for example `+02:00`) is converted to the same instant in UTC and ends `+00:00`; a naive datetime raises `ValidationError`; the serialised `now` never ends in `Z`. Handler: with `current_utc_time` monkeypatched to return two different instants in turn, two calls to `get_server_time()` return those two instants (proves the clock is read per call, not cached). Route registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_server_time_unit.py`
- Integration tests: through the session `client` fixture in `backend/tests/conftest.py` (no database needed by the endpoint). 200 with exactly the keys `now` and `timezone`; `timezone == "UTC"`; `now` ends `+00:00` and `datetime.fromisoformat(now).utcoffset() == timedelta(0)`; the parsed `now` is within a few seconds of the test's own `datetime.now(timezone.utc)`; two requests separated by `time.sleep(1)` return values that differ, with the second at least one second later; `POST /api/time` answers 405.
  - Directory: backend/tests/integration/
- E2E tests: no spec for this feature. E2E Tests is ENABLED, but no criterion requires navigation or interaction through the UI (the feature has no frontend), so every criterion is covered at unit or integration tier per the table below. Writing an E2E spec that calls the API directly would be an integration test in the wrong place (`testing_standards.md` Section 5).
  - Directory: e2e/tests/
  - File: none for FEAT-1 (would be FEAT-1_server_time_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST answers 405), verifying the HTTP contract.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | Integration | Verifying it needs no navigation or interaction: it is a router response through the HTTP cycle, and there is no UI. |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Unit and Integration | Verifying it needs no navigation or interaction: the offset and naive rejection are schema rules (unit), the per-request freshness is a two-request HTTP check (integration). |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a schema behaviour, checked by constructing and serialising `ServerTimeResponse`, and by the handler returning that type. |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit and Integration | It is a statement about the test suite itself, satisfied by the unit and integration files in the manifest. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` with `timezone` = `UTC` |
| 2 | `now` per request, UTC with explicit offset, never naive | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When I request GET /api/time twice a second apart, Then both `now` values end in `+00:00` and the second is later than the first |
| 3 | Body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When I open the OpenAPI document, Then GET /api/time's 200 response references the `ServerTimeResponse` schema |
| 4 | Tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the repository, When I run the FEAT-1 unit and integration test files, Then 0 failed |

## Manual verification plan
### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
This criterion has no UI; the observable check is the HTTP response.
Prerequisites: the stack is running (`docker compose up -d` at the repo root), and the backend answers on its published host port (the address `docker compose port backend 8010` prints; written `{BACKEND}` below, `localhost:8010` with the compose file as committed).
1. Run `curl -s -i http://{BACKEND}/api/time` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is a JSON object with exactly two keys, `now` and `timezone`, for example `{"now":"2026-11-04T12:34:56.789012+00:00","timezone":"UTC"}`; `timezone` is exactly `UTC`.
3. Open `http://{BACKEND}/docs` in a browser and expand `GET /api/time` → the 200 response schema shows `now` (string, date-time) and `timezone` (string, `UTC`).

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
This criterion has no UI; the observable check is two HTTP responses.
Prerequisites: as for Criterion 1.
1. Run `curl -s http://{BACKEND}/api/time` and note `now` → it ends in exactly `+00:00` (not `Z`, and not without an offset), and its time of day matches the current UTC time (compare with `date -u`) to within a few seconds.
2. Wait one second and run the same command again → `now` ends in `+00:00` and is at least one second later than the value from step 1.
3. Run `curl -s -X POST -i http://{BACKEND}/api/time` → status `405 Method Not Allowed` (edge case: the endpoint is read-only).

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
This criterion has no UI; the observable check is the code and the OpenAPI document.
1. Open `backend/app/schemas/server_time.py` → it defines `ServerTimeResponse` with `now: AwareDatetime`, `timezone: Literal["UTC"]` and a `field_serializer` for `now` whose docstring names the `+00:00` choice.
2. Open `backend/app/routers/server_time.py` → the handler is declared with `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, with no dict literal for the body.
3. Run `curl -s http://{BACKEND}/openapi.json` and find the `/api/time` entry → its 200 response references `#/components/schemas/ServerTimeResponse`.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
This criterion has no UI; the observable check is the test run.
Prerequisites: a PostgreSQL instance reachable through `DATABASE_URL` for the integration tier's session fixture (see `CLAUDE.md` Backing Services); the FEAT-1 tests themselves need no database.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the summary reports `0 failed`.
2. Open `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` → there is at least one test each for the shape, for the exact `+00:00` suffix, and for per-request freshness.
