# Implementation Plan, TEST-07: Uptime endpoint

## Feature
> A small backend feature for the autonomous `/deliver` run (Arm E of measured run 2). Independent of TEST-08, which is frontend-only, so the two can be built in parallel.
>
> ### What
> `GET /api/uptime` reports how long the process has been running, so an operator can tell a restart from a long-lived process without reading container logs.
>
> ### Acceptance criteria
> 1. `GET /api/uptime` returns **200** with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
> 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
> 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
>
> ### Notes
> Router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. Touches `main.py`'s router registration, so it must not run concurrently with another backend item that does the same.

## Acceptance Criteria
- [ ] 1. `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`.
- [ ] 2. `uptime_seconds` is a non-negative number and increases between two calls a second apart.
- [ ] 3. `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`.

## Re-Plan Feedback

- Comment (tracker): "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/39 … One recorded residual, not a defect today: `started_at` is captured at module import, which equals process start only because the Dockerfile launches a single uvicorn process with `--factory` and no `--workers`. If the deployment ever gains workers, each child would capture its own value and `uptime_seconds` would stop being monotonic across calls." → Addressed by: the capture moves out of module import. `backend/app/main.py`'s existing `lifespan` startup hook calls `uptime_service.record_start()`, which captures the instant once per process and is a no-op on a second call. Module import is not application startup: a module is imported by tooling, by pytest collection and by a reloader's child import without the application ever serving a request, so an import-time capture answers a different question from the one criterion 3 asks. The residual itself is narrowed but not eliminated, and is recorded rather than silently inherited: a uvicorn deployment with `--workers N` runs one lifespan per worker process, so each worker would still report its own start instant and a load-balanced caller would see `uptime_seconds` jump between workers. `backend/Dockerfile` launches exactly one process (`uv run uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8010`, no `--workers`), so today the value is the process's. This plan adds no shared store, env-var stamp or `/proc` read to make it worker-safe: nothing in the acceptance criteria asks for a multi-worker deployment, and building for one would be gold plating (`user_story_alignment.md` Section 3). The build repeats this note under the PR's known improvements.
- Comment (tracker): "…It claimed the OpenAPI schema documents `started_at` as string with `format: date-time`. Probing the generated schema showed a bare `{"type": "string"}` — the `field_serializer`'s `-> str` return annotation is what pydantic derives the serialisation-mode schema from… The serializer was deliberately not rewritten to make the document true: the wire value is already correct and two tests pin it, so changing working code to satisfy a document would be the wrong direction." → Addressed by: the prior run's judgement is kept — the wire value stays the contract and the serialiser is not rewritten to satisfy a document — and the document is made true by the cheaper route instead. The `started_at` field carries `json_schema_extra={"format": "date-time"}`, which adds the annotation to the generated schema without touching the serialiser or the wire value, and one unit test asserts the serialisation-mode schema for `started_at` is `{"type": "string", "format": "date-time"}`. If that annotation does not reach the serialisation-mode schema on the installed pydantic, the builder removes it, drops that one unit test, and the UAT script describes the bare `{"type": "string"}` exactly as the prior run's corrected script did, recorded in the PR as an OPTIONAL known improvement. The wire value does not change either way.
- Comment (tracker): "This item was held behind FEAT-1 rather than built in parallel. Both register a router in `backend/app/main.py`, so the run serialized them." → Addressed by: `## Risks and Assumptions` and `shared_risks.md` both carry the overlap. FEAT-1 (server time endpoint) is at `plan_review` with an open draft PR #56 and is independent of TEST-07; both add one `app.include_router(...)` line to `create_app()` and one registration assertion to `backend/tests/unit/test_main_unit.py`, so the two are serialized rather than built concurrently. TEST-06 (echo) carried the same overlap and is merged, so it is no longer a live concurrency risk; its landed registration is the insertion point this plan appends after.
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset)… Code revert pending: the operator reverts ffbfc12 (with 8794a99 and a9695cc) on the sandbox main in one `chore/*` PR before the run. Do not run /deliver against this item until that revert has merged." → Not acted on as a design change, and recorded as a satisfied precondition: the dispatching session established that `origin/main` at 374e468 carries no uptime code (`git grep -i uptime origin/main -- backend` finds nothing; PRs #26 and #39 were reverted by #29 and #44). This is therefore a first plan on a clean sandbox rather than a re-plan, nothing has to be reconciled before the build, and no file in the File Manifest already exists on main.
- Comment (tracker): "mayker-dev: PR opened for TEST-07 — https://github.com/bemayker/framework-improvement/pull/26 (branch `feature/TEST-07-uptime-endpoint`). Autonomous delivery run deliver-20260903T125824Z…" → Not acted on: a framework-generated link comment from a run whose PR has since been reverted. It carries no requirement, no correction and no constraint on this plan; it is recorded here only so that a comment which reached the planner is not indistinguishable from one nobody read.

