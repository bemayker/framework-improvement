# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature created 2026-09-07 for measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010). It exists to overlap a commit that will land on `main` during the run, not to be independent of it: it registers a router in `backend/app/main.py`, the file TEST-06 and TEST-07 also change.
>
> **What:** `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> **Acceptance criteria**
> * `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> * `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> * The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> * Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> **Notes:** Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The item's "How the measured run uses this item" block is operator instruction, explicitly not part of the feature, and is not planned.)
>
> Source: ClickUp task 123k99ctzxk (https://app.clickup.com/t/123k99ctzxk).

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`. The offset is pinned to `+00:00` (tracker comment point 3), never `Z`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.
- [ ] 5. (Added by tracker comment point 2.) `GET /api/echo?msg={text}` returns 200 with `{"echo": "<msg>"}`, registered in `backend/app/main.py` alongside the time router.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against `origin/main` at `fae177dc` (this branch's base). `73e544c8` is an ancestor of `origin/main` and did add `from app.routers.echo import router as echo_router` plus `app.include_router(echo_router)` after `health_router`, with `backend/app/routers/echo.py` and `backend/app/schemas/echo.py`. **Those lines and files are no longer on main**: the sandbox reset `9dcba19b` (#326) removed the echo router, schema and registration (and an earlier `server_time` router), and the later BUG-01 `server_time` registrations (latest `0e2a97cd`, #828) were removed again by reset `4b839121` (#836), the last commit touching `main.py`. What main holds now: imports `health`, `notes`, `version` (alphabetical, lines 20 to 22) and `create_app()` registers `version_router`, `notes_router`, `health_router` (lines 56 to 58). Insertion point therefore: the two new imports go in alphabetical position (`echo` before `health`, `server_time` between `notes` and `version`), and the two `include_router` calls go after `app.include_router(health_router)`, echo first and then server_time; the module docstring gains one clause naming both. No existing line in `main.py` is changed or reordered.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Addressed by: acted on, added as acceptance criterion 5, because a stakeholder comment on the ticket is input on the same footing as the description and it explicitly requests the endpoint (so it is not gold plating, `user_story_alignment.md` Section 3). Planned in TEST-06's own shape (separate `routers/echo.py` and `schemas/echo.py`, no service), because TEST-06's code is absent from main (point 1) and this recreates it. Assumptions recorded rather than blocked on: `msg` is a required query parameter, so a missing one is FastAPI's own 422 with no handler code; the message is returned verbatim, with no trimming (TEST-11 and BUG-05 disagree about whitespace and own that decision, not this item) and no length bound (TEST-06's former 200-character `max_length` was TEST-06's criterion, the comment does not ask for it). Flagged for the plan reviewer: TEST-06 is marked complete in the feature map and owns these same paths; if the reviewer prefers TEST-06 to be re-delivered on its own, criterion 5 and its manifest entries are the only things to remove.
- Comment (tracker), point 3: "Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: **`+00:00`** chosen. Reason: the criterion asks for an "explicit offset", and `+00:00` is a numeric offset where `Z` is a designator; it is also what `datetime.isoformat()` produces for a UTC-aware value. Pydantic 2.13.4 (pinned in `backend/uv.lock`) serialises a UTC-aware datetime as `Z` by default, so the choice is stated in the schema itself: `ServerTimeResponse` carries a `@field_serializer("now")` returning `value.astimezone(timezone.utc).isoformat()`, with a docstring naming `+00:00`. Covered by `test_server_time_response_serialises_now_with_plus_zero_offset` (unit) and `test_get_time_now_ends_with_plus_zero_offset` (integration), both asserting `endswith("+00:00")` and `not endswith("Z")`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06 ... Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module for either endpoint. Recorded as a planned deviation under `## Backend Plan` → Service layer. As read in `coding_standards/backend_frontend.md` Section 2.2, the Router, Service and Repository pattern applies "when the project includes a backend with data persistence", with business logic and transactional boundaries in the service; this endpoint persists nothing, has no transaction and no business rule, and reading the clock is a one-call dependency. The router keeps no logic: the clock read is a FastAPI dependency function (`current_utc_time`), which is also the seam the per-request test overrides.
- Merged since the last plan: n/a (fresh plan, branched from current main `fae177dc`; no earlier plan exists on this branch).

## Plan Overview
Backend only. Two read-only `GET` endpoints, each a router plus a Pydantic response schema, registered together in `backend/app/main.py`'s `create_app()`:
`GET /api/time` returns the server's current UTC time, computed per request through a FastAPI dependency and serialised with an explicit `+00:00` offset by the schema; `GET /api/echo?msg=` returns its query parameter verbatim. No service, repository, database, migration, frontend or external API work. Tests: unit (schema serialisation, naive rejection, the clock dependency, route registration) and integration (full HTTP cycle, including a dependency override that proves per-request freshness without sleeping).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints:
  - `GET /api/time`, router `backend/app/routers/server_time.py` (`APIRouter(prefix="/api", tags=["time"])`, path `/time`, `response_model=ServerTimeResponse`). Handler signature `get_time(now: Annotated[datetime, Depends(current_utc_time)]) -> ServerTimeResponse`, returning `ServerTimeResponse(now=now)`. `current_utc_time()` is a module-level function in the same router file returning `datetime.now(timezone.utc)`; FastAPI calls it once per request, which is what makes `now` per-request rather than import-time. The module is named `server_time` rather than `time` so it never reads as the stdlib module, and because downstream BUG-01's earlier builds worked against `routers/server_time.py` and `schemas/server_time.py`.
  - `GET /api/echo`, router `backend/app/routers/echo.py` (`APIRouter(prefix="/api", tags=["echo"])`, path `/echo`, `response_model=EchoResponse`). Handler `get_echo(msg: Annotated[str, Query()]) -> EchoResponse`, returning `EchoResponse(echo=msg)`. `msg` has no default, so a missing parameter is FastAPI's own 422.
  - Schemas: `backend/app/schemas/server_time.py` defines `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's type that rejects a naive datetime at construction) and `timezone: Literal["UTC"] = "UTC"`, plus `@field_serializer("now")` returning `value.astimezone(timezone.utc).isoformat()`, so the wire format is always UTC with the `+00:00` suffix, whatever offset the input carried. `backend/app/schemas/echo.py` defines `EchoResponse(BaseModel)` with `echo: str`.
  - Registration in `backend/app/main.py`: two imports in alphabetical position and two `app.include_router(...)` calls after `health_router` (echo, then server_time), docstring extended; nothing else in the file changes (see Re-Plan Feedback point 1).
- Service layer: none, as a **planned deviation** from `coding_standards/backend_frontend.md` Section 2.2 (tracker comment point 4, following the decision taken on TEST-06): neither endpoint has persistence, a transaction or a business rule, so a service module would only wrap `datetime.now()` and an identity return. The router still holds no business logic.
- Repository layer: none, no data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no parameters, no body.
- Response: `200`, `{"now": "2026-11-17T18:12:20.123456+00:00", "timezone": "UTC"}`. `now` is ISO 8601, always in UTC, always ending `+00:00` (never `Z`, never naive); microseconds appear when non-zero, as `isoformat()` emits them. `timezone` is always the literal `"UTC"`. Other methods: `405`.

- Method: GET
- URL: `/api/echo?msg={text}`
- Request: query parameter `msg` (string, required, returned verbatim).
- Response: `200`, `{"echo": "hello world"}` for `?msg=hello%20world`. Missing `msg`: `422` with FastAPI's standard validation body. Other methods: `405`.

## Technology Selection
- Current time (`routers/server_time.py`, `current_utc_time`): chose the standard library's `datetime.now(timezone.utc)` over any time library (none is installed and none is needed), because the stdlib returns an aware UTC datetime directly.
- Per-request computation: chose FastAPI's built-in `Depends` (installed, 0.139.2) over a hand-rolled clock seam or a service class, because a dependency is resolved per request and is overridable in tests through `app.dependency_overrides`.
- Naive rejection and offset pinning (`schemas/server_time.py`): chose Pydantic's own `AwareDatetime` and `field_serializer` (installed, 2.13.4) over custom validation code in the router, because the schema is where criterion 3 and comment point 3 require the rule to live.
- Echo endpoint (`routers/echo.py`, `schemas/echo.py`): FastAPI's `Query` and a one-field Pydantic model cover it; no new dependency.
- No new dependency at all, so no lockfile change.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` with `AwareDatetime` `now`, `Literal["UTC"]` `timezone`, and the `+00:00` field serializer.
- [B] backend/app/routers/server_time.py: `GET /api/time` router and the `current_utc_time` dependency.
- [B] backend/app/schemas/echo.py: `EchoResponse` with `echo: str`.
- [B] backend/app/routers/echo.py: `GET /api/echo` router with the required `msg` query parameter.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests of the schema serialisation, naive rejection, non-UTC conversion and the clock dependency.
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time` (shape, offset, per-request freshness, real-clock bounds, 405).
- [B] backend/tests/integration/test_echo_integration.py: HTTP-cycle tests for `GET /api/echo` (verbatim echo, special characters, missing `msg` 422).
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual UAT script build-feature writes.

### Modified files
- [B] backend/app/main.py: import `echo_router` and `server_time_router`, register both after `health_router`, extend the module docstring.
- [B] backend/tests/unit/test_main_unit.py: add route-registration tests for `/api/time` and `/api/echo`.

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. No E2E spec: no criterion involves the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: `ServerTimeResponse` serialisation (`+00:00` suffix, not `Z`; an aware non-UTC input such as `+02:00` is converted to UTC; a naive datetime raises `ValidationError`; `timezone` is `"UTC"`), `current_utc_time()` returns an aware datetime with zero UTC offset, and `create_app()` registers `/api/time` and `/api/echo`. No mocks needed: these are pure functions and models.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_unit.py`; registration tests extend `test_main_unit.py`)
- Integration tests: full HTTP request and response cycle through `TestClient`. For `/api/time`: 200 and the exact key set, the `+00:00` suffix, per-request freshness through `app.dependency_overrides[current_utc_time]` on a fresh `create_app()` (a fake clock that returns `2026-01-01T00:00:00+00:00` then `2026-01-01T00:00:01+00:00`, so the two calls a second apart differ deterministically, with no sleep and no shared-state mutation of the session `client`), a real-clock call whose `now` falls between timestamps taken before and after it, and 405 on `POST`. For `/api/echo`: verbatim echo, a URL-encoded message with spaces and `&`, and 422 without `msg`. Neither endpoint touches the database, so no `DATABASE_URL` is needed.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. E2E is ENABLED, but no criterion involves navigation or interaction through the UI (backend-only endpoints with no frontend consumer), so no spec is written.
  - Directory: e2e/tests/
  - File: none (would be `FEAT-1_server_time_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (echo without `msg` returns 422), expressed as API requests and responses.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` (UTC, `+00:00`) and `timezone: "UTC"` | Integration | `test_get_time_returns_200_with_now_and_utc_timezone`, `test_get_time_now_ends_with_plus_zero_offset`, `test_post_time_returns_405_method_not_allowed` | It is a router response shape: verifying it needs no navigation or interaction, and the endpoint has no UI. |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration and Unit | `test_get_time_computes_now_per_request`, `test_get_time_now_is_within_request_window`, `test_current_utc_time_returns_aware_utc_datetime`, `test_server_time_response_rejects_naive_datetime`, `test_server_time_response_converts_non_utc_time_to_utc` | Freshness is a dependency-resolution behaviour and naive rejection a schema rule: neither needs navigation or interaction. |
| 3 | Body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_server_time_response_serialises_now_with_plus_zero_offset`, `test_server_time_response_timezone_is_utc` | It is a code-structure rule verified on the schema itself, with no UI involved. |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit and Integration | `test_get_time_returns_200_with_now_and_utc_timezone`, `test_get_time_now_ends_with_plus_zero_offset`, `test_get_time_computes_now_per_request`, `test_server_time_response_serialises_now_with_plus_zero_offset` | It is a criterion about the test suite, satisfied by the unit and integration tests named in rows 1 to 3. |
| 5 | `GET /api/echo?msg={text}` returns `{"echo": "<msg>"}`, registered with the time router | Integration and Unit | `test_get_echo_returns_200_with_msg_echoed`, `test_get_echo_returns_msg_verbatim_with_special_characters`, `test_get_echo_without_msg_returns_422`, `test_create_app_registers_echo_route`, `test_create_app_registers_time_route` | It is a router behaviour and a registration fact, with no UI involved. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/time, Then the status is 200 and the body has `now` ending `+00:00` and `timezone` `UTC` |
| 2 | `now` per request, UTC, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/time twice a second apart, Then the two `now` values differ and both end `+00:00` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API's OpenAPI document, When I look up the GET /api/time response, Then it references the `ServerTimeResponse` schema |
| 4 | Tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When I run the server-time unit and integration tests, Then the run passes |
| 5 | `GET /api/echo?msg=` echoes the message | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/echo?msg=hello%20world, Then the status is 200 and the body is `{"echo": "hello world"}` |

## Manual verification plan
None of these criteria can be verified through the UI: both endpoints are backend-only with no frontend consumer. Each block therefore gives the observable check, a request and the response to read, against the backend on `http://localhost:8010`.

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone: "UTC"`
Prerequisites: the stack is up (`docker compose up -d` at the repo root) and the backend answers on port 8010.
1. Run `curl -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and the body is a JSON object with exactly two keys, `now` and `timezone`.
2. Read `timezone` → it is exactly `"UTC"`.
3. Read `now` → it looks like `2026-11-17T18:12:20.123456+00:00`: date, `T`, time, and it ends with `+00:00` (not `Z`, and not without an offset).

### Criterion 2: `now` is computed per request, in UTC, never naive
Prerequisites: as for criterion 1.
1. Run `curl -s http://localhost:8010/api/time`, wait about one second, and run it again → two bodies are printed.
2. Compare the two `now` values → the second is later than the first by roughly one second; they are not identical.
3. Compare each `now` with your own clock in UTC (`date -u +%H:%M:%S`) → the hour and minute match UTC, not your local time zone, and both values end `+00:00`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the 200 response's schema is named `ServerTimeResponse`, with fields `now` (string, date-time) and `timezone`.
2. Open `backend/app/schemas/server_time.py` → it defines `ServerTimeResponse`, and its `now` serializer's docstring names the `+00:00` choice; `backend/app/routers/server_time.py` returns that model, not a dict.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: `uv` installed; no database needed for these tests.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py` → the summary line reports no failed or errored test, and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → it contains `test_get_time_returns_200_with_now_and_utc_timezone` (shape), `test_get_time_now_ends_with_plus_zero_offset` (offset) and `test_get_time_computes_now_per_request` (freshness).

### Criterion 5: `GET /api/echo?msg={text}` returns `{"echo": "<msg>"}`
Prerequisites: as for criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → status `200 OK`, body `{"echo":"hello world"}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=a%26b%20c"` → status `200 OK`, body `{"echo":"a&b c"}`.
3. Run `curl -i http://localhost:8010/api/echo` (no `msg`) → status `422 Unprocessable Entity`, with a validation body naming the missing `msg` query parameter.
4. Run `uv run --directory backend pytest -q tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the summary line reports no failed or errored test, and the command exits 0.
