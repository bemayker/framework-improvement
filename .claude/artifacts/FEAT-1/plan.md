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

All four points below come from one tracker comment ("Re-plan requested before build. Four points, please answer each one explicitly in the revised plan."), recorded as one line per point so each answer is addressable. This is a first plan for this branch and the section is kept deliberately: feedback on the ticket exists before any plan PR does.

No merged-since-plan check applies. This branch was cut from `origin/main` at `ea8a2f2`, so its base *is* current main by construction and there is nothing that could have merged since.

- Comment (tracker): "1. TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py — the same router-registration block FEAT-1 plans to edit. Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: the insertion point was re-derived against `backend/app/main.py` at `ea8a2f2` (current `origin/main`), and **the premise of the point no longer holds**. The sandbox was reset for measured run 4 (`61a424f`, PR #44), which reverted the TEST-06, TEST-07 and TEST-08 merges together with the earlier FEAT-1 merge (PR #36, `ed48ef9`), so **squash `73e544c8` is not on main any more**. What changed since the comment was written is therefore a removal, not an addition. Main as it stands registers exactly three routers in `create_app()`, in this order: `version_router`, `notes_router`, `health_router`, with the matching three imports sorted `health`, `notes`, `version`. FEAT-1 adds a fourth import (`from app.routers.time import router as time_router`, sorted between `notes` and `version`) and a fourth `app.include_router(time_router)` call after `health_router`. Nothing else in `create_app()` moves: the settings read, the CORS middleware and the `lifespan` handler are untouched.
- Comment (tracker): "2. Also add a GET /api/echo?msg={text} endpoint returning {\"echo\": \"<msg>\"} while you are in main.py, so the two registrations land together." → **Not acted on.** `GET /api/echo` is the entire scope of TEST-06 ("Echo endpoint"), an open, ready item in `.claude/feature_map.md` on wave 2 with its own branch `feature/TEST-06-echo-endpoint` — it is not on main, so there is no already-landed registration for this one to land beside. Building it here is the gold-plating `user_story_alignment.md` Section 3 forbids (it is outside every acceptance criterion of FEAT-1), and it would additionally guarantee the `backend/app/main.py` collision `shared_risks.md` exists to prevent, by putting TEST-06's router in two branches at once. The scheduling concern the comment is really about is answered instead by the `shared_risk_notes` cell on this item's map row and by `shared_risks.md`: FEAT-1, TEST-06 and TEST-07 are serialized rather than merged into one item.
- Comment (tracker): "3. The acceptance criterion says \"ISO 8601 UTC with explicit offset\" without spelling the offset. Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: **the offset is pinned to `+00:00`**, not `Z`. Two reasons: `+00:00` is literally an explicit offset where `Z` is a zone designator that stands in for one, which is what the criterion asks for; and it is what `datetime.isoformat()` produces natively for an aware UTC value, so the schema pins it with a one-line pass-through serializer rather than string surgery whose output would drift with a Pydantic version. The choice is stated in the schema as a `@field_serializer("now")` returning `value.astimezone(UTC).isoformat()` (see `## Backend Plan`), so the wire format cannot depend on Pydantic's default datetime encoder. It is covered by an exact-suffix assertion at **both** tiers: `test_time_response_serialises_now_with_explicit_utc_offset` (unit, asserting the full string `2026-01-02T03:04:05+00:00` and that it does not end in `Z`) and `test_get_time_now_ends_with_explicit_utc_offset` (integration, asserting the HTTP body's `now` ends in `+00:00` and parses to a zero `utcoffset()`).
- Comment (tracker): "4. Do not add a service module for this endpoint. Follow the decision taken on TEST-06: coding_standards.md Section 2.2's Router -> Service -> Repository pattern is scoped to business logic and transactional boundaries, and reading a clock is neither. Record it as a planned deviation rather than leaving it silent." → Addressed by: no `backend/app/services/time_service.py` is planned. The handler reads the clock inline (`TimeResponse(now=datetime.now(UTC))`) and the layering deviation is recorded explicitly in `## Backend Plan` → "Service layer", citing `coding_standards.md` Section 2.2 and noting that `version` and `health` keep their service modules because each has real logic to hold (package-metadata resolution with a fallback; a live database probe with a parsed failure target).

## Plan Overview

