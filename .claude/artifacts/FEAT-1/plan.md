# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature created 2026-09-07 for measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010). It exists to overlap a commit that will land on `main` during the run, not to be independent of it: it registers a router in `backend/app/main.py`, the file TEST-06 and TEST-07 also change.
>
> **What:** `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> **Notes:** Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The description's "How the measured run uses this item" block is operator instructions, not acceptance criteria, and is not part of this plan's scope.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-read `backend/app/main.py` on this branch (cut from origin/main at b0ed4c9). Commit 73e544c (`feat(TEST-06): Echo endpoint (#35)`) is in main's history, but its `main.py` change is no longer present: `git log -- backend/app/main.py` shows the last change is 4cc3ac7 (`chore: release 0.3.478 D1 reset, code back to 36e231a`, 2026-11-04), preceded by a run of BUG-01 fixes and resets. As main now stands there is no echo router and no `server_time` router: the imports are `health`, `notes`, `version` (lines 19 to 21) and `create_app()` registers `version_router`, `notes_router`, `health_router` (lines 54 to 56). Insertion point: import `from app.routers.server_time import router as server_time_router` between the `notes` and `version` imports (alphabetical, lines 20 and 21), and `app.include_router(server_time_router)` after `app.include_router(health_router)` (line 56), before `return app`. The module docstring gains one clause naming FEAT-1's router. Nothing else in `main.py` changes.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on: GET /api/echo is TEST-06's own scope (a separate work item in `feature_map.md`, with its own follow-ups TEST-11, BUG-05 and CHORE-05 that specify its whitespace behaviour), and no FEAT-1 acceptance criterion asks for it. Adding it here is the gold plating `user_story_alignment.md` Section 3 rules out, and would put a second item's endpoint on this branch where TEST-06's tests and Done flip cannot see it. Plan PR reviewer: please confirm; if the echo endpoint is wanted, it belongs on TEST-06 (or an amendment to FEAT-1's acceptance criteria in the tracker).
- Comment (tracker), point 3: "Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is pinned to `+00:00`, a numeric offset, because the criterion asks for an "explicit offset" and `+00:00` is literally one, whereas `Z` is a zone designator. Pydantic v2 serialises an aware UTC datetime with `Z` by default, so the schema `ServerTimeResponse` in `backend/app/schemas/server_time.py` declares the choice in a module constant `UTC_OFFSET_SUFFIX = "+00:00"` and its docstring, and a `field_serializer` on `now` emits `value.astimezone(UTC).isoformat(timespec="microseconds")`. Covered by `test_server_time_response_serialises_now_with_plus_zero_offset_suffix` (unit, asserts `endswith("+00:00")` and not `Z`) and `test_get_time_returns_200_with_utc_now_and_plus_zero_offset` (integration, same exact-suffix assertion on the HTTP body).
- Comment (tracker), point 4: "Do not add a service module for this endpoint ... Record it as a planned deviation rather than leaving it silent." → Addressed by: no `services/server_time_service.py` is planned. Planned deviation from `coding_standards.md` Section 2.2 (Router, Service, Repository): the router calls a module-level `utc_now()` helper in `backend/app/routers/server_time.py` directly, because reading the clock is neither business logic nor a transactional boundary, and there is no repository. Recorded here and in `## Backend Plan`; the build carries it into the PR description's deviations list.
- Comment (tracker), 24 framework-posted "Plan PR opened for FEAT-1: ..." notices from earlier runs → Not acted on: they are notices, not feedback, and the work they refer to was removed from main by later sandbox resets; this plan is written against the code as it stands at b0ed4c9.

Merged since the last plan: n/a (fresh plan, branched from current main b0ed4c9; no prior plan exists).

Assumption (ambiguity): the feature's Notes say "following the TEST-06 shape", but TEST-06's echo router is not present on main (see point 1). This plan follows the shape of the routers that are present, `backend/app/routers/version.py` and `backend/app/schemas/version.py` (TEST-05): an `APIRouter(prefix="/api", tags=[...])`, a `response_model` schema in `backend/app/schemas/`, and the router returning the schema instance.

## Plan Overview
Backend only. One new read-only endpoint `GET /api/time` in a new router `backend/app/routers/server_time.py`, returning a new Pydantic schema `ServerTimeResponse` (`backend/app/schemas/server_time.py`) whose `now` is an aware datetime taken from `datetime.now(UTC)` on every request and serialised with a pinned `+00:00` suffix, and whose `timezone` is the literal `"UTC"`. The router is registered in `backend/app/main.py`. No service, no repository, no database access, no configuration, no new dependency. Tests: one new unit file, one new integration file, and one added registration test in the existing `test_main_unit.py`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` returns the server's current time in UTC. Read-only, no parameters, no database.
- Router (`backend/app/routers/server_time.py`): `router = APIRouter(prefix="/api", tags=["time"])`; a module-level `def utc_now() -> datetime: return datetime.now(UTC)` (the seam the tests patch, and the only place the clock is read); `@router.get("/time", response_model=ServerTimeResponse) def get_server_time() -> ServerTimeResponse: return ServerTimeResponse(now=utc_now())`. `utc_now()` is called inside the handler, never at import time or as a default value, so every request reads the clock afresh.
- Schema (`backend/app/schemas/server_time.py`): `UTC_OFFSET_SUFFIX = "+00:00"`; `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic rejects a naive datetime at construction, so a naive value can never be serialised) and `timezone: Literal["UTC"] = "UTC"`; `@field_serializer("now")` returning `value.astimezone(UTC).isoformat(timespec="microseconds")`, which yields e.g. `2026-11-05T01:29:16.123456+00:00`. The docstring states the `+00:00` choice over `Z` and why. `timespec="microseconds"` keeps the string a fixed shape (plain `isoformat()` drops the fraction when microseconds are 0).
- Service layer: none, by planned deviation from `coding_standards.md` Section 2.2 (tracker comment point 4): reading the clock is neither business logic nor a transactional boundary.
- Repository layer: none (no data access).
- Migrations: none.
- `backend/app/main.py`: add the import between the `notes` and `version` router imports, and `app.include_router(server_time_router)` after `app.include_router(health_router)`; add FEAT-1's router to the module docstring's list.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `application/json`, exactly two keys:
  `{"now": "2026-11-05T01:29:16.123456+00:00", "timezone": "UTC"}`
  `now` is ISO 8601, always UTC, always microsecond precision, always ending in the literal `+00:00`; `timezone` is always the string `"UTC"`.
