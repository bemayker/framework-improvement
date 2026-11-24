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
> (The item's "How the measured run uses this item" block is operator instructions, explicitly not part of the feature, and is not planned against.)

## Acceptance Criteria
- [ ] AC1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] AC2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive. The offset is pinned to `+00:00` (tracker comment point 3, below).
- [ ] AC3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] AC4: Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py, the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: verified against git, not taken from the comment. `73e544c8` (feat(TEST-06): Echo endpoint (#35), 2026-09-14) is an ancestor of `origin/main` and did add `from app.routers.echo import router as echo_router` and `app.include_router(echo_router)` after the health registration. It is no longer in effect: the echo router was re-added by `ea5f29a5` (#316) and then removed by the sandbox reset `9dcba19b` (#326), and `origin/main` at `669b9494` has no `backend/app/routers/echo.py`. Main as it now stands (`git show origin/main:backend/app/main.py`) imports `health_router`, `notes_router`, `version_router` in alphabetical order and registers `version_router`, `notes_router`, `health_router` in `create_app()`. Insertion point: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports (keeping the alphabetical order), and `app.include_router(server_time_router)` goes after `app.include_router(health_router)` as the last line before `return app`; the module docstring gains "FEAT-1 the server time router". What changed against the comment's premise: the echo lines the comment expects to find are not there, so FEAT-1 is planned against the three-router block, not a four-router one. A reset commit `8e5fc4db` also removed an earlier FEAT-1 build (`routers/server_time.py`, `schemas/server_time.py`, `services/server_time_service.py`); nothing of it is on main, so every FEAT-1 file below is created fresh.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on because the echo endpoint is its own tracked work item, TEST-06 "Echo endpoint" (branch `feature/TEST-06-echo-endpoint`, files `backend/app/routers/echo.py`, `backend/app/schemas/echo.py`, `backend/tests/integration/test_echo_integration.py`), with two dependants (TEST-11 and BUG-05) that specify opposite whitespace behaviour for that same endpoint. Building it inside FEAT-1 would either duplicate TEST-06 (if the comment's premise that it is merged were true) or pre-empt it with untested scope and collide with TEST-06's files (as main actually stands); `user_story_alignment.md` Sections 3 and 6 treat both as out of bounds (no gold plating; check existing items before creating duplicates). Assumption made, flagged for the plan PR reviewer: echo stays with TEST-06. If the reviewer wants it inside FEAT-1 anyway, the change is two manifest entries (`backend/app/routers/echo.py`, `backend/app/schemas/echo.py`), their tests and one more registration line, and TEST-06 must then be closed as superseded so the two never both build.
- Comment (tracker), point 3: "Pin the offset now: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is `+00:00`. Reason: the criterion says "explicit offset", and `+00:00` is a numeric offset, where `Z` is a designator; it is also what `datetime.isoformat()` produces. The choice is load-bearing rather than free: the installed Pydantic (2.13.4, `backend/uv.lock`) serialises a UTC `datetime` as `...Z` in JSON mode, so the schema pins the format with a `field_serializer` (`value.astimezone(timezone.utc).isoformat(timespec="microseconds")`, fixed width, for example `2026-11-24T04:38:10.123456+00:00`) and states the choice in its docstring and the field description. Tests asserting the exact suffix: `test_server_time_response_serializes_now_with_plus_zero_offset_suffix` (unit) and `test_get_server_time_now_has_explicit_plus_zero_offset` (integration), both asserting `endswith("+00:00")` and that `"Z"` does not end the string.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: Router -> Service -> Repository is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation." → Addressed by: no service module and no repository. Planned deviation from `coding_standards.md` Section 2.2 (in the plugin's `coding_standards/backend_frontend.md`), recorded here and under `## Backend Plan`: the router reads the clock through a module-level `_utc_now()` helper and builds the schema; there is no business logic and no transaction to put in a service. I did not open TEST-06's plan to confirm the "decision taken on TEST-06" (a planner never reads another item's plan); the deviation rests on Section 2.2's own text, whose service layer is defined by business logic and transactional boundaries. Note the precedent is mixed: TEST-05's version endpoint, the nearest existing shape, does use a service (`version_service.py`); this plan follows the comment over that precedent.
- Merged since the last plan: n/a (fresh plan, branched from current main `669b9494`; no earlier plan on this branch).

## Plan Overview
Backend only. One new read-only endpoint, `GET /api/time`, in a new router `backend/app/routers/server_time.py`, with its response defined by a new Pydantic schema `backend/app/schemas/server_time.py`, registered in `backend/app/main.py` after the health router. No database, no service layer (planned deviation, Re-Plan Feedback point 4), no frontend, no new dependency. Tests: unit tests for the schema's serialisation and the handler's per-call clock read, a route-registration unit test, and router integration tests over the real HTTP cycle.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time. Router `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time() -> ServerTimeResponse` declared with `response_model=ServerTimeResponse`, the same shape as `backend/app/routers/version.py`.
- Clock: a module-level `_utc_now() -> datetime` in the router returning `datetime.now(timezone.utc)`, called inside the handler on every request (never at import or at app creation), so it is computed per request and is the one seam tests patch.
- Schema: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's type that rejects a naive datetime at validation) and `timezone: Literal["UTC"] = "UTC"`. A `@field_serializer("now")` returns `value.astimezone(timezone.utc).isoformat(timespec="microseconds")`, pinning the `+00:00` suffix and a fixed-width fraction; the docstring states the `+00:00` choice and why `Z` was not used.
- Service layer: none. Planned deviation from `coding_standards.md` Section 2.2: reading a clock is neither business logic nor a transactional boundary (Re-Plan Feedback point 4).
- Repository layer: none, no data access.
- Migrations: none.
- Registration: `backend/app/main.py`, import `server_time_router` between the notes and version imports, `app.include_router(server_time_router)` after `app.include_router(health_router)`; docstring extended. CORS middleware untouched (it already allows GET).
- Out of scope, deliberately: no `Cache-Control` header (that is downstream BUG-01's own item), no query parameters, no other time zones.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `application/json`, body defined by `ServerTimeResponse`:

```json
{"now": "2026-11-24T04:38:10.123456+00:00", "timezone": "UTC"}
```

- `now`: ISO 8601, always UTC, always the `+00:00` suffix, always six fractional digits; never naive, never `Z`.
- `timezone`: always the literal string `UTC`.
- Any other method on `/api/time`: 405 (FastAPI default).

## Technology Selection
- Server clock: chose the standard library's `datetime.now(timezone.utc)` over any time library, because the stdlib returns an aware UTC datetime directly.
- Naive-datetime guard: chose Pydantic's installed `AwareDatetime` type over a hand-written validator, because the installed dependency already rejects naive values.
- Offset formatting: chose a `field_serializer` calling stdlib `isoformat(timespec="microseconds")` over Pydantic's default datetime serialisation, because the default emits `Z` and the plan pins `+00:00`.
- `backend/app/routers/server_time.py` and `backend/app/schemas/server_time.py`: no stdlib call, native platform feature or installed dependency provides an application route or its response schema, so they are built here on the installed FastAPI and Pydantic.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, `now: AwareDatetime` with the `+00:00` field serializer, `timezone: Literal["UTC"]`
- [B] backend/app/routers/server_time.py: `GET /api/time` router with the `_utc_now()` clock seam
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema's serialisation and validation and for the handler's per-call clock read
- [B] backend/tests/integration/test_server_time_integration.py: router integration tests over the full HTTP cycle
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual UAT script build-feature writes

### Modified files
- [B] backend/app/main.py: import and register `server_time_router` after the health router; docstring names FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`

No lockfile changes: the feature adds no dependency. No `README.md` or `docs/DEVELOPMENT.md` change: neither lists endpoints, and the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `ServerTimeResponse` serialisation (exact `+00:00` suffix, six fractional digits, non-UTC aware input converted to UTC, `timezone` always `UTC`), validation (a naive datetime is rejected with `ValidationError`), the handler's per-call clock read (calling `get_server_time()` twice with `_utc_now` patched to two different instants returns two different `now` values), and route registration in `create_app()`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the session `client` fixture (no database needed: the endpoint touches none): 200 with exactly the keys `now` and `timezone`; `now` ends in `+00:00` and parses with `datetime.fromisoformat` to an aware value with zero UTC offset; two requests with `app.routers.server_time._utc_now` monkeypatched to instants one second apart return different `now` values (per request, not cached; no sleep); an unpatched `now` lies within a few seconds of the test's own `datetime.now(timezone.utc)`; `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none. The E2E toggle is ENABLED, but no criterion involves navigation or interaction through the UI and the feature adds no frontend, so no criterion's covering tier is E2E (`testing_standards.md` Section 6). No spec file is written.
  - Directory: e2e/tests/
  - File: n/a, no criterion warrants a spec
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a non-GET method returns 405), and the manual script expanded from `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | Integration | `test_get_server_time_returns_200_with_now_and_timezone`, `test_post_server_time_returns_405_method_not_allowed`, `test_create_app_registers_server_time_route` | verifying it needs no navigation or interaction: it is a router response shape, observable over HTTP |
| 2 | `now` computed per request, UTC, explicit `+00:00` offset, never naive | Integration | `test_get_server_time_now_has_explicit_plus_zero_offset`, `test_get_server_time_now_is_computed_per_request`, `test_get_server_time_now_is_close_to_current_utc_time`, `test_get_server_time_computes_now_per_call` | verifying it needs no navigation or interaction: it is a serialisation and per-request behaviour of the router |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_server_time_response_serializes_now_with_plus_zero_offset_suffix`, `test_server_time_response_rejects_naive_datetime`, `test_server_time_response_converts_non_utc_aware_datetime_to_utc`, `test_server_time_response_timezone_is_utc` | verifying it needs no navigation or interaction: it is a schema's validation and serialisation rule |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit | `test_server_time_response_serializes_now_with_plus_zero_offset_suffix`, `test_get_server_time_computes_now_per_call`, `test_get_server_time_now_is_computed_per_request` | verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests themselves existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` with `timezone` equal to `UTC` |
| 2 | `now` per request, UTC, `+00:00` | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/time twice a second apart, Then both `now` values end in `+00:00` and they differ |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When I open the OpenAPI schema, Then GET /api/time's 200 response references `ServerTimeResponse` |
| 4 | Unit and integration tests cover shape, offset, freshness | covered at Unit, see Criterion coverage | Given the repository, When I run the FEAT-1 unit and integration test files, Then the run passes |

## Manual verification plan
None of the four criteria can be verified through the application UI: FEAT-1 is a backend endpoint with no frontend. Each block below gives the observable check instead, through a terminal and the backend's own OpenAPI page.

### Criterion 1: GET /api/time returns 200 with now and timezone
Prerequisites: the stack is running (`docker compose up -d --build` from the repository root), so the backend answers on `http://localhost:8010`.
1. Run `curl -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it has exactly two keys, `now` (a timestamp such as `2026-11-24T04:38:10.123456+00:00`) and `timezone` with the value `UTC`.
3. Run `curl -i -X POST http://localhost:8010/api/time` → the status line reads `405 Method Not Allowed`.

### Criterion 2: now is computed per request, in UTC with an explicit offset
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8010/api/time`, wait about one second, and run it again → two bodies.
2. Compare the two `now` values → they differ, and the second is later than the first.
3. Read the end of each `now` value → each ends in `+00:00`, never in `Z` and never with no offset at all.
4. Compare the hour in `now` with the current UTC time (`date -u`) → they agree to within a few seconds.

### Criterion 3: the response body is defined by a Pydantic schema
Prerequisites: as for Criterion 1.
1. Open `http://localhost:8010/docs` in a browser → the Swagger page lists `GET /api/time` under the `time` tag.
2. Expand `GET /api/time` and look at its 200 response → the schema shown is `ServerTimeResponse`, with fields `now` (string, date-time) and `timezone`.
3. Open `backend/app/schemas/server_time.py` → it defines `ServerTimeResponse`, and its docstring states the `+00:00` choice; `backend/app/routers/server_time.py` builds that schema and returns no bare dict.

### Criterion 4: unit and integration tests cover the shape, the offset and the freshness
Prerequisites: a checkout of the branch, with `uv` installed.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py` → the summary line reports no failed or errored test, and the command exits 0.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the summary line reports no failed or errored test, and the command exits 0.
3. Open both test files → there are tests named for the shape (`test_get_server_time_returns_200_with_now_and_timezone`), the offset (`test_get_server_time_now_has_explicit_plus_zero_offset`) and the freshness (`test_get_server_time_now_is_computed_per_request`).

## Scope changes

- 2026-11-24 The tracker comment's point 2 (add GET /api/echo?msg={text} in backend/app/main.py, with backend/app/routers/echo.py and backend/app/schemas/echo.py) is not added to FEAT-1's scope. Reason: GET /api/echo is TEST-06's own work item, TEST-11 and BUG-05 build on it with opposite whitespace rules, and no FEAT-1 acceptance criterion asks for it (user_story_alignment.md Sections 3 and 6); the plan PR reviewer is asked to confirm or overrule.
