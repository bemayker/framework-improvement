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
> (The item's "How the measured run uses this item" block is operator instructions and is not part of the feature; nothing below is planned from it.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback

Three feedback sources are recorded below and all three were consulted.

**Source 1, tracker comments.** The item carries five comments and no threaded replies. Four are the framework's own "Plan PR opened" notices (PRs #36, #48, #50) and one autonomous-run answer; none is actionable. The one actionable human comment is a four-point re-plan request, still unresolved on the tracker, recorded as one line per point so each answer is addressable.

**Source 2, PR review comments.** PR #50 (draft, https://github.com/bemayker/framework-improvement/pull/50) carries zero reviews, zero general comments and zero inline comments. There is nothing to address from this source.

**Source 3, the merged-since-plan check** returned `verdict=replan` (exit 1) with `base=ea8a2f2 ref=origin/main commits=1 overlap=2`. One commit merged to `origin/main` since this branch's base and it touches both paths this plan's File Manifest names as modified. Both overlapping files were re-read from `origin/main` (`git show origin/main:{path}`), never from this branch's older copy, and each is answered on its own line below.

- Comment (tracker): "1. TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-derived against `origin/main:backend/app/main.py` as it stands at `caa57a5`. **The comment's sha is stale and its premise is live again.** `73e544c8` was reverted by the run-4 sandbox reset (`61a424f`, PR #44); TEST-06 has since merged a second time as **`caa57a5` (PR #51, `feat(TEST-06): Echo endpoint`)**, which is the commit the merged-since check names. **What changed, against the PR #50 plan's derivation:** that plan read a main registering *three* routers (`version_router`, `notes_router`, `health_router`) and placed FEAT-1's registration after `health_router`. Main now registers **four**, in this order: `version_router`, `notes_router`, `health_router`, `echo_router`, with four sorted imports `echo`, `health`, `notes`, `version`. So (a) the **import** position is unchanged — `from app.routers.time import router as time_router` still sorts between `notes` and `version` — and (b) the **registration** position moved: `app.include_router(time_router)` now goes after `echo_router`, which is the last line of the block rather than the third. (c) The module docstring's per-feature sentence also grew a clause, and now ends `...and TEST-06 the echo router.`; FEAT-1 extends that same sentence rather than the shorter one PR #50 read. Nothing else in `create_app()` moves: the settings read, the `CORSMiddleware` block and the `lifespan` handler are untouched. A second consequence is recorded under the merged-since lines below: this branch's base predates `caa57a5`, so the builder starts from a tree with no echo in it.
- Comment (tracker): "2. Also add a GET /api/echo?msg={text} endpoint returning {\"echo\": \"<msg>\"} while you are in main.py, so the two registrations land together." → **Not acted on, and the reason is now stronger than it was in PR #50.** `GET /api/echo` **already exists on `origin/main`** — `backend/app/routers/echo.py`, `backend/app/schemas/echo.py`, registered in `create_app()` as `echo_router`, delivered by TEST-06 in `caa57a5`. Adding it inside FEAT-1 would therefore not make two registrations land together; it would re-implement a shipped endpoint, and the second implementation would conflict line-for-line with the first the moment this branch takes main in. It is also outside every one of FEAT-1's four acceptance criteria, which is the gold plating `user_story_alignment.md` Section 3 forbids. This is a refusal and not a deferral: there is nothing left to defer, because the work the comment asks for is done. The scheduling concern behind the comment — that FEAT-1, TEST-06 and TEST-07 all edit one registration block — is answered by `shared_risks.md` and by this item's `shared_risk_notes` cell, and TEST-06's half of it is now closed by its merge.
- Comment (tracker): "3. The acceptance criterion says \"ISO 8601 UTC with explicit offset\" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: **the offset is pinned to `+00:00`**, not `Z`, and the PR #50 answer stands unchanged because nothing on main bears on it. Two reasons for the choice: `+00:00` is literally an explicit offset where `Z` is a zone designator standing in for one, which is what the criterion asks for; and it is what `datetime.isoformat()` emits natively for an aware UTC value, so the schema pins it with a one-line pass-through serializer instead of string surgery whose output would drift with a Pydantic version. The choice is stated in the schema as `@field_serializer("now")` returning `value.astimezone(UTC).isoformat()` (see `## Backend Plan`), so the wire format cannot depend on Pydantic's default datetime encoder. It is covered by an exact-suffix assertion at **both** tiers: `test_time_response_serialises_now_with_explicit_utc_offset` (unit, asserting the full string `2026-01-02T03:04:05+00:00` and that it does not end in `Z`) and `test_get_time_now_ends_with_explicit_utc_offset` (integration, asserting the HTTP body's `now` ends in `+00:00` and parses to a zero `utcoffset()`).
- Comment (tracker): "4. Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/time_service.py` is planned, and **the TEST-06 precedent the comment invokes is now verifiable on main rather than asserted**: `origin/main:backend/app/services/` holds exactly `health_service.py`, `note_service.py` and `version_service.py`, and `backend/app/routers/echo.py` constructs its response schema inline with no service module at all. FEAT-1 takes the same shape — the handler reads the clock inline (`TimeResponse(now=datetime.now(UTC))`) — and the layering deviation is recorded explicitly in `## Backend Plan` → "Service layer", citing `coding_standards.md` Section 2.2 and noting that `version` and `health` keep their service modules because each has real logic to hold (package-metadata resolution with a fallback; a live database probe with a parsed failure target).
- Merged since the last plan: `backend/app/main.py` (TEST-06's echo router landed in `caa57a5`: a fourth import `from app.routers.echo import router as echo_router`, a fourth `app.include_router(echo_router)` at the end of the registration block, and an extra clause on the module docstring's per-feature sentence) → **re-scoped to:** the entry is kept, because registering `/api/time` is FEAT-1's own work and nothing on main does it. What is re-scoped is the insertion point: the registration call now goes **after `echo_router`** rather than after `health_router`, and the docstring clause is appended to the sentence as it now reads. The import position is genuinely unchanged (`time` still sorts between `notes` and `version`), and that is stated rather than assumed, because "unchanged" is the answer a re-plan has to justify.
- Merged since the last plan: `backend/tests/unit/test_main_unit.py` (TEST-06 added `test_create_app_registers_echo_route` in `caa57a5`, after the existing version and health cases; `_collect_route_paths` and `BUILT_IN_ROUTE_PATHS` are untouched) → **re-scoped to:** the entry is kept for the same reason — no test on main asserts `/api/time` — and the new `test_create_app_registers_time_route` is appended **after the echo case** rather than after the health case, reusing the two shared helpers exactly as the echo case does. No existing test is edited.

**Note for the builder, not a work item of its own.** This branch's base is `ea8a2f2`, which predates `caa57a5`, so the working tree it starts from carries **three** routers and no echo module. Every edit specified in this plan for `backend/app/main.py` and `backend/tests/unit/test_main_unit.py` is written against **main's current content** (four routers: version, notes, health, echo). The branch therefore needs `origin/main` merged or rebased in before or during the build, so those two files carry TEST-06's lines before FEAT-1's are added to them. The planner does not perform that reconciliation: this dispatch is read-mostly and reconciling the branch is a human-triggered step by design.

## Plan Overview

One read-only backend endpoint, `GET /api/time`, built in the shape `origin/main` already uses for `version` and `echo`: a router module under `backend/app/routers/`, a Pydantic response schema under `backend/app/schemas/`, and one `app.include_router(...)` line at the end of the application factory's registration block. It has no service layer (see the recorded deviation), no repository layer, no database access, no migration and no frontend. Coverage is unit plus integration; no E2E spec is warranted because there is no UI to navigate. The only files this feature shares with another **open** item are `backend/app/main.py` and its unit test, which `shared_risks.md` now flags against TEST-07 alone — TEST-06's half of that risk closed when it merged.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` — returns the server's current instant in UTC plus the fixed zone label. No path parameters, no query parameters, no request body, no authentication.
- Router: `backend/app/routers/time.py`, an `APIRouter(prefix="/api", tags=["time"])` with `@router.get("/time", response_model=TimeResponse)`, matching `origin/main:backend/app/routers/echo.py` and `version.py` exactly, module docstring included (`"""Router for GET /api/time (FEAT-1)."""`). The handler is `def get_time() -> TimeResponse: return TimeResponse(now=datetime.now(UTC))`, using `from datetime import UTC, datetime` (Python 3.12's `datetime.UTC` alias). Reading the clock inside the handler is what makes criterion 2's per-request freshness true by construction: there is no module-level constant and no cache.
- Schema: `backend/app/schemas/time.py` defines `TimeResponse(BaseModel)` with two fields, matching the one-class-per-file shape of `schemas/echo.py` and `schemas/version.py`. `now: AwareDatetime` — `pydantic.AwareDatetime` rather than a bare `datetime`, so a naive value is a validation error at the type level rather than a silent local-time reading inside `astimezone`; that is the "never naive" half of criterion 2 pinned in the schema. `timezone: Literal["UTC"] = "UTC"` — a literal, so no other value can be constructed and the OpenAPI schema renders it as a constant. A `@field_serializer("now")` returns `value.astimezone(UTC).isoformat()`, which pins the wire format to `+00:00` (point 3 above) independently of Pydantic's default datetime encoder, and normalises any non-UTC aware input to the same instant in UTC.
- Service layer: **none, and this is a planned deviation from `coding_standards.md` Section 2.2** (Router → Service → Repository). That section scopes the service layer to business logic and transactional boundaries; reading the system clock is neither, so a `time_service.py` would be a pass-through module whose only content is the same one-line call. The deviation matches the precedent already on main: `backend/app/routers/echo.py` has no service module either, and `backend/app/services/` holds only `health_service.py`, `note_service.py` and `version_service.py`. It is confined to this endpoint — `version` and `health` keep their service modules because each holds real logic (package-metadata resolution with a sentinel fallback; a live connectivity probe plus a parsed attempted-target on the failure path). Recorded here so the reviewer grades it against the plan rather than against the pattern.
- Repository layer: none. The endpoint touches no database; `DATABASE_URL` may be unset and the endpoint must still answer, exactly as `GET /api/version` and `GET /api/echo` do today.
- Migrations: none. No schema change.
- Registration: `backend/app/main.py` gains one import, `from app.routers.time import router as time_router`, sorted between the `notes` and `version` imports, and one `app.include_router(time_router)` call in `create_app()` **after `app.include_router(echo_router)`**, which is the last line of the registration block as main now stands (see the Re-Plan Feedback answer to point 1 and the merged-since line for the derivation). The module docstring's per-feature sentence — which currently ends `...TEST-02 the health router, and TEST-06 the echo router.` — is extended with a FEAT-1 clause for the time router, matching the convention already in that file.
- Logging and error handling: nothing to add. The handler has no failure path of its own — no I/O, no parsing, no external call — so there is no exception to log and no custom exception class to define. `coding_standards.md` Section 2.3's rule is satisfied vacuously, not waived.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no path parameters, no query parameters, no request body, no headers required.
- Response: `200 OK`, `application/json`

```json
{
  "now": "2026-09-16T09:41:07.512834+00:00",
  "timezone": "UTC"
}
```

  - `now` — string, ISO 8601, always ending in the explicit offset `+00:00` (never `Z`, never offsetless). Microseconds are present when the clock supplies them and absent when it does not (`2026-09-16T09:41:07+00:00` is a valid response); only the offset suffix is contractual.
  - `timezone` — string, always exactly `"UTC"`.
  - Exactly these two keys; no envelope, no additional fields.
- Errors: `405 Method Not Allowed` for any verb other than GET, matching `test_post_echo_returns_405_method_not_allowed` on main. There is no 4xx validation path (the endpoint accepts no input) and no 5xx path of its own.

## Technology Selection
- Current-instant source (`datetime.now(UTC)`): chose the Python standard library's `datetime` module over adding a date/time dependency such as `pendulum` or `arrow`, because the stdlib already returns a timezone-aware UTC value and its `isoformat()` already emits the exact `+00:00` wire format criterion 1 requires — a dependency would add an install for a single call.
- Response schema (`TimeResponse`): chose `pydantic.BaseModel` with `AwareDatetime` and a `field_serializer`, a dependency this project already installs (FastAPI depends on it, and `backend/app/schemas/echo.py`, `version.py` and `health.py` already use it), over hand-building the response dict in the router. Criterion 3 requires the schema, and `AwareDatetime` is what makes "never naive" a type error instead of a test-only assertion.
- Router (`APIRouter`): chose `fastapi.APIRouter`, already installed and already the pattern in `backend/app/routers/echo.py` and `version.py`, over a bare `@app.get` on the factory; no alternative was considered because the project's own convention settles it.
- No net-new dependency is introduced, so `backend/pyproject.toml` is unchanged and no lockfile is regenerated.
- No net-new service, repository or utility module is introduced: the one candidate (a `time_service.py`) is deliberately not built, per the recorded Section 2.2 deviation above.

## File Manifest
### New files
- [B] backend/app/routers/time.py: `APIRouter(prefix="/api", tags=["time"])` with the `GET /time` handler returning `TimeResponse(now=datetime.now(UTC))`
- [B] backend/app/schemas/time.py: `TimeResponse` — `now: AwareDatetime` with a `field_serializer` pinning `+00:00`, and `timezone: Literal["UTC"] = "UTC"`
- [B] backend/tests/unit/test_time_router_unit.py: unit cases for the handler and the schema (freshness, UTC awareness, exact `+00:00` suffix, non-UTC normalisation, naive rejection, `response_model` declaration)
- [B] backend/tests/integration/test_time_integration.py: full HTTP cycle for `GET /api/time` (200 shape, offset suffix, per-request freshness, 405 on POST)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge scenario
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact-directory copy of that manual script (build-feature Section 14 step 3)

One unit test file covers two modules, and its name changed from the PR #50 plan. That plan named it `test_time_unit.py`; reading `origin/main` shows TEST-06 landed its equivalent as `backend/tests/unit/test_echo_router_unit.py`, covering router and schema together, so `test_time_router_unit.py` is both the landed precedent and an unambiguous name where the router and schema modules are both called `time`. Splitting it in two would need a name the `test_{module}_unit.py` convention does not provide.

### Modified files
- [B] backend/app/main.py: add `from app.routers.time import router as time_router` (sorted between the `notes` and `version` imports) and `app.include_router(time_router)` in `create_app()` after `app.include_router(echo_router)`, the last line of the registration block on current main; extend the module docstring's per-feature sentence with a FEAT-1 clause
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` after the existing `test_create_app_registers_echo_route`, asserting `/api/time` is among the app's custom routes and reusing `_collect_route_paths` and `BUILT_IN_ROUTE_PATHS` unchanged

No dependency manifest changes, so no lockfile entry: `backend/pyproject.toml` is untouched and nothing regenerates `uv.lock`. `README.md` and `docs/DEVELOPMENT.md` need no edit either, so no `[Docs]` entries: this feature changes no project structure, no run configuration, no dependency and no test infrastructure, and neither document carries an endpoint list that a new route would have to join (`README.md` names the compose services and the repository tree; `docs/DEVELOPMENT.md` documents the framework and the test commands, both unchanged).

## Testing Strategy
- Unit tests: the router handler in `backend/app/routers/time.py` (reads the clock on every call; returns a timezone-aware UTC value; the route declares `response_model=TimeResponse`) and the `TimeResponse` schema in `backend/app/schemas/time.py` (exact `+00:00` suffix, non-UTC aware input normalised to UTC, naive input rejected). Per-request freshness is proved deterministically with a monkeypatched clock returning two distinct values, so the case does not depend on clock resolution. One added case in `test_main_unit.py` covers the router registration.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` → `test_time_router_unit.py` (matching `test_echo_router_unit.py` on main)
- Integration tests: the full HTTP request/response cycle for `GET /api/time` through the session-scoped `client` fixture in `backend/tests/conftest.py` — 200 with exactly the two contractual keys, the `now` suffix at the HTTP boundary, two requests returning different and increasing values, and `POST /api/time` returning 405 as the one reachable error case. **No backing service is needed**: this endpoint touches no database, so these tests use neither the `database_url` nor the `db_connection` fixture and the PostgreSQL recipe in `CLAUDE.md` → Backing Services is not exercised by this item (it is still provisioned for the rest of the suite). This is the same posture `test_echo_integration.py` and `test_version_integration.py` already take on main.
  - Directory: `backend/tests/integration/`
- E2E tests: **not warranted for this feature**, although `E2E Tests` is ENABLED in `CLAUDE.md`. This is a JSON API endpoint with no UI: no acceptance criterion is verified by navigation or interaction through the browser, and a spec that called the endpoint directly would be a router integration test wearing a browser (`testing_standards.md` Section 5). No spec is generated and `e2e/tests/` is untouched.
  - Directory: `e2e/tests/` (unused by this feature)
  - File: `{feature_id}_{slug}.spec.ts` (no file produced)
- UAT scenarios: Gherkin covering each of the four acceptance criteria plus one edge scenario (a second request a moment later reports a later instant), written against the HTTP response rather than a screen, since there is no UI.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour, fully observable through the test client's HTTP request/response cycle |
| 2 | `now` is computed per request, serialised in UTC with an explicit offset, never naive | Unit | Verifying it needs no navigation or interaction: it is a property of one function and one schema, and a monkeypatched clock proves per-request computation deterministically where a browser could only observe it. The integration tier repeats the freshness and offset checks at the HTTP boundary, but the unit tier is the cheapest one that can cover the criterion |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict | Unit | Verifying it needs no navigation or interaction: it is a structural property of the schema module — the serializer's exact output and the route's `response_model` are both asserted by importing them, the same way `test_echo_router_unit.py` asserts TEST-06's |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit + Integration | Verifying it needs no navigation or interaction: this criterion is about the suite itself, and it is satisfied by rows 1 to 3's executed tests running green in Phase B and in CI. The shape is covered by the integration 200 case, the offset by the exact-suffix assertion at both tiers, and the freshness by the monkeypatched-clock unit case plus the two-request integration case |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends `GET /api/time`, Then the response is 200 and its body has exactly the keys `now` and `timezone` with `timezone` equal to `UTC` |
| 2 | `now` is computed per request, UTC with an explicit offset, never naive | covered at Unit, see Criterion coverage | Given the backend is running, When a client sends `GET /api/time` twice a second apart, Then the two `now` values differ, the second is later, and both end in `+00:00` |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When a client fetches `/openapi.json`, Then `components.schemas` contains `TimeResponse` with a date-time `now` and a constant `UTC` timezone, and `GET /api/time` references it |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | covered at Unit + Integration, see Criterion coverage | Given the repository checkout, When the backend suite runs, Then the time unit and integration test files execute and pass, asserting the two-key shape, the `+00:00` suffix and two differing consecutive values |
| edge | A non-UTC aware instant is still reported in UTC | covered at Unit, see Criterion coverage | Given a `TimeResponse` built from an instant carrying a `+02:00` offset, When it is serialised, Then `now` names the same instant with the `+00:00` offset |

## Manual verification plan

Prerequisites for every block: the repository is checked out on this branch with the feature built and `origin/main` merged in, the stack is up (`docker compose up -d` from the repository root), and `docker compose ps` shows `db`, `backend` and `frontend` running. The backend answers on `http://localhost:8010`. No login, no seed data and no toggle is needed — the endpoint is public and reads only the clock.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
1. In a terminal at the repository root, run `curl -i http://localhost:8010/api/time` → the first response line is `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the body on the last line of that output → it is a single JSON object with exactly two keys, for example `{"now":"2026-09-16T09:41:07.512834+00:00","timezone":"UTC"}`. There is no envelope, no `data` wrapper and no third key.
3. Read the `timezone` value → it is exactly the string `UTC`.
4. Open `http://localhost:8010/api/time` in a browser tab → the same two-key JSON object is displayed, confirming the endpoint is reachable without a client that sets special headers.
5. Run `curl -s "http://localhost:8010/api/echo?msg=hello"` in the same terminal → it returns `{"echo":"hello"}`, confirming this branch did not disturb the echo route TEST-06 registered immediately above the time route in `create_app()`.

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
1. In the terminal, run `curl -s http://localhost:8010/api/time` and write down the `now` value, for example `2026-09-16T09:41:07.512834+00:00`.
2. Wait at least one second (count to two), then run `curl -s http://localhost:8010/api/time` again and write down the second `now` value → the two values are different, and the second one is later than the first when read left to right (its seconds field has advanced by at least one).
3. Read the last six characters of both values → each is exactly `+00:00`. Neither ends in `Z`, and neither stops after the seconds or microseconds with no offset at all (a value such as `2026-09-16T09:41:07.512834` with nothing after it is a failure of this step).
4. Run `date -u +%Y-%m-%dT%H:%M:%S` in the same terminal and compare it with the `now` value from step 2 → the two agree to within a few seconds, confirming the endpoint reports UTC and not a local zone shifted to look like UTC.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
This criterion is about how the response is produced and cannot be confirmed from the response body alone, so read the generated OpenAPI document, which only exists because a schema defines the response.
1. Open `http://localhost:8010/docs` in a browser and expand the `GET /api/time` entry → the "Successful Response" block names the schema `TimeResponse` rather than an untyped object, and lists `now` as a `string` with format `date-time` and `timezone` as a string fixed to `UTC`.
2. Run `curl -s http://localhost:8010/openapi.json | grep -c TimeResponse` in the terminal → the count is at least 1, meaning the endpoint's response is declared against the named schema in the generated document.
3. Open `backend/app/schemas/time.py` in an editor → it defines `class TimeResponse(BaseModel)` with `now: AwareDatetime`, `timezone: Literal["UTC"] = "UTC"` and a `@field_serializer("now")`. Open `backend/app/routers/time.py` → the handler's return statement constructs `TimeResponse(...)` and the decorator carries `response_model=TimeResponse`; there is no `return {"now": ...}` dict literal anywhere in the file.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
This criterion is about the test suite rather than about the running application, so the observable check is the suite's own output rather than a screen.
1. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_time_router_unit.py tests/integration/test_time_integration.py` → the run finishes with `0 failed` and no test is reported as skipped.
2. Re-run it with the names shown: `uv run --directory backend pytest -v tests/unit/test_time_router_unit.py tests/integration/test_time_integration.py` → the listed test names include one asserting the exact `+00:00` suffix, one asserting two consecutive calls return different values, and one asserting the 200 response's two-key shape, each reported as `PASSED`.
3. From the repository root, run the project's full gate command `uv run --directory backend pytest -q && npm --prefix frontend test` → both suites pass, confirming the new tests did not break an existing one (in particular the version, health and echo route-registration cases in `tests/unit/test_main_unit.py`).
