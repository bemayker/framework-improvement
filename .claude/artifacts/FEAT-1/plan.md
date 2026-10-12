# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> Notes: Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The item's "How the measured run uses this item" block is operator instruction for the framework measurement, not feature scope, and is not planned.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1, "re-check the insertion point against main as it now stands, and say what changed" → Addressed by: the insertion point is derived from `backend/app/main.py` at `origin/main` 0e31204 (this branch's base). What changed versus a pre-TEST-06 main: TEST-06 (squash 7fb9e25, PR #143) added `from app.routers.echo import router as echo_router` and `app.include_router(echo_router)`, and TEST-07 (squash 0e31204, PR #144) added `from app.routers.uptime import router as uptime_router`, `from app.services import uptime_service`, `app.include_router(uptime_router)`, and the `app.state.process_start` capture in `lifespan`. FEAT-1 therefore inserts its import alphabetically between the `notes_router` and `uptime_router` imports, appends `app.include_router(server_time_router)` after `app.include_router(uptime_router)` and before `return app`, and adds "FEAT-1 the server time router" to the module docstring's list. `lifespan` is not touched. Note: the comment cites squash 73e544c8 / PR #35; neither exists in this repository's current history (the sandbox was reset by fc19931); the TEST-06 squash on current main is 7fb9e25 (PR #143), which is the commit this plan was derived against.
- Comment (tracker), point 2, "also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"}" → Not acted on because `GET /api/echo` already exists on main: `backend/app/routers/echo.py` and `backend/app/schemas/echo.py` (TEST-06, 7fb9e25, PR #143), registered in `main.py` line 65 and covered by `backend/tests/integration/test_echo_integration.py`. Re-adding it would duplicate shipped work and conflict with that router, and it is outside FEAT-1's four acceptance criteria (`user_story_alignment.md` Section 3). The intent of "the two registrations land together" is already met: echo's registration is on main, and FEAT-1's lands next to it.
- Comment (tracker), point 3, "pin the offset: +00:00 or Z, state it in the schema, test the exact suffix" → Addressed by: the offset is pinned to `Z`. Reason: Pydantic v2 serialises a UTC-aware datetime with `Z`, and TEST-07's `started_at` on the same API already ships `Z` (`test_uptime_schema_unit.py`), so one API keeps one spelling. `ServerTimeResponse` states the choice in its docstring, types `now` as `AwareDatetime` (a naive value raises `ValidationError`), and normalises any aware input to UTC with a field validator so the suffix is always `Z` whatever offset reaches it. Tests assert the exact suffix: the unit test asserts `now` ends with `Z` and not `+00:00`; the integration test asserts the HTTP body's `now` ends with `Z`.
- Comment (tracker), point 4, "no service module; record it as a planned deviation" → Addressed by: no `backend/app/services/server_time_service.py` is planned. Recorded as a planned deviation from `coding_standards.md` Section 2.2 (Router, Service, Repository) under `## Backend Plan` → `Service layer:`: reading the clock is neither business logic nor a transactional boundary, and TEST-06 (`echo.py`, router plus schema, no service) is the shape the item names. The router's single `datetime.now(timezone.utc)` call is the whole computation. The PR description must carry this deviation.

## Plan Overview
One read-only backend endpoint, `GET /api/time`, in the TEST-06 shape: a router module and a Pydantic response schema, registered in `create_app()`. No database, no service module, no frontend, no external API. Tests: unit tests for the schema (shape, `Z` suffix, UTC normalisation, naive rejection) and for the router function (per-call clock read), integration tests through the shared `client` fixture for the HTTP cycle, and one registration assertion in `test_main_unit.py`.

Naming choice: the module is `server_time` (`backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py`), not `time`. A module named `time` inside `app.routers` or `app.schemas` is legal but reads as a shadow of the stdlib `time` module, and BUG-01 (which depends on FEAT-1) is described in `.claude/feature_map.md` as editing `server_time.py`, so this name is the one that item will look for.

