# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> ## What
>
> `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> ## Acceptance criteria
>
> 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
> 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
> 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
>
> ## Notes
>
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches `main.py`'s router registration, so it must not run concurrently with another backend item that does the same.

## Acceptance Criteria
- [ ] `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker, deliver-20260914T095103Z run): "One recorded residual, not a defect today: started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers. If the deployment ever gains workers, each child would capture its own value and uptime_seconds would stop being monotonic across calls." → Addressed by: `started_at` is captured in the app's startup path, the existing `lifespan` in `backend/app/main.py`, and stored on `app.state`, never at module import (Backend Plan). This ties the value to the ASGI startup of the app instance actually being served (under `uvicorn --factory`, the module-level `app = create_app()` in `main.py` is a second, unserved instance, and an import-time capture would belong to neither). `uptime_seconds` is computed from a `time.monotonic()` reading taken in the same startup call, so within one process it can never go backwards, even if the wall clock is adjusted. What this does NOT remove, stated rather than hidden: uptime is per process by definition, so under `--workers N` each worker still has its own start and two calls served by different workers can differ. That is inherent to "how long the process has been running", is out of scope (the Dockerfile runs one process), and is carried forward as a known improvement rather than solved with shared state.
- Comment (tracker, 2026-09-07 reset): "Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Not acted on because its precondition is met: verified at plan time on this branch (cut from `origin/main` 7fb9e25) that `backend/app/routers/` holds only `echo.py`, `health.py`, `notes.py` and `version.py`, `backend/app/schemas/` holds only `echo.py`, `health.py`, `note.py` and `version.py`, and `git grep` finds no `uptime` or `started_at` under `backend/`, `frontend/`, `README.md` or `docs/` outside the historical run report `docs/runs/deliver-20260914T095103Z/report.md`. The plan is against a main without the feature.
- The item's four framework "PR opened" link comments (PRs #90, #63, #57, #26) are link records from earlier sandbox rounds, not feedback, and change nothing in this plan.
- Design input from the historical run report (not a comment, recorded because it shaped a choice): that implementation used a `field_serializer` annotated `-> str`, which made OpenAPI publish `started_at` as a bare string. This plan types the field as Pydantic's `AwareDatetime` with no custom serializer, which measured on the installed pydantic 2.13.4 serialises a UTC value as `2026-10-13T08:00:00Z` and publishes `format: date-time`.
- Assumption (recorded instead of a question): criterion 3's "explicit offset" is satisfied by the trailing `Z`, the ISO 8601 / RFC 3339 zero-offset designator Pydantic emits for a UTC-aware datetime. What the criterion excludes is a naive timestamp with no offset at all, which `AwareDatetime` rejects at validation time. A `+00:00` spelling would need a custom serializer, which is exactly what lost the `date-time` format last time.
- Assumption: manual checks use `http://localhost:8010`, the host port `docker-compose.yml` and the backend Dockerfile publish, matching TEST-06.

