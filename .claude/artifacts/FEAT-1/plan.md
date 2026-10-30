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
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. **It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.**
>
> ## How the measured run uses this item (operator instructions, not part of the feature)
>
> 1. `/plan-feature TEST-09` **before** Arm C's item (TEST-06) merges. Leave it at `plan_review`; a re-plan is only possible there (baseline Section 5.3).
> 2. After TEST-06 merges to `main` (its squash touches `backend/app/main.py`), post the re-plan comment on this item and run `/plan-feature TEST-09` again.
> 3. **Pass:** the merged-since check reports a non-clean verdict naming the overlapping commit, and the re-plan answers the comment point by point (MDF-008). **`verdict=clean` on this item is a failed setup, not a pass** (baseline Section 5.2).
> 4. Do not build it before step 3 has been recorded. Whether it is then built is the operator's choice; it is not one of the items the baseline's numbers are compared on.

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
Comments read newest first; a tracker comment overrides the description where the two disagree. This is a first plan on this branch (fresh from `origin/main` at 181ee5c), so there is no merged-since entry: the check is `n/a (fresh plan, branched from current main)`.

- Comment (tracker, 2026-10-29, framework-posted): "Plan PR opened for FEAT-1: https://github.com/bemayker/framework-improvement/pull/382 ... This is a fresh plan against main at 921f7a5 ..." → Not acted on as a request: it is the framework's own link comment from an earlier plan run, whose code is not on main after the sandbox reset, and it asks for nothing. Read as context only. One point of it is deliberately NOT carried over: that plan added the echo endpoint as a fifth criterion; this plan does not (see point 2 below for why).
- Comments (tracker, 18 further framework-posted "Plan PR opened for FEAT-1" link comments, PRs #36 through #381) → Not acted on: link comments to plan PRs whose code is not on main after the resets; they ask for nothing.
- Comment (tracker, 2026-09-14, stakeholder), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against `backend/app/main.py` as it stands on this branch (identical to `origin/main` at 181ee5c). Squash 73e544c8 is not reachable from main after the sandbox resets, and main carries no echo code: `create_app()` registers, in order, `version_router`, `notes_router`, `health_router`, with imports `health`, `notes`, `version` in alphabetical order. What changed versus the comment's assumption: there is no echo registration to sit beside. Insertion point now: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports (keeping them alphabetical), and `app.include_router(server_time_router)` goes after `app.include_router(health_router)`, the last line before `return app`. Paths do not collide (`/api/time` is new), so order has no routing effect.
- Comment (tracker, 2026-09-14, stakeholder), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on, deliberately. `GET /api/echo` is exactly TEST-06's scope (Echo endpoint, open in `feature_map.md`, wave 2), and TEST-11 and BUG-05 depend on TEST-06 delivering it; no FEAT-1 acceptance criterion asks for it. `user_story_alignment.md` Section 3 (scope containment) forbids adding an endpoint the item's criteria do not specify, and building it here would make TEST-06 a duplicate and leave its dependants pointing at an item whose work landed under another ID. The comment overrides the description only where the two disagree, and here it adds scope owned by another item rather than correcting this one. Assumption recorded instead of blocking: the stakeholder's aim (one edit to main.py's registration block) is met by serializing FEAT-1 and TEST-06 builds, which `shared_risks.md` flags; if the stakeholder still wants echo under FEAT-1, the remedy is to amend the criteria and cancel or re-scope TEST-06, which is a tracker decision, not a planner one. The plan PR reviewer should confirm this.
- Comment (tracker, 2026-09-14, stakeholder), point 3: "Pin it now ... decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`. Reason: it is what Python's `datetime.isoformat()` emits for an aware UTC value, and it is an explicit numeric offset, the literal reading of the criterion's "explicit offset". Pydantic v2 by default serializes a UTC datetime with a `Z` suffix, so the schema carries a `field_serializer` on `now` that converts to UTC and returns `isoformat()`, and its docstring states the `+00:00` choice. Unit tests assert the serialized value ends with exactly `+00:00` (and does not end with `Z`); the integration test asserts the same suffix on the HTTP body.
- Comment (tracker, 2026-09-14, stakeholder), point 4: "Do not add a service module for this endpoint ... Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module. Planned deviation from `coding_standards.md` Section 2.2 (Router, Service, Repository): reading the clock is neither business logic nor a transactional boundary and touches no repository, so the router reads it through a one-line module-level function in the router file (`current_utc_time()`), which also gives the tests a seam to substitute the clock. Recorded in the Backend Plan below and to be repeated in the PR description.