## Plan Overview
One database-free backend endpoint, built on the layering this project already uses for `GET /api/version` and `GET /api/health`: a Router → Service → Schema slice with no repository layer, because nothing is persisted and nothing is read from the database. `backend/app/services/uptime_service.py` captures the process start instant once and computes elapsed time; `backend/app/routers/uptime.py` maps that onto the response schema and holds no business logic; `backend/app/schemas/uptime.py` defines the response body. `backend/app/main.py` gains one import pair, one `app.include_router(...)` line, one `record_start()` call inside the existing `lifespan` hook, and one docstring clause in the style that file already uses to record which feature registered which router. No frontend work, no migration, no dependency change.

## Frontend Plan
No frontend changes required. This feature adds one JSON endpoint and renders nothing; no component, route or piece of state is touched.

- Design reference notes: AI freestyle (`CLAUDE.md` Design Reference mode is `NONE`, and this feature has no frontend work for a design to govern in any case).

## Backend Plan
- Endpoints: `GET /api/uptime` — returns the process's start instant and how many seconds it has been running. Registered on an `APIRouter(prefix="/api", tags=["uptime"])` in `backend/app/routers/uptime.py`, exactly the shape `version.py`, `health.py` and `echo.py` already use.
- Service layer: `backend/app/services/uptime_service.py`, mirroring `version_service.py`'s role as the business-logic home for a database-free endpoint. It holds two module-level values and two public functions. `record_start()` captures `datetime.now(timezone.utc)` and a `time.monotonic()` reading into module-level state, once per process: a second call is a no-op and returns the value already captured. It is called from the `lifespan` startup hook in `backend/app/main.py`, which is what makes criterion 3's "captured once at application startup" true rather than "captured at import". `get_uptime()` returns a small frozen dataclass `UptimeSnapshot(started_at: datetime, uptime_seconds: float)`, where `uptime_seconds` is the current `time.monotonic()` minus the monotonic reading taken at start, rounded to 3 decimals, and `started_at` is the wall-clock instant captured at start. The router maps that onto the schema, so no business logic sits in the router (`coding_standards.md` Section 2.2).
- Error/robustness case: if `get_uptime()` is reached with nothing recorded — an app instantiated without running its lifespan, which is what a bare `TestClient(app)` outside a `with` block does — it calls `record_start()` itself, logs a warning naming the condition, and answers with an uptime of approximately zero. The endpoint must answer 200 rather than 500, which is the same failure-absorbing posture `version_service.get_app_version()` takes for a missing distribution, and it follows that file's logging convention (`logging.getLogger(__name__)`, never `print()`).
- Repository layer: none. This feature persists nothing and reads nothing from the database, so the Repository rung of `coding_standards.md` Section 2.2 does not apply — the same shape `GET /api/version` and `GET /api/echo` already have. The endpoint must answer with `DATABASE_URL` unset, and an integration test pins that.
- Migrations: none. No schema change.

## API Integration Plan
No external API integration. `CLAUDE.md` declares no API References, and this feature consumes nothing outside the process.