## Plan Overview
One read-only backend endpoint, `GET /api/uptime`, returning `UptimeResponse` with `uptime_seconds` (float, at least 0) and `started_at` (UTC-aware datetime). At application startup the existing `lifespan` captures a `ProcessStart` (wall-clock UTC `started_at` plus a `time.monotonic()` reading) once and stores it on `app.state`; per request the router reads it and the service computes `time.monotonic() - start.monotonic_start`. Layers: a small service module (capture and elapsed-time logic), a schema, a router, one `include_router` line and one lifespan line in the app factory, and tests (unit for the service, schema and registration; integration over the HTTP cycle). No frontend, no database, no external API, no new dependency. Scope is criteria 1 to 4 only: no human-readable duration, no per-worker aggregation, no logging, no caching headers.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/uptime` in `backend/app/routers/uptime.py`, `APIRouter(prefix="/api", tags=["uptime"])`, the same shape as `version.py`. Handler signature `get_uptime(request: Request) -> UptimeResponse`, declared with `response_model=UptimeResponse`; it reads `request.app.state.process_start` and returns `UptimeResponse(uptime_seconds=uptime_service.seconds_since(start), started_at=start.started_at)`. No business logic in the router.
- Service layer: `backend/app/services/uptime_service.py`, mirroring `version_service.py`'s module style:
  - `@dataclass(frozen=True) class ProcessStart` with `started_at: datetime` (UTC-aware) and `monotonic_start: float`.
  - `capture_process_start() -> ProcessStart`: one `datetime.now(timezone.utc)` and one `time.monotonic()` reading, taken together.
  - `seconds_since(start: ProcessStart) -> float`: `time.monotonic() - start.monotonic_start`. Monotonic by construction within a process, so non-negative and increasing (criterion 2) without clamping.
  - Module docstring states why monotonic is used for the duration and wall-clock only for the reported timestamp.
- Startup capture: in `backend/app/main.py`'s existing `lifespan`, set `app.state.process_start = uptime_service.capture_process_start()` as its first statement, before the database branch, so it is set whether or not `DATABASE_URL` is configured. The lifespan docstring gains one line for it. `create_app()` gains `app.include_router(uptime_router)` after the echo router, and the module docstring's list gains TEST-07.
- Schema: `backend/app/schemas/uptime.py` with `class UptimeResponse(BaseModel)`: `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`. Publishes `minimum: 0` and `format: date-time` in OpenAPI; rejects a negative value or a naive datetime at construction.
- Repository layer: none (no data access).
- Migrations: none.
- Errors: no custom exception or handler. `app.state.process_start` is always set by the lifespan before the app serves a request; no fallback branch is added for an app that never started.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no parameters, no body.
- Response 200: `UptimeResponse`, e.g.
  `{"uptime_seconds": 12.503, "started_at": "2026-10-13T08:00:00.123456Z"}`
  `uptime_seconds` is a JSON number of seconds with sub-second precision, at least 0. `started_at` is ISO 8601 in UTC with the `Z` designator, identical on every call within one process lifetime.
- Response 405: any method other than GET (FastAPI default).

## Technology Selection
- Startup capture point (criterion 3): chose FastAPI's existing `lifespan` startup hook plus `app.state` (installed dependency `fastapi`) over a module-level constant set at import, because import time is not app startup under `uvicorn --factory` (the tracker residual), and over a new global singleton, because `app.state` already scopes the value to the served instance.
- Elapsed-time clock (criterion 2): chose the stdlib `time.monotonic()` over subtracting two `datetime.now()` wall-clock readings, because a wall-clock adjustment could make the difference shrink or go negative; monotonic cannot.
- UTC timestamp (criterion 3): chose the stdlib `datetime.now(timezone.utc)` over a third-party time library, which nothing here needs.
- `started_at` typing and serialisation (criteria 3 and 4): chose Pydantic's `AwareDatetime` (installed with `fastapi`) over a `field_serializer` returning `str`, because the type already serialises UTC with an explicit `Z` offset, rejects naive values, and keeps `format: date-time` in OpenAPI, which the serializer lost in the earlier implementation.
- Non-negative `uptime_seconds` (criterion 2): chose Pydantic `Field(ge=0)` over a hand-rolled check, because the installed validator enforces and documents it.
- `UptimeResponse` schema (criterion 4): chose a Pydantic `BaseModel` over a bare dict or stdlib `dataclass`, because the criterion names Pydantic and the sibling schemas use it.
- `ProcessStart` value object: chose a stdlib frozen `dataclass` over a Pydantic model, because it is internal state, never serialised, and needs no validation.
- `backend/app/routers/uptime.py` and `backend/app/services/uptime_service.py`: no stdlib call, native platform feature or installed dependency replaces a route handler or the two-line capture and elapsed functions, so they are built here.
- New dependencies: none. `backend/pyproject.toml` and `backend/uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic response schema, `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`.
- [B] backend/app/services/uptime_service.py: `ProcessStart` frozen dataclass, `capture_process_start()` (UTC wall clock plus monotonic reading, taken once) and `seconds_since(start)` (monotonic elapsed seconds).
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router; reads `request.app.state.process_start`, returns `UptimeResponse`, no business logic.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for `capture_process_start` (UTC-aware timestamp, monotonic value taken from `time.monotonic`) and `seconds_since` (elapsed from a patched clock, zero at the start instant, increases as the patched clock advances), with `time.monotonic` and the clock monkeypatched.
- [B] backend/tests/unit/test_uptime_schema_unit.py: unit tests for `UptimeResponse`: happy path serialises a UTC `started_at` with the `Z` offset; edge `uptime_seconds=0` accepted; error cases: negative `uptime_seconds` and a naive `started_at` both raise `ValidationError`.
- [B] backend/tests/integration/test_uptime_integration.py: full HTTP cycle via the shared `client` fixture: 200 with exactly the two keys; `uptime_seconds` is a non-negative number; two calls one second apart, the second larger by at least 0.9 s; `started_at` identical across both calls, parses as an aware datetime with zero UTC offset, and is not later than the request time; OpenAPI 200 response references `UptimeResponse` with `started_at` `format: date-time`; 405 on POST.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (a restart produces a new `started_at` and a reset uptime).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the uptime router and service; in `lifespan`, set `app.state.process_start = uptime_service.capture_process_start()` first; add `app.include_router(uptime_router)` in `create_app()`; add TEST-07 to the module docstring's list and one line to the lifespan docstring.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` asserting `/api/uptime` is among the app's custom routes, matching the version, health and echo tests.