## Plan Overview
Backend-only. One new read-only endpoint, `GET /api/time`, in a new router `backend/app/routers/server_time.py`, returning a new Pydantic schema `ServerTimeResponse` in `backend/app/schemas/server_time.py`. The router is registered in `backend/app/main.py`. No database, no service layer (planned deviation, see Re-Plan Feedback point 4), no frontend, no external API, no new dependency. Tests: unit tests for the schema's serialization and validation and for the router's clock seam, integration tests through the FastAPI TestClient for status, shape, offset and per-request freshness, plus a route-registration unit test in the existing `test_main_unit.py`.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item)

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time so a client can measure clock skew. Router `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time()` with `response_model=ServerTimeResponse`, matching the shape of `backend/app/routers/version.py`.
- Clock read: module-level `def current_utc_time() -> datetime: return datetime.now(UTC)` in `backend/app/routers/server_time.py` (`from datetime import UTC, datetime`). The handler calls it on every request (never at import time, never cached), so each response carries its own instant. It is the tests' seam: they monkeypatch `server_time.current_utc_time`.
- Schema: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's type that rejects a naive datetime at validation) and `timezone: Literal["UTC"] = "UTC"`. A `@field_serializer("now")` returns `value.astimezone(UTC).isoformat()`, so the JSON value is always UTC with the `+00:00` suffix (pinned per Re-Plan Feedback point 3; Pydantic's default would emit `Z`). Docstring states the `+00:00` choice.
- Service layer: none. Planned deviation from `coding_standards.md` Section 2.2: reading a clock is not business logic and has no transactional boundary; recorded per the stakeholder's point 4. The router contains no logic beyond the clock call and building the schema.
- Repository layer: none (no persistence).
- Migrations: none.
- Registration in `backend/app/main.py`: add `from app.routers.server_time import router as server_time_router` between the `notes` and `version` router imports; add `app.include_router(server_time_router)` after `app.include_router(health_router)`. Add `FEAT-1 the server time router` to the module docstring's list of features that register routers. No change to the CORS middleware: it already allows `GET`.
- Error handling: the endpoint takes no input and has no failure path of its own; a non-GET method returns FastAPI's 405.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters
- Response: 200, `application/json`, shape `{"now": string (ISO 8601, UTC, suffix exactly +00:00), "timezone": "UTC"}`. Example:

```json
{"now": "2026-10-30T15:39:23.123456+00:00", "timezone": "UTC"}
```

  Fractional seconds are whatever `isoformat()` emits (microseconds when non-zero); clients must parse `now` as ISO 8601, not by fixed width.
- Other methods: `POST /api/time` returns 405 (FastAPI default).

## Technology Selection
- Current time source: chose the standard library's `datetime.now(UTC)` over any time library or NTP client, because the stdlib already returns an aware UTC instant; nothing to install.
- Aware-datetime validation: chose Pydantic's built-in `AwareDatetime` type (installed via FastAPI) over a hand-written validator, because it already rejects naive values.
- Offset formatting: chose a Pydantic `field_serializer` calling stdlib `isoformat()` over a custom JSON encoder or string field, because those two installed pieces produce the pinned `+00:00` suffix in one line while keeping `now` typed as a datetime.
- No other net-new component, module or dependency: the router and schema modules are project code no rung replaces, and no dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime`, `timezone: Literal["UTC"]`, `+00:00` field serializer)
- [B] backend/app/routers/server_time.py: `GET /api/time` router with the `current_utc_time()` clock seam
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (shape, `+00:00` suffix, UTC conversion of a non-UTC aware value, naive rejection, timezone literal) and the router handler (calls the clock per invocation)
- [B] backend/tests/integration/test_server_time_integration.py: TestClient tests for 200 and shape, exact `+00:00` suffix, per-request freshness, 405 on POST
- [G] e2e/uat/scenarios/FEAT-1_server-time-endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server-time-endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script build-feature writes

### Modified files
- [B] backend/app/main.py: import and register `server_time_router` (insertion point in Backend Plan); docstring names FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom routes

No dependency change, so no lockfile entry (`backend/uv.lock` untouched). No `[Docs]` entry: neither `README.md` nor `docs/DEVELOPMENT.md` lists the API's endpoints, and this item changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `ServerTimeResponse` serialization and validation; the router handler with the clock monkeypatched.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_server_time_unit.py`; plus one test added to `test_main_unit.py`
  - Cases: `model_dump(mode="json")` of an aware UTC value ends with exactly `+00:00` and not `Z`; an aware non-UTC value (for example `+02:00`) serializes converted to UTC with `+00:00`; a naive datetime raises `ValidationError`; `timezone` defaults to and only accepts `"UTC"`; `get_server_time()` called twice with a clock returning two instants one second apart yields two different `now` values (proves per-call reading, not import-time caching); route registration of `/api/time`.
