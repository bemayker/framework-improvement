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
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. **It touches** **`main.py`****'s router registration, so it must not be built concurrently with another backend item that does the same.**
>
> ## How the measured run uses this item (operator instructions, not part of the feature)
>
> 1. `/plan-feature TEST-09` **before** Arm C's item (TEST-06) merges. Leave it at `plan_review`; a re-plan is only possible there (baseline Section 5.3).
> 2. After TEST-06 merges to `main` (its squash touches `backend/app/main.py`), post the re-plan comment on this item and run `/plan-feature TEST-09` again.
> 3. **Pass:** the merged-since check reports a non-clean verdict naming the overlapping commit, and the re-plan answers the comment point by point (MDF-008). **`verdict=clean`** **on this item is a failed setup, not a pass** (baseline Section 5.2).
> 4. Do not build it before step 3 has been recorded. Whether it is then built is the operator's choice; it is not one of the items the baseline's numbers are compared on.

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.
- [ ] 5. (Added by tracker comment, point 2) `GET /api/echo?msg={text}` returns 200 with `{"echo": "<msg>"}`, registered in `backend/app/main.py` in the same change as `/api/time`.
- [ ] 6. (Added by tracker comment, point 3) The offset is pinned to `+00:00` (never `Z`), the choice is stated in the Pydantic schema, and a test asserts the exact suffix.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked with git against `origin/main` at `7397b07` (this branch's base). `73e544c` (feat(TEST-06): Echo endpoint, #35) is in main's ancestry and did add `from app.routers.echo import router as echo_router` and `app.include_router(echo_router)` after `health_router`. But it is no longer what main holds: the echo router was removed again by later sandbox resets, the most recent being `9dcba19` (chore: reset the sandbox after release run 0.3.443 T8, #326), and `backend/app/routers/echo.py` does not exist on main today. `backend/app/main.py` on main registers exactly three routers in `create_app()`, in this order: `version_router`, `notes_router`, `health_router`, then `return app`; the import block holds `routers.health`, `routers.notes`, `routers.version`. So what changed relative to the comment's premise: the TEST-06 lines the comment expects to sit in the registration block are absent, and the insertion point is directly after `app.include_router(health_router)`. This plan adds two `include_router` lines there (echo, then server_time) and two imports in alphabetical position (`routers.echo` before `routers.health`, `routers.server_time` between `routers.notes` and `routers.version`), and extends the module docstring's per-feature list. No other line of `main.py` changes (CORS middleware and lifespan untouched).
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Addressed by: acted on as acceptance criterion 5, because a tracker comment amends the description and this one explicitly requests the endpoint. Planned as `backend/app/routers/echo.py` plus `EchoResponse` in `backend/app/schemas/echo.py`, registered in the same `main.py` edit as the time router. Assumptions recorded because the comment specifies only the success shape: `msg` is required, so a request without it gets FastAPI's standard 422 (framework validation, no handler code); `msg` is returned verbatim after URL decoding, with no trimming; no length bound is added, because the comment asks for none and TEST-06's former 200-character bound is not part of this request (no gold plating). Risk flagged rather than hidden: `/api/echo` is TEST-06's endpoint (feature_map row TEST-06), and TEST-11 (trim) and BUG-05 (keep whitespace) both specify its whitespace behaviour in opposite directions; this plan takes BUG-05's reading by doing nothing (verbatim), and `shared_risks.md` flags the overlap.
- Comment (tracker), point 3: "Pin the offset now: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`, recorded as acceptance criterion 6. Reason: the criterion asks for an "explicit offset", and `+00:00` is a numeric offset while `Z` is a zone designator; `+00:00` is also what Python's `datetime.isoformat()` emits for an aware UTC value. The choice must be made in code because pydantic 2.13 (installed, `backend/uv.lock`) serialises an aware UTC datetime with a `Z` suffix by default; `ServerTimeResponse` therefore carries a `@field_serializer("now")` that returns `value.astimezone(UTC).isoformat(timespec="microseconds")`, with the choice stated in the schema's docstring and a module constant `UTC_OFFSET_SUFFIX = "+00:00"`. Covered by `test_server_time_response_serializes_now_with_plus_zero_offset` (unit) and `test_get_time_now_ends_with_plus_zero_offset` (integration), both asserting `endswith("+00:00")` and the absence of `Z`. `timespec="microseconds"` is also an assumption: without it `isoformat()` drops the fraction when the microsecond is 0, giving the field two shapes.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `services/server_time_service.py` and no `services/echo_service.py`. Recorded as a planned deviation in `## Plan Overview` and `## Backend Plan`, matching the TEST-06 plan in `73e544c`. The clock read lives in the router module as a FastAPI dependency (`utc_now`) so tests can substitute it without a service layer.
- Comment (tracker), 30 others: the framework's own "Plan PR opened" link and answer comments for earlier, now closed plan PRs. → Not acted on because they carry no planning content and ask for nothing; recorded so no comment is silently dropped.
- Merged since the last plan: n/a (fresh plan, branched from current main at `7397b07`; no earlier plan on this branch to reconcile).

## Plan Overview
Backend-only feature. Add two GET endpoints to the FastAPI app, each as one router plus one response schema, registered together in `create_app()` in `backend/app/main.py` exactly as the version and health routers are:

`GET /api/time` (`backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py`) returns `ServerTimeResponse(now=..., timezone="UTC")`. `now` comes from a router-module dependency `utc_now()` that calls `datetime.now(UTC)` on every request, so the value is fresh per request and always aware. The schema types `now` as pydantic's `AwareDatetime` (a naive value fails validation) and serialises it in UTC with the literal `+00:00` suffix.

`GET /api/echo` (`backend/app/routers/echo.py`, `backend/app/schemas/echo.py`) returns `EchoResponse(echo=msg)` for a required `msg` query parameter, verbatim.

Planned deviation from `coding_standards.md` Section 2.2 (tracker comment point 4): no service module for either endpoint. Section 2.2's Router → Service → Repository pattern is for business logic and transactional boundaries; reading the clock and echoing a validated string are neither, and the existing code keeps a service only where there is logic to hold (`version_service`, `health_service`, `note_service`). The router still holds no business logic, which is the part of Section 2.2 that binds here. No frontend work, no repository, no migration, no new dependency.

Recorded assumptions (`user_story_alignment.md` Section 4, unattended surfaces):
- "Two calls a second apart differ" is verified deterministically by overriding the `utc_now` dependency with two instants one second apart, plus one un-overridden two-call test asserting the second `now` is strictly later. No `sleep` in tests.
- `timezone` is the constant `"UTC"`, typed `Literal["UTC"]`; the server's own local timezone is never reported.
- Neither endpoint needs a database; both answer with `DATABASE_URL` unset, as `/api/version` does.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` in `backend/app/routers/server_time.py`, `router = APIRouter(prefix="/api", tags=["time"])`, handler `def get_time(now: Annotated[datetime, Depends(utc_now)]) -> ServerTimeResponse` decorated `@router.get("/time", response_model=ServerTimeResponse)`, body `return ServerTimeResponse(now=now)`. The same module defines `def utc_now() -> datetime: return datetime.now(UTC)` (docstring: the clock is a dependency so tests can override it via `app.dependency_overrides`). `GET /api/echo` in `backend/app/routers/echo.py`, `router = APIRouter(prefix="/api", tags=["echo"])`, handler `def get_echo(msg: Annotated[str, Query()]) -> EchoResponse` decorated `@router.get("/echo", response_model=EchoResponse)`, body `return EchoResponse(echo=msg)`. Neither handler contains an `if`, a `len()` or an `HTTPException`.
- Service layer: none, by the recorded deviation above (tracker comment point 4).
- Repository layer: none. No data access.
- Migrations: none.
- Schemas: `backend/app/schemas/server_time.py` holds `UTC_OFFSET_SUFFIX: str = "+00:00"` and `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` and `timezone: Literal["UTC"] = "UTC"`, plus `@field_serializer("now")` returning `value.astimezone(UTC).isoformat(timespec="microseconds")`. The class docstring states the choice: always UTC, always the numeric `+00:00` offset, never `Z`, never naive. `backend/app/schemas/echo.py` holds `class EchoResponse(BaseModel)` with `echo: str`, in the style of `schemas/version.py`.
- App factory: `backend/app/main.py` gains `from app.routers.echo import router as echo_router` and `from app.routers.server_time import router as server_time_router` in alphabetical position, and `app.include_router(echo_router)` then `app.include_router(server_time_router)` after `app.include_router(health_router)`. The module docstring's per-feature list gains a FEAT-1 clause naming both routers.
- Logging: nothing to log; neither endpoint has a failure path of its own.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: none (no query, no body).
- Response 200, defined by `ServerTimeResponse` in `backend/app/schemas/server_time.py`:

  ```json
  {"now": "2026-11-13T06:43:27.123456+00:00", "timezone": "UTC"}
  ```

  `now` is always `YYYY-MM-DDTHH:MM:SS.ffffff+00:00`. Any other method: 405 (FastAPI default).

- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg` (string, required, returned verbatim after URL decoding). No body.
- Response 200, defined by `EchoResponse` in `backend/app/schemas/echo.py`:

  ```json
  {"echo": "hello"}
  ```

- Response 422 when `msg` is absent: FastAPI's standard validation body, `detail[0].type == "missing"`, `detail[0].loc == ["query", "msg"]`.

## Technology Selection
- Current time: chose the standard library's `datetime.now(datetime.UTC)` over any installed or new date library, because the stdlib returns an aware UTC value directly.
- Offset serialisation: chose a pydantic `@field_serializer` calling stdlib `isoformat(timespec="microseconds")` over pydantic's default datetime serialisation (installed, emits `Z`, which point 3 rules out) and over a hand-built format string, because `isoformat` already emits `+00:00` for an aware UTC value.
- Naive-datetime guard: chose pydantic's built-in `AwareDatetime` type (installed) over a hand-written validator, because it rejects naive values declaratively.
- Clock injection: chose a FastAPI `Depends(utc_now)` dependency (installed) over a net-new service module or a monkeypatched module global, because `app.dependency_overrides` is the framework's own substitution point and needs no extra layer.
- Response schemas: chose pydantic `BaseModel` (`ServerTimeResponse`, `EchoResponse`; pydantic ships with the installed FastAPI) over a bare dict, which criterion 3 forbids.
- Required `msg` check: chose FastAPI's parameter declaration (no default, framework 422) over a hand-written check in the handler.
- Service modules: chose to construct both responses in the router over net-new `services/` modules, because there is no business logic to own (tracker comment point 4).
- No net-new dependency is added by this feature, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `UTC_OFFSET_SUFFIX` and `ServerTimeResponse` (`now: AwareDatetime` serialised as UTC with `+00:00`, `timezone: Literal["UTC"]`).
- [B] backend/app/routers/server_time.py: `utc_now()` clock dependency and the `GET /api/time` router returning `ServerTimeResponse`.
- [B] backend/app/schemas/echo.py: `EchoResponse` (`echo: str`) for `GET /api/echo`.
- [B] backend/app/routers/echo.py: `GET /api/echo` router with a required `msg` query parameter, returning `EchoResponse(echo=msg)`.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for `ServerTimeResponse` (exact `+00:00` suffix, conversion of a non-UTC aware value to UTC, naive value rejected, `timezone` literal) and for `utc_now()` (aware, offset zero).
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle for `GET /api/time`: shape and keys, exact suffix, per-request freshness via a dependency override one second apart and via two real calls, OpenAPI names `ServerTimeResponse`, 405 on POST.
- [B] backend/tests/integration/test_echo_integration.py: full HTTP cycle for `GET /api/echo`: 200 `{"echo": "hello"}`, surrounding spaces returned verbatim, 422 when `msg` is absent, OpenAPI names `EchoResponse`.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus the naive-value edge case.
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the echo and server_time routers, add `app.include_router(echo_router)` and `app.include_router(server_time_router)` after the health registration, extend the module docstring with FEAT-1.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` and `test_create_app_registers_echo_route`, following the existing version and health registration tests.

No dependency manifest changes, so `backend/uv.lock` is not touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, and neither document lists the application's endpoints.

## Testing Strategy
- Unit tests: the schema's serialisation and validation rules and the `utc_now` clock, in isolation (no app, no HTTP); the app-factory registration tests in the existing `test_main_unit.py`. Test names: `test_server_time_response_serializes_now_with_plus_zero_offset`, `test_server_time_response_converts_aware_datetime_to_utc`, `test_server_time_response_rejects_naive_datetime`, `test_server_time_response_timezone_is_utc`, `test_utc_now_returns_aware_utc_datetime`, `test_create_app_registers_time_route`, `test_create_app_registers_echo_route`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_unit.py`; registration tests go into the existing `test_main_unit.py`)
- Integration tests: both routers through the full HTTP cycle with the session-scoped `client` fixture from `backend/tests/conftest.py`; the freshness override test builds its own `create_app()` instance and sets `app.dependency_overrides[utc_now]`, so the shared client is never mutated. No test requests `database_url` or `db_connection`. Time tests: `test_get_time_returns_200_with_now_and_utc_timezone` (status 200, keys exactly `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` and has `utcoffset() == timedelta(0)`), `test_get_time_now_ends_with_plus_zero_offset` (suffix asserted via the imported `UTC_OFFSET_SUFFIX` and by the literal `"+00:00"`, and `"Z"` absent), `test_get_time_now_is_computed_per_request` (override yields `2026-01-01T00:00:00+00:00` then `2026-01-01T00:00:01+00:00`; the two responses differ by exactly one second), `test_get_time_two_real_calls_return_different_instants` (no override; second `now` strictly later than the first), `test_get_time_openapi_references_server_time_response`, `test_post_time_returns_405_method_not_allowed`. Echo tests: `test_get_echo_returns_200_with_msg`, `test_get_echo_returns_msg_verbatim_with_surrounding_spaces`, `test_get_echo_without_msg_returns_422`, `test_get_echo_openapi_references_echo_response`.
  - Directory: backend/tests/integration/ (`test_server_time_integration.py`, `test_echo_integration.py`)
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion below): no page consumes either endpoint. E2E is ENABLED project-wide; no `e2e/tests/FEAT-1_*.spec.ts` is produced.
  - Directory: e2e/tests/ (no file added)
  - File: none (would be `FEAT-1_server_time_endpoint.spec.ts` if warranted)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge case (a naive datetime is rejected by the schema), phrased as HTTP requests and responses; validated for well-formedness, not executed in a browser.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | `test_get_time_returns_200_with_now_and_utc_timezone`, `test_create_app_registers_time_route` | Verifying it needs no navigation or interaction: it is a router behaviour over the HTTP cycle and no UI consumes the endpoint |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration | `test_get_time_now_is_computed_per_request`, `test_get_time_two_real_calls_return_different_instants`, `test_server_time_response_rejects_naive_datetime`, `test_server_time_response_converts_aware_datetime_to_utc` | Freshness is a request-level behaviour and the naive guard is a schema validation rule; neither involves a page |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_get_time_openapi_references_server_time_response` | The OpenAPI component reference and the exact body shape prove it; no interaction is involved |
| 4 | Unit and integration tests cover the shape, the offset and the freshness | Unit | `test_server_time_response_serializes_now_with_plus_zero_offset`, `test_server_time_response_timezone_is_utc`, `test_utc_now_returns_aware_utc_datetime` | A criterion about the test suite itself: it is met by the unit tests named here together with the integration tests on rows 1, 2 and 6 |
| 5 | `GET /api/echo?msg={text}` returns 200 with `{"echo": "<msg>"}` | Integration | `test_get_echo_returns_200_with_msg`, `test_get_echo_returns_msg_verbatim_with_surrounding_spaces`, `test_get_echo_without_msg_returns_422`, `test_get_echo_openapi_references_echo_response`, `test_create_app_registers_echo_route` | A router behaviour over the HTTP cycle; no UI consumes the endpoint |
| 6 | Offset pinned to `+00:00`, stated in the schema, exact suffix tested | Unit | `test_server_time_response_serializes_now_with_plus_zero_offset`, `test_get_time_now_ends_with_plus_zero_offset` | A serialisation rule of the schema, confirmed once more over HTTP; no page shows the value |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the response is HTTP 200 with exactly the keys `now` and `timezone`, and `timezone` is `UTC` |
| 2 | `now` per request, UTC, never naive | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time twice one second apart, Then the two `now` values differ and both end in `+00:00` |
| 3 | Pydantic schema defines the body | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads GET /openapi.json, Then the 200 response of GET /api/time references the `ServerTimeResponse` component |
| 4 | Tests cover shape, offset, freshness | covered at Unit, see Criterion coverage | Given the backend test suite, When the unit and integration tiers run, Then the server-time tests pass with 0 failed |
| 5 | `GET /api/echo?msg=...` returns `{"echo": ...}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo?msg=hello, Then the response is HTTP 200 with body `{"echo": "hello"}` |
| 6 | Offset pinned to `+00:00` | covered at Unit, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then `now` ends with `+00:00` and contains no `Z` |