- Errors: any other method on `/api/time` returns FastAPI's 405.

## Technology Selection
- UTC timestamp (`now`): chose the standard library's `datetime.now(UTC)` and `datetime.isoformat(timespec="microseconds")` over any third-party date library (pendulum, arrow), because the stdlib covers aware UTC time and ISO 8601 output fully.
- Response schema `ServerTimeResponse`: chose Pydantic's `BaseModel` with `AwareDatetime` and `field_serializer`, already installed through FastAPI (pydantic 2.13.4 in `backend/uv.lock`), over a hand-written naive-datetime check and a bare dict, because the installed dependency enforces awareness and pins the serialised form in the schema the criterion requires.
- `timezone` field: chose `typing.Literal["UTC"]` (stdlib) over an Enum, because one fixed value needs no enum type.
- Router `server_time.py`: no stdlib call, native platform feature or installed dependency replaces a FastAPI router; it is built here on the installed `fastapi.APIRouter`, in the existing routers' shape.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime` with the `+00:00` field serializer, `timezone: Literal["UTC"]`) and the `UTC_OFFSET_SUFFIX` constant
- [B] backend/app/routers/server_time.py: `GET /api/time` router with the `utc_now()` clock seam, no service module (planned deviation)
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (exact `+00:00` suffix, conversion of a non-UTC aware datetime, naive rejected, `timezone` literal) and for the handler's per-request clock read
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time` (200 and exact shape, exact suffix, per-request freshness with a patched clock and with the real clock, 405 on POST)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script that build-feature writes to the item's artifacts
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge-case scenario (UAT Generation ENABLED)

### Modified files
- [B] backend/app/main.py: import `server_time_router` between the `notes` and `version` imports, `app.include_router(server_time_router)` after the health router, docstring names FEAT-1's router
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the app's custom routes

No dependency changes, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file catalogues endpoints.

## Testing Strategy
- Unit tests: the schema and the router handler in isolation, clock patched through `app.routers.server_time.utc_now` (monkeypatch), no HTTP and no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_server_time_unit.py`
  - Cases: `test_server_time_response_serialises_now_with_plus_zero_offset_suffix` (happy: `model_dump(mode="json")["now"]` ends with exactly `+00:00`, not `Z`, equals `UTC_OFFSET_SUFFIX` usage and round-trips through `datetime.fromisoformat` to the input instant); `test_server_time_response_converts_non_utc_aware_datetime_to_utc` (edge: `2026-11-05T03:00:00+02:00` serialises as `2026-11-05T01:00:00.000000+00:00`); `test_server_time_response_rejects_naive_datetime` (error: `pydantic.ValidationError`); `test_server_time_response_rejects_timezone_other_than_utc` (error: `timezone="Europe/Brussels"` raises `ValidationError`); `test_get_server_time_reads_the_clock_on_every_call` (freshness: `utc_now` patched to return two instants one second apart on successive calls, two `get_server_time()` calls return those two different instants).
  - Plus, in the existing `test_main_unit.py`: `test_create_app_registers_time_route`.
