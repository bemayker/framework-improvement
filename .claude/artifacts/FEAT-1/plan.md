# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> A small backend feature created 2026-09-07 for **measured run 3, Arm D (the re-plan and merged-since-check arm, MDF-008 and MDF-010)**. It exists to **overlap** a commit that will land on `main` during the run, not to be independent of it: it registers a router in `backend/app/main.py`, the file TEST-06 and TEST-07 also change. That overlap is the whole point.
>
> ### What
> `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> ### Acceptance criteria
> 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> 4. Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> ### Notes
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The item also carries a section "How the measured run uses this item (operator instructions, not part of the feature)". It is operator procedure, not acceptance criteria, and is deliberately not planned against.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.

## Re-Plan Feedback
- Comment (tracker), point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." -> Addressed by: re-checked against main at `374e468`, which is a *later* landing of TEST-06 than the squash the comment names (`73e544c8` was reverted by `be81cdf` and re-landed as PR #55), so main now carries TEST-06 exactly once. What changed in `backend/app/main.py` since this item was written: the module docstring's closing sentence now ends "and TEST-06 the echo router"; `from app.routers.echo import router as echo_router` sits at the head of the router import block; and `app.include_router(echo_router)` is the **last** of four registrations in `create_app()` (version, notes, health, echo). The insertion point is therefore not the one this item was described against. FEAT-1's import goes **after** `from app.routers.notes import ...` and **before** `from app.routers.version import ...` (the block is alphabetical: echo, health, notes, time, version), and `app.include_router(time_router)` is appended as a fifth line after the `echo_router` registration. Nothing else in the factory moves: no change to `lifespan`, to the CORS middleware or to `get_settings()`. `backend/tests/unit/test_main_unit.py` has likewise grown `test_create_app_registers_echo_route`, so FEAT-1's registration assertion is appended after it rather than written into a file that has no such precedent.
- Comment (tracker), point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." -> **Not acted on, because that work is already on main and re-doing it would be duplicate work.** Verified in this checkout at `374e468`: `backend/app/routers/echo.py` declares `GET /api/echo` with `msg: Annotated[str, Query(max_length=200)]`, `backend/app/schemas/echo.py` declares `EchoResponse(echo: str)`, `backend/app/main.py` already registers `echo_router`, and `backend/tests/unit/test_echo_unit.py` plus `backend/tests/integration/test_echo_integration.py` cover it. The comment was written while TEST-06 was unmerged; adding a second `/api/echo` now would either collide with the existing route or force an edit of a merged feature's files under a different work item's ID. This plan's File Manifest therefore names no echo file, and the only `backend/app/main.py` change it contracts for is the FEAT-1 registration.
- Comment (tracker), point 3: "The acceptance criterion says "ISO 8601 UTC with explicit offset" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." -> Addressed by: **pinning `+00:00`**, not `Z`. It is what `datetime.isoformat()` produces for a UTC-aware value with no string post-processing, and the alternative would need a substitution this endpoint has no other reason to carry. The choice is stated **in the schema** rather than in the router: `TimeResponse` declares an explicit `@field_serializer("now")` returning `value.isoformat()`, which makes the rendered suffix a property of the schema instead of a property of Pydantic's default datetime serializer (that default renders a zero offset as `Z`, so leaving it implicit would silently contradict the pin). Covered by `test_time_integration.py` asserting `response.json()["now"].endswith("+00:00")` and by `test_time_unit.py` asserting the same suffix on `TimeResponse(...).model_dump(mode="json")["now"]` — the exact suffix at both tiers, not a generic "is parseable" check.
- Comment (tracker), point 4: "Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." -> Addressed by: accepted, and recorded as a **planned deviation** under `## Backend Plan` -> Service layer. No `backend/app/services/time_service.py` appears in the File Manifest. The precedent the comment names is visible in this checkout: `backend/app/routers/echo.py` (TEST-06) has no service module while `backend/app/routers/version.py` (TEST-05) does, and the discriminator between them is exactly whether there is business logic to hold. `datetime.now(timezone.utc)` is a single stdlib call with no branching, no persistence and no transaction, so a service module here would be an indirection with nothing in it.

