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
> *   `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> *   `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> *   The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> *   Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> ## Notes
>
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. **It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.**
>
> ## How the measured run uses this item (operator instructions, not part of the feature)
>
> 1. `/plan-feature TEST-09` **before** Arm C's item (TEST-06) merges. Leave it at `plan_review`; a re-plan is only possible there (baseline Section 5.3).
> 2. After TEST-06 merges to `main` (its squash touches `backend/app/main.py`), post the re-plan comment on this item and run `/plan-feature TEST-09` again.
> 3. **Pass:** the merged-since check reports a non-clean verdict naming the overlapping commit, and the re-plan answers the comment point by point (MDF-008). **`verdict=clean` on this item is a failed setup, not a pass** (baseline Section 5.2).
> 4. Do not build it before step 3 has been recorded. Whether it is then built is the operator's choice; it is not one of the items the baseline's numbers are compared on.

## Acceptance Criteria
- [ ] AC1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] AC2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] AC3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] AC4: Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
<!--
  First plan on this item (no plan.md existed, fresh branch from origin/main at 76cf593),
  kept because the tracker item carries one actionable comment with four points.
  Merged-since check: n/a (fresh plan, branched from current main).
-->
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: premise checked against git, and it is half true. `73e544c` (feat(TEST-06), 2026-09-14) is an ancestor of `origin/main` and did add `from app.routers.echo import router as echo_router` plus `app.include_router(echo_router)` to `create_app()`. But the later sandbox reset `9dcba19` (2026-10-24) removed `backend/app/routers/echo.py`, `schemas/echo.py`, `routers/server_time.py`, `schemas/server_time.py` and the `uptime` slice, and took those registrations out of `main.py` again; no later commit restored them. On main as it stands now (76cf593), `create_app()` registers exactly `version_router`, `notes_router` and `health_router`, in that order, after the `CORSMiddleware` block, and the router imports are `health`, `notes`, `version` in alphabetical order. Insertion point, re-checked on that file: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports (keeping the alphabetical order), and `app.include_router(server_time_router)` goes after `app.include_router(health_router)` and before `return app`; the module docstring gains "and FEAT-1 the server time router". What changed against the comment's picture: there is no echo registration in the block to sit next to, so nothing in FEAT-1 depends on TEST-06's lines.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on, because: (a) the echo endpoint is the whole scope of TEST-06 ("Echo endpoint"), a separate tracker item that currently reads "to test" (framework `in_review`) and carries its own acceptance criteria (required `msg`, 422 on a msg over 200 characters via `Query(max_length=...)`, per its plan at `73e544c`), which this request's one-line spec does not reproduce, so building it here would ship a second, divergent echo under FEAT-1's criteria and leave TEST-06's PR colliding with it on `routers/echo.py`, `schemas/echo.py` and `main.py`; (b) TEST-11 (trim whitespace) and BUG-05 (keep whitespace) both depend on TEST-06's echo files and specify opposite behaviour, a contradiction FEAT-1 has no standing to settle; (c) the comment's stated reason, "so the two registrations land together", rests on point 1's premise that the echo registration is in `main.py`, which is not the case on main today. Scope stays bounded by FEAT-1's four criteria (`user_story_alignment.md` Section 3). Assumption recorded instead of a blocking question: the request is a convenience bundling, not a change to FEAT-1's acceptance criteria. If the plan reviewer wants it anyway, the reversible route is to add it as a criterion on this item (or close TEST-06 into FEAT-1) and re-plan, rather than for the build to absorb it silently.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`. Reason: it is the numeric offset the criterion's words "explicit offset" literally ask for (`Z` is ISO 8601's UTC designator, not an offset), and it is what the standard library's `datetime.isoformat()` produces for an aware UTC value. Pydantic 2.13.4 (the version in `backend/uv.lock`) serialises an aware UTC `datetime` as `Z` by default, so the choice cannot be left implicit: `ServerTimeResponse` declares it with a module constant `UTC_OFFSET_SUFFIX = "+00:00"` and a `@field_serializer("now")` that converts to UTC and returns `isoformat()`. Unit and integration tests assert `now` ends with exactly `+00:00` and not with `Z` (see Testing Strategy).
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: premise checked, and TEST-06's plan at `73e544c` does record exactly that deviation for `echo_service.py`. No `backend/app/services/time_service.py` is planned; the deviation is recorded in Plan Overview and Backend Plan below. The router still holds no business logic: the clock read is a one-line module function in the router, `current_utc_time()`, kept as a named seam so tests can substitute the clock.
- Comment (tracker), the other 28 top-level comments: framework notices ("Plan PR opened for FEAT-1: ..." links and one autonomous-run answer) for earlier plan PRs that are now closed → Not acted on because they ask for nothing; none contradicts the description.

## Plan Overview
Backend-only feature. Add `GET /api/time` as one router (`backend/app/routers/server_time.py`) and one response schema (`backend/app/schemas/server_time.py`), registered in `create_app()` in `backend/app/main.py` exactly as the version and health routers are, following the TEST-06 shape (router plus schema, no service). The router computes the time on every call through `current_utc_time()` (`datetime.now(UTC)`) and returns `ServerTimeResponse(now=...)`; the schema forbids naive datetimes (`AwareDatetime`), fixes `timezone` to the literal `"UTC"`, and serialises `now` in UTC with the pinned `+00:00` suffix.

The file names `server_time.py` are chosen because BUG-01, which depends on FEAT-1, describes its work as editing `backend/app/routers/server_time.py` and its registration in `main.py`; matching that name keeps BUG-01's plan valid.

Deliberate deviation from `coding_standards.md` Section 2.2, recorded so the reviewer reads it as planned (tracker comment point 4): no service module is created. Section 2.2's Router to Service to Repository pattern places business logic and transactional boundaries in the service; reading the system clock is neither, there is no persistence, and a service would be a one-line pass-through with nothing to test in isolation. Local precedent agrees: TEST-06's plan recorded the same deviation for the echo endpoint. Section 2.2's binding rule, no business logic in the router, still holds.

Out of scope, by the criteria: no frontend, no caching headers (BUG-01's subject), no echo endpoint (tracker point 2, above), no database access, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time per request. `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time()` with `response_model=ServerTimeResponse`, returning `ServerTimeResponse(now=current_utc_time())`.
- Clock seam: module-level `current_utc_time() -> datetime` in `backend/app/routers/server_time.py`, body `return datetime.now(UTC)`. The handler looks it up at call time, so a test can `monkeypatch.setattr` it on the router module.
- Schema: `backend/app/schemas/server_time.py`, class `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (naive input raises `ValidationError`) and `timezone: Literal["UTC"] = "UTC"`; module constant `UTC_OFFSET_SUFFIX = "+00:00"` with a docstring stating the pinned choice and why; `@field_serializer("now")` returning `value.astimezone(UTC).isoformat()`, so a non-UTC aware value is normalised to UTC and every serialisation ends with `+00:00`.
- Registration: `backend/app/main.py` adds `from app.routers.server_time import router as server_time_router` between the `notes` and `version` imports, and `app.include_router(server_time_router)` after `app.include_router(health_router)`; docstring line extended to name FEAT-1's router. Nothing else in `main.py` changes (CORS `allow_methods` already includes GET).
- Service layer: none, planned deviation from `coding_standards.md` Section 2.2 (see Plan Overview).
- Repository layer: none, no data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no parameters, no body.
- Response: 200, `application/json`, schema `ServerTimeResponse`:

