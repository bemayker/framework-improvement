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
>
> (The "How the measured run uses this item" block is operator process, not acceptance criteria: no work is planned for it. The "TEST-06 shape" the Notes refer to is not on `main` after the sandbox reset; the closest shape on `main` is the version router, `backend/app/routers/version.py`.)

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
<!--
  All three tracker comments on this item are recorded below, newest first,
  each with what this plan does about it. The two informational comments are
  recorded and not acted on, with the reason, rather than dropped.
  The base branch state this plan is written against: `main` at ea8a2f2. Commit
  61a424f ("chore: reset the sandbox for measured run 4") REVERTED the four
  merges that the older comments were written against, FEAT-1 (#36), TEST-06
  (#35), TEST-07 (#39) and TEST-08 (#38). Every answer below is re-judged
  against `main` as it now stands, and where the reset changed the answer that
  is said explicitly.
  No `[merged-since]` lines were carried into this dispatch: this branch was cut
  from current `origin/main` and the check is not applicable, so there is no
  "Merged since the last plan" entry to record.
-->
- Comment (tracker, 2026-09-14): "mayker-dev (autonomous run deliver-20260914T095103Z), answering the four-point re-plan comment. PR #36: … Insertion point re-checked against main and moved … Offset pinned to +00:00, not Z … No service module, recorded as a planned deviation … Delivered: GET /api/time returning {"now": "<ISO 8601 UTC +00:00>", "timezone": "UTC"} … the handover rebuild failed (Bind for 0.0.0.0:5442 failed: port is already allocated)" → Addressed by: **not acted on, because it is a record of the previous run rather than a request**. It reports the delivery of PR #36, which commit 61a424f has since reverted; none of that code is on `main` now. Its three substantive decisions are carried forward on their own merits and re-derived below (offset pinned to `+00:00`, no service module, insertion point checked against `main`), not adopted on the authority of this comment. The handover-rebuild note names an environment condition (the long-lived compose stack already holds 5183/8010/5442), which is an operator concern at build time and changes nothing in this plan.
- Comment (tracker, 2026-09-14, unresolved): "Re-plan requested before build. Four points, please answer each one explicitly in the revised plan. 1. TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py … Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: **acted on, and the answer has changed since the comment was written.** Squash 73e544c8 is no longer on `main`: commit 61a424f reverted PR #35 along with three others, so `backend/app/main.py` carries **no echo router** today. Re-checked against `main` at ea8a2f2: the imports are `health`, `notes`, `version` (alphabetical by module), and `create_app()` registers `version_router`, `notes_router`, `health_router` in that order. FEAT-1's import therefore sits between the `notes` and `version` imports (alphabetical, where `server_time` sorts), and its registration goes **after `app.include_router(health_router)`** as the last line of the block — not after an `echo_router` line, which does not exist. The module docstring's feature clause currently ends "and TEST-02 the health router."; FEAT-1's clause is appended after that one. See `## Backend Plan` and the File Manifest for the exact edit.
- Comment (tracker, 2026-09-14, unresolved): "2. Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Addressed by: **not acted on, and this is a refusal rather than a deferral.** Verified against the current tree: `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, so the echo endpoint the earlier run declined to duplicate is no longer on `main` either — the ground of the refusal has changed but the refusal has not. `GET /api/echo` is the entire scope of **TEST-06 (Echo endpoint)**, which is an open, ready backlog item with its own row in `.claude/feature_map.md` and its own branch `feature/TEST-06-echo-endpoint`. Building it inside FEAT-1 would deliver another item's whole scope under this item's ID, leaving TEST-06 to be closed with an empty diff or to collide with this branch on the same paths. The secondary reason is scope containment: an echo endpoint appears in none of FEAT-1's four acceptance criteria (`user_story_alignment.md` Section 3). If the echo endpoint is wanted sooner, the remedy is to run TEST-06, not to widen FEAT-1.
- Comment (tracker, 2026-09-14, unresolved): "3. The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: **acted on. The offset is pinned to the literal `+00:00`, never `Z`.** Both are valid ISO 8601 UTC designators; `+00:00` is the literal reading of "explicit offset" and is what `datetime.isoformat()` produces for an aware UTC value, where Pydantic's default datetime serialiser emits `Z`. The choice lives in the schema, as a `field_serializer` on `now` in `backend/app/schemas/server_time.py`, so the format travels with the field rather than with a caller. It is asserted as an exact suffix at both tiers: the unit tier checks the serialised value ends with `+00:00` and does **not** end with `Z`; the integration tier checks the live response body's suffix plus `utcoffset() == timedelta(0)`. See `## API Contract` and `## Testing Strategy`.
- Comment (tracker, 2026-09-14, unresolved): "4. Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: **acted on, and recorded here as a planned deviation from `coding_standards.md` Section 2.2.** No `backend/app/services/server_time_service.py` is created. The one line of logic — `datetime.now(timezone.utc)` — lives in the router handler body, and the fixed timezone label is a constant in the schema module. The deviation is stated here, and the build states it in the PR description. Two residuals worth knowing, both stated rather than buried: the "TEST-06 shape" this decision followed is not on `main` after the reset, so the nearest precedent for a dependency-free `GET` is `version.py`, which **does** carry a service module (`version_service.py`, which resolves package metadata and has something to hold); and `health.py` carries one too. So after this feature lands, two shapes for dependency-free GET endpoints coexist in this codebase. Nothing in this plan changes `version.py` or `health.py`.
- Comment (tracker, 2026-09-14): "Plan PR opened for FEAT-1: https://github.com/bemayker/framework-improvement/pull/36" → Addressed by: **not acted on: it is a link record, not a request.** PR #36 was merged and then reverted by the sandbox reset, so it names no live branch state; this plan is written against `main` at ea8a2f2 on the fresh branch `feature/FEAT-1-server-time-endpoint`.

## Plan Overview
One backend endpoint, no frontend, no database, no new dependency. A Pydantic response schema and a FastAPI router are added under `backend/app/schemas/` and `backend/app/routers/`, and the router is registered in the existing `create_app()` factory in `backend/app/main.py`. The handler reads the clock with one standard-library call and returns a schema instance; there is no service layer and no repository layer, which is the planned deviation from `coding_standards.md` Section 2.2 recorded above. Coverage is unit (handler and schema in isolation, with a monkeypatched clock) plus integration (the full HTTP cycle through the shared `client` fixture, which needs no database). No E2E spec: no criterion is reachable through the UI. UAT artifacts are generated because `UAT Generation` is ENABLED.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` — returns the server's current UTC time and the fixed timezone label, so a client can measure clock skew against the API.
- Service layer: **none, deliberately.** The handler body is `datetime.now(timezone.utc)`; there is no business logic and no transactional boundary for a service to own. Planned deviation from `coding_standards.md` Section 2.2, recorded in `## Re-Plan Feedback` above and to be repeated in the PR description.
- Repository layer: none. The endpoint touches no database and requests no `database_url` fixture, so it answers with `DATABASE_URL` unset, exactly as `GET /api/version` does.
- Migrations: none. No schema change.
- Registration edit, exact and re-checked against `main` at ea8a2f2: add `from app.routers.server_time import router as server_time_router` between the existing `notes` and `version` imports (alphabetical by module path); add `app.include_router(server_time_router)` in `create_app()` immediately after the existing `app.include_router(health_router)` line, as the last registration in the block; append one clause to the module docstring's feature sentence after "and TEST-02 the health router." naming FEAT-1 and the server time router. Nothing else in `main.py` changes — the lifespan handler, the CORS middleware and the three existing registrations are untouched.
- Schema module: `backend/app/schemas/server_time.py` defines `SERVER_TIMEZONE = "UTC"`, and `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's aware type, so a naive value is a validation error rather than a test-time discovery) and `timezone: Literal["UTC"]`, plus a `field_serializer` on `now` that returns `value.isoformat()` and therefore pins the `+00:00` suffix.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no path parameters, no query parameters, no body, no authentication.
- Response: 200 `application/json`, exactly two keys.

```json
{
  "now": "2026-09-16T10:15:30.123456+00:00",
  "timezone": "UTC"
}
```

  `now` is an ISO 8601 timestamp for an aware UTC datetime, serialised by `datetime.isoformat()`, so it always ends with the literal six characters `+00:00` and never with `Z`. It is computed per request; two requests a second apart return different, strictly increasing values. `timezone` is the literal string `UTC` and no other value validates. The only other reachable status is `405 Method Not Allowed` on a non-GET verb, which FastAPI produces from the route declaration; the endpoint takes no input, so there is no 400/422 path and no 404 path.

## Technology Selection
- Current UTC time read: chose the standard library's `datetime.now(timezone.utc)` over a date library (`arrow`, `pendulum`, `python-dateutil`, none of which this project installs), because the stdlib returns an aware UTC datetime in one call and nothing here needs parsing, arithmetic or zone conversion.
- Home of the clock read: chose the router handler body plus a schema-module constant over a net-new `backend/app/services/server_time_service.py`, because a service module whose entire body is one stdlib call adds a layer with nothing to hold; recorded as a planned deviation from `coding_standards.md` Section 2.2 in `## Re-Plan Feedback` (tracker comment point 4).
- Explicit-offset serialisation: chose `datetime.isoformat()` on the aware value (stdlib, emits `+00:00`) over Pydantic's default datetime serialiser (already installed, emits `Z`), because the criterion asks for an explicit offset and `+00:00` is the pinned reading; wired through a Pydantic `field_serializer` so the format lives with the schema that owns the field rather than in the router.
- Naive-datetime rejection: chose the already-installed Pydantic `AwareDatetime` type over a hand-written `field_validator` that inspects `tzinfo`, because the installed type expresses the constraint with no code of its own.
- Fixed timezone label: chose `Literal["UTC"]` (stdlib `typing`, validated by the installed Pydantic) over a plain `str` field plus a test asserting its value, because the type makes any other value a validation error instead of a test-time discovery.
- Response schema: Pydantic `BaseModel`, already installed with FastAPI and matching every existing module in `backend/app/schemas/`; no alternative was needed.
- Router: FastAPI `APIRouter(prefix="/api")`, already installed and the shape every existing router in `backend/app/routers/` uses; no alternative was needed.
- Test clock control: chose `monkeypatch` of the router module's `datetime` reference (pytest, already installed) for the deterministic unit-tier freshness check, and `time.sleep(1)` (stdlib) for the integration tier's literal "a second apart" assertion, over `freezegun` or `time-machine` (neither installed), because two calls and a comparison need no clock-freezing library.
- No net-new dependency is added by this feature, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `SERVER_TIMEZONE = "UTC"` constant and `ServerTimeResponse` (`now: AwareDatetime` with an `isoformat()` field serializer pinning `+00:00`, `timezone: Literal["UTC"]`) for `GET /api/time`.
- [B] backend/app/routers/server_time.py: `APIRouter(prefix="/api", tags=["time"])` with `GET /time`, `response_model=ServerTimeResponse`; handler `get_server_time` reads `datetime.now(timezone.utc)` and returns a `ServerTimeResponse`, no service module and no bare dict.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the handler (called directly, with `app.routers.server_time.datetime` monkeypatched) and for the schema: aware UTC result, two handler calls against a fake advancing clock return distinct `now` values, naive datetime rejected, a `timezone` other than `"UTC"` rejected, serialised value equals `isoformat()` and ends with `+00:00` and not with `Z`.
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle through the shared session-scoped `client` fixture: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` parses and `utcoffset() == timedelta(0)` and the string ends with `+00:00`, two requests one second apart return strictly increasing `now`, skew within 5 seconds of the test process's own UTC clock, the OpenAPI 200 response references `ServerTimeResponse`, and 405 on POST.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (a second request never returns the same or an earlier timestamp).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: add the `server_time` router import between the `notes` and `version` imports; add `app.include_router(server_time_router)` after the existing `app.include_router(health_router)` line as the last registration in `create_app()`; append FEAT-1's clause to the module docstring's feature sentence. No other line changes.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` after the existing `test_create_app_registers_health_route`, asserting `/api/time` is among the app's custom route paths, in the shape of the existing version and health assertions.

This feature adds no dependency, so no dependency manifest and no lockfile (`uv.lock`) is touched: FastAPI, Pydantic and pytest are already installed and the standard library covers everything else. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit, because this feature changes no project structure, no run configuration, no dependency and no test infrastructure, and neither document enumerates the API endpoints.

## Testing Strategy
- Unit tests: `app.routers.server_time.get_server_time` called directly as a function (no HTTP), and `ServerTimeResponse` from `app.schemas.server_time`. Happy path: the handler returns a `ServerTimeResponse` whose `now` is aware with a zero `utcoffset()` and whose `timezone` equals `SERVER_TIMEZONE == "UTC"`. Edge case: with `app.routers.server_time.datetime` monkeypatched to a fake whose `now(tz)` returns successive distinct aware values, two handler calls return different `now` values, proving the value is computed per call and not cached, deterministically and with no sleep. Error cases: `ServerTimeResponse(now=datetime(2026, 1, 1), timezone="UTC")` raises `pydantic.ValidationError` (naive rejected by `AwareDatetime`), and `ServerTimeResponse(now=<aware>, timezone="CET")` raises `pydantic.ValidationError` (rejected by the `Literal`). Offset pin: `model_dump(mode="json")["now"]` for a known aware UTC value equals that value's `isoformat()`, ends with `+00:00`, and does not end with `Z`. Plus the app-factory registration test added to `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py — `test_server_time_unit.py`, the shared stem of the router and schema modules; the route-registration assertion goes into the existing `test_main_unit.py`.
- Integration tests: the router through the full HTTP request/response cycle using the shared session-scoped `client` fixture from `backend/tests/conftest.py`. No database is needed, so none of the `database_url` / `db_connection` fixtures are requested and these tests run wherever the unit tier runs, exactly as `test_version_integration.py` does. Assertions: 200 with body keys exactly `{"now", "timezone"}` and `timezone == "UTC"`; `datetime.fromisoformat(body["now"])` succeeds with `tzinfo is not None` and `utcoffset() == timedelta(0)`, and the raw string ends with `+00:00`; freshness — two GETs separated by `time.sleep(1)` return `now` values where the second parses strictly later than the first; skew sanity — `now` is within 5 seconds of the test process's own `datetime.now(timezone.utc)`; OpenAPI — `/openapi.json` shows the `/api/time` GET 200 `$ref` as `#/components/schemas/ServerTimeResponse` with properties `now` and `timezone`; and 405 on POST, the only reachable error case, matching the version, health and notes integration suites.
  - Directory: backend/tests/integration/ — `test_server_time_integration.py`
- E2E tests: **not warranted for this feature**, although the `E2E Tests` toggle is ENABLED. No acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion in the table below): all four are HTTP payload, type and test-suite properties of a backend endpoint that no frontend component consumes. No `e2e/tests/FEAT-1_*.spec.ts` is produced, and the per-feature edge-case spec obligation of `testing_standards.md` Section 4 does not attach, because that obligation is scoped to the criteria this table assigns to E2E. The toggle governs whether the tier may run, not whether every feature gets a spec.
  - Directory: e2e/tests/ (nothing produced here)
  - File: {feature_id}_{slug}.spec.ts (not produced, see above)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (repeated requests are monotonic and never equal), validated for well-formedness rather than executed as browser tests. The manual script is expanded from `## Manual verification plan` below.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour over the real HTTP cycle, and no UI consumes the endpoint |
| 2 | `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive | Integration (freshness and the `+00:00` suffix over HTTP) plus Unit (the no-caching check against a monkeypatched clock, naive rejection by the schema, and `+00:00` not `Z` from the serializer) | Verifying it needs no navigation or interaction: two HTTP calls and a parse settle freshness and offset, and naive rejection is a schema validation rule |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router | Unit plus Integration | Verifying it needs no navigation or interaction: `ServerTimeResponse` is imported from `app.schemas.server_time` and exercised directly at unit level, and the integration tier's OpenAPI `$ref` and exact-keys assertions confirm the router serialises through it |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | The criterion is satisfied by the existence and passing of the tests named above; a browser adds nothing to a criterion about the test suite itself |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the response is HTTP 200 with a `now` timestamp and `timezone` equal to "UTC" |
| 2 | `now` is fresh per request, UTC with an explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client requests GET /api/time twice one second apart, Then both `now` values end in "+00:00" and the second is later than the first |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client reads GET /openapi.json, Then the `/api/time` 200 response references a `ServerTimeResponse` schema with `now` and `timezone` properties |
| 4 | Unit and integration tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When `uv run pytest -q` runs, Then the server time unit and integration tests are collected and pass |

## Manual verification plan
### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
This criterion is not verifiable through the UI: no frontend component consumes the endpoint. The observable check is the HTTP response itself, read with `curl`.
Prerequisites: Docker running; the stack up via `docker compose up -d --build` from the repo root; `docker compose ps` shows the `backend` service running and `docker-compose.yml` publishes it on host port `8010`. A terminal with `curl`.
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the response body → a JSON object with exactly two keys, in the shape `{"now":"2026-09-16T10:15:30.123456+00:00","timezone":"UTC"}`: `now` is a full ISO 8601 timestamp with a date, a `T`, a time with fractional seconds and the suffix `+00:00`; `timezone` is exactly `UTC`.
3. Run `date -u` in the same terminal and compare its hour and minute with the `now` value from step 2 → they match to within a few seconds, confirming the value is UTC rather than the host's local zone.

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
Not verifiable through the UI. The observable check is two HTTP responses compared against each other.
Prerequisites: criterion 1 just verified, stack still up.
1. Run `curl -s http://localhost:8010/api/time` and write down the `now` value → for example `2026-09-16T10:15:30.123456+00:00`.
2. Run `sleep 1`, then run `curl -s http://localhost:8010/api/time` again → the `now` value differs from step 1 and is later than it; the seconds field, or the minute, has advanced.
3. Inspect both `now` values character by character at the end of the string → each ends with the literal six characters `+00:00`; neither ends with the letter `Z`, and neither ends with a bare time such as `...30.123456` with nothing after it, which is what a naive value would look like.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Not verifiable through the UI. The observable checks are the OpenAPI document FastAPI generates from the schema, and the source files themselves.
Prerequisites: stack still up; a checkout of the branch open in an editor.
1. Run `curl -s http://localhost:8010/openapi.json` and search the output for the string `ServerTimeResponse` → it is present under `components.schemas`, with `properties.now` of type `string` and format `date-time`, and `properties.timezone` carrying `enum: ["UTC"]`; the `/api/time` GET 200 response references `#/components/schemas/ServerTimeResponse`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the "Successful Response" schema is named `ServerTimeResponse` and lists `now` and `timezone`.
3. Open `backend/app/schemas/server_time.py` in the editor → it defines `SERVER_TIMEZONE = "UTC"` and `class ServerTimeResponse(BaseModel)` with the two fields and a `field_serializer` for `now`. Open `backend/app/routers/server_time.py` → the route declares `response_model=ServerTimeResponse` and the handler returns an instance of it built from `datetime.now(timezone.utc)`, not a dict literal. List `backend/app/services/` → it contains no `server_time_service.py`, which is the planned deviation from `coding_standards.md` Section 2.2 recorded in `## Re-Plan Feedback`.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Not verifiable through the UI. The observable check is the test run's own output.
Prerequisites: `uv` installed and the backend dependencies synced (`uv sync` inside `backend/`). No database is needed for these two files.
1. From the repo root run `uv run --directory backend pytest tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py -v` → the output lists test names covering the aware UTC result, the distinct successive calls, the naive-datetime rejection, the non-UTC `timezone` rejection, the `+00:00` suffix, the 200 shape, the one-second freshness check, the OpenAPI schema reference and the 405 case, and the final line reports every one of them passed with 0 failed.
2. From the repo root run `uv run --directory backend pytest -q` → the whole backend suite passes, including `tests/unit/test_main_unit.py::test_create_app_registers_time_route` alongside the pre-existing version and health registration tests.
