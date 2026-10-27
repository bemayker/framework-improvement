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
> (The item's "How the measured run uses this item" block is operator instructions, not part of the feature, and is not planned.)

## Acceptance Criteria
- [ ] AC1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] AC2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] AC3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] AC4: Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
One actionable tracker comment, four numbered points, each answered below. Sixteen other comments on the item are framework notices that ask for nothing and were not carried into this dispatch.

- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against `origin/main` at `6439eec` (this branch sits on it with no commit of its own). The premise is out of date. `73e544c feat(TEST-06): Echo endpoint (#35)` is an ancestor of `origin/main`, but TEST-06 has since been merged and reset several times, and the last commit to touch `backend/app/main.py` is `9dcba19 chore: reset the sandbox after release run 0.3.443 T8 (#326)`, which deleted `backend/app/routers/echo.py`, `uptime.py` and `server_time.py` and removed their registrations. On main today `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, and `create_app()` registers, in order, `version_router`, `notes_router`, `health_router`. So the echo registration is not on main and nothing FEAT-1 touches changed shape. Insertion point: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` router imports (the block is alphabetical), and `app.include_router(server_time_router)` goes after `app.include_router(health_router)`, the last line before `return app`. The module docstring's list of registering features gains FEAT-1. If TEST-06 or TEST-07 does land on main before this item is built, the conflict is a textual one in those two adjacent lines and is resolved by keeping both registrations.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Not acted on, and this is a decision against the comment rather than an oversight. The echo endpoint is its own tracked work item, TEST-06 "Echo endpoint" in `.claude/feature_map.md`, with its own acceptance criteria (a required `msg`, a 200-character bound returning 422) and two items depending on it (TEST-11, BUG-05). It is in none of FEAT-1's four acceptance criteria, and the request rests on point 1's premise that TEST-06 is on main, which it is not. Building it here would ship a second, unreviewed answer to TEST-06's criteria under FEAT-1's ID, leave TEST-06 still open in the tracker, and turn TEST-06's own build into duplicate work. `user_story_alignment.md` Section 3 and `review_standards.md` Section 3 ("No invented endpoints") both bound this plan to the criteria. The plan therefore carries exactly one endpoint. If the stakeholder does want the two registrations together, the route is to build TEST-06 next, serialised after FEAT-1 per the feature map's shared-risk note, or to amend FEAT-1's acceptance criteria in the tracker and re-plan.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`. Reason: AC1 and AC2 both say "explicit offset", and `+00:00` is a numeric offset, while `Z` is a zone designator that some clients do not parse as an offset. Pinning it is load-bearing, not cosmetic: Pydantic v2 (installed 2.13.4, per `backend/uv.lock`) serialises a UTC-aware `datetime` as `...Z` by default, so without an explicit serialiser the endpoint would ship `Z`. The schema states the choice in a module constant `UTC_OFFSET_SUFFIX = "+00:00"` and in a `field_serializer` on `now` that converts to UTC and returns `isoformat()`. Unit and integration tests assert the suffix exactly with `endswith("+00:00")` and a full-format regex, and assert `"Z"` is absent.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/server_time_service.py` is planned. Verified the precedent rather than taking it on trust: TEST-06's plan at `73e544c` records the same deviation in its Plan Overview. Recorded as a planned deviation from `coding_standards.md` Section 2.2 in this plan's Plan Overview and Backend Plan.
- Merged since the last plan: n/a (fresh plan, branched from current main at `6439eec`; no `[merged-since]` lines were supplied). Point 1 above is the check against main as it stands.

## Plan Overview
Backend-only feature. Add `GET /api/time` as one router (`backend/app/routers/server_time.py`) and one response schema (`backend/app/schemas/server_time.py`), registered in `create_app()` in `backend/app/main.py` the same way the version and health routers are. The handler reads the clock per request with `datetime.now(UTC)` and returns `ServerTimeResponse(now=..., timezone="UTC")`.