```json
{"now": "2026-11-10T11:19:09.123456+00:00", "timezone": "UTC"}
```

  `now` is always UTC with the literal suffix `+00:00` (never `Z`, never naive); fractional seconds appear when the clock reading has them (stdlib `isoformat()` behaviour). `timezone` is always the string `"UTC"`. Any other method on `/api/time` returns 405 (FastAPI default).

## Technology Selection
- Clock read: chose the standard library `datetime.now(UTC)` over a third-party time library, because the stdlib returns an aware UTC datetime directly and nothing more is needed.
- Response schema: chose Pydantic (already installed through FastAPI) `BaseModel` with `AwareDatetime` and `Literal["UTC"]` over a bare dict or a hand-written validator, because Pydantic's own types enforce "never naive" and the fixed timezone value, and AC3 requires a Pydantic schema.
- Offset formatting: chose the stdlib `isoformat()` inside a Pydantic `field_serializer` over Pydantic's native datetime serialisation, because the native output for UTC is `Z` and the pinned contract is `+00:00` (tracker point 3).
- Service module: none, chose constructing the response in the router over a net-new `services/time_service.py`, because there is no business logic or transaction for a service to own (planned Section 2.2 deviation).
- Router module `backend/app/routers/server_time.py`: no stdlib call, native platform feature or installed dependency provides the endpoint, so it is built here.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, `UTC_OFFSET_SUFFIX`, the `now` serializer pinning `+00:00`
- [B] backend/app/routers/server_time.py: `GET /api/time` router, `current_utc_time()` clock seam
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (shape, suffix, UTC normalisation, naive rejection) and the handler (per-call clock read)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP tests for 200 and shape, exact `+00:00` suffix, per-request freshness, 405 on POST
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register `server_time_router` in `create_app()`, docstring line
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the app's custom routes

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` change: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `backend/tests/unit/test_server_time_unit.py`, no app or network.
  - `test_server_time_response_serialises_now_with_plus_zero_offset_suffix`: an aware UTC `now` dumped with `model_dump(mode="json")` and `model_dump_json()` ends with exactly `+00:00` and does not end with `Z`; `UTC_OFFSET_SUFFIX == "+00:00"`.
  - `test_server_time_response_shape_has_now_and_utc_timezone`: dumped keys are exactly `{"now", "timezone"}` and `timezone == "UTC"` by default.
  - `test_server_time_response_normalises_non_utc_offset_to_utc` (edge): an aware `+02:00` input at 12:00 serialises as 10:00 with `+00:00`.
  - `test_server_time_response_with_naive_datetime_raises_validation_error` (error): a naive `datetime` raises `pydantic.ValidationError`.
  - `test_server_time_response_with_non_utc_timezone_label_raises_validation_error` (error): `timezone="Europe/Brussels"` raises `ValidationError`.
  - `test_current_utc_time_returns_aware_utc_datetime`: `utcoffset() == timedelta(0)` and `tzinfo` is not None.
  - `test_get_server_time_reads_clock_on_every_call`: `current_utc_time` monkeypatched to return T and then T plus 1 second; two direct calls of `get_server_time()` return those two values, which differ.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so test_server_time_unit.py; registration test added to the existing test_main_unit.py
- Integration tests: `backend/tests/integration/test_server_time_integration.py`, through the session `client` fixture in `backend/tests/conftest.py` (no database needed).
  - `test_get_time_returns_200_with_now_and_utc_timezone`: 200, body keys exactly `{"now", "timezone"}`, `timezone == "UTC"`.
  - `test_get_time_now_ends_with_plus_zero_offset_suffix`: `now` ends with `+00:00`, not `Z`; `datetime.fromisoformat(now).utcoffset() == timedelta(0)`.
  - `test_get_time_now_is_computed_per_request`: `datetime.now(UTC)` taken just before and after the request brackets the returned `now` (proves it is not fixed at import time).
  - `test_get_time_two_calls_a_second_apart_differ`: `current_utc_time` monkeypatched on `app.routers.server_time` to return T and then T plus 1 second; two GETs return `now` values that differ by exactly one second. Deterministic, no sleep.
  - `test_post_time_returns_405_method_not_allowed`: the error case for a read-only endpoint with no input (`testing_standards.md` Section 4's router row).
  - Directory: backend/tests/integration/
- E2E tests: not warranted. Enabled per CLAUDE.md, but no criterion involves navigation or interaction through a UI (the feature has no frontend), so no spec is written (`testing_standards.md` Section 6).
  - Directory: e2e/tests/
  - File: none for this feature (would be FEAT-1_server_time_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (POST returns 405), as API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour, and there is no UI |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration and Unit | verifying it needs no navigation or interaction: freshness is a router behaviour (clock seam), the offset and naive rejection are schema rules |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a schema definition, exercised directly by the schema unit tests and through `response_model` by the integration tests |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | it is a statement about the unit and integration test files themselves; each of shape, offset and freshness has a named test in both tiers above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` with `timezone` = "UTC" |