One read-only backend endpoint, `GET /api/time`, built in the shape the existing `version` and `health` endpoints already use: a router module under `backend/app/routers/`, a Pydantic response schema under `backend/app/schemas/`, and one `app.include_router(...)` line in the application factory. It has no service layer (see the recorded deviation), no repository layer, no database access, no migration and no frontend. Coverage is unit plus integration; no E2E spec is warranted because there is no UI to navigate. The only file this feature shares with another open item is `backend/app/main.py` (and its unit test), which `shared_risks.md` flags against TEST-06 and TEST-07.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` — returns the server's current instant in UTC plus the fixed zone label. No path parameters, no query parameters, no request body, no authentication.
- Router: `backend/app/routers/time.py`, an `APIRouter(prefix="/api", tags=["time"])` with `@router.get("/time", response_model=TimeResponse)`, matching `backend/app/routers/version.py` exactly. The handler is `def get_time() -> TimeResponse: return TimeResponse(now=datetime.now(UTC))`, using `from datetime import UTC, datetime` (Python 3.12's `datetime.UTC` alias). Reading the clock inside the handler is what makes criterion 2's per-request freshness true by construction: there is no module-level constant and no cache.
- Schema: `backend/app/schemas/time.py` defines `TimeResponse(BaseModel)` with two fields. `now: AwareDatetime` — `pydantic.AwareDatetime` rather than a bare `datetime`, so a naive value is a validation error at the type level rather than a silent local-time reading inside `astimezone`; that is the "never naive" half of criterion 2 pinned in the schema. `timezone: Literal["UTC"] = "UTC"` — a literal, so no other value can be constructed and the OpenAPI schema renders it as a constant. A `@field_serializer("now")` returns `value.astimezone(UTC).isoformat()`, which pins the wire format to `+00:00` (point 3 above) independently of Pydantic's default datetime encoder, and normalises any non-UTC aware input to the same instant in UTC.
- Service layer: **none, and this is a planned deviation from `coding_standards.md` Section 2.2** (Router → Service → Repository). That section scopes the service layer to business logic and transactional boundaries; reading the system clock is neither, so a `time_service.py` would be a pass-through module whose only content is the same one-line call. The deviation is confined to this endpoint: `version` and `health` keep their service modules because each holds real logic (package-metadata resolution with a sentinel fallback; a live connectivity probe plus a parsed attempted-target on the failure path). Recorded here so the reviewer grades it against the plan rather than against the pattern.
- Repository layer: none. The endpoint touches no database; `DATABASE_URL` may be unset and the endpoint must still answer, exactly as `GET /api/version` does today.
- Migrations: none. No schema change.
- Registration: `backend/app/main.py` gains one import and one `app.include_router(time_router)` call in `create_app()`, after `health_router` (see the Re-Plan Feedback answer to point 1 for the derivation against current main). The module docstring's per-feature sentence is extended with FEAT-1, matching the convention already in that file.
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
- Errors: `405 Method Not Allowed` for any verb other than GET. There is no 4xx validation path (the endpoint accepts no input) and no 5xx path of its own.

## Technology Selection
- Current-instant source (`datetime.now(UTC)`): chose the Python standard library's `datetime` module over adding a date/time dependency such as `pendulum` or `arrow`, because the stdlib already returns a timezone-aware UTC value and its `isoformat()` already emits the exact `+00:00` wire format criterion 1 requires — a dependency would add an install for a single call.
- Response schema (`TimeResponse`): chose `pydantic.BaseModel` with `AwareDatetime` and a `field_serializer`, a dependency this project already installs (FastAPI depends on it, and `backend/app/schemas/version.py` and `health.py` already use it), over hand-building the response dict in the router. Criterion 3 requires the schema, and `AwareDatetime` is what makes "never naive" a type error instead of a test-only assertion.
- Router (`APIRouter`): chose `fastapi.APIRouter`, already installed and already the pattern in `backend/app/routers/version.py` and `health.py`, over a bare `@app.get` on the factory; no alternative was considered because the project's own convention settles it.
- No net-new dependency is introduced, so `backend/pyproject.toml` is unchanged and no lockfile is regenerated.
- No net-new service, repository or utility module is introduced: the one candidate (a `time_service.py`) is deliberately not built, per the recorded Section 2.2 deviation above.

## File Manifest
### New files
- [B] backend/app/routers/time.py: `APIRouter(prefix="/api", tags=["time"])` with the `GET /time` handler returning `TimeResponse(now=datetime.now(UTC))`
- [B] backend/app/schemas/time.py: `TimeResponse` — `now: AwareDatetime` with a `field_serializer` pinning `+00:00`, and `timezone: Literal["UTC"] = "UTC"`
- [B] backend/tests/unit/test_time_unit.py: unit cases for the handler and the schema (freshness, UTC awareness, exact `+00:00` suffix, non-UTC normalisation, naive rejection)
- [B] backend/tests/integration/test_time_integration.py: full HTTP cycle for `GET /api/time` (200 shape, offset suffix, per-request freshness, 405 on POST)
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge scenario
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below
- [G] .claude/artifacts/FEAT-1/uat_script.md: the artifact-directory copy of that manual script (build-feature Section 14 step 3)

### New-file note: one unit test file covers two modules. The unit naming convention is `test_{module}_unit.py`, and this feature's router and schema modules are both named `time`; a single `test_time_unit.py` is therefore the convention's own answer, and splitting it would need a name the convention does not provide.

### Modified files
- [B] backend/app/main.py: add `from app.routers.time import router as time_router` (sorted between the `notes` and `version` imports) and `app.include_router(time_router)` in `create_app()` after `health_router`; extend the module docstring's per-feature sentence with FEAT-1
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route`, asserting `/api/time` is among the app's custom routes, matching the existing version and health cases

