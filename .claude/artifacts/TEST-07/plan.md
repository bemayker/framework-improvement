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
- [ ] 1. `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
<!-- First plan. The tracker item carries 31 comments; none asks for anything beyond the description. Recorded here so none reads as unread. -->
- Comment (tracker, 28 comments 2026-09 and later): "mayker-dev: PR opened for TEST-07 ... draft plan PR for review" (framework link comments, PRs #900 down to #57) → not acted on because they are the framework's own PR links and request nothing.
- Comment (tracker, 2026-09-14): PR #39 build report, noting the `+00:00` wire format, the OpenAPI schema showing `started_at` as a bare string, and the residual that `started_at` per process holds only while uvicorn runs one process → not acted on as a requirement (it describes a build the sandbox has since been reset from; the checkout holds no uptime code). Its two facts are used as design input: the plan pins `+00:00` explicitly (Backend Plan) and the manual plan does not claim an OpenAPI `format: date-time`; the multi-worker residual is recorded under Plan Overview assumptions.
- Comment (tracker, 2026-09-07): reset to `to do`, "do not run /deliver until the revert has merged" → not acted on because the precondition is already met: the tree on `7ce6e965` has no `routers/uptime.py`, `schemas/uptime.py` or uptime tests, and `main.py` registers only version, notes and health.
- Comment (tracker, 2026-09-03): PR #26 link comment → not acted on, requests nothing.

## Plan Overview
Backend only. Adds `GET /api/uptime` following the existing Router to Service layering of the version and health slices (`routers/version.py`, `services/version_service.py`, `schemas/version.py`). No database, no repository, no migration, no frontend.

Design:
- `app/services/uptime_service.py` owns the clock logic: a frozen `StartupStamp` dataclass (`started_at: datetime` in UTC, `started_monotonic: float`), `capture_startup()` that reads both clocks once, and `uptime_seconds(stamp)` that returns `max(0.0, monotonic() - stamp.started_monotonic)`.
- `create_app()` in `app/main.py` calls `capture_startup()` once and stores the result on `app.state.startup`, next to the router registration. The router reads `request.app.state.startup` per request and never recomputes `started_at`.
- `app/schemas/uptime.py` defines `UptimeResponse` (Pydantic) and pins the wire format of `started_at` to `+00:00`.

Key decisions:
- **Capture point is `create_app()`, not module import and not the lifespan.** The Dockerfile runs `uvicorn app.main:create_app --factory`, so `create_app()` runs once at process startup; capturing there gives each app instance its own stamp, so tests that build a fresh app are independent, and it does not depend on the lifespan having run (a `TestClient` used without a context manager skips the lifespan).
- **Uptime is measured on the monotonic clock, `started_at` on the wall clock.** A wall-clock difference can go backwards on an NTP step, which would break criterion 2; `time.monotonic()` cannot. `started_at` is the wall-clock UTC instant read in the same call.
- **`started_at` is serialised as `+00:00`, not `Z`.** Pydantic 2.13 (`backend/uv.lock`) serialises a UTC datetime as `...Z` by default. Assumption recorded: "explicit offset" means a numeric offset, so the schema adds a JSON-mode `field_serializer` returning `value.astimezone(timezone.utc).isoformat()`.
- **`uptime_seconds` is an unrounded float.** Rounding to whole seconds could make two calls one second apart read equal at a boundary; a float always increases.

Assumptions (recorded, not blocking):
- "Application startup" means the startup of the served app instance, which is the process startup under the shipped single-process uvicorn command. If the deployment ever adds `--workers N`, each worker captures its own stamp and calls may land on different workers. Out of scope here: the criterion only asks for process uptime, and no worker setting exists today.
- No authentication: the existing `/api/version` and `/api/health` are public, and the criteria name none.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime` returns `UptimeResponse` with 200. `APIRouter(prefix="/api", tags=["uptime"])` in `backend/app/routers/uptime.py`, handler `get_uptime(request: Request) -> UptimeResponse`, reading `request.app.state.startup` and building the body from `stamp.started_at` and `uptime_service.uptime_seconds(stamp)`. Registered in `backend/app/main.py` with `app.include_router(uptime_router)` after the existing three, plus `app.state.startup = capture_startup()` in `create_app()`; the module docstring line naming which item registers which router gains TEST-07.
- Service layer: `backend/app/services/uptime_service.py` with `from time import monotonic` and `from datetime import datetime, timezone` at module level (so tests patch `uptime_service.monotonic` and `uptime_service.datetime`), `StartupStamp` (frozen dataclass), `capture_startup() -> StartupStamp` returning `StartupStamp(started_at=datetime.now(timezone.utc), started_monotonic=monotonic())`, and `uptime_seconds(stamp: StartupStamp) -> float`, clamped at 0.0 so the body can never carry a negative.
- Schema: `backend/app/schemas/uptime.py`, `UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus `@field_serializer("started_at", when_used="json")` returning `value.astimezone(timezone.utc).isoformat()`.
- Repository layer: none, no data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no body, no query parameters.
- Response: 200, `application/json`

```json
{"uptime_seconds": 42.817305, "started_at": "2026-11-22T17:27:30.123456+00:00"}
```

- Other methods on the path return 405 (FastAPI default), as `/api/version` does.

## Technology Selection
- Uptime measurement (`uptime_service.uptime_seconds`): chose the standard library `time.monotonic()` over a wall-clock `datetime` difference, because a wall-clock difference can go negative or jump on a clock adjustment, and over `psutil` process create-time, which is a new dependency for what one stdlib call does.
- Startup timestamp (`uptime_service.capture_startup`): chose the standard library `datetime.now(timezone.utc)` over any time library; no alternative is needed.
- Startup storage: chose FastAPI's built-in `app.state` (an installed dependency) over a module-level global, because a per-app value keeps tests that build fresh apps independent.
- Response schema (`schemas/uptime.py`): chose Pydantic's installed `BaseModel`, `AwareDatetime` and `field_serializer` over a hand-written dict and formatter; criterion 4 requires a Pydantic schema.
- Router (`routers/uptime.py`): FastAPI's installed `APIRouter`, the pattern every existing router uses; no stdlib or platform alternative applies.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema, `started_at` serialised with a `+00:00` offset
- [B] backend/app/services/uptime_service.py: `StartupStamp`, `capture_startup()`, `uptime_seconds()`
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router reading `app.state.startup`
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service and the schema serialisation
- [B] backend/tests/integration/test_uptime_integration.py: HTTP request/response tests for `GET /api/uptime`
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-07/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: capture the startup stamp on `app.state.startup` in `create_app()`, register the uptime router, update the module docstring
- [B] backend/tests/unit/test_main_unit.py: assert the uptime route is registered and the startup stamp is captured once per app

No lockfile changes: the feature adds no dependency. No `README.md` or `docs/DEVELOPMENT.md` changes: neither lists endpoints, and the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `uptime_service` (stamp capture is UTC-aware, elapsed seconds from the monotonic clock, increase between reads, clamp at zero) and `UptimeResponse` JSON serialisation (`+00:00` offset); `create_app()` registers `/api/uptime` and sets `app.state.startup` once. Clocks are patched on `uptime_service.monotonic` and `uptime_service.datetime`, no real sleeps.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_uptime_service_unit.py`, existing `test_main_unit.py`)
- Integration tests: full HTTP cycle through `TestClient` on a fresh `create_app()`: 200 and body shape, increase between two calls with the monotonic clock patched to advance 1.0 s, `started_at` identical across calls, `+00:00` offset on the wire, body validates against `UptimeResponse`, and the error case `POST /api/uptime` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion involves navigation or interaction through the UI; the feature has no frontend.
  - Directory: e2e/tests/
  - File: none for this feature (would be `TEST-07_uptime_endpoint.spec.ts`)
