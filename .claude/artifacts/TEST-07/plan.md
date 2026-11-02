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
- [ ] 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback
- Comment (tracker, 2026-09-14, deliver-20260914T095103Z PR notice): "GET /api/uptime returns {"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC +00:00>"} ... The UAT script was telling testers something untrue ... It claimed the OpenAPI schema documents started_at as string with format: date-time. Probing the generated schema showed a bare {"type": "string"} ... One recorded residual, not a defect today: started_at is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with --factory and no --workers ..." → Addressed by, point by point: (a) the wire format: this plan pins `+00:00` as the offset spelling (see API Contract), matching the comment's example, and does not rely on Pydantic's default UTC spelling (`Z`); (b) the OpenAPI lesson: the plan makes no claim about the OpenAPI `format` of `started_at`, the UAT script and Gherkin must not assert one, and criterion 4 is verified by the schema name and its two properties in the generated document, which is what is actually true; (c) the import-time residual: this plan captures `started_at` in the FastAPI lifespan startup hook in `backend/app/main.py`, not at module import, so it is tied to application startup per criterion 3 and each `create_app()` instance gets its own value. The multi-worker caveat still holds in a weaker form (each worker would run its own lifespan and report its own start); this is recorded under Known limitations, not built against, because the Dockerfile runs one uvicorn process and no criterion asks for cross-worker consistency; (d) "held behind FEAT-1" and "48 unit and 39 integration tests": history of a reverted build, nothing to act on in this plan; serialisation against other `main.py` items is carried in `shared_risks.md`.
- Comment (tracker, 2026-09-07, operator): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Verified, not acted on further: `git log` shows `0ac6818 chore: revert TEST-06, TEST-07 and TEST-08 for measured run 3 (#29)` on main, and a search of `backend/app`, `backend/tests`, `e2e/` and `backend/Dockerfile` for `uptime` and `started_at` returns nothing. `backend/app/main.py` registers only the version, notes and health routers. No uptime endpoint exists on main today, so this plan builds it from nothing; the precondition the comment sets is met.
- Comment (tracker, 14 framework-written notices, "mayker-dev: PR opened for TEST-07 ... draft plan PR for review. When approved, move this item to on hold and dispatch /build-feature TEST-07."): → Not acted on: these are status notices from earlier plan runs whose PRs were closed by sandbox resets; they request nothing of the plan.

## Plan Overview
One read-only backend endpoint, `GET /api/uptime`, following the Router, Service, Schema layering the version and health endpoints already use. No database, no repository layer, no frontend.

The process start is captured exactly once, in the existing `lifespan` startup hook of `backend/app/main.py`, as two values: an aware UTC wall-clock datetime (`started_at`, what the operator reads) and a `time.monotonic()` reading (what `uptime_seconds` is computed from, so a wall-clock adjustment can never make uptime negative or jump). Both are stored on `app.state.process_start`. The router reads that value from `request.app.state` and asks the service for the elapsed seconds; the Pydantic response schema serialises `started_at` as ISO 8601 with an explicit `+00:00` offset.

Known limitations (recorded, not built): with several uvicorn workers each worker runs its own lifespan, so successive calls could hit workers with different `started_at` values. Today's Dockerfile runs a single process, and no criterion asks for cross-worker values.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/uptime`, returns the process's start time and seconds elapsed since it. New router `backend/app/routers/uptime.py` with `APIRouter(prefix="/api", tags=["uptime"])`, one handler `get_uptime(request: Request) -> UptimeResponse` declared with `response_model=UptimeResponse`. No business logic in the router: it reads `request.app.state.process_start` and calls the service.
- Registration: `backend/app/main.py`, import `router as uptime_router` and add `app.include_router(uptime_router)` after the existing three `include_router` calls; in the existing `lifespan`, set `app.state.process_start = uptime_service.capture_process_start()` as its first statement, before the `DATABASE_URL` branch, so it is captured whether or not a database is configured. Update the module docstring's list of registered routers.
- Service layer: new `backend/app/services/uptime_service.py`:
  `ProcessStart`, a frozen dataclass with `started_at: datetime` (aware, UTC) and `started_monotonic: float`;
  `capture_process_start() -> ProcessStart`, returns `ProcessStart(datetime.now(UTC), time.monotonic())`;
  `get_uptime_seconds(process_start: ProcessStart, now_monotonic: float | None = None) -> float`, returns `max(0.0, now - process_start.started_monotonic)` where `now` defaults to `time.monotonic()`. The clamp makes criterion 2's non-negativity a property of the function rather than of the clock, and the optional parameter is the seam the unit tests use instead of patching `time`.