## Frontend Plan
No frontend changes required.
- Design reference notes: n/a, Design Reference mode is NONE and this feature has no frontend work.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time and the literal timezone name `UTC`. Read-only; other methods return FastAPI's 405.
- Router: `backend/app/routers/server_time.py`, `router = APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time() -> ServerTimeResponse` declared with `response_model=ServerTimeResponse`. The handler calls `datetime.now(timezone.utc)` inside the function body, on every request, so nothing is captured at import or startup. It returns `ServerTimeResponse(now=..., timezone="UTC")`, never a dict.
- Schema: `backend/app/schemas/server_time.py`, `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` and `timezone: Literal["UTC"]`, plus a `field_validator("now")` that returns `value.astimezone(timezone.utc)`. Docstring states: "`now` is always UTC and serialises with the `Z` offset designator (ISO 8601), never `+00:00` and never naive."
- Service layer: none, a planned deviation from `coding_standards.md` Section 2.2. Reading the clock is neither business logic nor a transactional boundary, and the item asks for the TEST-06 shape (router plus schema, no service). The PR description lists this deviation.
- Repository layer: none, no data access.
- Migrations: none.
- Registration in `backend/app/main.py` (against main at 0e31204): add `from app.routers.server_time import router as server_time_router` between the `notes_router` and `uptime_router` imports (alphabetical, as the existing block is); add `app.include_router(server_time_router)` after `app.include_router(uptime_router)`; extend the module docstring's list with "FEAT-1 the server time router". No change to `lifespan` or the CORS middleware (`allow_methods` already includes GET).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no parameters, no body.
- Response 200, `application/json`, schema `ServerTimeResponse`:

```json
{"now": "2026-10-13T08:00:00.123456Z", "timezone": "UTC"}
```

  `now` is ISO 8601, UTC, always ending in `Z`; fractional seconds appear as Pydantic emits them (microseconds when non-zero). `timezone` is always the string `UTC`.
- Response 405: any method other than GET (FastAPI default).

## Technology Selection
- Current UTC time: chose the stdlib `datetime.now(timezone.utc)` over any third-party clock or date library (none needed; `time.time()` would need conversion and is not offset-aware).
- Offset-aware typing and `Z` serialisation: chose Pydantic's installed `AwareDatetime` plus one `field_validator` over a hand-written serializer or string formatting, because Pydantic already emits `Z` for UTC and rejects naive datetimes.
- `timezone` field: chose `typing.Literal["UTC"]` (stdlib) over a custom enum, since only one value is ever valid.
- No new dependency is added; no service module is created (see Backend Plan).

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, `now: AwareDatetime` normalised to UTC by a `field_validator`, `timezone: Literal["UTC"]`; docstring pins the `Z` offset choice.
- [B] backend/app/routers/server_time.py: `GET /api/time` router (`prefix="/api"`), handler `get_server_time()` reads `datetime.now(timezone.utc)` per call and returns `ServerTimeResponse`; no service module, no dict.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests. Schema: happy path serialises a UTC `now` to `{"now": "2026-10-13T08:00:00Z", "timezone": "UTC"}` with exactly those keys; the serialised `now` ends with `Z` and not `+00:00`; edge case, an aware `+02:00` input is normalised to the UTC instant with `Z`; error cases, a naive `now` and a `timezone` other than `UTC` both raise `ValidationError`. Router function: with `app.routers.server_time.datetime` monkeypatched to return two different instants on successive calls, two calls of `get_server_time()` return those two instants (the clock is read per call, not cached).
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle via the shared `client` fixture, no `database_url`: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`; `now` ends with `Z`, parses with `datetime.fromisoformat` to an aware value with `utcoffset() == timedelta(0)`, and lies between timestamps taken just before and just after the request; two calls with `time.sleep(1)` between them differ by at least 0.9 s; OpenAPI 200 response references `ServerTimeResponse` with `now` `format: date-time`; POST returns 405.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (POST `/api/time` is rejected with 405).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the `notes_router` and `uptime_router` imports; add `app.include_router(server_time_router)` after `app.include_router(uptime_router)`; add FEAT-1 to the module docstring's list. `lifespan` and middleware unchanged.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the app's custom routes, matching the version, health, echo and uptime tests.

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) changes.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.
No E2E spec is planned: no criterion needs browser navigation or interaction (see `### Criterion coverage`).

