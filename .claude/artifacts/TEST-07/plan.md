# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> **What:** `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> **Acceptance criteria:**
> 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
> 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
> 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
>
> **Notes:** Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches `main.py`'s router registration, so it must not run concurrently with another backend item that does the same.
>
> (ClickUp task 123k99ctgcg, workspace 30307190, list 901524718831; status to do.)

## Acceptance Criteria
- [ ] 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker, newest): "mayker-dev: PR opened for TEST-07 (PR #39, run deliver-20260914T095103Z) ... GET /api/uptime returns {"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC +00:00>"} ... The UAT script ... claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare {"type": "string"} ... This item was held behind FEAT-1 ... started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers ..." → Addressed by, point by point: (a) the offset is pinned to `+00:00`, not pydantic's default `Z`: the schema serialises `started_at` with an explicit `field_serializer` returning `isoformat()` of the UTC value, and a unit test plus an integration test assert the string ends in `+00:00`. (b) The OpenAPI remark is carried forward as a constraint on Phase G: the UAT script and the Gherkin scenarios must not claim the OpenAPI document gives `started_at` a `date-time` format, because with a `-> str` serializer it documents a plain string. No criterion asks about the OpenAPI document, so the plan does not add a schema override to change it (no gold plating). (c) Capture point: kept at import of the service module (`backend/app/services/uptime_service.py`), which `backend/app/main.py` imports through the router before uvicorn serves a request, so it is application startup and is never recomputed per request. Recorded residual, not a defect today and not acted on: the Dockerfile runs one uvicorn process (`--factory`, no `--workers`); with several workers each process would hold its own `started_at`, and a lifespan-hook capture would have exactly the same property, so moving the capture buys nothing. The build lists it under the PR's known improvements. (d) Serialization behind FEAT-1: recorded in `shared_risks.md`, extended to every row the feature map names for `backend/app/main.py`. (e) The test counts it quotes (48 unit, 39 integration) describe a sandbox state since reset and are not carried into this plan.
- Comment (tracker, older): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Not acted on because the precondition is historical: the sandbox was reset again before this run (commit 892a631, "reset sandbox for release run 0.3.478"), and a search of `backend/app/`, `backend/tests/` and `e2e/` for `uptime` on this branch (from `origin/main` at 7d159cd) finds nothing, so there is no earlier implementation to revert or collide with and every file below is new.
- Merged since the last plan: n/a (fresh plan, branched from current main at 7d159cd; no earlier TEST-07 plan exists in `.claude/artifacts/`).

## Plan Overview
Backend-only feature, the smallest shape the existing code already uses (the TEST-05 version slice: `routers/version.py`, `schemas/version.py`, `services/version_service.py`). A new `uptime` router exposes `GET /api/uptime`; it delegates to a new `uptime_service` that captures the start instant once, at module import, as both a UTC wall-clock `datetime` (reported as `started_at`) and a `time.monotonic()` reading (the base `uptime_seconds` is measured from). The body is a new pydantic schema `UptimeResponse` in `backend/app/schemas/uptime.py`. The router is registered in `create_app()` with one `include_router` line. No frontend work, no database, no migrations, no new dependency.

Two recorded design decisions:
- **Elapsed time comes from the monotonic clock, not from subtracting wall-clock datetimes.** The wall clock can step backwards (NTP correction, manual change), which would make `uptime_seconds` negative or shrink between calls and break criterion 2. `time.monotonic()` never goes backwards; the service also clamps the difference at `0.0` so the non-negative guarantee does not rest on the clock alone.
- **`started_at` is serialised with an explicit `+00:00` offset.** pydantic v2 serialises a UTC-aware datetime with a `Z` suffix; the criterion asks for an explicit offset, and the newest tracker comment's contract shows `+00:00`, so the schema serialises it explicitly rather than relying on the default.

Recorded assumption: "a number" in criterion 1 is a JSON number carrying fractional seconds (a Python `float`, unrounded); nothing asks for rounding or an integer, so none is applied.

