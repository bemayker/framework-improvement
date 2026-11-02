# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). **Its reproduction only runs on the deployed environment**: locally there is no edge cache, so the bug cannot be seen. It exercises the `to_verify` route (merged, awaiting verification on the deployed environment).
>
> ## Defect
>
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> ## Reproduction (deployed only)
>
> 1. `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`
> 2. Expected: two different `now` values. Actual: identical values.
>
> Locally both calls differ, because nothing caches them.
>
> ## Acceptance criteria
>
> 1. `GET /api/time` responses carry `Cache-Control: no-store`.
> 2. A test asserts the header on the response.
> 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
>
> ## Notes
>
> Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete.
>
> Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 19 comments read on the ClickUp task, all mayker-dev PR and status notices from earlier runs → not acted on because none states a requirement or corrects the description.
- Merged since the last plan: n/a (fresh plan in this run, branched from current main 13925e1; no `[merged-since]` lines in the dispatch).
- Assumption (dependency gap): FEAT-1 is `complete` in the tracker, but its code is **absent from main**. Verified with `git ls-tree origin/main backend/app`: there is no `routers/server_time.py`, no server-time schema or service, and `backend/app/main.py` registers only the version, notes and health routers. A header cannot be added to a route that does not exist, so this plan **recreates FEAT-1's `GET /api/time` slice** (schema, service, router, registration, tests) to FEAT-1's own acceptance criteria, read from ClickUp task 123k99ctzxk, and adds the `Cache-Control: no-store` fix on top. Scope is bounded to what FEAT-1 specified: `{"now": ISO 8601 UTC with explicit offset, "timezone": "UTC"}`, computed per request, defined by a Pydantic schema. Nothing beyond that is added.
- Assumption (layering): a previous run's BUG-01 build recreated the slice as Router plus Schema with no service module, and its approval logged that as a residual layering doubt against the sibling `version` and `health` slices, which each have a `services/` module. This plan follows the sibling shape (Router, Service, Schema) so the slice matches its neighbours; the service is one function, so the cost is one small file.
- Assumption (offset spelling): FEAT-1 asks for "ISO 8601 UTC with explicit offset". Pydantic v2 serialises an aware UTC `datetime` with a `Z` suffix; this plan makes `now` a `str` produced by `datetime.isoformat()` on an aware UTC value, which spells the offset as `+00:00`, the unambiguous reading of "explicit offset".

## Plan Overview
Backend only. Recreate the `GET /api/time` endpoint FEAT-1 specified and make every response it returns carry `Cache-Control: no-store`, so the CDN in front of the deployed API stops caching it. Three new modules in the existing Router to Service to Schema layering (`routers/server_time.py`, `services/server_time_service.py`, `schemas/server_time.py`), one line of router registration in `backend/app/main.py`, a unit test for the service and an integration test for the route that asserts the header (criterion 2). No database, no frontend, no new dependency. Criterion 3 is a human check on the deployed environment after merge; the item carries the `mayker:to-verify` tag and routes to `to_verify`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, with response header `Cache-Control: no-store`.
- Service layer: `backend/app/services/server_time_service.py` exposes `get_server_now() -> str`, returning `datetime.now(timezone.utc).isoformat()`. The clock is read inside the function on every call, never at import time or in a default argument, so `now` is fresh per request. The `datetime` reference is module-level (imported as `from datetime import datetime, timezone`) so a unit test can monkeypatch it with a fixed clock.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time(response: Response) -> ServerTimeResponse`. It sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=get_server_now())`. The header value is a module constant `CACHE_CONTROL_NO_STORE = "no-store"` so the test and the router name one source. Setting it on the injected `Response` (not by building a `JSONResponse` by hand) keeps `response_model` validation in place.
- Schema: `backend/app/schemas/server_time.py`, `class ServerTimeResponse(BaseModel)` with `now: str` and `timezone: Literal["UTC"] = "UTC"`.
- Registration: `backend/app/main.py` imports `router as server_time_router` and adds `app.include_router(server_time_router)` after the existing three; the module docstring gains one clause naming FEAT-1/BUG-01's time router. No other change to `main.py`. CORS is untouched: only `GET` is used and it is already allowed.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no parameters.
- Response: 200, headers include `Cache-Control: no-store`, body:

```json
{"now": "2026-11-02T21:30:05.123456+00:00", "timezone": "UTC"}
```

- `POST /api/time` (any non-GET method): 405, FastAPI's default; not a new behaviour, asserted only as the route's reachable error case.