## Testing Strategy
- Unit tests: `ServerTimeResponse` (shape, exact `Z` suffix, UTC normalisation, naive and wrong-timezone rejection) and `get_server_time()` (clock read per call, via a monkeypatched `datetime`). Happy path, one edge case and error cases per `testing_standards.md` Section 1.1.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_server_time_unit.py`; registration assertion added to the existing `test_main_unit.py`.
- Integration tests: `GET /api/time` through the real HTTP request/response cycle with the shared session-scoped `client` fixture from `backend/tests/conftest.py`; 200 shape, `Z` offset and UTC parse, per-request freshness one second apart, OpenAPI schema reference, 405 on POST. No database fixture: the endpoint touches none.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py, here `test_server_time_integration.py`.
- E2E tests: none warranted. E2E is ENABLED, but no frontend screen consumes `/api/time` and no criterion involves navigation or interaction (`testing_standards.md` Section 6, fourth question asked per criterion); a spec calling the API directly would be a router integration test (Section 5).
  - Directory: e2e/tests/
  - File: none for this feature (would be `FEAT-1_server_time_endpoint.spec.ts`).
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge case (POST returns 405).
  - Directory: e2e/uat/scenarios/ (scenarios), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked through the real HTTP cycle. |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration + Unit | Verifying it needs no navigation or interaction: freshness is two HTTP calls a second apart (integration) and a per-call clock read (unit); the offset is a serialisation rule (unit and integration). |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit + Integration | Verifying it needs no navigation or interaction: the schema is exercised directly (unit) and the OpenAPI 200 response must reference `ServerTimeResponse` (integration). |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit + Integration | It is a statement about the test suite itself; it is met by the two test files above running green, with nothing in a browser to observe. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET `/api/time`, Then the status is 200 and the body has exactly `now` and `timezone`, with `timezone` equal to `UTC` |
| 2 | `now` per request, UTC, explicit offset | covered at Integration + Unit, see Criterion coverage | Given the backend is running, When I GET `/api/time` twice one second apart, Then the two `now` values differ and each ends in `Z` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit + Integration, see Criterion coverage | Given the backend is running, When I read the OpenAPI document, Then the 200 response of `GET /api/time` references `ServerTimeResponse` |
| 4 | Tests cover shape, offset, freshness | covered at Unit + Integration, see Criterion coverage | Given the repository at the feature branch, When I run the FEAT-1 unit and integration test files, Then the run reports 0 failed |
| E | Edge: non-GET method | covered at Integration | Given the backend is running, When I POST `/api/time`, Then the status is 405 |

## Manual verification plan
No acceptance criterion is verifiable through the application UI: no frontend screen consumes `GET /api/time`. The observable check is the HTTP response, read with `curl` against the compose stack, plus the backend's interactive docs page for criterion 3.

Shared prerequisites for every block: Docker running; repository on branch `feature/FEAT-1-server-time-endpoint` (or `main` once merged); from the repository root, `docker compose up -d --build` has completed and `docker compose ps` shows the `backend` service running; host port `8010` is the backend (from `docker-compose.yml`); a terminal with `curl`. `curl` prints JSON without spaces, so `{"now":"...","timezone":"UTC"}` on screen is the same body as the spaced examples below. The timestamps you see differ from the examples; the steps say what must hold.

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone`
Prerequisites: the shared prerequisites above.
1. Run `curl -i http://localhost:8010/api/time` → the first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the body on the last line → a JSON object with exactly two keys, e.g. `{"now": "2026-10-13T08:00:00.123456Z", "timezone": "UTC"}`: `now` is a quoted timestamp and `timezone` is exactly `UTC`.
3. Run `curl -i -X POST http://localhost:8010/api/time` → the first line reads `HTTP/1.1 405 Method Not Allowed` (edge case).

### Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive
Prerequisites: the shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/time; echo; sleep 1; curl -s http://localhost:8010/api/time; echo` → two bodies print, one per line.
2. Compare the two `now` values → they differ, and the second is about one second later than the first (for example `...08:00:00.10Z` then `...08:00:01.12Z`).
3. Read either `now` value → it ends in `Z`, not `+00:00` and not without any offset (a value like `2026-10-13T08:00:00.123456` with no suffix is a failure).
4. Run `date -u +%Y-%m-%dT%H:%M:%SZ` right after a `curl` → the printed UTC time matches `now` to within a second or two, confirming the value is UTC rather than local time.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the shared prerequisites above, plus a browser.
1. Open `http://localhost:8010/docs`, expand `GET /api/time`, and look at the 200 response → its schema is named `ServerTimeResponse`, with `now` a string of format `date-time` and `timezone` a string whose only allowed value is `UTC`.
2. Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` → the schema file defines `class ServerTimeResponse(BaseModel)` whose docstring states the `Z` choice; the router declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, not a dict; there is no `backend/app/services/server_time_service.py`.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: repository on the feature branch; `uv` installed. No database is needed.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
2. Open `backend/tests/unit/test_server_time_unit.py` → there is a test asserting the serialised `now` ends with `Z` and not `+00:00`, a test rejecting a naive `now`, and a test showing two calls of `get_server_time()` read the clock twice.
3. Open `backend/tests/integration/test_server_time_integration.py` → there is a test asserting the exact two keys, one asserting the `Z` suffix, and one making two calls one second apart and asserting the `now` values differ.