- UAT scenarios: one scenario per criterion plus one edge case (POST returns 405), API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | `test_get_uptime_returns_200_with_uptime_seconds_and_started_at`, `test_create_app_registers_uptime_route` | verifying it needs no navigation or interaction: it is a router response, and there is no UI for it |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration | `test_get_uptime_seconds_increases_between_two_calls`, `test_uptime_seconds_increases_between_two_reads`, `test_uptime_seconds_is_never_negative` | verifying it needs no navigation or interaction: it is a service computation observed through the router |
| 3 | `started_at` captured once at startup and serialised in UTC with an explicit offset | Integration | `test_get_uptime_started_at_is_identical_across_calls`, `test_get_uptime_started_at_is_utc_with_explicit_offset`, `test_create_app_captures_startup_once_on_app_state`, `test_uptime_response_serialises_started_at_with_utc_offset` | verifying it needs no navigation or interaction: it is app-factory state and a schema serialisation rule |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_get_uptime_body_matches_uptime_response_schema` | verifying it needs no navigation or interaction: it is a response-model contract |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body has exactly `uptime_seconds` and `started_at` |
| 2 | non-negative, increases a second apart | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice a second apart, Then both values are at least 0 and the second is greater |
| 3 | captured once, UTC with explicit offset | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then `started_at` is identical and ends in `+00:00`; When the backend restarts, Then `started_at` changes |
| 4 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the OpenAPI document, When I look up `/api/uptime`, Then its 200 response references the `UptimeResponse` schema |

## Manual verification plan
<!-- No UI exists for this endpoint: every step is an HTTP call or a test run. Backend on http://localhost:8010 per docker-compose.yml. -->
### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: the stack is up (`docker compose up -d --build` at the repo root) and the backend answers on http://localhost:8010.
1. Run `curl -s -i http://localhost:8010/api/uptime` → the status line reads `HTTP/1.1 200 OK` and the header `content-type: application/json`.
2. Read the body of the same response → it is one JSON object with exactly two keys, `uptime_seconds` (a number, e.g. `12.40371`) and `started_at` (a string such as `2026-11-22T17:27:30.123456+00:00`).

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` → a value of 0 or more.
2. Wait about one second, then run the same command again → `uptime_seconds` is larger than the value from step 1 by roughly one second.
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` → the summary line reports no failed or errored test and the command exits 0.

### Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset
Prerequisites: as Criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart → `started_at` is the same string both times, and it ends in `+00:00`.
2. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again → `started_at` is now a later instant than in step 1 and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open http://localhost:8010/docs in a browser and expand `GET /api/uptime` → the 200 response shows the schema `UptimeResponse` with fields `uptime_seconds` (number) and `started_at` (string).
2. Open `backend/app/schemas/uptime.py` → it defines `class UptimeResponse(BaseModel)`, and `backend/app/routers/uptime.py` uses it as the route's `response_model` or return type.