## API Contract
- Method: `GET`
- URL: `/api/uptime`
- Request: no path parameters, no query parameters, no body, no authentication.
- Response, 200:

```json
{
  "uptime_seconds": 12.345,
  "started_at": "2026-09-20T09:14:02.481293+00:00"
}
```

`uptime_seconds` is a JSON number (a float, rounded to 3 decimals) and is never negative. `started_at` is a JSON string: the ISO 8601 rendering of an aware UTC datetime carrying the explicit `+00:00` offset, produced by `datetime.isoformat()` through a pydantic `field_serializer` so the suffix is deterministic rather than dependent on the installed pydantic's default datetime rendering (which emits `Z` on some versions). There is no error response: the endpoint takes no input to reject and absorbs its one internal failure mode as described in the Backend Plan, so 200 is the only status this route returns.

## Technology Selection
- Elapsed-time computation: chose the standard library's `time.monotonic()` over subtracting two `datetime.now(timezone.utc)` readings, because a wall-clock subtraction can move backwards when the host clock is stepped (an NTP correction, a VM resume, a manual clock change) while criterion 2 requires `uptime_seconds` to be non-negative and increasing. The monotonic clock is guaranteed non-decreasing, so the criterion holds by construction rather than by a `max(0.0, ...)` clamp that would hide the anomaly.
- Start-instant capture: chose the standard library's `datetime.now(timezone.utc)` over any third-party date/time package, because an aware UTC datetime is exactly what criterion 3 asks for and nothing needs installing.
- Startup hook: chose the `lifespan` async context manager already present in `backend/app/main.py` over adding a FastAPI `@app.on_event("startup")` handler (deprecated in the installed FastAPI) and over a module-import side effect, which is what the prior run used and what the tracker comment records a residual against. The existing hook covers the need, so no new mechanism is introduced.
- Uptime service module: no standard-library call, native platform feature or installed dependency covers it, so it is built here. It holds real business logic — capture-once semantics, the monotonic elapsed computation, and the un-recorded fallback — which `coding_standards.md` Section 2.2 forbids placing in the router. This is the opposite call from TEST-06, whose service module was declined because a pass-through would only have forwarded its argument.
- Response body: chose a pydantic `BaseModel` in `backend/app/schemas/uptime.py` over returning a bare `dict` from the router, because criterion 4 requires it and `pydantic` is already installed as a FastAPI dependency; no alternative rung applies, since the criterion names the mechanism.
- UTC offset rendering: chose pydantic's `field_serializer` (already installed with FastAPI) returning `value.isoformat()` over hand-formatting a `str` field in the router with `strftime`, because the installed dependency covers it and keeping the field typed as a datetime is what lets the schema stay the contract. Chosen over relying on pydantic's default datetime serialisation because that emits `Z` rather than `+00:00` on some installed versions, and criterion 3 asks for an explicit offset.
- OpenAPI `format: date-time` annotation: chose `json_schema_extra={"format": "date-time"}` on the field over rewriting the serialiser's return type, because the annotation is one argument on an existing field while the rewrite would change working code to satisfy a document — the direction the prior run's tracker comment explicitly rejected. The fallback, if it does not reach the serialisation-mode schema, is recorded in `## Re-Plan Feedback`.
- New dependency: none. `fastapi`, `pydantic` (via FastAPI) and the standard library cover every line of this feature, so `backend/pyproject.toml` is unchanged and no lockfile is regenerated.