## Frontend Plan
No frontend changes required. (No acceptance criterion renders the endpoint; Design Reference mode is NONE.)
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/uptime`, in `backend/app/routers/uptime.py` with `APIRouter(prefix="/api", tags=["uptime"])` and `response_model=UptimeResponse`, matching `routers/version.py`'s shape. The handler calls the service and builds `UptimeResponse(uptime_seconds=..., started_at=...)`; no business logic in the router (`coding_standards.md` Section 2.2). Any other method on the path answers 405 (FastAPI default).
- Service layer: `backend/app/services/uptime_service.py`.
  - Module constants, captured once at import: `STARTED_AT: datetime = datetime.now(UTC)` and `STARTED_MONOTONIC: float = time.monotonic()`. A comment states why they are module-level (captured once per process at startup, never per request) and the single-process assumption the residual above names.
  - `elapsed_seconds(started_monotonic: float, now_monotonic: float) -> float`: pure function, returns `max(0.0, now_monotonic - started_monotonic)`.
  - `get_uptime() -> UptimeReport`, where `UptimeReport` is a frozen dataclass (`started_at: datetime`, `uptime_seconds: float`), mirroring `health_service.HealthReport`: returns `STARTED_AT` unchanged and `elapsed_seconds(STARTED_MONOTONIC, time.monotonic())`. It reads `time.monotonic` through the `time` module so unit tests can monkeypatch it.
- Schema: `backend/app/schemas/uptime.py`, `UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus `@field_serializer("started_at")` returning `value.astimezone(UTC).isoformat()` (yields `2026-11-04T18:18:00.123456+00:00`). `AwareDatetime` rejects a naive datetime at construction, so a timezone-less value can never reach the wire.
- Repository layer: none. No persisted data.
- Migrations: none.
- App factory: `backend/app/main.py` imports `router as uptime_router` from `app.routers.uptime` and adds `app.include_router(uptime_router)` after the existing three; the module docstring's list of registered routers gains TEST-07. Nothing else in the factory changes (lifespan and CORS untouched).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: none (no parameters, no body)
- Response 200:

  ```json
  {"uptime_seconds": 42.137, "started_at": "2026-11-04T18:18:00.123456+00:00"}
  ```

  `uptime_seconds`: JSON number, `>= 0`, seconds since process start, fractional. `started_at`: ISO 8601 string, always UTC, always with the explicit `+00:00` offset, identical on every call within one process.
- Schema: `UptimeResponse` in `backend/app/schemas/uptime.py`.
- Any other method on the path: 405. The generated OpenAPI document shows `started_at` as a plain string (no `format`), because of the `-> str` serializer; this is expected and is not a criterion.
- No database access: the endpoint answers with `DATABASE_URL` unset.

## Technology Selection
- Start-instant capture and elapsed time (`uptime_service`): chose the standard library (`datetime.now(UTC)` for `started_at`, `time.monotonic()` for elapsed seconds) over a dependency such as `psutil` (process create time), because the stdlib covers it and `psutil` is not installed; over wall-clock subtraction, because the wall clock can step backwards and break criterion 2.
- Response schema (`UptimeResponse`): chose pydantic `BaseModel` with its built-in `AwareDatetime`, `Field(ge=0)` and `field_serializer`, already installed with FastAPI (pydantic 2.13.4 in `uv.lock`) and used by every file in `app/schemas/`, over a hand-written dict or a custom datetime encoder.
- Router (`routers/uptime.py`): FastAPI's `APIRouter`, already installed; no alternative needed.
- No net-new dependency is added by this feature.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` pydantic schema (`uptime_seconds` non-negative float, `started_at` aware datetime serialised with `+00:00`).
- [B] backend/app/services/uptime_service.py: start instant captured once at import (`STARTED_AT`, `STARTED_MONOTONIC`), `elapsed_seconds()` clamp, `get_uptime()` returning an `UptimeReport`.
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router, no business logic.
- [B] backend/tests/unit/test_uptime_service_unit.py: service unit tests (monotonic clock monkeypatched).
- [B] backend/tests/unit/test_uptime_schema_unit.py: schema unit tests (offset serialisation, naive datetime rejected, negative uptime rejected).
- [B] backend/tests/integration/test_uptime_integration.py: full HTTP cycle: 200 and shape, increase over one second, constant `started_at`, 405 on POST, answers with `DATABASE_URL` unset.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (POST answers 405).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual UAT script.

### Modified files
- [B] backend/app/main.py: import the uptime router and register it in `create_app()` with one `include_router` line; docstring lists TEST-07.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` asserting `/api/uptime` is among the custom routes.