## Plan Overview
One backend endpoint, `GET /api/time`, built on the router-plus-schema shape TEST-06 established: a two-field Pydantic response schema in `backend/app/schemas/time.py`, a four-line router in `backend/app/routers/time.py`, and one import plus one `include_router` line in `backend/app/main.py`. No service layer (planned deviation, see Backend Plan), no repository, no database, no migration, no frontend and no external API. Covered by unit tests over the schema and the route's declared contract, and by integration tests over the full HTTP cycle through the existing session-scoped `client` fixture. No E2E spec: the feature adds no UI surface for a browser to navigate to.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` — returns the server's current instant in UTC, so a client can compare it against its own clock. Declared on an `APIRouter(prefix="/api", tags=["time"])` in `backend/app/routers/time.py` with `response_model=TimeResponse`, matching `backend/app/routers/echo.py` and `backend/app/routers/version.py`. The handler body is one line: `return TimeResponse(now=datetime.now(timezone.utc))`.
- Service layer: **none, and this is a recorded deviation from `coding_standards.md` Section 2.2** (Router -> Service -> Repository). That section scopes the Service layer to business logic and to transactional boundaries; this endpoint has neither — one stdlib call, no branching, no persistence, no transaction — so a `time_service.py` would be an empty indirection. It follows the decision already taken on TEST-06, whose `backend/app/routers/echo.py` has no service module, and it is the same discriminator that gives TEST-05's `/api/version` one (it resolves an installed distribution's version and can fail) and denies this one. Requested explicitly by tracker comment point 4 and recorded here rather than left silent, per `user_story_alignment.md` Section 6.
- Repository layer: none. The endpoint touches no database. The `database_url`, `db_connection` and `notes_table` fixtures in `backend/tests/conftest.py` are used by no test this plan adds, exactly as `test_echo_integration.py` uses none of them, and the endpoint must answer with `DATABASE_URL` unset (the `lifespan` hook already logs a warning and continues in that case).
- Migrations: none. No schema change.
- Response schema: `backend/app/schemas/time.py` declares `TimeResponse` with two fields and one serializer. `now: datetime` carries a timezone-aware value, and an explicit `@field_serializer("now")` returns `value.isoformat()`, which renders the pinned `+00:00` offset (see Technology Selection). `timezone: Literal["UTC"] = "UTC"` pins criterion 1's constant in the type rather than in a router-side string literal, so the only value the field can hold is the one the criterion names.
- Module naming: `time.py` under both `app/routers/` and `app/schemas/`, matching the `{resource}.py` convention every sibling follows (`echo.py` -> `/api/echo`, `version.py` -> `/api/version`, `health.py` -> `/api/health`). It does not shadow the stdlib `time` module: Python 3 imports are absolute, so `app.routers.time` is reachable only by its dotted path and a stdlib `import time` anywhere in the tree still resolves to the stdlib.
- Registration in `backend/app/main.py`: `from app.routers.time import router as time_router` goes between the `notes` and `version` imports (the block is alphabetical), and `app.include_router(time_router)` is appended after the `echo_router` registration in `create_app()`. The module docstring's router enumeration gains FEAT-1's time router. Nothing else in the factory changes.

## API Integration Plan
No external API integration.

## API Contract
- Method: `GET`
- URL: `/api/time`
- Request: no path parameters, no query parameters, no body, no authentication.
- Response: `200 OK`, `application/json`, body shaped by `TimeResponse`:

```json
{
  "now": "2026-09-20T14:32:07.481923+00:00",
  "timezone": "UTC"
}
```

`now` is an ISO 8601 timestamp produced by `datetime.isoformat()` on a timezone-aware UTC value, so the offset is always the literal suffix `+00:00`, never `Z` and never absent. Microseconds are present whenever the clock reports them, which `isoformat()` does by default; nothing truncates or rounds them, and that resolution is what makes criterion 2's per-request freshness observable without a sleep. `timezone` is always the literal string `UTC`. The endpoint has no error responses of its own: it takes no input to reject, so there is no 400/422 path and no 404 path.