## File Manifest
### New files
- [B] backend/app/schemas/uptime.py: `UptimeResponse` pydantic model with `uptime_seconds: float` and `started_at` (an aware datetime), a `field_serializer` rendering `started_at` as `isoformat()` with the `+00:00` offset, and `json_schema_extra={"format": "date-time"}` on that field. The response body criterion 4 mandates.
- [B] backend/app/services/uptime_service.py: the business logic — `record_start()` (capture the wall-clock start instant and a `time.monotonic()` reading, once per process, idempotent) and `get_uptime()` (return an `UptimeSnapshot` frozen dataclass with `started_at` and a non-negative `uptime_seconds` computed from the monotonic clock, falling back to a first capture plus a logged warning when nothing was recorded).
- [B] backend/app/routers/uptime.py: `APIRouter(prefix="/api", tags=["uptime"])` with `GET /uptime`, `response_model=UptimeResponse`, mapping the service's `UptimeSnapshot` onto the schema and holding no business logic.
- [B] backend/tests/unit/test_uptime_service_unit.py: unit tests for the service — happy path (a recorded start yields a non-negative `uptime_seconds` and the recorded `started_at`), edge case (`record_start()` is idempotent, so the second call returns the first value, and two consecutive `get_uptime()` calls never decrease), error case (nothing recorded: `get_uptime()` still answers, logs the warning, and yields an aware UTC `started_at`).
- [B] backend/tests/unit/test_uptime_unit.py: unit tests for the schema and the route's declared contract — `UptimeResponse` serialises `started_at` with an explicit `+00:00` offset and rejects a naive datetime, and the route built by `create_app()` declares `response_model=UptimeResponse` (criterion 4) with `format: date-time` on `started_at` in the generated serialisation-mode schema.
- [B] backend/tests/integration/test_uptime_integration.py: integration tests over the full HTTP cycle — 200 with both keys and their types (criterion 1), a strictly larger `uptime_seconds` across two calls a second apart (criterion 2), an identical `started_at` across two calls on the same client plus an offset-bearing ISO 8601 value that `datetime.fromisoformat` parses to UTC (criterion 3), and a 200 with `DATABASE_URL` unset.
- [G] e2e/uat/scenarios/TEST-07_uptime_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge-case scenario (a backend restart resets `uptime_seconds` and moves `started_at` forward).
- [G] e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md: the human-readable manual UAT script, expanded from this plan's `## Manual verification plan` with checkboxes, prerequisites and the summary table.
- [G] .claude/artifacts/TEST-07/uat_script.md: the artifact-directory copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the uptime router and the uptime service; add one `app.include_router(uptime_router)` line at the end of the existing registration block in `create_app()`; add one `uptime_service.record_start()` call inside the existing `lifespan` hook, before the database branch, so the start instant is captured on every startup path including the one where `DATABASE_URL` is unset; and extend the module docstring's per-feature sentence with "and TEST-07 the uptime router", in the style the file already uses. Nothing else in the factory changes.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_uptime_route`, matching the per-router registration assertions TEST-02, TEST-05 and TEST-06 already added to this file.

No dependency change: this feature adds no package to `backend/pyproject.toml`, so `uv.lock` is not regenerated and no lockfile entry appears above.

No documentation change: build-feature Section 15's condition is not met. The feature adds one endpoint on the existing router pattern and changes no project structure, no run configuration, no dependency and no test infrastructure. Neither `README.md` nor `docs/DEVELOPMENT.md` enumerates the application's endpoints (checked: neither file lists any `/api/` route), so neither needs an edit.

## Testing Strategy
- Unit tests: the uptime service's business logic (the capture-once guarantee, the monotonic non-decreasing computation, and the un-recorded fallback), plus the schema's serialisation of `started_at` with an explicit `+00:00` offset, plus the route's declared contract read off the app `create_app()` builds (its `response_model` is `UptimeResponse`, and the serialisation-mode schema for `started_at` carries `format: date-time`). Module-level service state is controlled with `monkeypatch.setattr` on the service module rather than with a production-code test hook.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` → `test_uptime_service_unit.py` (the service module) and `test_uptime_unit.py` (schema and route contract)
- Integration tests: the full HTTP request/response cycle through the session-scoped `client` fixture in `backend/tests/conftest.py` — `GET /api/uptime` returns 200 with `uptime_seconds` (a number, not negative) and `started_at` (a string); two calls at least 1.05 seconds apart return a second `uptime_seconds` at least 1.0 greater than the first; two calls on the same client return a byte-identical `started_at`, which is the observable form of "captured once, not recomputed per request"; `started_at` matches ISO 8601 with a literal `+00:00` suffix and `datetime.fromisoformat` parses it to a UTC-aware value; and the endpoint answers 200 with `DATABASE_URL` unset. The one-second sleep is the measurement criterion 2 names rather than a hardcoded wait standing in for synchronisation, so `testing_standards.md` Section 5's no-hardcoded-waits anti-pattern (which is about E2E synchronisation) does not apply. No database fixture is used, because the endpoint touches no database.
  - Directory: `backend/tests/integration/`
  - Naming: `test_{module}_integration.py` → `test_uptime_integration.py`