No dependency manifest changes, so no lockfile is touched (FastAPI and pydantic are already installed, the rest is stdlib). Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: service and schema in isolation, no HTTP, no database.
  - `test_uptime_service_unit.py`: `elapsed_seconds` happy path (`elapsed_seconds(100.0, 142.5) == 42.5`), edge case (equal readings give `0.0`), error case (a `now` earlier than the start clamps to `0.0`, never negative); `get_uptime()` with `time.monotonic` monkeypatched to return `STARTED_MONOTONIC + 5.0` and then `+ 6.0` reports `5.0` then `6.0` (increase); `get_uptime()` called twice returns the identical `started_at` (`is`/equality with `STARTED_AT`), whose `utcoffset()` is zero.
  - `test_uptime_schema_unit.py`: `UptimeResponse(...).model_dump(mode="json")["started_at"]` ends with `+00:00` and parses back with `datetime.fromisoformat` to the same instant; a non-UTC aware input (e.g. `+02:00`) is serialised converted to `+00:00`; a naive datetime raises `ValidationError`; `uptime_seconds=-1.0` raises `ValidationError`; `0.0` is accepted.
  - `test_main_unit.py`: `/api/uptime` is registered by `create_app()`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `test_uptime_integration.py`, the router over the real HTTP request/response cycle through the shared session `client` fixture in `backend/tests/conftest.py`. No database fixture is used: the endpoint needs none.
  - `test_get_uptime_returns_200_with_uptime_and_started_at`: status 200, body keys exactly `{"uptime_seconds", "started_at"}`, `uptime_seconds` is an `int`/`float` (not `bool`) and `>= 0`, `started_at` is a string.
  - `test_get_uptime_increases_between_calls_a_second_apart`: two GETs separated by `time.sleep(1.0)`; the second `uptime_seconds` is strictly greater than the first, by at least `0.9`. (A real one-second wait is the criterion's own wording; this is the backend tier, where the E2E no-hardcoded-waits rule does not apply.)
  - `test_get_uptime_started_at_is_constant_and_utc`: the two responses' `started_at` strings are identical; the string ends with `+00:00`; `datetime.fromisoformat(...)` has `utcoffset() == timedelta(0)` and is not later than `datetime.now(UTC)`.
  - `test_get_uptime_answers_when_database_url_is_unset`: monkeypatch `DATABASE_URL` away, fresh `create_app()` in a `TestClient` context, 200 (mirrors `test_version_integration.py`).
  - `test_post_uptime_returns_405_method_not_allowed`: the only reachable error case.
  - Directory: backend/tests/integration/
- E2E tests: not warranted for this feature. No criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion: all four are HTTP payload or schema behaviours of an endpoint no UI consumes), so no `e2e/tests/TEST-07_*.spec.ts` is produced.
  - Directory: e2e/tests/ (none written)
  - File: TEST-07_uptime_endpoint.spec.ts (not produced, per the above)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (POST answers 405), validated for well-formedness, not executed as browser tests. Neither the scenarios nor the manual script may claim that the OpenAPI document gives `started_at` a `date-time` format (see Re-Plan Feedback).
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: it is a router response over the real HTTP cycle, and no UI consumes the endpoint |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration (plus Unit for the clamp) | Verifying it needs no navigation or interaction: two HTTP calls a second apart cover it end to end; the never-negative clamp is a pure function covered at Unit |
| 3 | `started_at` captured once at startup, not per request, serialised in UTC with an explicit offset | Integration (plus Unit for the serializer) | Verifying it needs no navigation or interaction: two HTTP calls returning the identical `+00:00` string cover it; offset conversion and naive-value rejection are schema rules covered at Unit |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a code-structure and validation rule, covered by the schema unit tests importing `app.schemas.uptime.UptimeResponse` and by the router's `response_model` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime, Then the response is HTTP 200 with a numeric uptime_seconds and an ISO 8601 started_at |
| 2 | `uptime_seconds` non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime twice one second apart, Then both uptime_seconds values are non-negative and the second is greater |
| 3 | `started_at` captured once, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/uptime twice, Then started_at is identical in both responses and ends with +00:00, And after a backend restart started_at is later |
| 4 | Body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the codebase, When a reviewer opens backend/app/schemas/uptime.py, Then UptimeResponse declares uptime_seconds and started_at and the router uses it as its response_model |

## Manual verification plan
### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
This criterion is not verifiable through the UI (no frontend consumes the endpoint); the observable check is the HTTP response, read with curl.
Prerequisites: Docker running; the stack up with `docker compose up -d --build` from the repository root; `docker compose ps` shows the `backend` service running (it publishes port 8010).
1. In a terminal, run `curl -i http://localhost:8010/api/uptime` → the first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the response body → exactly two keys, for example `{"uptime_seconds":12.84,"started_at":"2026-11-04T18:18:00.123456+00:00"}`: `uptime_seconds` is a bare number (no quotes) and `started_at` is a quoted date-time string.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: criterion 1 verified, stack still up.
1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` → two JSON bodies print one after the other.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second is larger than the first by roughly one second (for example `30.12` then `31.14`).

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset
Prerequisites: criterion 2 verified, stack still up.
1. Look at the two bodies from criterion 2 → `started_at` is character-for-character identical in both, while `uptime_seconds` differs.
2. Read the end of the `started_at` string → it ends in `+00:00` (an explicit UTC offset), never in `Z` and never with no offset at all.
3. Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is now later than the value noted in step 1 and `uptime_seconds` is small (a few seconds): the value was taken when the process started, which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
This criterion is a code-structure rule, not UI behaviour; the observable check is the source and the tests that import it.
1. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`.
2. Open `backend/app/routers/uptime.py` → the `GET /uptime` route declares `response_model=UptimeResponse`.
3. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the summary line reports `0 failed`.