## Manual verification plan
No criterion is verifiable through the application's own UI: no frontend consumes `GET /api/time` or `GET /api/echo`. The observable check is the HTTP response itself, read with `curl`, plus FastAPI's Swagger UI at `/docs` for the schema criterion.

Shared prerequisites: Docker running; the stack up via `docker compose up -d --build` from the repository root; `docker compose ps` shows the `backend` service running; a terminal with `curl`; the backend published on the host at `http://localhost:8010` (from `docker-compose.yml`).

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
Prerequisites: the shared prerequisites above.
1. Run `curl -i http://localhost:8010/api/time` → the first line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json`.
2. Read the body → a JSON object with exactly two keys, `now` and `timezone`, for example `{"now":"2026-11-13T06:43:27.123456+00:00","timezone":"UTC"}`; `timezone` is exactly `UTC`.

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
Prerequisites: the shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/time` and note the `now` value → it ends in `+00:00`.
2. Wait about one second, then run `curl -s http://localhost:8010/api/time` again → the new `now` is later than the first by roughly one second; the two values differ.
3. Compare `now` with the current UTC time from `date -u` in the same terminal → the hour and minute match UTC, not your local time zone.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the shared prerequisites above; a browser.
1. Open `http://localhost:8010/docs` → the Swagger UI lists `GET /api/time` under the `time` tag.
2. Expand `GET /api/time` and read its `200` response → the schema link names `ServerTimeResponse`.
3. Scroll to `Schemas` → `ServerTimeResponse` lists `now` (string, date-time) and `timezone` (`UTC`).
4. Open `backend/app/routers/server_time.py` in an editor → the handler returns `ServerTimeResponse(...)`, not a dict.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: a database for the integration tier per `CLAUDE.md` Backing Services, with `DATABASE_URL` set (the server-time tests themselves need none).
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py tests/integration/test_echo_integration.py` → the summary line reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → it contains `test_get_time_now_is_computed_per_request` and `test_get_time_now_ends_with_plus_zero_offset`, and `backend/tests/unit/test_server_time_unit.py` contains `test_server_time_response_serializes_now_with_plus_zero_offset`.

### Criterion 5: `GET /api/echo?msg={text}` returns 200 with `{"echo": "<msg>"}`
Prerequisites: the shared prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello"` → `HTTP/1.1 200 OK` with body exactly `{"echo":"hello"}`.
2. Run `curl -s "http://localhost:8010/api/echo?msg=%20hi%20"` → body exactly `{"echo":" hi "}`: the spaces are kept.
3. Run `curl -i http://localhost:8010/api/echo` → status 422, and the body's `detail[0]` has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 6: the offset is pinned to `+00:00`, stated in the schema, and tested
Prerequisites: the shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/time` → `now` ends with exactly `+00:00` and contains no `Z`.
2. Open `backend/app/schemas/server_time.py` → `UTC_OFFSET_SUFFIX = "+00:00"` is defined, the class docstring states the `+00:00` choice, and a `field_serializer` for `now` emits it.