No dependency manifest changes, so no lockfile entry: `backend/pyproject.toml` is untouched and nothing regenerates `uv.lock`. `README.md` and `docs/DEVELOPMENT.md` need no edit either, so no `[Docs]` entries: this feature changes no project structure, no run configuration, no dependency and no test infrastructure, and neither document carries an endpoint list that a new route would have to join (`README.md` names the three compose services and the repository tree; `docs/DEVELOPMENT.md` documents the framework and the test commands, both unchanged).

## Testing Strategy
- Unit tests: the router handler in `backend/app/routers/time.py` (reads the clock on every call; returns a timezone-aware UTC value) and the `TimeResponse` schema in `backend/app/schemas/time.py` (exact `+00:00` suffix, non-UTC aware input normalised to UTC, naive input rejected). Per-request freshness is proved deterministically with a monkeypatched clock returning two distinct values, so the case does not depend on clock resolution. One added case in `test_main_unit.py` covers the router registration.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` → `test_time_unit.py`
- Integration tests: the full HTTP request/response cycle for `GET /api/time` through the session-scoped `client` fixture in `backend/tests/conftest.py` — 200 with exactly the two contractual keys, the `now` suffix at the HTTP boundary, two requests returning different and increasing values, and `POST /api/time` returning 405 as the one reachable error case. **No backing service is needed**: this endpoint touches no database, so these tests use neither `database_url` nor `db_connection` and the PostgreSQL recipe in `CLAUDE.md` → Backing Services is not exercised by this item (it is still provisioned for the rest of the suite).
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
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict | Unit | Verifying it needs no navigation or interaction: it is a structural property of the schema module — the serializer's exact output and the router's `response_model` are both asserted by importing them |
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

Prerequisites for every block: the repository is checked out on this branch with the feature built, the stack is up (`docker compose up -d` from the repository root), and `docker compose ps` shows `db`, `backend` and `frontend` running. The backend answers on `http://localhost:8010`. No login, no seed data and no toggle is needed — the endpoint is public and reads only the clock.

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
1. In a terminal at the repository root, run `curl -i http://localhost:8010/api/time` → the first response line is `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the body on the last line of that output → it is a single JSON object with exactly two keys, for example `{"now":"2026-09-16T09:41:07.512834+00:00","timezone":"UTC"}`. There is no envelope, no `data` wrapper and no third key.
3. Read the `timezone` value → it is exactly the string `UTC`.
4. Open `http://localhost:8010/api/time` in a browser tab → the same two-key JSON object is displayed, confirming the endpoint is reachable without a client that sets special headers.

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
1. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_time_unit.py tests/integration/test_time_integration.py` → the run finishes with `0 failed` and no test is reported as skipped.
2. Re-run it with the names shown: `uv run --directory backend pytest -v tests/unit/test_time_unit.py tests/integration/test_time_integration.py` → the listed test names include one asserting the exact `+00:00` suffix, one asserting two consecutive calls return different values, and one asserting the 200 response's two-key shape, each reported as `PASSED`.
3. From the repository root, run the project's full gate command `uv run --directory backend pytest -q && npm --prefix frontend test` → both suites pass, confirming the new tests did not break an existing one (in particular the version and health route-registration cases in `tests/unit/test_main_unit.py`).