## Technology Selection
- Server time value: chose the standard library `datetime.now(timezone.utc).isoformat()` over any date library, because the stdlib produces an aware UTC ISO 8601 string with an explicit `+00:00` offset directly.
- Cache directive: chose FastAPI's injected `Response` parameter (installed dependency `fastapi`) to set the header over a custom middleware or a hand-built `JSONResponse`, because one header on one route needs neither, and the injected response keeps `response_model` validation.
- Response schema: chose Pydantic `BaseModel` (installed with FastAPI) over a bare dict, because FEAT-1 requires a schema in `backend/app/schemas/`.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: str`, `timezone: Literal["UTC"]`).
- [B] backend/app/services/server_time_service.py: `get_server_now()` returning the per-call aware UTC ISO 8601 string.
- [B] backend/app/routers/server_time.py: `GET /api/time` router setting `Cache-Control: no-store` on every response.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for `get_server_now()` (offset, aware UTC, per-call freshness with a fake clock).
- [B] backend/tests/integration/test_server_time_integration.py: HTTP cycle tests: 200 shape, `Cache-Control: no-store` header, two calls differ, POST is 405.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature writes.

### Modified files
- [B] backend/app/main.py: import and register the server time router (`app.include_router(server_time_router)`), docstring clause.

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` change: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure, and neither document lists the API's endpoints. No E2E spec files: no criterion is covered at the E2E tier (see Criterion coverage).

## Testing Strategy
- Unit tests: `get_server_now()` in the service layer. Happy path: the value parses with `datetime.fromisoformat`, is timezone-aware, has `utcoffset() == timedelta(0)` and ends in `+00:00`. Edge case: the clock is read per call, proved by monkeypatching the module's `datetime` with a fake whose `now(tz)` returns two different fixed instants on successive calls and asserting the two results differ and match them. Error case: the fake clock is called with `timezone.utc` (never naive `now()`), asserted on the argument it received.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_server_time_service_unit.py`
- Integration tests: real HTTP cycle through the session `client` fixture from `backend/tests/conftest.py` (no database needed). `test_get_time_returns_200_with_utc_now_and_timezone` (status, body keys exactly `now` and `timezone`, `timezone == "UTC"`, `now` aware with zero offset); `test_get_time_sets_cache_control_no_store` (criterion 2: `response.headers["cache-control"] == "no-store"`); `test_get_time_computes_now_per_request` (two consecutive calls, second parsed `now` strictly later than the first; microsecond resolution makes a sleep unnecessary); `test_post_time_returns_405_method_not_allowed`. Also one case built with `create_app()` and `DATABASE_URL` removed (mirroring `test_version_integration.py`), proving the endpoint answers with no database configured.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py, so `test_server_time_integration.py`
- E2E tests: not warranted. The criteria involve no navigation or UI interaction: the endpoint has no consumer in the frontend, so a browser spec would only call the API, which `testing_standards.md` Section 5 classes as a router integration test.
  - Directory: e2e/tests/
  - File: none for this item.
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (POST is refused), and the manual script from `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | Verifying it needs no navigation or interaction: it is a response header on a router, read off the HTTP response. |
| 2 | A test asserts the header on the response. | Integration | The criterion is itself the integration test `test_get_time_sets_cache_control_no_store`; no UI is involved. |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration | No UI path exists and the edge cache exists only on the deployed host; locally the two inputs the code controls are covered by `test_get_time_sets_cache_control_no_store` and `test_get_time_computes_now_per_request`, and the deployed check itself is the human step in the Manual verification plan (the item routes to `to_verify`). |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response has status 200 and header Cache-Control no-store |
| 2 | A test asserts the header on the response. | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then the header test passes with 0 failed |
| 3 | After deploy, the reproduction returns two different values. | covered at Integration, see Criterion coverage | Given the deployed environment behind its CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the backend is running locally (`docker compose up -d` from the repository root, backend published on its configured host port, 8000 by default) or through `uv run --directory backend uvicorn app.main:app --port 8000`. No database or seed data is needed.
This criterion has no UI; the observable check is the response header.
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers printed above the body → a line `cache-control: no-store` is present.
3. Read the body → it has the shape `{"now":"2026-11-02T21:30:05.123456+00:00","timezone":"UTC"}`, with `now` ending in `+00:00` and `timezone` exactly `UTC`.
4. Run `curl -si -X POST http://localhost:8000/api/time` → the status line reads `405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the feature branch with `uv` installed. No database needed.
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` → the summary line reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_sets_cache_control_no_store` asserts the `cache-control` response header equals `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: the merged change is deployed to the environment behind the CDN, and you know its public host (written below as `deployed-host`). This is a deployed-only check: it cannot be reproduced locally, where nothing caches the response.
1. Run `curl -s https://deployed-host/api/time; sleep 1; curl -s https://deployed-host/api/time` → two JSON bodies are printed.
2. Compare the two `now` values → they differ, the second about one second later than the first.
3. Run `curl -sI https://deployed-host/api/time` → a `cache-control: no-store` header is present, and if the CDN reports cache status (for example an `x-cache` or `cf-cache-status` header) it does not read `HIT`.
4. If both checks hold, move the tracker item from `to_verify` to Done; if the values are identical, record the full headers of both responses on the item.