The schema carries the whole correctness contract of AC1 and AC2:
- `now: AwareDatetime` (Pydantic's built-in type) rejects a naive datetime at construction, so "never naive" is enforced by the type, not by convention.
- a `field_serializer("now")` converts the value to UTC and returns `value.astimezone(UTC).isoformat()`, which yields the pinned `+00:00` suffix instead of Pydantic's default `Z`.
- `timezone: Literal["UTC"]`, so no other value can be constructed.

Deliberate deviation from `coding_standards.md` Section 2.2, recorded so the reviewer reads it as planned (tracker comment point 4): no service module is created. Section 2.2's Router to Service to Repository pattern holds business logic and transactional boundaries, and reading the system clock is neither. A service would be a one-line pass-through with nothing to test in isolation. The router still holds no business logic, which is the Section 2.2 rule that binds here; the serialisation rule lives in the schema. Local precedent agrees: the existing routers keep a service only where there is logic to hold (version resolution, the database probe).

No frontend work, no repository, no migration, no new dependency, no database access (the endpoint answers with `DATABASE_URL` unset, like `/api/version`).

## Infrastructure Scaffolding
Not applicable: FEAT-1 is not the scaffold item (TEST-01 is, and is done), and `backend/`, `frontend/` and `e2e/` already exist.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, computed per request. Router `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time() -> ServerTimeResponse`, declared with `response_model=ServerTimeResponse`. Takes no input. Clock read as `datetime.now(UTC)` inside the handler body, never at import or app startup.
- Service layer: none, by planned deviation from `coding_standards.md` Section 2.2 (see Plan Overview and tracker comment point 4).
- Repository layer: none, the endpoint touches no data store.
- Migrations: none.
- Schema `ServerTimeResponse` in `backend/app/schemas/server_time.py`: fields `now: AwareDatetime` and `timezone: Literal["UTC"]`; module constant `UTC_OFFSET_SUFFIX = "+00:00"` with a docstring stating the `+00:00` over `Z` choice; `@field_serializer("now")` returning `value.astimezone(UTC).isoformat()`. `isoformat()` omits the fractional part when microseconds are 0; both forms are valid ISO 8601 and the tests' regex accepts both.
- Registration in `backend/app/main.py`: import between the `notes` and `version` router imports, `app.include_router(server_time_router)` after `app.include_router(health_router)`, docstring updated to name FEAT-1.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `application/json`, body shaped by `ServerTimeResponse`:

```json
{"now": "2026-10-27T19:44:51.123456+00:00", "timezone": "UTC"}
```

- `now`: ISO 8601, always UTC, always ending in `+00:00`, never `Z`, never naive. Fractional seconds present unless the clock reads exactly `.000000`.
- `timezone`: always the literal string `UTC`.
- Error responses: none of its own. A non-GET method gets FastAPI's 405.

## Technology Selection
- Clock read: chose the standard library's `datetime.now(UTC)` over any time library; the stdlib covers an aware UTC timestamp completely.
- Naive-datetime guard: chose Pydantic's built-in `AwareDatetime` type (installed dependency, Pydantic 2.13.4 via FastAPI) over a hand-written validator; it rejects naive values with no code of ours.
- `+00:00` serialisation: chose a `field_serializer` calling the stdlib's `datetime.isoformat()` over a custom JSON encoder or a formatting library, because Pydantic's default emits `Z` and a three-line serialiser on the field is the smallest mechanism that pins the suffix in the schema itself.
- Service module: chose to build the response in the router over a net-new `services/server_time_service.py`, because there is no business logic, transaction or external call for a service to own (planned Section 2.2 deviation, Plan Overview).
- New dependencies: none.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` (AwareDatetime `now`, `Literal["UTC"]` timezone, `+00:00` field serialiser, `UTC_OFFSET_SUFFIX` constant)
- [B] backend/app/routers/server_time.py: `GET /api/time` router, reads the clock per request and returns `ServerTimeResponse`
- [B] backend/tests/unit/test_server_time_unit.py: schema unit tests (shape, exact `+00:00` suffix, non-UTC aware input converted to UTC, naive input rejected, non-UTC timezone literal rejected)
- [B] backend/tests/integration/test_server_time_integration.py: router tests over the real HTTP cycle (200 and shape, exact suffix, per-request freshness with a stubbed clock and with the real clock bracketed, answers with DATABASE_URL unset, POST returns 405)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/FEAT-1/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register `server_time_router` after `health_router`; docstring names FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is a custom route (TEST-02 and TEST-05 precedent)

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` change: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists endpoints. No E2E spec under `e2e/tests/`: no criterion is assigned to E2E (Criterion coverage below).

## Testing Strategy
- Unit tests: the `ServerTimeResponse` schema in isolation, no app, no clock. Happy path: a fixed aware UTC datetime serialises via `model_dump(mode="json")` and `model_dump_json()` to `{"now": "...+00:00", "timezone": "UTC"}` exactly. Edge case: an aware non-UTC input (`+02:00`) serialises converted to UTC with `+00:00` and the hour shifted. Edge case: a value at `.000000` microseconds still ends in `+00:00`. Error cases: a naive datetime raises `ValidationError`; `timezone="Europe/Brussels"` raises `ValidationError`. Assertions on the suffix use `endswith("+00:00")`, a full-format regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{6})?\+00:00$`, and `"Z" not in value`. Plus the registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here test_server_time_unit.py
- Integration tests: `GET /api/time` through the session `client` fixture from `backend/tests/conftest.py`. (1) 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` matching the regex above and parsing with `datetime.fromisoformat` to an aware value whose `utcoffset()` is zero. (2) Per-request freshness, deterministic: monkeypatch `app.routers.server_time.datetime` with a stub whose `now(tz)` returns two different fixed instants in sequence; two requests return those two instants in order, which proves the clock is read per request and not cached. (3) Per-request freshness against the real clock, no sleep: take `before = datetime.now(UTC)`, request, take `after`; assert `before <= now <= after`, then a second request's `now` is strictly later than the first's. (4) Answers 200 with `DATABASE_URL` unset (fresh app, as `test_version_integration.py` does). (5) `POST /api/time` returns 405. No database is needed, so these tests never skip for a missing `DATABASE_URL`.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py, here test_server_time_integration.py
- E2E tests: no spec. E2E Tests is ENABLED, but no criterion requires navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, answered per criterion below), and FEAT-1 has no frontend.
  - Directory: e2e/tests/
  - File: none for this feature (would be FEAT-1_server_time_endpoint.spec.ts)