## Technology Selection
- Current-instant computation: chose the standard library's `datetime.now(timezone.utc)` over any date/time dependency (`pendulum`, `arrow`, `python-dateutil`), because rung 1 of the ladder covers it completely — one call returns a timezone-aware UTC value, and nothing in the criteria needs parsing, arithmetic or formatting beyond it.
- ISO 8601 rendering with the pinned `+00:00` offset: chose the standard library's `datetime.isoformat()`, declared through a Pydantic `@field_serializer` on `TimeResponse.now`, over (a) a hand-rolled `strftime("%Y-%m-%dT%H:%M:%S.%f%z")` format string, which would have to re-insert the colon in the offset by hand, and over (b) Pydantic's default datetime JSON serializer, which is already installed and would need no code at all. (b) is the rung this would otherwise have stopped at, and it is rejected on a stated reason rather than on taste: its core serializer renders a zero UTC offset as `Z`, which contradicts the `+00:00` that tracker comment point 3 pinned, so relying on it would make the response shape a property of a dependency's internals instead of a property of this schema.
- Response body model: chose Pydantic `BaseModel`, a dependency this project already installs through FastAPI, over a bare `dict` return. Criterion 3 mandates the schema, and this is rung 3 of the ladder rather than a new dependency.
- Router: chose FastAPI's `APIRouter`, already installed and already the shape of all four existing routers, over any new routing abstraction.
- Per-request freshness test: chose two real calls plus a strict comparison of the two parsed instants over adding a clock-freezing dependency (`freezegun`, `time-machine`). No new dependency, and freezing the clock would test the opposite of what criterion 2 asks — that the value moves.
- New dependency: none. `backend/pyproject.toml` is unchanged and no lockfile is regenerated.