- Integration tests: `GET /api/time` through the full HTTP request and response cycle with the session-scoped `client` fixture from `backend/tests/conftest.py`. No database needed (the endpoint reads none; the lifespan already tolerates an unset `DATABASE_URL`).
  - Directory: backend/tests/integration/
  - File: `test_server_time_integration.py`
  - Cases: `test_get_time_returns_200_with_utc_now_and_plus_zero_offset` (status 200, body keys exactly `{"now", "timezone"}`, `timezone == "UTC"`, `now` ends with `+00:00`, `datetime.fromisoformat(now).utcoffset() == timedelta(0)`, and `now` within a few seconds of the test's own `datetime.now(UTC)`); `test_get_time_computes_now_per_request` (clock patched to return `2026-11-05T01:29:16+00:00` then `2026-11-05T01:29:17+00:00`: two requests return exactly those two values, proving per-request computation of the "a second apart" case without a hardcoded wait); `test_get_time_with_real_clock_returns_a_later_now_on_the_second_call` (two unpatched requests, the second `now` strictly later than the first); `test_post_time_returns_405_method_not_allowed` (error case).
- E2E tests: not warranted. E2E Tests is ENABLED, but the endpoint has no UI: no page, component or interaction renders or calls it, so no criterion requires navigation or interaction through the UI (the fourth tier question, asked per criterion below). A browser spec would have to call the API directly, which `testing_standards.md` Section 5 classes as a router integration test. No `e2e/tests/` spec is planned.
  - Directory: e2e/tests/ (none written)
  - File: none
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (POST answers 405), phrased against the HTTP response, and the manual UAT script from `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | verifying it needs no navigation or interaction: it is a router response over the HTTP cycle, and no UI calls this endpoint |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Unit and Integration | verifying it needs no navigation or interaction: it is a schema serialisation rule and a per-request clock read, checked with a patched clock at both tiers |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is the schema's own behaviour (`ServerTimeResponse` validation and serialisation), plus the router's `response_model` exercised by the integration tests |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | verifying it needs no navigation or interaction: this criterion is met by the two test files themselves, named case by case in the tier list above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone`, with `timezone` "UTC" |
| 2 | `now` per request, UTC, explicit offset, never naive | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time twice a second apart, Then the two `now` values differ, the second is later, and both end in "+00:00" |
| 3 | Body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When a client reads the OpenAPI schema, Then GET /api/time's 200 response references `ServerTimeResponse` |
| 4 | Unit and integration tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the repository, When the backend unit and integration test files for server time run, Then 0 failed |

## Manual verification plan
This endpoint has no UI; every check below is made against the running backend with `curl` from a terminal (the backend publishes on http://localhost:8010 under `docker compose up`, per `docker-compose.yml`).

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
Prerequisites: the stack is running (`docker compose up -d --build` from the repository root), and `curl http://localhost:8010/api/version` answers 200.
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body printed under the headers → it is one JSON object with exactly two keys, for example `{"now":"2026-11-05T01:29:16.123456+00:00","timezone":"UTC"}`, and `timezone` is exactly `"UTC"`.

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/time` → note the `now` value, for example `2026-11-05T01:29:16.123456+00:00`.
2. Wait about one second, then run the same command again → the new `now` is a different value, roughly one second later than the first.
3. Compare both `now` values with the terminal's own UTC time (`date -u`) → both show the same hour and minute as `date -u` (allowing for skew of a few seconds), and both end with exactly `+00:00`: never `Z`, never another offset, never a value with no offset at all.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Prerequisites: as for Criterion 1.
1. Open http://localhost:8010/docs in a browser and expand `GET /api/time` → its 200 response shows the schema `ServerTimeResponse` with fields `now` (string, date-time) and `timezone` (string, "UTC").
2. Open `backend/app/routers/server_time.py` → the handler returns `ServerTimeResponse(...)` and declares `response_model=ServerTimeResponse`; no `dict` literal is returned. Open `backend/app/schemas/server_time.py` → it defines `ServerTimeResponse` and states the `+00:00` choice in its docstring.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: a local PostgreSQL is not needed for these files; `uv` is installed.
1. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
2. Read the test names in `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` → the shape (`test_get_time_returns_200_with_utc_now_and_plus_zero_offset`), the exact `+00:00` suffix (`test_server_time_response_serialises_now_with_plus_zero_offset_suffix`) and per-request freshness (`test_get_server_time_reads_the_clock_on_every_call`, `test_get_time_computes_now_per_request`) each have a named test.