- UAT scenarios: Gherkin scenarios per criterion plus one edge case (a non-GET method returns 405), validated for well-formedness; manual script expanded from the Manual verification plan.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | Verifying it needs no navigation or interaction: it is a router response over the HTTP cycle, and the feature has no UI. |
| 2 | `now` computed per request, UTC with explicit offset, never naive | Integration (freshness, offset on the wire) and Unit (offset serialisation, naive rejected) | Verifying it needs no navigation or interaction: freshness is two HTTP calls and the offset and naive rules are schema behaviour. |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a structural property, checked by the schema unit tests constructing `ServerTimeResponse` and by the router declaring it as `response_model` (review reads the router). |
| 4 | Unit and integration tests cover shape, offset and per-request freshness | Unit and Integration | It is a criterion about the tests themselves; it is met by the two test modules above and has no UI behaviour. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone`, with `timezone` "UTC" |
| 2 | `now` per request, UTC, explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I GET /api/time twice a second apart, Then both `now` values end in "+00:00" and the second is later than the first |
| 3 | Body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When I open /openapi.json, Then the /api/time 200 response references the `ServerTimeResponse` schema |
| 4 | Unit and integration tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the repository checked out, When I run the FEAT-1 unit and integration test files, Then the run reports 0 failed |

## Manual verification plan
FEAT-1 has no UI, so no criterion can be verified by navigating a screen. Each block below is the observable check a person runs from a terminal instead.

Prerequisites (shared by every block): Docker running; the stack started from the repository root with `docker compose up -d --build`; `docker compose ps` shows the `backend` service running; a terminal with `curl`. The backend is published on the host at `http://localhost:8010` (`docker-compose.yml`).

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
1. Run `curl -s -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is one JSON object with exactly two keys, `now` and `timezone`, for example `{"now":"2026-10-27T19:44:51.123456+00:00","timezone":"UTC"}`.
3. Check `timezone` → it reads exactly `UTC`.

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
1. Run `curl -s http://localhost:8010/api/time` → note the `now` value; it ends in `+00:00`, not `Z` and not with no offset at all.
2. Run `date -u +%Y-%m-%dT%H:%M:%S` in the same terminal → the date, hour and minute match `now` from step 1 (allow a few seconds for the gap between the two commands; a mismatch of whole hours means the value is not UTC).
3. Wait about one second and run `curl -s http://localhost:8010/api/time` again → the new `now` is later than the one from step 1 and also ends in `+00:00`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `http://localhost:8010/openapi.json` in a browser, or run `curl -s http://localhost:8010/openapi.json` → under `paths`, `/api/time` → `get` → `responses` → `200`, the schema is a `$ref` to `#/components/schemas/ServerTimeResponse`.
2. Under `components` → `schemas` → `ServerTimeResponse` → it lists the properties `now` (string, date-time format) and `timezone`.
3. Open `backend/app/schemas/server_time.py` → it defines `ServerTimeResponse`, and `backend/app/routers/server_time.py` returns that model, not a dict literal.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
1. From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`, and no test in those files is reported skipped (they need no database).
2. Open `backend/tests/integration/test_server_time_integration.py` → there is a test asserting the `+00:00` suffix exactly, and a test issuing two requests and asserting the two `now` values differ in order.
