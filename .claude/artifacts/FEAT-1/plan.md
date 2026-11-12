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
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: checked against `origin/main` at b7f2644. The premise is out of date: 73e544c8 (`feat(TEST-06): Echo endpoint (#35)`, 2026-09-14) is in main's history, but its echo router was later removed by sandbox resets (echo.py's last touches on main are `ea5f29a` re-adding it in #316 and `9dcba19` removing it in #326), so `backend/app/main.py` on main today registers exactly `version_router`, `notes_router`, `health_router`, in that order, with no echo import. The TEST-06 echo registration exists only on the unmerged branch `origin/feature/TEST-06-echo-endpoint` (tracker status `to test`), which appends `app.include_router(echo_router)` after `health_router` and adds `from app.routers.echo import router as echo_router` before the health import. Insertion point for FEAT-1: the import `from app.routers.server_time import router as server_time_router` after the `notes` import (alphabetical, `server_time` sorts after `notes` and before `version`), and `app.include_router(server_time_router)` as the last line of the registration block after `app.include_router(health_router)`; the module docstring's list of registering features gains "FEAT-1 the server time router". Nothing changed in that block on main since this branch left it; whichever of TEST-06 and FEAT-1 merges second gets a trivial textual conflict on the line after `health_router` and on the docstring, resolved by keeping both lines (recorded in shared_risks.md).
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on because the echo endpoint is TEST-06's own scope, already implemented and in review on `origin/feature/TEST-06-echo-endpoint` (router, `EchoQuery` and `EchoResponse` schemas, integration tests). Adding it here would duplicate that work and guarantee a conflict on `backend/app/routers/echo.py`, `backend/app/schemas/echo.py` and the same `main.py` lines when either PR merges, and it is outside FEAT-1's four acceptance criteria (`user_story_alignment.md` Section 3). Assumption recorded: the intent of "land together" is that the two registrations do not collide, which shared_risks.md achieves by serializing FEAT-1's build after TEST-06 merges (or the reverse) rather than by co-owning echo. If the stakeholder does want echo moved into FEAT-1, TEST-06 must be closed first and this plan re-planned.
- Comment (tracker), point 3: "Pin the offset now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: the offset is pinned to `+00:00`, the numeric form, because the criterion asks for an "explicit offset" and `+00:00` is a literal offset while `Z` is a zone designator; it is also what the stdlib's `datetime.isoformat()` emits for an aware UTC datetime. Pydantic 2 (2.13.4 in `backend/uv.lock`) serializes a UTC datetime with `Z` by default, so the schema carries a `field_serializer("now")` that emits `value.astimezone(timezone.utc).isoformat(timespec="seconds")`, and the schema's docstring states the `+00:00` choice and why. Precision pinned to whole seconds so the string has one fixed shape (`2026-11-12T22:28:59+00:00`). Covered by the unit test `test_server_time_response_serializes_now_with_plus_zero_offset_suffix` and the integration test `test_get_time_now_ends_with_plus_zero_offset`, both asserting `endswith("+00:00")` and not `endswith("Z")`.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module is planned. Planned deviation from `coding_standards.md` Section 2.2 (Router, Service, Repository): the router reads the clock through a small `utc_now()` function in the router module, injected with FastAPI `Depends` so tests override it, and returns the schema directly; there is no business logic, no persistence and no transaction to bound. This matches TEST-06's branch, whose `echo.py` router builds `EchoResponse` with no service. The deviation is restated in `## Backend Plan` and must be listed in the implementation PR description.