- Schema: new `backend/app/schemas/uptime.py`, `UptimeResponse(BaseModel)` with `uptime_seconds: float = Field(ge=0)` and `started_at: AwareDatetime`, plus a `@field_serializer("started_at")` returning `value.astimezone(UTC).isoformat()` so the wire value always ends in `+00:00`. No OpenAPI `format` claim is made for `started_at` (see Re-Plan Feedback).
- Repository layer: none, nothing is persisted.
- Migrations: none.
- Error handling: the endpoint takes no input. The only reachable error at the HTTP layer is a wrong method (405, FastAPI's own). No new exception class is introduced.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/uptime`
- Request: no path, query or body parameters.
- Response: 200, `application/json`, body defined by `UptimeResponse` in `backend/app/schemas/uptime.py`:

```json
{
  "uptime_seconds": 42.718,
  "started_at": "2026-11-02T14:48:28.123456+00:00"
}
```

  `uptime_seconds`: JSON number, float, greater than or equal to 0, seconds since this application instance's lifespan startup.
  `started_at`: string, ISO 8601, always UTC with the literal `+00:00` offset, identical on every call to the same running instance.
- Errors: `POST /api/uptime` (or any other method) returns 405.

## Technology Selection
- Wall-clock start time: chose the standard library `datetime.now(UTC)` over any dependency; the stdlib covers it.
- Elapsed-time source: chose the standard library `time.monotonic()` over subtracting wall-clock datetimes, because a wall-clock adjustment (NTP step) can make a datetime difference negative, which criterion 2 forbids; no dependency considered.
- Startup capture point: chose FastAPI's existing `lifespan` hook in `backend/app/main.py` (installed dependency, already used there) over a module-level constant captured at import, because import time is not application startup (the tracker comment's residual) and an import-time constant is shared by every `create_app()` instance.
- Response schema and UTC offset serialisation: chose Pydantic's `AwareDatetime` with a `field_serializer` (installed, pydantic 2.13.4 per `backend/uv.lock`) over a hand-formatted string, because Pydantic's default UTC spelling is `Z` and the stakeholder example names `+00:00`.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/uptime.py: `GET /api/uptime` router, reads `request.app.state.process_start`, returns `UptimeResponse`
- [B] backend/app/services/uptime_service.py: `ProcessStart`, `capture_process_start()`, `get_uptime_seconds()`
- [B] backend/app/schemas/uptime.py: `UptimeResponse` Pydantic schema with the `+00:00` serializer for `started_at`
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service (happy path, zero elapsed edge, clamp on a backwards clock, capture returns an aware UTC datetime)
- [B] backend/tests/integration/test_uptime_integration.py: router tests through the full HTTP cycle (criteria 1 to 4, plus 405)
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-07/uat_script.md: copy of the manual UAT script that build-feature writes alongside it

### Modified files
- [B] backend/app/main.py: capture `app.state.process_start` in `lifespan`, import and register `uptime_router`, update the module docstring
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route` beside the existing version and health route tests

No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` change: the feature adds an endpoint and changes no project structure, run configuration, dependencies or test infrastructure, and neither document keeps an endpoint list.