## File Manifest
### New files
- [B] backend/app/schemas/time.py: `TimeResponse` Pydantic model — `now: datetime` with an explicit `@field_serializer("now")` returning `value.isoformat()` (the pinned `+00:00` offset), and `timezone: Literal["UTC"] = "UTC"`. The response body criterion 3 mandates.
- [B] backend/app/routers/time.py: `APIRouter(prefix="/api", tags=["time"])` with `GET /time`, `response_model=TimeResponse`, and a one-line body returning `TimeResponse(now=datetime.now(timezone.utc))`. No service module (recorded deviation, see Backend Plan).
- [B] backend/tests/unit/test_time_unit.py: unit tests for the `TimeResponse` schema (an aware value serializes with the exact `+00:00` suffix; `timezone` defaults to `UTC` and rejects anything else; a missing `now` raises) and for the route's declared contract read off `create_app()` (the `/api/time` route's `response_model` is `TimeResponse`), plus the router function called twice returning two different aware instants.
- [B] backend/tests/integration/test_time_integration.py: integration tests over the full HTTP cycle — 200 with exactly the two keys, the exact `+00:00` suffix, a parsed `tzinfo` with a zero offset, two sequential calls returning strictly increasing instants, and one call that answers with `DATABASE_URL` unset.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge-case scenario (two consecutive reads differ).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: the human-readable manual UAT script, expanded from this plan's `## Manual verification plan` with checkboxes, prerequisites and the summary table.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact-directory copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: add `from app.routers.time import router as time_router` between the `notes` and `version` imports, append `app.include_router(time_router)` after the `echo_router` registration in `create_app()`, and extend the module docstring's router enumeration with FEAT-1. Nothing else in the factory changes.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route`, appended after `test_create_app_registers_echo_route` and matching the per-router registration assertions TEST-02, TEST-05 and TEST-06 already added to this file.

No dependency change: this feature adds no package to `backend/pyproject.toml`, so no lockfile is regenerated and no lockfile entry appears above.

No documentation change: build-feature Section 15's condition is not met. The feature adds one endpoint on the existing router pattern and changes no project structure, no run configuration, no dependency and no test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: the `TimeResponse` schema and the route's declared contract. Happy path: `TimeResponse(now=datetime(2026, 1, 2, 3, 4, 5, 678901, tzinfo=timezone.utc)).model_dump(mode="json")` equals `{"now": "2026-01-02T03:04:05.678901+00:00", "timezone": "UTC"}` — the exact `+00:00` suffix tracker comment point 3 asked to pin, asserted on a fixed input so the assertion is deterministic. Edge case: `timezone` accepts nothing but `UTC` (the `Literal` rejects `CET` with a `ValidationError`), and an aware value in a non-zero offset (`timezone(timedelta(hours=2))`) serializes with that instant's own offset rather than being silently relabelled — which is why the router, not the schema, is what guarantees UTC. Error case: `TimeResponse()` with no `now` raises `ValidationError`. Plus the route contract read off the app `create_app()` builds, in the shape `test_echo_unit.py` already uses (recursing through the `include_router` wrapper's `original_router`): the `/api/time` route's `response_model` is `TimeResponse`, which is criterion 3's "defined by a Pydantic schema, not a bare dict" stated as an assertion no status code could distinguish. And the router function called twice directly returns two different `now` values, each with `tzinfo` not `None` and a zero `utcoffset()` — criterion 2's "computed per request, never naive" at the cheapest possible tier.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` -> `test_time_unit.py`
- Integration tests: the full HTTP request/response cycle through the session-scoped `client` fixture in `backend/tests/conftest.py`. `GET /api/time` returns 200; the body has exactly the keys `now` and `timezone`; `body["timezone"] == "UTC"`; `body["now"].endswith("+00:00")`; `datetime.fromisoformat(body["now"])` has a non-`None` `tzinfo` with a zero offset (criterion 2's "never naive" over the wire, where a naive value would parse fine and carry no offset). Freshness: two sequential `GET /api/time` calls, both parsed, asserting the second is **strictly greater** than the first. No `sleep(1)`: `isoformat()` carries microseconds and a full TestClient round trip is many orders of magnitude longer than one microsecond, so the assertion is as strong without adding a real second to every suite run. Finally one test asserting the endpoint answers with `DATABASE_URL` unset (`monkeypatch.delenv`, a fresh `create_app()`), matching `test_echo_integration.py` — this endpoint needs no database and must not start depending on one. No database fixture is used.
  - Directory: `backend/tests/integration/`
  - Naming: `test_{module}_integration.py` -> `test_time_integration.py`
- E2E tests: none for this feature. `E2E Tests` is ENABLED project-wide and stays enabled; the tier is scoped to the criteria whose covering tier is E2E (`testing_standards.md` Section 4's E2E row read with Section 6), and this feature has none — it adds no route, no component and no interactive element to the frontend, so there is nothing a browser could navigate to or interact with. No spec file is produced under `e2e/tests/`. This matches TEST-02, TEST-05 and TEST-06, the three backend-only items already merged, none of which has a spec there.
  - Directory: `e2e/tests/` (unused by this feature)
  - File: `{feature_id}_{slug}.spec.ts` (not produced)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (two consecutive reads return different instants), validated for well-formedness by CI rather than executed.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour over the HTTP request/response cycle, and no UI renders this endpoint. |
| 2 | `now` is computed per request, UTC with an explicit offset, never naive | Integration | Verifying it needs no navigation or interaction: it is two HTTP reads compared to each other plus a suffix and `tzinfo` assertion on the body. The unit tier additionally covers it by calling the router function twice directly. |
| 3 | The response body is defined by a Pydantic schema, not a bare dict | Unit | Verifying it needs no navigation or interaction, and no HTTP call either: the route's declared `response_model` is read off the app `create_app()` builds. A hand-rolled dict would produce a byte-identical HTTP response, so this is the only tier that can tell the two apart. |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Unit + Integration | Verifying it needs no navigation or interaction: it is satisfied by the existence and passing of the tests named in rows 1 to 3 — the shape at both tiers, the exact `+00:00` suffix at both tiers, and the freshness at both tiers. It is a statement about the test suite, so no browser could observe it at all. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone` | Covered at Integration, see Criterion coverage | Given the API is running, When a client requests `GET /api/time`, Then the response is 200 and its body carries a `now` timestamp and `timezone` equal to `UTC`. |
| 2 | `now` is computed per request, UTC with an explicit offset, never naive | Covered at Integration, see Criterion coverage | Given the API is running, When a client requests `GET /api/time` twice a second apart, Then the two `now` values differ and each ends with the offset `+00:00`. |
| 3 | The response body is defined by a Pydantic schema, not a bare dict | Covered at Unit, see Criterion coverage | Given the API is running, When a client fetches the OpenAPI document, Then `GET /api/time` declares a `TimeResponse` schema with the fields `now` and `timezone`. |
| 4 | Unit and integration tests cover the shape, the offset and the per-request freshness | Covered at Unit and Integration, see Criterion coverage | Given the repository at this branch, When the backend test suite runs, Then `test_time_unit.py` and `test_time_integration.py` both pass and assert the shape, the `+00:00` suffix and the per-request freshness. |

## Manual verification plan
This feature adds no UI. All four criteria are verified against the running API rather than through a screen, so each block below gives the observable check — the exact command and the exact expected output — instead of a click path.

### Criterion 1: GET /api/time returns 200 with an ISO 8601 UTC `now` and `timezone` equal to UTC
Prerequisites: the backend is running and reachable at `http://localhost:8010` (`docker compose up -d` from the repository root, or `uv run --directory backend uvicorn app.main:app --port 8010`). No database is needed for this endpoint, no seed data is needed, and the endpoint is unauthenticated so no sign-in is required.
1. In a terminal, run `curl -i http://localhost:8010/api/time` -> the first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the body printed under the headers -> it is a single JSON object with exactly two keys, `now` and `timezone`, for example `now` = `2026-09-20T14:32:07.481923+00:00` and `timezone` = `UTC`. There is no third key and no wrapper object.
3. Read the value of `timezone` in that body -> it is the string `UTC`, in those three capital letters.

### Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive
Prerequisites: as criterion 1, plus a second terminal showing the current UTC time (`date -u`).
1. Run `curl -s http://localhost:8010/api/time` and write down the `now` value, for example `2026-09-20T14:32:07.481923+00:00`.
2. Wait one second, then run `curl -s http://localhost:8010/api/time` again and write down the second `now` value -> it is a **later** timestamp than the first, differing by roughly one second. Two identical values would mean the timestamp was computed once at import and cached, which is the failure this step exists to catch.
3. Read the last six characters of either `now` value -> they are exactly `+00:00`. Not `Z`, and not absent. A value ending in the seconds digits with no offset at all is naive and is a failure.
4. Compare either `now` value against `date -u` in the second terminal -> the two agree to within a few seconds. A value that is hours off means the server built the string from local time and labelled it UTC.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
Prerequisites: as criterion 1.
1. Open `http://localhost:8010/docs` in a browser -> the FastAPI interactive documentation page loads and lists a `time` tag.
2. Expand `GET /api/time` under that tag and open its "Successful Response" example -> the schema is named `TimeResponse` and shows the two fields `now` (string, date-time) and `timezone` (string, with the single allowed value `UTC`). A handler returning a bare dict would show an empty or generic schema here, which is the difference this step reads.
3. Open `backend/app/schemas/time.py` in an editor -> it declares `class TimeResponse(BaseModel)` with those two fields, and `backend/app/routers/time.py` returns `TimeResponse(...)` rather than a dict literal.

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
This criterion is about the test suite rather than about a running screen, so the observable check is the suite's own output.
1. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_time_unit.py tests/integration/test_time_integration.py` -> the summary line reports every test passed and zero failed. A `no tests ran` or `collected 0 items` line means the files are missing or misnamed, and is a failure.
2. Run `uv run --directory backend pytest -q` for the whole backend suite -> the summary line reports zero failures, confirming the new router registration broke neither `test_main_unit.py` nor any merged feature's tests.
3. Open `backend/tests/integration/test_time_integration.py` -> it contains an assertion on the literal suffix `+00:00` and a test that issues two requests and compares the two parsed instants. Both must be present: a suite that only checked the status code would pass while criteria 1 and 2 were unmet.