| 2 | per request, UTC with explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client calls GET /api/time twice a second apart, Then the two `now` values differ and both end with `+00:00` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API docs, When the reader opens GET /api/time, Then its 200 response is the `ServerTimeResponse` schema |
| 4 | tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the repository, When the server time unit and integration tests run, Then 0 failed |

## Manual verification plan
<!--
  The endpoint has no UI; every check is an HTTP call or a file read, as the
  observable check the template asks for when a criterion cannot be verified
  through the UI. Backend host port 8010 comes from docker-compose.yml.
-->
Prerequisites (shared by every block): Docker running; the stack up via `docker compose up -d --build` from the repository root; `docker compose ps` shows the `backend` service running (this endpoint needs no database, but compose starts `db` anyway); a terminal with `curl`; the backend is published on the host at `http://localhost:8010`.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
This criterion has no UI; verify it over HTTP.
1. Run `curl -s -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body printed under the headers → it is one JSON object with exactly two keys, `now` (a string such as `2026-11-10T11:19:09.123456+00:00`) and `timezone` with the value `"UTC"`, and nothing else.
3. Run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/time` → prints `405`.

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
This criterion has no UI; verify it over HTTP.
1. Run `curl -s http://localhost:8010/api/time`, wait about one second, then run the same command again → two JSON bodies are printed.
2. Compare the two `now` values → they differ, and the second is about one second later than the first.
3. Look at the end of each `now` value → each ends with exactly `+00:00` (not `Z`, and never without an offset).
4. Compare the hour in `now` with the output of `date -u +%H:%M` run in the same terminal → the hours and minutes match (UTC, not the machine's local time).

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
This criterion has no UI behaviour; the observable checks are the API docs and the source.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the 200 response's schema is named `ServerTimeResponse`, with `now` (string, date-time) and `timezone` (the constant `UTC`).
2. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)` with `now`, `timezone`, the `UTC_OFFSET_SUFFIX = "+00:00"` constant and the `now` serializer.
3. Open `backend/app/routers/server_time.py` → the handler declares `response_model=ServerTimeResponse` and returns `ServerTimeResponse(...)`; no `return {...}` dict literal appears.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
This criterion is about the test suite; verify it by running it.
1. From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed` (no failures, no errors).
2. Open `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` → each file has a test for the shape (keys and `timezone`), one asserting the exact `+00:00` suffix, and one for per-request freshness (the clock-seam test, and in the integration file also the before-and-after bracket test).