## Testing Strategy
- Unit tests: `uptime_service`, all clock values injected or monkeypatched, no app or database.
  `test_get_uptime_seconds_returns_elapsed_since_start` (start 100.0, now 142.5, returns 42.5);
  `test_get_uptime_seconds_returns_zero_when_no_time_has_passed` (edge: now equals start);
  `test_get_uptime_seconds_clamps_to_zero_when_now_precedes_start` (error case: a now earlier than start returns 0.0, never negative);
  `test_get_uptime_seconds_uses_the_monotonic_clock_by_default` (monkeypatch `uptime_service.time.monotonic`, no explicit now);
  `test_capture_process_start_returns_an_aware_utc_datetime` (`utcoffset() == timedelta(0)`).
  Plus `test_create_app_registers_uptime_route` in the existing `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/uptime` through `TestClient` with the lifespan entered (`with TestClient(...)`, as the shared `client` fixture does), no database needed.
  `test_get_uptime_returns_200_with_uptime_seconds_and_started_at` (status 200, keys exactly `{"uptime_seconds", "started_at"}`, `uptime_seconds` is an int or float and is at least 0);
  `test_get_uptime_seconds_increases_between_calls_a_second_apart` (two calls with `time.sleep(1.0)` between, second value strictly greater than the first, and greater by at least 0.9);
  `test_get_uptime_started_at_is_stable_across_calls` (two calls on one app return the identical `started_at` string);
  `test_get_uptime_started_at_is_captured_at_startup_not_import` (a fresh `create_app()` entered after a short sleep reports a later `started_at` than the shared client's, and `started_at` lies between timestamps taken just before and just after entering the fresh client);
  `test_get_uptime_started_at_is_utc_with_explicit_offset` (string ends with `+00:00`, `datetime.fromisoformat` parses it, `utcoffset() == timedelta(0)`);
  `test_get_uptime_body_matches_the_uptime_response_schema` (`UptimeResponse.model_validate(response.json())` succeeds, and `/openapi.json` names `UptimeResponse` as the 200 response schema of `/api/uptime` with properties `uptime_seconds` and `started_at`; no assertion on a `format` keyword);
  `test_post_uptime_returns_405_method_not_allowed`.
  - Directory: backend/tests/integration/
- E2E tests: none written. E2E is ENABLED in CLAUDE.md, but no criterion involves navigation or interaction through the UI (the feature has no frontend), so per `testing_standards.md` Section 6 the tier is not warranted for any criterion; every criterion is covered at integration or unit level below.
  - Directory: e2e/tests/
  - File: none (would be TEST-07_uptime_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), phrased against the HTTP response, with no claim about the OpenAPI `format` of `started_at`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked through the real HTTP cycle |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration (plus Unit for the clamp) | No UI involved: two HTTP calls a second apart prove the increase; the non-negative clamp is a service rule unit-tested directly |
| 3 | `started_at` captured once at startup, not per request, UTC with an explicit offset | Integration (plus Unit for the aware UTC capture) | No UI involved: stability across calls, startup capture and the `+00:00` wire format are all observable in the response body |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | No UI involved: the body validates against `UptimeResponse` and the generated OpenAPI document names that schema for the route |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime, Then the status is 200 and the body has exactly uptime_seconds and started_at |
| 2 | non-negative and increasing | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice a second apart, Then both uptime_seconds are at least 0 and the second is larger |
| 3 | started_at fixed at startup, UTC with offset | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/uptime twice, Then started_at is identical and ends with +00:00; When the backend restarts, Then started_at is later and uptime_seconds is small again |
| 4 | Pydantic schema in backend/app/schemas/ | covered at Integration, see Criterion coverage | Given the backend is running, When I open /docs, Then GET /api/uptime shows the UptimeResponse schema with uptime_seconds and started_at |

## Manual verification plan
<!--
  The endpoint has no screen of its own. The closest UI is FastAPI's Swagger UI at /docs on the backend, used below where it helps; otherwise the observable check is the HTTP response read with curl.
-->
### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`
Prerequisites: the stack is running from the repo root with `docker compose up -d --build`, and the backend answers on `http://localhost:8010` (the host port `docker-compose.yml` publishes).
1. Open `http://localhost:8010/docs` in a browser → Swagger UI lists `GET /api/uptime` under the `uptime` tag.
2. Expand `GET /api/uptime`, click `Try it out`, then `Execute` → the response panel shows code `200` and a JSON body with exactly two keys, `uptime_seconds` (a number, for example `37.402`) and `started_at` (a string such as `2026-11-02T14:48:28.123456+00:00`).
3. In a terminal run `curl -i http://localhost:8010/api/uptime` → the first line reads `HTTP/1.1 200 OK`, `content-type` is `application/json`, and the body has the same two keys.

### Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart
Prerequisites: as for criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `50.120`) → the value is 0 or greater.
2. Wait about one second, then run the same command again → `uptime_seconds` is larger than the first value by roughly one second (for example `51.131`), never smaller and never negative.
3. Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` from the repo root → the run ends with `0 failed`.

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset
Prerequisites: as for criterion 1.
1. Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart, and compare `started_at` → both responses carry the identical string, and it ends with `+00:00`.
2. Compare `started_at` with the backend container's start time from `docker compose ps backend` (or the time you ran `docker compose up`) → they agree to within a few seconds, expressed in UTC.
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again → `started_at` is now later than the value from step 1, and `uptime_seconds` has dropped to a small number (a few seconds), which is how an operator tells a restart from a long-lived process.

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for criterion 1.
1. Open `http://localhost:8010/docs`, expand `GET /api/uptime`, and select the `Schema` view of the 200 response → it is named `UptimeResponse` and lists `uptime_seconds` (number) and `started_at` (string). Do not expect a `date-time` format on `started_at`; the document is not required to show one.
2. Open `backend/app/schemas/uptime.py` in the repository → it defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`, and `backend/app/routers/uptime.py` declares `response_model=UptimeResponse`.