- Integration tests: full HTTP cycle through the session `client` fixture (no database needed).
  - Directory: backend/tests/integration/
  - File: `test_server_time_integration.py`
  - Cases: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`; `now` ends with `+00:00` and `datetime.fromisoformat(now).utcoffset() == timedelta(0)`; freshness, deterministic: monkeypatch `app.routers.server_time.current_utc_time` to return `2026-01-01T00:00:00+00:00` then `2026-01-01T00:00:01+00:00`, two GETs return those two different values; freshness, real clock: two GETs, the second `now` is not earlier than the first, and each is within 5 seconds of the test's own `datetime.now(UTC)`; `POST /api/time` returns 405.
  - No hardcoded sleep: the one-second gap is produced by the substituted clock.
- E2E tests: not warranted. E2E Tests is ENABLED, but no criterion requires navigation or interaction through a UI (this item has no UI), so no criterion is assigned to E2E and no spec is written (`testing_standards.md` Section 6, fourth question per criterion).
  - Directory: e2e/tests/
  - File: none for this item (would be `FEAT-1_server-time-endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), validated for well-formedness only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | Integration | verifying it needs no navigation or interaction: it is a router response through the HTTP cycle, and there is no UI |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration and Unit | verifying it needs no navigation or interaction: per-request freshness and the `+00:00` suffix are router and schema behaviour, checked with a substituted clock |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a schema definition, exercised directly and as the router's `response_model` |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit and Integration | verifying it needs no navigation or interaction: it is satisfied by the existence and passing of the backend test files themselves |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` = `UTC` |
| 2 | per-request, UTC, explicit offset | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client calls GET /api/time twice about a second apart, Then the two `now` values differ and both end with `+00:00` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend's OpenAPI document, When a reader opens the `/api/time` operation, Then its 200 response references the `ServerTimeResponse` schema |
| 4 | tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the repository, When the backend unit and integration server-time tests run, Then 0 failed |

## Manual verification plan
This item has no UI: every criterion is verified against the running backend's HTTP response or its test suite, which are the observable checks.

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone: "UTC"`
Prerequisites: backend running locally on port 8000 (`uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed.
1. In a terminal, run `curl -i http://localhost:8000/api/time` → the first line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it has exactly two keys, `now` (for example `2026-10-30T15:39:23.123456+00:00`) and `timezone` with the value `UTC`, and nothing else.

### Criterion 2: `now` is computed per request, UTC with an explicit offset, never naive
Prerequisites: as for Criterion 1.
1. Run `curl -s http://localhost:8000/api/time`, wait about one second, run it again → two bodies whose `now` values differ, the second later than the first by roughly one second.
2. Read the end of each `now` value → each ends with exactly `+00:00` (not `Z`, not another offset, and never without an offset).
3. Compare the time part with `date -u` run in the same terminal → it matches the machine's UTC time to within a second or two, not its local time.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for Criterion 1.
1. Open `http://localhost:8000/docs` in a browser and expand `GET /api/time` → the 200 response's schema is named `ServerTimeResponse`, with `now` (string, date-time) and `timezone` (string, `UTC`).
2. Open `backend/app/schemas/server_time.py` → it defines `class ServerTimeResponse(BaseModel)` and a docstring stating the `+00:00` suffix; `backend/app/routers/server_time.py` returns that class, not a dict.

### Criterion 4: unit and integration tests cover shape, offset and freshness
Prerequisites: repository checked out on the feature branch, uv installed.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary reports `0 failed`.
2. Open the two server-time test files → there is a test asserting the body's keys, one asserting the exact `+00:00` suffix, and one asserting two calls return different `now` values.