## Plan Overview
Backend only. One new read-only endpoint, `GET /api/time`, in a new router `backend/app/routers/server_time.py`, returning a new Pydantic schema `ServerTimeResponse` from `backend/app/schemas/server_time.py`, registered in `create_app()` in `backend/app/main.py`. No database, no frontend, no external API, no new dependency. The clock is read once per request through an injectable dependency so per-request freshness is testable without sleeping. Tests: unit (schema serialization, offset suffix, naive rejection, clock function, route registration) and integration (HTTP cycle through `TestClient`). No E2E: no criterion involves UI navigation or interaction.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time as `ServerTimeResponse`. Router `APIRouter(prefix="/api", tags=["time"])` with `@router.get("/time", response_model=ServerTimeResponse)`, same shape as `backend/app/routers/version.py`.
- Clock: `def utc_now() -> datetime: return datetime.now(timezone.utc)` defined in the router module; the handler takes `now: Annotated[datetime, Depends(utc_now)]` and returns `ServerTimeResponse(now=now)`. FastAPI evaluates the dependency on every request (no caching across requests), which is what makes `now` per request; tests use `app.dependency_overrides[utc_now]`.
- Schema: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (pydantic rejects a naive datetime at construction, so "never naive" is enforced by the type) and `timezone: Literal["UTC"] = "UTC"`; `@field_serializer("now")` returns `value.astimezone(timezone.utc).isoformat(timespec="seconds")`, so the JSON value always ends in `+00:00`. Docstring states the `+00:00` over `Z` choice.
- Service layer: none. Planned deviation from `coding_standards.md` Section 2.2: reading the clock is neither business logic nor a transactional boundary, so no `server_time_service.py` is created (tracker comment point 4; same decision as TEST-06's echo router). List this deviation in the PR description.
- Repository layer: none (no persistence).
- Migrations: none.
- Registration: in `backend/app/main.py` add `from app.routers.server_time import router as server_time_router` between the `notes` and `version` imports, and `app.include_router(server_time_router)` after `app.include_router(health_router)`; extend the module docstring's list with FEAT-1. Do not restructure the factory, lifespan or CORS middleware (`allow_methods` already includes GET).
- Errors: no input, so the only error path is a wrong method (POST returns FastAPI's 405).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters
- Response: 200, `application/json`:

```json
{"now": "2026-11-12T22:28:59+00:00", "timezone": "UTC"}
```

  `now` is ISO 8601, whole seconds, always UTC, always suffixed `+00:00` (never `Z`, never naive). `timezone` is always the literal string `UTC`. A POST to `/api/time` returns 405.

## Technology Selection
- `utc_now()` clock function: chose the stdlib `datetime.now(timezone.utc)` over any time library (e.g. `pendulum`, `arrow`), because the stdlib returns an aware UTC datetime directly and nothing more is needed.
- `+00:00` serialization: chose a pydantic `field_serializer` calling the stdlib `datetime.isoformat(timespec="seconds")` over pydantic's default datetime serialization, because the installed pydantic 2 emits `Z` for UTC and the criterion, per tracker point 3, is pinned to `+00:00`.
- Naive-datetime guard: chose pydantic's installed `AwareDatetime` type over a hand-written validator, because it already rejects a naive datetime.
- Per-request clock injection: chose FastAPI's installed `Depends` with `app.dependency_overrides` over a new service module or a mocking library, because it makes the clock overridable in tests with no new code path.
- `ServerTimeResponse` schema and `server_time` router: no stdlib call, native platform feature or installed dependency provides an endpoint, so they are built here on the installed FastAPI and pydantic.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime` serialized with `+00:00`, `timezone: Literal["UTC"]`)
- [B] backend/app/routers/server_time.py: `utc_now()` clock dependency and the `GET /api/time` router
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (shape, `+00:00` suffix, non-UTC conversion, naive rejection) and `utc_now()`
- [B] backend/tests/integration/test_server_time_integration.py: integration tests for `GET /api/time` through the HTTP cycle (200 shape, offset suffix, per-request freshness, 405)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register `server_time_router` after `health_router`; add FEAT-1 to the docstring's list of registering features
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`

No dependency change, so no lockfile is regenerated. `README.md` and `docs/DEVELOPMENT.md` need no edit: neither lists the API endpoints, and this feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the schema's serialization and validation, the clock function, and the router registration; no database needed.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_unit.py`; registration test added to the existing `test_main_unit.py`)
  - Cases: `test_server_time_response_serializes_now_with_plus_zero_offset_suffix` (happy path, exact suffix `+00:00`, not `Z`); `test_server_time_response_has_now_and_timezone_utc_fields` (shape via `model_dump(mode="json")`, keys exactly `now` and `timezone`, `timezone == "UTC"`); `test_server_time_response_converts_non_utc_aware_datetime_to_utc` (edge: a `+02:00` input serializes as the same instant in `+00:00`); `test_server_time_response_rejects_naive_datetime` (error: `ValidationError`); `test_utc_now_returns_timezone_aware_utc_datetime` (`tzinfo` not None, `utcoffset() == timedelta(0)`); `test_create_app_registers_server_time_route`.
- Integration tests: `GET /api/time` through `TestClient` (no database required; uses the session `client` fixture from `backend/tests/conftest.py`, or a fresh `create_app()` client where a dependency override is set, cleared after the test).
  - Directory: backend/tests/integration/
  - Cases: `test_get_time_returns_200_with_now_and_utc_timezone` (status 200, keys exactly `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware datetime within a few seconds of the test's own `datetime.now(timezone.utc)`); `test_get_time_now_ends_with_plus_zero_offset` (exact suffix, offset zero); `test_get_time_computes_now_per_request` (override `utc_now` with a callable that returns `2026-01-01T00:00:00+00:00` then `2026-01-01T00:00:01+00:00`; two consecutive GETs return those two distinct values, proving the clock is read per request rather than at import or startup); `test_post_time_returns_405_method_not_allowed`.
- E2E tests: none for this feature. E2E is ENABLED in CLAUDE.md, but no criterion requires UI navigation or interaction (backend-only endpoint with no frontend consumer), so every criterion is covered at unit or integration level (see Criterion coverage).
  - Directory: e2e/tests/
  - File: no `FEAT-1_server_time_endpoint.spec.ts` is planned
- UAT scenarios: one scenario per criterion plus one edge case (POST returns 405), written against the HTTP endpoint.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | `test_get_time_returns_200_with_now_and_utc_timezone`, `test_post_time_returns_405_method_not_allowed` | verifying it needs no navigation or interaction: it is a router response shape, checked through the HTTP cycle |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration and Unit | `test_get_time_computes_now_per_request`, `test_get_time_now_ends_with_plus_zero_offset`, `test_server_time_response_rejects_naive_datetime`, `test_utc_now_returns_timezone_aware_utc_datetime` | verifying it needs no navigation or interaction: freshness is a per-request dependency behaviour and the offset is a serialization rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_server_time_response_has_now_and_timezone_utc_fields`, `test_server_time_response_serializes_now_with_plus_zero_offset_suffix` | verifying it needs no navigation or interaction: it is a schema definition, exercised directly |
| 4 | Unit and integration tests cover shape, offset and per-request freshness | Unit and Integration | `test_server_time_response_converts_non_utc_aware_datetime_to_utc`, `test_create_app_registers_server_time_route`, `test_get_time_computes_now_per_request` | verifying it needs no navigation or interaction: it is a statement about the test suite, satisfied by the unit and integration tests above passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the API is running, When I request GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` with `timezone` equal to `UTC` |
| 2 | `now` per request, UTC, explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the API is running, When I request GET /api/time twice more than one second apart, Then the two `now` values differ and both end in `+00:00` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API is running, When I open the OpenAPI document, Then GET /api/time's 200 response references the `ServerTimeResponse` schema |
| 4 | Unit and integration tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When I run the server time unit and integration tests, Then 0 failed |

## Manual verification plan
This feature has no UI. Every criterion is verified against the running API from a browser address bar or a terminal, which is the observable check the UI would otherwise give.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
Prerequisites: the backend is running locally on port 8000, started with `uv run --directory backend uvicorn app.main:app --port 8000` (no database is needed for this endpoint).
1. Open `http://localhost:8000/api/time` in a browser → the page shows a JSON object with exactly two keys, `now` and `timezone`.
2. Read the `timezone` value → it is exactly `UTC`.
3. Run `curl -i http://localhost:8000/api/time` in a terminal → the first line is `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
4. Run `curl -i -X POST http://localhost:8000/api/time` → the status line reads `405 Method Not Allowed`.

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
Prerequisites: same running backend as Criterion 1.
1. Open `http://localhost:8000/api/time` and note the `now` value, for example `2026-11-12T22:28:59+00:00` → the value has a date, `T`, a time in whole seconds and ends with `+00:00` (not `Z`, and never without an offset).
2. Compare the time part with the current UTC time (run `date -u` in a terminal) → they agree to within a few seconds.
3. Wait at least two seconds, then reload the page → the new `now` value is later than the one noted in step 1 and still ends with `+00:00`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Prerequisites: same running backend as Criterion 1.
1. Open `http://localhost:8000/docs` → the Swagger page lists `GET /api/time` under the `time` tag.
2. Expand `GET /api/time` and open its 200 response schema → it is named `ServerTimeResponse` with fields `now` (string, date-time) and `timezone` (`UTC`).
3. Open `backend/app/schemas/server_time.py` in the editor → it defines `class ServerTimeResponse(BaseModel)` and its docstring states the `+00:00` offset choice; `backend/app/routers/server_time.py` returns `ServerTimeResponse(...)`, with no dict literal as the response.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Prerequisites: a terminal at the repository root.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the summary line reports `0 failed`.
2. Read the test names in `backend/tests/integration/test_server_time_integration.py` → `test_get_time_computes_now_per_request` and `test_get_time_now_ends_with_plus_zero_offset` are present, and `backend/tests/unit/test_server_time_unit.py` holds `test_server_time_response_serializes_now_with_plus_zero_offset_suffix`.
