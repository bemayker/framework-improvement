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

Scope note: the last section of the feature text is labelled *operator instructions, not part of the feature* and is excluded from this plan. The item refers to itself as `TEST-09`; its framework ID in `feature_map.md` and `project_state.json` is **FEAT-1**, which every path, branch and manifest entry below uses.

## Acceptance Criteria
- [ ] `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
This is a re-plan of the plan committed as 9b7b770. Two feedback sources reached it: one actionable tracker comment (the item's other comment is the framework's own PR-link comment, not actionable) and a `verdict=replan` merged-since notice. Every point of both is answered below; nothing was dropped.

- Comment (tracker): "Re-plan requested before build. Four points, please answer each one explicitly in the revised plan. 1. TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed. 2. Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together. 3. The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix. 4. Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by, point by point:
  1. **Insertion point re-checked against `origin/main` (73e544c) and moved.** `git show origin/main:backend/app/main.py` shows what changed: the module docstring's last clause now reads "TEST-02 the health router, and TEST-06 the echo router."; the import block gained `from app.routers.echo import router as echo_router` (first of the four `app.routers` imports, alphabetical); and `create_app()` gained `app.include_router(echo_router)` as the fourth and last registration, after `health_router`. The previous plan inserted "after the health router", which on today's main would land between `health_router` and `echo_router`. Re-scoped: the import `from app.routers.server_time import router as server_time_router` goes between the `notes` and `version` imports (alphabetical, matching how echo was slotted), the registration `app.include_router(server_time_router)` goes **after `app.include_router(echo_router)`**, last in the block, and the docstring's clause becomes "TEST-02 the health router, TEST-06 the echo router, and FEAT-1 the server time router." The echo lines are not touched. See also the merged-since entries below for what the unrebased branch means for this.
  2. **Not acted on: the echo endpoint is already on main, shipped by TEST-06 (73e544c, PR #35).** Read from `origin/main` rather than assumed: `backend/app/routers/echo.py` declares `router = APIRouter(prefix="/api", tags=["echo"])` with `@router.get("/echo", response_model=EchoResponse)` taking `msg: Annotated[str, Query(max_length=ECHO_MESSAGE_MAX_LENGTH)]` (required, no default) and returning `EchoResponse(echo=msg)`; `backend/app/schemas/echo.py` defines `EchoResponse(BaseModel)` with the single field `echo: str`, so the body is exactly `{"echo": "<msg>"}`; `backend/app/main.py` on main already imports it and calls `app.include_router(echo_router)`; `backend/tests/integration/test_echo_integration.py` and a `test_create_app_registers_echo_route` case in `test_main_unit.py` cover it. The request is therefore satisfied by merged code and adding it here would produce a duplicate router on the same path. The secondary reason is `user_story_alignment.md` Section 3 (scope containment: the echo endpoint is not in FEAT-1's acceptance criteria); the primary reason is that the work already exists on main. If the operator intended something the merged echo endpoint does not do, that is a change to TEST-06's delivered behaviour and belongs on a new item, not inside FEAT-1.
  3. **Offset pinned to `+00:00`, in the schema, with a suffix test.** Decision: `+00:00`, not `Z`. Both are valid ISO 8601 UTC designators; `+00:00` is the literal reading of "explicit offset" (a numeric offset rather than a letter alias), it is what `datetime.isoformat()` produces for an aware UTC value, and it is what `datetime.fromisoformat()` on every supported Python parses without a compatibility shim. The choice lives in `backend/app/schemas/server_time.py`: `ServerTimeResponse` carries a `@field_serializer("now")` returning `value.isoformat()` with a docstring stating the `+00:00` decision, because Pydantic's default serialiser would emit `Z` and the format has to be owned by the schema, not by the router. It was a "recorded assumption" in the previous plan; it is now a pinned decision. Tests assert the exact suffix at both tiers: unit, `model_dump(mode="json")["now"].endswith("+00:00")` and `not ...endswith("Z")` for a known aware value; integration, `response.json()["now"].endswith("+00:00")` on a live response, plus `datetime.fromisoformat(...).utcoffset() == timedelta(0)`.
  4. **Service module removed; recorded as a planned deviation from `coding_standards.md` Section 2.2.** `backend/app/services/server_time_service.py` is dropped from the File Manifest. Following TEST-06's shape exactly as it sits on main: the module-level constant goes in the schema module (TEST-06 keeps `ECHO_MESSAGE_MAX_LENGTH` in `schemas/echo.py` with a "one source" comment, so `SERVER_TIMEZONE = "UTC"` goes in `schemas/server_time.py` with the same reasoning) and the one line of logic goes in the router handler (TEST-06's `get_echo` returns `EchoResponse(echo=msg)` directly, so `get_server_time` returns `ServerTimeResponse(now=datetime.now(timezone.utc), timezone=SERVER_TIMEZONE)` directly). **Planned deviation:** `coding_standards.md` Section 2.2 prescribes Router → Service → Repository "when the project includes a backend with data persistence", with the Service layer defined as the home of business logic and transactional boundaries. Reading the system clock is neither business logic nor a transaction, and a service module whose whole body is `return datetime.now(timezone.utc)` is the "hasty abstraction" Section 1's DRY note warns against. The router keeps Section 2.2's own constraint ("NO business logic here") intact because there is no business logic in this feature. TEST-06 took the same decision on main and this plan follows it so the two dependency-free GET endpoints share one shape. The deviation is listed here and must be repeated in the build PR description so the reviewer finds it stated rather than discovering it.

- Merged since the last plan, verbatim notice from Section 5 step 7:

  ```
  [merged-since] base=2f8fb91 ref=origin/main commits=1 overlap=2 verdict=replan
  [merged-since] plan entries that origin/main also changed since 2f8fb91:
  [merged-since]   modified  backend/app/main.py  (on origin/main: M; planned: import the server time router and register it in `create_app()` (one `include_router` line after the health router); extend the module docstring's feature list with FEAT-1.)
  [merged-since]   modified  backend/tests/unit/test_main_unit.py  (on origin/main: M; planned: add `test_create_app_registers_time_route` asserting `/api/time` is in the app's custom route paths, in the shape of the existing version and health assertions.)
  [merged-since] merged on origin/main since 2f8fb91:
  [merged-since]   73e544c feat(TEST-06): Echo endpoint (#35)
  ```

- Merged since the last plan: `backend/app/main.py` (TEST-06's squash 73e544c added the `echo_router` import, `app.include_router(echo_router)` as the last registration in `create_app()`, and the docstring clause "and TEST-06 the echo router") → **re-scoped to:** the same three edits FEAT-1 always planned, but positioned relative to main's current content: import between `notes` and `version`, registration after `echo_router` (last), docstring clause appended after TEST-06's. The work itself has not landed (nothing on main mentions `/api/time`), so the entry stays; only its insertion point moved. **What the unrebased branch means:** this branch (9b7b770) still sits on base 2f8fb91 and has not been rebased or merged with `origin/main`, so its working copy of `main.py` has three routers and no echo lines. The build's edit therefore lands on the same three hunks TEST-06 changed (docstring tail, import block, `include_router` block) and the PR will show a textual conflict with main in exactly those hunks until the branch is reconciled. The reconciliation is a human-triggered step (a rebase onto, or merge of, `origin/main` before `/build-feature`, recommended), never something this plan or the builder performs. Whether it happens before or after the build, the target state of `main.py` is main's content plus FEAT-1's three lines in the positions stated above, and every conflict hunk resolves by keeping both TEST-06's and FEAT-1's lines in that order. The builder must not remove or reorder the echo lines.
- Merged since the last plan: `backend/tests/unit/test_main_unit.py` (TEST-06 added `test_create_app_registers_echo_route`, placed between `test_create_app_registers_health_route` and `test_create_app_returns_independent_instances`) → **re-scoped to:** add `test_create_app_registers_time_route` **after `test_create_app_registers_echo_route`** and before `test_create_app_returns_independent_instances`, in the same three-line shape (`create_app()`, `_collect_route_paths(app.routes) - BUILT_IN_ROUTE_PATHS`, `assert "/api/time" in custom_paths`) with a docstring "Edge case: the app registers the FEAT-1 server time route." The content is unchanged because main added a sibling test and not this one; the position moved so the file reads in registration order. The same unrebased-branch note applies: on this branch the echo test is absent, so the hunk conflicts with main until reconciled and resolves by keeping both tests.
- Not in the notice, checked anyway: `backend/tests/conftest.py` on main is unchanged by TEST-06 and still provides the session-scoped `client` fixture with no database requirement; `backend/app/routers/echo.py` and `backend/app/schemas/echo.py` are read-only precedents for this plan and are not modified by it.

## Plan Overview
Backend-only feature. Add `GET /api/time` to the FastAPI app following the TEST-06 echo endpoint's shape as it now sits on `origin/main`: a router module holding the one-line handler, a schema module holding the response model and the module-level constant, no service and no repository. The handler reads the clock with `datetime.now(timezone.utc)` on every call; the response is a `ServerTimeResponse` Pydantic model whose `now` field is typed as an aware datetime and serialised with `isoformat()`, so the wire value always carries the explicit `+00:00` offset. No frontend work, no migrations, no new dependencies.

Decisions taken here rather than left as assumptions (the criteria are silent; the tracker comment asked for one of them to be pinned):
1. "Explicit offset" is serialised as `+00:00`, not `Z` (comment point 3; reasoning in `## Re-Plan Feedback`). Pinned in the schema's field serializer, asserted as the exact suffix at both test tiers.
2. Precision is Python's default microsecond `isoformat()` output (`2026-09-14T10:15:30.123456+00:00`). Nothing in the criteria asks for truncation, and microsecond precision is what makes two closely spaced calls distinguishable.
3. `timezone` is a fixed literal `"UTC"`, typed `Literal["UTC"]` in the schema and sourced from the `SERVER_TIMEZONE` constant in the same module: the endpoint never reports another zone, so the type documents that rather than a free string.
4. No service module (comment point 4): a planned, recorded deviation from `coding_standards.md` Section 2.2, matching TEST-06.

The module stem is `server_time` (router `server_time.py`, schema `server_time.py`, unit test `test_server_time_unit.py`, integration test `test_server_time_integration.py`) rather than `time`, so no module in `app/` shadows the standard library's `time`.

## Frontend Plan
No frontend changes required. (The feature exposes a backend endpoint; nothing in the acceptance criteria renders it. Design reference mode is NONE, so the notes line would read `AI freestyle`, and no UI is planned.)

## Backend Plan
- Endpoints: `GET /api/time` (router `app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, matching the echo and version routers' shape). Handler `get_server_time() -> ServerTimeResponse` decorated `@router.get("/time", response_model=ServerTimeResponse)`, returning `ServerTimeResponse(now=datetime.now(timezone.utc), timezone=SERVER_TIMEZONE)`. The module imports `from datetime import datetime, timezone` at module level, so the unit tier can monkeypatch `app.routers.server_time.datetime`. The clock is read inside the handler body on every call and nothing is cached, which is what "computed per request" means here. There is no error path (the system clock always answers), so no exception handling and no logger.
- Service layer: **none, by decision** (tracker comment point 4). Planned deviation from `coding_standards.md` Section 2.2, recorded in `## Re-Plan Feedback` and to be repeated in the build PR description: the pattern's Service layer is for business logic and transactional boundaries, reading a clock is neither, and TEST-06 took the same decision on main. The one line of logic lives in the router handler, as `get_echo` does.
- Repository layer: none. No data access.
- Migrations: none. No schema change.
- Schema: `app/schemas/server_time.py` with `SERVER_TIMEZONE: str = "UTC"` as a module-level constant (declared here for one source, the way `ECHO_MESSAGE_MAX_LENGTH` is in `schemas/echo.py`: the router imports it for the response value and the tests import it for their assertions) and `ServerTimeResponse(BaseModel)`: `now: AwareDatetime` (Pydantic's aware-only type, so a naive datetime is rejected at construction, which is the "never naive" guarantee), `timezone: Literal["UTC"]`, and a `@field_serializer("now")` returning `value.isoformat()` so the JSON carries `+00:00` rather than Pydantic's default `Z`; the serializer's docstring states the `+00:00` decision.
- App factory: `app/main.py` gains `from app.routers.server_time import router as server_time_router` between the `notes` and `version` imports, `app.include_router(server_time_router)` after `app.include_router(echo_router)` as the last registration in `create_app()`, and the docstring clause "TEST-02 the health router, TEST-06 the echo router, and FEAT-1 the server time router." Nothing else in the factory changes and the echo lines are left exactly as main has them.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: none (no parameters, no body)
- Response 200:

  ```json
  {"now": "2026-09-14T10:15:30.123456+00:00", "timezone": "UTC"}
  ```

  `now` is an ISO 8601 timestamp in UTC with the explicit `+00:00` offset (never `Z`, never naive), microsecond precision, read from the clock on every request. `timezone` is always the literal `UTC`.
- Schema: `ServerTimeResponse` in `app/schemas/server_time.py` (`now: AwareDatetime` serialised via `isoformat()`, `timezone: Literal["UTC"]`); the OpenAPI document references it as `#/components/schemas/ServerTimeResponse` for the 200 response.
- Any other method on the path: 405 (FastAPI default, as with `/api/echo`, `/api/version` and `/api/health`).

## Technology Selection
- Current UTC time: chose the standard library's `datetime.now(timezone.utc)` over a date library (`arrow`, `pendulum`, `python-dateutil`, none of which the project installs), because the stdlib returns an aware UTC datetime in one call and nothing here needs parsing, arithmetic or zone conversion.
- Home of the clock read: chose the router handler body plus a schema-module constant (the shape TEST-06 already established on main, and what tracker comment point 4 asks for) over a net-new `app/services/server_time_service.py`, because a service whose only body is one stdlib call adds a module and a layer with nothing to hold; recorded as a planned deviation from `coding_standards.md` Section 2.2 in `## Re-Plan Feedback`.
- Explicit-offset serialisation: chose `datetime.isoformat()` on the aware value (stdlib, emits `+00:00`) over Pydantic's default datetime serialiser (already installed, emits `Z`), because the criterion asks for an explicit offset and `+00:00` is the pinned reading (comment point 3); wired through a Pydantic `field_serializer` rather than formatting in the router, so the format lives with the schema that owns the field.
- Naive-datetime rejection: chose the already-installed Pydantic `AwareDatetime` type over a hand-written `field_validator` checking `tzinfo`, because the type expresses the constraint with no code of its own.
- Fixed timezone label: chose `Literal["UTC"]` (stdlib `typing`, validated by installed Pydantic) over a plain `str` field plus a test asserting its value, because the type makes any other value a validation error rather than a test-time discovery.
- Response schema: Pydantic `BaseModel`, already installed with FastAPI and matching every existing file in `app/schemas/`; no alternative considered necessary.
- Freshness check in tests: chose `time.sleep(1)` (stdlib) for the integration tier's literal "a second apart" assertion, and `monkeypatch` (installed with pytest) of the router module's `datetime` reference for the deterministic unit-tier check, over `freezegun` or `time-machine` (not installed), because two calls and a comparison need no clock-freezing library.
- No net-new dependency is added by this feature, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `SERVER_TIMEZONE = "UTC"` constant and `ServerTimeResponse` (`now: AwareDatetime` with `isoformat()` field serializer pinning `+00:00`, `timezone: Literal["UTC"]`) for `GET /api/time`.
- [B] backend/app/routers/server_time.py: `GET /api/time` router; handler `get_server_time` reads `datetime.now(timezone.utc)` and returns `ServerTimeResponse`, no service, no bare dict.
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the router handler (called directly, `app.routers.server_time.datetime` monkeypatched) and the schema: aware UTC result, two handler calls with a fake advancing clock return distinct `now` values (no caching), naive datetime rejected, `timezone` other than `"UTC"` rejected, serialised string equals `isoformat()` and ends in `+00:00` and not `Z`.
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle via the shared `client` fixture: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` parses with `utcoffset() == timedelta(0)` and ends with `+00:00`, two requests one second apart return strictly increasing `now`, skew within 5 seconds of the test process's own UTC clock, OpenAPI 200 response references `ServerTimeResponse`, 405 on POST.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (a second request never returns the same or an earlier timestamp).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the server time router (between the `notes` and `version` imports) and register it in `create_app()` with one `include_router` line after `app.include_router(echo_router)`, last in the block; extend the module docstring's feature clause with FEAT-1 after TEST-06's. Echo lines untouched.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` after `test_create_app_registers_echo_route`, asserting `/api/time` is in the app's custom route paths, in the shape of the existing version, health and echo assertions.

No dependency manifest changes, so no lockfile is touched (`fastapi`, `pydantic` and `pytest` are already installed and the stdlib covers the rest). Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, and neither document lists the existing API endpoints. The previous plan's `backend/app/services/server_time_service.py` and `backend/tests/unit/test_server_time_service_unit.py` are removed from this manifest (tracker comment point 4); nothing else is dropped.

## Testing Strategy
- Unit tests: `app.routers.server_time.get_server_time` called directly as a function (no HTTP) and `ServerTimeResponse` from `app.schemas.server_time`. Happy path: the handler returns a `ServerTimeResponse` whose `now` is aware, `utcoffset()` is zero and `timezone == SERVER_TIMEZONE == "UTC"`. Edge case: with `app.routers.server_time.datetime` monkeypatched to a fake whose `now(tz)` returns successive distinct aware values, two handler calls return different `now` values (proves no caching, deterministic, no sleep). Error cases: `ServerTimeResponse(now=datetime(2026, 1, 1), timezone="UTC")` raises `pydantic.ValidationError` (naive rejected); `ServerTimeResponse(now=<aware>, timezone="CET")` raises `pydantic.ValidationError` (`Literal` rejected). Offset pin: `model_dump(mode="json")["now"]` for a known aware UTC value equals its `isoformat()`, ends with `+00:00` and does not end with `Z`. Plus the app-factory registration test added to `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_unit.py`, the shared stem of the router and schema modules; route registration goes into the existing `test_main_unit.py`)
- Integration tests: router through the full HTTP request/response cycle using the shared session-scoped `client` fixture from `backend/tests/conftest.py` (no database is needed, so none of the `database_url` fixtures are requested and the tests run wherever the unit tier runs, exactly as `test_echo_integration.py` does). 200 with body keys exactly `{"now", "timezone"}` and `timezone == "UTC"`; `datetime.fromisoformat(body["now"])` succeeds, `.utcoffset() == timedelta(0)`, `.tzinfo is not None`, and the string ends with `+00:00`; freshness: two GETs separated by `time.sleep(1)` return `now` values where the second parses strictly later than the first; skew sanity: `now` is within 5 seconds of the test process's own `datetime.now(timezone.utc)`; OpenAPI: `/openapi.json` shows the `/api/time` GET 200 `$ref` as `#/components/schemas/ServerTimeResponse` with properties `["now", "timezone"]` (the shape of TEST-06's `test_openapi_documents_echo_response_as_the_200_schema`); 405 on POST (the only reachable error case, as for the echo, version and health endpoints).
  - Directory: backend/tests/integration/ (`test_server_time_integration.py`)
- E2E tests: not warranted for this feature. No criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion below: all four are HTTP payload, type and test-coverage properties of a backend endpoint no UI consumes), so no `e2e/tests/FEAT-1_*.spec.ts` is produced and the per-feature edge-case spec obligation does not attach. The `E2E Tests: ENABLED` toggle governs whether the tier may run, not whether every feature gets a spec.
  - Directory: e2e/tests/ (nothing produced here)
  - File: {feature_id}_{slug}.spec.ts (not produced, see above)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (repeated requests are monotonic and never equal), validated for well-formedness, not executed as browser tests. Manual script expanded from `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour over the real HTTP cycle and no UI consumes the endpoint |
| 2 | `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive | Integration (freshness and `+00:00` suffix over HTTP) plus Unit (no-caching with a fake clock via the monkeypatched router `datetime`, naive rejected by the schema, `+00:00` and not `Z` from the serializer) | Verifying it needs no navigation or interaction: two HTTP calls and a parse settle freshness and offset, and the naive-rejection rule is a schema validation rule |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router | Unit plus Integration | Verifying it needs no navigation or interaction: `ServerTimeResponse` is imported from `app.schemas.server_time` and exercised directly at unit level, and the integration tier's OpenAPI `$ref` and exact-keys assertions confirm the router serialises through it |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit and Integration | The criterion is satisfied by the existence and passing of the tests named above; a browser adds nothing to a criterion about the test suite itself |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the response is HTTP 200 with a `now` timestamp and `timezone` equal to "UTC" |
| 2 | `now` is fresh per request, UTC with explicit offset, never naive | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client requests GET /api/time twice one second apart, Then both `now` values end in "+00:00" and the second is later than the first |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client reads GET /openapi.json, Then the `/api/time` 200 response references a `ServerTimeResponse` schema with `now` and `timezone` properties |
| 4 | Unit and integration tests cover shape, offset and freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When `uv run pytest -q` runs, Then the server time unit and integration tests are collected and pass |

## Manual verification plan
### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
This criterion is not verifiable through the UI (no frontend consumes the endpoint); the observable check is the HTTP response itself, read with curl.
Prerequisites: Docker running; the stack up via `docker compose up -d --build` from the repo root; `docker compose ps` shows the `backend` service running on host port `8010` (the mapping `docker-compose.yml` publishes). A terminal with `curl`.
1. In a terminal, run `curl -i http://localhost:8010/api/time` → the first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the response body → a JSON object with exactly two keys, in the shape `{"now":"2026-09-14T10:15:30.123456+00:00","timezone":"UTC"}`: `now` is a full ISO 8601 timestamp with a date, a `T`, a time with fractional seconds and the suffix `+00:00`; `timezone` is exactly `UTC`.
3. Compare the `now` value's hour and minute with the current UTC time (for example `date -u`) → they match to within a few seconds; the value is UTC, not the host's local zone.

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
Not verifiable through the UI; the observable check is two HTTP responses compared.
Prerequisites: criterion 1 just verified, stack still up.
1. Run `curl -s http://localhost:8010/api/time` and note the `now` value → for example `2026-09-14T10:15:30.123456+00:00`.
2. Wait at least one second (count to two, or run `sleep 1`), then run `curl -s http://localhost:8010/api/time` again → the `now` value is different from step 1 and later than it (the seconds field, or the minute, has advanced).
3. Inspect both `now` values → each ends with the literal six characters `+00:00`; neither ends with the letter `Z`, and neither ends with a bare time (a naive value would end in `...30.123456` with nothing after it).

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Not verifiable through the UI; the observable check is the OpenAPI document FastAPI generates from the schema, plus the source files.
Prerequisites: stack still up.
1. Run `curl -s http://localhost:8010/openapi.json` and search the output for `ServerTimeResponse` → the string is present under `components.schemas`, with `properties.now` of type `string` (format `date-time`) and `properties.timezone` with `enum: ["UTC"]`, and the `/api/time` GET's 200 response references `#/components/schemas/ServerTimeResponse`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` → the "Successful Response" schema is named `ServerTimeResponse` and lists `now` and `timezone`.
3. In the repository, open `backend/app/schemas/server_time.py` → it defines `SERVER_TIMEZONE = "UTC"` and `class ServerTimeResponse(BaseModel)` with the two fields and a `field_serializer` for `now`; open `backend/app/routers/server_time.py` → the route declares `response_model=ServerTimeResponse` and returns an instance of it built from `datetime.now(timezone.utc)`, not a dict literal; `backend/app/services/` contains no `server_time_service.py` (the planned deviation from `coding_standards.md` Section 2.2 recorded above).

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
Not verifiable through the UI; the observable check is the test run's own output.
Prerequisites: `uv` installed and the backend dependencies synced (`uv sync` inside `backend/`). No database is needed for these two files.
1. From the `backend/` directory run `uv run pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py -v` → the output lists tests whose names name the aware UTC result, the distinct-successive-calls case, the naive-datetime rejection, the non-UTC `timezone` rejection, the `+00:00` suffix, the 200 shape, the one-second freshness check, the OpenAPI schema reference and the 405 case, and the final line reports all of them passed with 0 failed.
2. From the `backend/` directory run `uv run pytest -q` → the whole backend suite passes, including `tests/unit/test_main_unit.py::test_create_app_registers_time_route` and the pre-existing `test_create_app_registers_echo_route`.