No E2E spec is produced: no acceptance criterion involves the UI (see Criterion coverage), so there is no `[D]` entry.
No lockfile changes: the feature adds no dependency, so `backend/uv.lock`, `package-lock.json` and `backend/pyproject.toml` stay untouched.
README.md and docs/DEVELOPMENT.md need no edit: the feature changes no project structure, run configuration, dependency or test infrastructure (it adds files inside existing directories and reuses the existing `client` fixture).

## Testing Strategy
- Unit tests: the service (`capture_process_start`, `seconds_since`), with `time.monotonic` and the UTC clock monkeypatched so no test sleeps; the schema's validation rules (non-negative, offset-aware); and the app factory's route registration. Each tested function gets a happy path, an edge case and an error case per `testing_standards.md` Section 1.1.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`, `test_uptime_schema_unit.py`, and the existing `test_main_unit.py`)
- Integration tests: the router over the real HTTP cycle through the session-scoped `client` fixture in `backend/tests/conftest.py`, which enters `TestClient` as a context manager and therefore runs the lifespan that captures the start. The one-second criterion uses a real `time.sleep(1)` between two requests, because it is the criterion's own wording and the monotonic clock under test cannot be patched without testing the patch. The endpoint needs no database; the tests must not request the `database_url` fixture.
  - Directory: backend/tests/integration/
  - File: test_uptime_integration.py
- E2E tests: none warranted. E2E is ENABLED, but no criterion requires navigation or interaction through the UI (no frontend consumes `/api/uptime`), and a Playwright spec calling the API directly is the anti-pattern `testing_standards.md` Section 5 names.
  - Directory: e2e/tests/ (no file added)
  - File: none (would have been TEST-07_uptime_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus the restart edge case; the manual script is HTTP-level (curl), like TEST-02's and TEST-06's.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: it is a router response, fully observable over HTTP, and no UI consumes it. |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration (plus Unit for the elapsed-time logic) | Verifying it needs no navigation or interaction: two HTTP calls with a one-second sleep between them, and a patched-clock unit test of `seconds_since`. |
| 3 | `started_at` captured once at startup, serialised in UTC with an explicit offset | Integration (plus Unit for the schema) | Verifying it needs no navigation or interaction: equality across two calls and the parsed offset are HTTP-level assertions; the naive-datetime rejection is a schema validation rule. |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: it is a contract property, asserted by the OpenAPI 200 response referencing `UptimeResponse`, and by review of the router code. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/uptime, Then the status is 200 and the body has exactly the keys `uptime_seconds` (a number) and `started_at` (an ISO 8601 UTC string) |
| 2 | `uptime_seconds` non-negative and increasing a second apart | covered at Integration, see Criterion coverage | Given the backend is running, When a client calls GET /api/uptime twice one second apart, Then both values are at least 0 and the second is larger than the first by about one second |
| 3 | `started_at` captured once at startup, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When a client calls GET /api/uptime twice, Then `started_at` is identical and ends in `Z`; edge case: after the backend restarts, `started_at` is later and `uptime_seconds` has reset |
| 4 | Response body is a Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads /openapi.json, Then the 200 response of GET /api/uptime references the `UptimeResponse` schema |

## Manual verification plan
No acceptance criterion is verifiable through the application UI: no frontend screen consumes `GET /api/uptime`. The observable check is the HTTP response, read with `curl` against the compose stack, plus the backend's interactive docs page for criterion 4.

Shared prerequisites for every block: Docker running; repository on branch `feature/TEST-07-uptime-endpoint` (or `main` once merged); from the repository root, `docker compose up -d --build` has completed and `docker compose ps` shows the `backend` service running; host port `8010` is the backend (from `docker-compose.yml`); a terminal with `curl`. `curl` prints JSON without spaces, so `{"uptime_seconds":12.5,...}` on screen is the same body as `{"uptime_seconds": 12.5, ...}` below. The exact numbers and timestamps you see differ from the examples; the steps say what must hold.

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the shared prerequisites above.
1. Run `curl -i http://localhost:8010/api/uptime` → the first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present.
2. Read the body on the last line → a JSON object with exactly two keys, e.g. `{"uptime_seconds": 37.204, "started_at": "2026-10-13T08:00:00.123456Z"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted timestamp.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: the shared prerequisites above.
1. Run `curl -s http://localhost:8010/api/uptime; echo; sleep 1; curl -s http://localhost:8010/api/uptime; echo` → two bodies print, one per line.
2. Compare the two `uptime_seconds` values → both are 0 or greater, and the second is larger than the first by roughly one second (for example `41.02` then `42.04`), never smaller or equal.

### Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset
Prerequisites: the shared prerequisites above.
1. Run the two-call command from Criterion 2 again → the `started_at` value is character-for-character identical in both bodies.
2. Read that `started_at` value → it is ISO 8601 and ends in `Z` (the UTC offset designator), e.g. `2026-10-13T08:00:00.123456Z`; it is not a timestamp without an offset such as `2026-10-13T08:00:00.123456`.
3. Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s http://localhost:8010/api/uptime` → `started_at` is later than the value from step 1, and `uptime_seconds` is small (a few seconds), showing the value belongs to the new process start rather than being recomputed per request.
4. Open `backend/app/main.py` and `backend/app/routers/uptime.py` in the editor → the start is captured in `lifespan` via `capture_process_start()` and stored on `app.state`; the router only reads it and contains no `datetime.now` call.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the shared prerequisites above, plus a browser.
1. Open `http://localhost:8010/docs` and expand `GET /api/uptime`, then look at the 200 response → its schema is named `UptimeResponse`, with `uptime_seconds` a number (minimum 0) and `started_at` a string of format `date-time`.
2. Open `backend/app/schemas/uptime.py` and `backend/app/routers/uptime.py` → the schema file defines `class UptimeResponse(BaseModel)`; the router declares `response_model=UptimeResponse` and returns an `UptimeResponse`, not a dict.
3. Run `uv run --directory backend pytest -q tests/integration/test_uptime_integration.py tests/unit/test_uptime_service_unit.py tests/unit/test_uptime_schema_unit.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
