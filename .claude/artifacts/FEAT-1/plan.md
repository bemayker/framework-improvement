# Implementation Plan, FEAT-1: Server time endpoint

## Feature
> **What.** `GET /api/time` reports the server's current time, so a client can detect clock skew against the API without a second service.
>
> **Acceptance criteria.**
> * `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
> * `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
> * The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
> * Unit and integration tests cover the shape, the offset and the per-request freshness.
>
> **Notes.** Router under `backend/app/routers/`, registered in `backend/app/main.py`, following the TEST-06 shape. It touches `main.py`'s router registration, so it must not be built concurrently with another backend item that does the same.
>
> (The item's description also carries a measurement-run preamble and a "How the measured run uses this item" block. Both are operator instructions, not feature scope, and nothing in this plan is derived from them.)

## Acceptance Criteria
- [ ] 1. `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`.
- [ ] 2. `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
- [ ] 4. Unit and integration tests cover the shape, the offset and the per-request freshness.
- [ ] 5. (Added by tracker comment, point 2) `GET /api/echo?msg={text}` returns 200 with `{"echo": "<msg>"}`, registered in `backend/app/main.py` together with the time router.

## Re-Plan Feedback
- Comment (tracker), Florian Serneels, 2026-09-14, point 1: "TEST-06 has merged to main (squash 73e544c8, PR #35) and its diff touches backend/app/main.py ... Re-check the insertion point against main as it now stands, and say what changed." → Addressed by: re-checked against `origin/main` at 921f7a5 (this branch's base). 73e544c8 is an ancestor of main, but the later sandbox resets (c5a6e64, 70600df) removed its code: `backend/app/routers/` on main holds only `health.py`, `notes.py` and `version.py`, there is no `echo.py` router or `echo.py` schema, and `main.py` imports `health_router`, `notes_router`, `version_router` and registers them in the order version, notes, health. What changed versus the previous plans: the echo lines those plans slotted around do not exist. Insertion point now: the `from app.routers.server_time import router as server_time_router` import goes between the `notes` and `version` imports (alphabetical, matching the existing block), `app.include_router(server_time_router)` goes after `app.include_router(health_router)` as the last registration, and a FEAT-1 clause is appended to the module docstring after the TEST-02 clause. No existing line in `main.py` is edited or reordered.
- Comment (tracker), Florian Serneels, 2026-09-14, point 2: "Also add a GET /api/echo?msg={text} endpoint returning {"echo": "<msg>"} while you are in main.py, so the two registrations land together." → Addressed by: acted on, as acceptance criterion 5. The newer autonomous-run comment refused this point because the echo endpoint was already on main; that premise is no longer true (point 1), so the stakeholder's request stands and a comment overrides the description where they disagree. Planned as `backend/app/routers/echo.py` plus `backend/app/schemas/echo.py`, registered after the time router. Assumptions, recorded rather than asked: `msg` is a required query parameter (missing gives FastAPI's 422), it is returned verbatim with no trimming or other transformation, and no length limit is added. Trimming is deliberately not decided here: TEST-11 (trim) and BUG-05 (keep) specify opposite whitespace behaviour on this endpoint and both depend on TEST-06, so that contradiction stays theirs to resolve.
- Comment (tracker), Florian Serneels, 2026-09-14, point 3: "Pin it now rather than leaving it an assumption: decide between +00:00 and Z, state the choice in the Pydantic schema, and cover it with a test that asserts the exact suffix." → Addressed by: pinned to `+00:00`, the literal reading of "explicit offset". The schema types `now` as Pydantic `AwareDatetime` (a naive value fails validation) and carries a `field_serializer` on `now` that converts to UTC and emits `isoformat()`, because Pydantic's default JSON serialisation of a UTC datetime emits `Z`. Unit tests assert the serialised value ends with `+00:00` and does not end with `Z`; the integration test asserts the same suffix on the live response body plus `utcoffset() == timedelta(0)` on the parsed value.
- Comment (tracker), Florian Serneels, 2026-09-14, point 4: "Do not add a service module for this endpoint ... Record it as a planned deviation rather than leaving it silent." → Addressed by: no service module. Planned deviation from `coding_standards.md` Section 2.2 (Router, Service, Repository; "NO business logic" in the router): reading the clock has no business rule, no persistence and no transaction, so the router obtains it through a FastAPI dependency (`utc_now`, defined in the router module) and builds the schema. Section 2.2 names dependency injection as a router responsibility, which is why the clock is a dependency rather than an inline call. The echo endpoint follows the same shape (no service). Residual, stated: `version` and `health` keep their service modules, so two shapes for dependency-free GET endpoints coexist; this plan changes neither. The deviation is to be repeated in the PR description.
- Comment (tracker), mayker-dev autonomous run deliver-20260914T095103Z, 2026-09-14 (newest): its answer to the four points → not acted on as written, because its points 1 and 2 rest on echo code that a later sandbox reset removed from main (see point 1). Its point 3 (`+00:00` in a `field_serializer`, exact-suffix assertions at both tiers) and point 4 (no service, deviation recorded) are carried over unchanged. Its handover note (port 5442 already allocated) is an environment observation from that run and asks for nothing in this plan.
- Comment (tracker), 17 framework notices "Plan PR opened for FEAT-1: {url} ..." (PRs 36, 48, 50, 56, 64, 91, 145, 169, 184, 192, 214, 217, 224, 272, 318, 345 twice) → not acted on because they are link notices from earlier plan runs and ask for nothing.
- Merged since the last plan: n/a (fresh plan, branched from current main at 921f7a5; no `[merged-since]` lines were supplied).

## Plan Overview
Backend only. Two small read-only GET endpoints, each a router plus a Pydantic response schema, both registered at the end of `create_app()` in `backend/app/main.py`:

1. `GET /api/time`: router `server_time.py` with a `utc_now` clock dependency, schema `ServerTimeResponse` that pins the offset to `+00:00`.
2. `GET /api/echo?msg=...`: router `echo.py`, schema `EchoResponse`, returning `msg` verbatim (tracker comment point 2).

No service, repository, migration, frontend change, external API or new dependency. Tests: unit (schema serialisation, handler with an injected clock, route registration) and integration (live HTTP cycle). No criterion needs the browser, so no E2E spec; UAT artifacts per the mandated set.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints:
  - `GET /api/time`: returns `ServerTimeResponse(now=<clock value>, timezone="UTC")`. The clock is `utc_now() -> datetime`, returning `datetime.now(timezone.utc)`, injected with `Depends(utc_now)` so it is evaluated per request and replaceable in tests via `app.dependency_overrides`.
  - `GET /api/echo`: required query parameter `msg: str`; returns `EchoResponse(echo=msg)` unchanged.
  - Both routers use `APIRouter(prefix="/api", tags=[...])` and `response_model=...`, matching `version.py`.
- Schemas:
  - `backend/app/schemas/server_time.py`: `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` and `timezone: Literal["UTC"]`, plus `@field_serializer("now")` returning `value.astimezone(timezone.utc).isoformat()` so the wire value always ends `+00:00`.
  - `backend/app/schemas/echo.py`: `EchoResponse(BaseModel)` with `echo: str`.
- `backend/app/main.py`: add the two imports alphabetically (`echo` before `health`, `server_time` between `notes` and `version`), append `app.include_router(server_time_router)` then `app.include_router(echo_router)` after `health_router`, and append a docstring clause: "FEAT-1 the server time router and the echo router." Nothing else in the file changes.
- Service layer: none, by planned deviation (Re-Plan Feedback point 4).
- Repository layer: none (no persistence).
- Migrations: none.
- Error handling: no custom exceptions are needed. A missing `msg` returns FastAPI's standard 422 validation body; a non-GET method returns 405.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no parameters, no body.
- Response: 200, `application/json`

```json
{"now": "2026-10-29T16:53:08.123456+00:00", "timezone": "UTC"}
```

`now` is ISO 8601, always in UTC, always with the literal `+00:00` suffix (never `Z`, never naive); microseconds are present when non-zero, as `isoformat()` emits them. Other methods: 405.

- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg` (string, required), e.g. `/api/echo?msg=hello%20world`
- Response: 200, `application/json`

```json
{"echo": "hello world"}
```

Missing `msg`: 422 with FastAPI's standard validation body. Other methods: 405.

## Technology Selection
- Server clock (`utc_now`): chose the standard library `datetime.now(timezone.utc)` over any time library, because the stdlib returns an aware UTC value directly.
- Naive-datetime guard: chose Pydantic's `AwareDatetime` (installed with FastAPI) over a hand-written validator, because it rejects a naive value with no custom code.
- `+00:00` serialisation: chose a Pydantic `field_serializer` calling stdlib `isoformat()` over a custom JSON encoder or response class, because Pydantic's default emits `Z` and the serializer is the smallest place the choice can live inside the schema, as point 3 asks.
- Response schemas (`ServerTimeResponse`, `EchoResponse`): chose Pydantic `BaseModel` (installed with FastAPI) over a bare dict, as criterion 3 requires.
- Routers: chose FastAPI `APIRouter` (installed) with `Depends` for the clock; no alternative needed.
- New dependencies: none. No stdlib call, native feature or installed dependency was passed over for a new one.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` with `AwareDatetime` `now`, `Literal["UTC"]` `timezone`, and the `+00:00` `field_serializer`.
- [B] backend/app/routers/server_time.py: `utc_now` clock dependency and the `GET /api/time` handler.
- [B] backend/app/schemas/echo.py: `EchoResponse` with `echo: str`.
- [B] backend/app/routers/echo.py: `GET /api/echo` handler with required `msg` query parameter.
- [B] backend/tests/unit/test_server_time_unit.py: schema suffix, naive rejection, non-UTC normalisation, handler freshness with an injected clock.
- [B] backend/tests/integration/test_server_time_integration.py: live 200 shape, offset suffix and `utcoffset`, two calls a second apart differ, POST 405.
- [B] backend/tests/integration/test_echo_integration.py: live 200 `{"echo": ...}` verbatim, missing `msg` 422, POST 405.
- [G] e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/FEAT-1/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: two router imports, two `include_router` calls after `health_router`, docstring clause.
- [B] backend/tests/unit/test_main_unit.py: two tests asserting `/api/time` and `/api/echo` are registered.

No lockfile changes: no dependency is added or changed, so `backend/uv.lock` and `frontend/package-lock.json` stay untouched. No `README.md` or `docs/DEVELOPMENT.md` change: the feature adds two endpoints and changes no project structure, run configuration, dependency or test infrastructure. No E2E spec file: no criterion is assigned to E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: schema and router behaviour in isolation, no network, no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_server_time_unit.py`; `test_main_unit.py` extended.
  - `ServerTimeResponse` serialised (`model_dump(mode="json")` and `model_dump_json()`) from an aware UTC value: `now` ends with `+00:00`, does not end with `Z`, `timezone == "UTC"`, keys exactly `{"now", "timezone"}`.
  - Edge: an aware non-UTC value (e.g. `+02:00`) serialises converted to UTC with `+00:00` and the correct instant.
  - Error: a naive `datetime` raises `pydantic.ValidationError`; `timezone="CET"` raises `ValidationError`.
  - Freshness: with `app.dependency_overrides[utc_now]` returning two different fixed instants on consecutive calls, two `GET /api/time` calls return those two distinct values, proving `now` is evaluated per request rather than cached at import or startup.
  - `utc_now()` itself returns a value whose `utcoffset() == timedelta(0)`.
  - `test_main_unit.py`: `/api/time` and `/api/echo` present in the custom routes.
- Integration tests: real HTTP request/response cycle through the session `client` fixture; neither endpoint touches the database.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py
  - Time: 200; body keys exactly `{"now", "timezone"}`; `timezone == "UTC"`; `now` ends `+00:00`; `datetime.fromisoformat(now).utcoffset() == timedelta(0)`; the value lies between a UTC timestamp taken just before and just after the request. Two requests separated by `time.sleep(1.1)` return different values with the second later than the first. POST returns 405.
  - Echo: `?msg=hello` returns `{"echo": "hello"}`; `?msg=hello%20world` returns `{"echo": "hello world"}`; no `msg` returns 422; POST returns 405.
- E2E tests: not warranted. E2E Tests is ENABLED, but no criterion requires navigation or interaction through the UI (the feature has no frontend), so no spec is written and no criterion is assigned to E2E.
  - Directory: e2e/tests/
  - File: none for this feature.
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (missing `msg` gives 422), written as API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | Integration | Verifying it needs no navigation or interaction: it is an HTTP router response, fully observable through the test client. |
| 2 | `now` computed per request, UTC, explicit offset, never naive | Unit and Integration | Verifying it needs no navigation or interaction: freshness is a router dependency behaviour and the offset is a schema serialisation rule; the integration tier confirms both on the live response. |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a code-structure property, checked by unit tests importing `ServerTimeResponse` and by review of the router's `response_model`. |
| 4 | Unit and integration tests cover shape, offset and freshness | Unit and Integration | Verifying it needs no navigation or interaction: it is satisfied by the existence and passing of the two test files named above. |
| 5 | `GET /api/echo?msg={text}` returns `{"echo": "<msg>"}` | Integration | Verifying it needs no navigation or interaction: it is an HTTP router response with a validated query parameter. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` returns 200 with `now` and `timezone: "UTC"` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the status is 200 and the body has exactly `now` and `timezone` with `timezone` = "UTC" |
| 2 | `now` per request, UTC, explicit offset | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time twice about a second apart, Then both `now` values end in "+00:00" and the second is later than the first |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API's OpenAPI document, When the GET /api/time response schema is read, Then it is `ServerTimeResponse` with fields `now` and `timezone` |
| 4 | Tests cover shape, offset, freshness | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the FEAT-1 unit and integration test files run, Then 0 tests fail |
| 5 | `GET /api/echo?msg={text}` returns `{"echo": "<msg>"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo?msg=hello, Then the status is 200 and the body is {"echo": "hello"}; edge: without `msg` the status is 422 |

## Manual verification plan
No criterion has a UI: every block below is verified in a browser tab pointed straight at the API, or in a terminal. The backend is assumed reachable at `http://localhost:8010` (the `docker-compose.yml` backend port); substitute the port your stack publishes if it differs.

### Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`
Prerequisites: the app stack is running (`docker compose up -d --build` from the repo root) and `http://localhost:8010/api/version` answers in the browser.
1. Open `http://localhost:8010/api/time` in a browser tab → the page shows a JSON object with exactly two keys, `now` and `timezone`.
2. Read `timezone` → it is the string `UTC`.
3. Open the browser's developer tools, Network tab, reload the page → the `time` request shows status `200` and content type `application/json`.

### Criterion 2: `now` is computed per request, in UTC, with an explicit offset
Prerequisites: as for criterion 1.
1. Open `http://localhost:8010/api/time` → note the `now` value, e.g. `2026-10-29T16:53:08.123456+00:00`.
2. Check its ending → it ends with `+00:00`, not with `Z` and not with no offset at all.
3. Compare its hour and minute with the current UTC time (for example from `https://time.is/UTC`) → they agree to within a few seconds.
4. Wait about two seconds and reload the tab → the new `now` value differs from the one noted in step 1 and is later.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for criterion 1.
1. Open `http://localhost:8010/docs` → the Swagger UI lists `GET /api/time` under the `time` tag.
2. Expand `GET /api/time` and open the 200 response's Schema tab → the schema is named `ServerTimeResponse` with fields `now` (string, date-time) and `timezone` (string, `UTC`).
3. Open `backend/app/schemas/server_time.py` in the editor → it defines `class ServerTimeResponse(BaseModel)` with the `now` serializer; `backend/app/routers/server_time.py` names it as `response_model` and returns no dict.

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
Not a UI criterion; the observable check is the test run.
Prerequisites: `uv` installed; the Postgres backing service running only if you also run the rest of the integration tier (these two files do not need it).
1. From the repo root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
2. Open `backend/tests/unit/test_server_time_unit.py` → it has a test asserting the serialised `now` ends with `+00:00` and not with `Z`, a test rejecting a naive datetime, and a test showing two requests with two injected clock values return two different `now` values.
3. Open `backend/tests/integration/test_server_time_integration.py` → it has a test asserting the live body's shape and `+00:00` suffix, and a test making two requests about a second apart and asserting they differ.

### Criterion 5: `GET /api/echo?msg={text}` returns `{"echo": "<msg>"}`
Prerequisites: as for criterion 1.
1. Open `http://localhost:8010/api/echo?msg=hello` → the page shows `{"echo":"hello"}`.
2. Open `http://localhost:8010/api/echo?msg=hello%20world` → the page shows `{"echo":"hello world"}`.
3. Open `http://localhost:8010/api/echo` with no `msg` → the Network tab shows status `422` and the body names the missing `msg` query parameter.