- E2E tests: none for this feature. `E2E Tests` is ENABLED project-wide and stays enabled; the tier is scoped to the criteria whose covering tier is E2E (`testing_standards.md` Section 4's E2E row read with Section 6), and this feature has none — it adds no route, no component and no interactive element to the frontend, so there is nothing a browser could navigate to or interact with. No spec file is produced under `e2e/tests/`.
  - Directory: `e2e/tests/` (unused by this feature)
  - File: `{feature_id}_{slug}.spec.ts` (not produced)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (a backend restart resets the uptime and moves `started_at` forward), validated for well-formedness by CI rather than executed.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | Integration | Verifying it needs no navigation and no interaction: it is one router request/response cycle, exercised directly through the test client. No UI renders either value. |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | Integration | Verifying it needs no navigation and no interaction: it is two HTTP calls and an arithmetic comparison of the numbers they return. The monotonic guarantee underneath is additionally asserted at unit level against the service, which no browser test could reach. |
| 3 | `started_at` is captured once at startup, not per request, and carries an explicit UTC offset | Integration | Verifying it needs no navigation and no interaction: the capture-once half is two HTTP calls returning the same string, and the offset half is a string comparison on a response body. The capture-once semantics are additionally asserted at unit level against `record_start()`'s idempotence. |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation, no interaction and no HTTP cycle: it is a structural property of the code, asserted by importing `UptimeResponse` and reading the route's declared `response_model`. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at` | covered at Integration, see Criterion coverage | Given the backend is running, When a caller requests `/api/uptime`, Then the response is 200 and the body carries exactly the keys `uptime_seconds` (a number) and `started_at` (an ISO 8601 UTC string). |
| 2 | `uptime_seconds` is non-negative and increases between two calls a second apart | covered at Integration, see Criterion coverage | Given the backend has been running for a moment, When a caller requests `/api/uptime` twice with a second between the calls, Then both values are non-negative and the second is at least one second larger than the first. |
| 3 | `started_at` is captured once at startup and carries an explicit UTC offset | covered at Integration, see Criterion coverage | Given the backend has not restarted between the calls, When a caller requests `/api/uptime` twice, Then `started_at` is identical in both responses and ends in the explicit offset `+00:00`. |
| 4 | The response body is defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the built application, When the uptime route's declared response model is inspected, Then it is the `UptimeResponse` schema from `backend/app/schemas/uptime.py` and the 200 body carries exactly the keys `uptime_seconds` and `started_at`. |
| edge | A restart resets the uptime | covered at Integration, see Criterion coverage (the capture-once assertion is its in-process form) | Given the backend is restarted, When a caller requests `/api/uptime` again, Then `started_at` is later than before the restart and `uptime_seconds` has dropped back near zero. |

## Manual verification plan

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`
Prerequisites: Docker and Docker Compose running; the repository checked out on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`); the stack up via `docker compose up -d --build` from the repository root, with `docker compose ps` showing `db` healthy and `backend` running; no other process bound to host port `8010` (the mapping comes from `docker-compose.yml`); a terminal with `curl`.
1. In a terminal, run `curl -i "http://localhost:8010/api/uptime"` → the first response line reads `HTTP/1.1 200 OK`.
2. Read the body printed by that same command → it is a single JSON object with exactly two keys, for example `{"uptime_seconds":12.345,"started_at":"2026-09-20T09:14:02.481293+00:00"}`. `uptime_seconds` is a bare number with no quotes around it, `started_at` is a quoted string, and there is no third key.
3. Open `http://localhost:8010/api/uptime` in the browser → the page renders the same two-key JSON object and nothing else.

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart
Prerequisites: same as criterion 1, and the backend has not been restarted since criterion 1's steps.
1. In a terminal, run `curl -s "http://localhost:8010/api/uptime"` and write down the `uptime_seconds` value → it is a number greater than or equal to 0, never negative and never a quoted string.
2. Wait at least two seconds, then run `curl -s "http://localhost:8010/api/uptime"` again and write down the new `uptime_seconds` → the second number is larger than the first by at least 1, and the difference is roughly the number of seconds you waited (a two-second wait gives a difference of about 2).
3. In a terminal, run `curl -s "http://localhost:8010/api/uptime"` three times in a row with no wait between them → the three `uptime_seconds` values are non-decreasing (each one greater than or equal to the previous), confirming the number never runs backwards.

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset
Prerequisites: same as criterion 1, and the backend has not been restarted since criterion 2's steps.
1. In a terminal, run `curl -s "http://localhost:8010/api/uptime"` and copy the full `started_at` value, for example `2026-09-20T09:14:02.481293+00:00` → the string ends with the literal five characters `+00:00`. It must not end with `Z`, and it must not end with the digits alone and no offset at all.
2. Wait at least five seconds, then run `curl -s "http://localhost:8010/api/uptime"` again and compare its `started_at` with the value you copied → the two strings are identical, character for character, microseconds included. A value that changed between the two calls would mean the instant is recomputed per request.
3. In a terminal, run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s "http://localhost:8010/api/uptime"` → `started_at` is now a later time than the value you copied in step 1, and `uptime_seconds` has dropped back to a small number (under 60). This is the observable check that the instant is tied to application startup rather than to a build-time constant or to the request.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
This criterion is structural and cannot be fully verified through a running UI; three observable checks stand in for it.
Prerequisites: same as criterion 1, plus the repository open in an editor.
1. Open `http://localhost:8010/openapi.json` in the browser and search for `UptimeResponse` → the schema is present under `components.schemas` with the properties `uptime_seconds` (type `number`) and `started_at` (type `string`), and the 200 response of `/api/uptime` references it. A bare dict return would produce no named schema here.
2. Open `http://localhost:8010/docs` in the browser and expand `GET /api/uptime` → the example response shows both fields under the `UptimeResponse` model name.
3. Open `backend/app/schemas/uptime.py` in the repository → the file exists and defines `class UptimeResponse(BaseModel)` with those two fields, and `backend/app/routers/uptime.py` names it as `response_model=UptimeResponse` on the route decorator.

## Risks and Assumptions
Assumptions made rather than blocked on (`user_story_alignment.md` Section 4), each recorded here and repeated in the PR description:

1. `uptime_seconds` is a float rounded to 3 decimals. Criterion 1 says "a number" and criterion 2 needs it to increase across a second, which a millisecond-resolution float does comfortably; the rounding keeps the response readable instead of printing seventeen significant digits.
2. `started_at` renders with the `+00:00` offset rather than `Z`. Both are valid ISO 8601 UTC, and criterion 3's "explicit offset" is read as the numeric form, which is also what the item's own prior-run comment records as the delivered shape.
3. The start instant is recorded once per process, so repeated `create_app()` calls inside one process (which the test suite makes) share one value. That is what "how long the process has been running" means, and it is what makes the capture-once integration assertion meaningful.
4. `GET /api/uptime` is unauthenticated and uncached, like every other endpoint in this project. No `Cache-Control` header is added: nothing asks for one, and adding one would be gold plating.

Concurrency risk: `backend/app/main.py` and `backend/tests/unit/test_main_unit.py` are shared with FEAT-1 (server time endpoint), which is independent of this item and currently at `plan_review` with an open draft PR. Serialize the two builds rather than running them concurrently; `shared_risks.md` carries the detail.
