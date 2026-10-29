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
- Comment (tracker): 14 comments read, all earlier runs' PR-opened notes → Addressed by: not acted on because none carries a correction or amendment to the item text; none overrides the description.
- Assumption (ingest observation, verified against the code at plan base 2ba5477): FEAT-1 is complete in the tracker, but `GET /api/time` does not exist on main. `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`; no `server_time` module exists under `backend/app/` or `backend/tests/`, and `backend/app/main.py` registers only the version, notes and health routers (the sandbox reset 70600df removed FEAT-1's code and the earlier BUG-01 fix 795b836). The item says "FEAT-1 is complete" and scopes the fix to `server_time.py`, but a header cannot be set on a route that does not exist, so this plan recreates the minimal FEAT-1 slice the fix needs (router, response schema, registration in `main.py`) and adds the header in the router. The recreated contract follows FEAT-1's merged contract as recorded in docs/runs/deliver-20261024T062302Z/decisions-FEAT-1.md: body keys exactly `now` and `timezone`, `now` an ISO 8601 UTC value with a `+00:00` suffix read from the clock on every request, schema a Pydantic model in `backend/app/schemas/server_time.py`. Nothing beyond that slice is added.
- Merged since the last plan: n/a (fresh plan in this run, written against main at 2ba5477; no `[merged-since]` lines in the dispatch).

## Plan Overview
Backend only. Recreate `GET /api/time` (FEAT-1's endpoint, absent from main) as a router plus a response schema, register it in the app factory, and set `Cache-Control: no-store` on every response from that route so the CDN in front of the deployed API stops storing and replaying it. Tests: unit tests for the schema, integration tests over the HTTP cycle asserting the header and per-request freshness, one route-registration unit test. Criterion 3 is deployed-only and is verified by a human after deploy (the `to_verify` route).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time and sets the response header `Cache-Control: no-store`. Router `APIRouter(prefix="/api", tags=["server-time"])`, matching `backend/app/routers/version.py`'s shape; the handler takes FastAPI's `Response` parameter and sets `response.headers["Cache-Control"] = "no-store"` (named module constant, with a one-line comment saying why: the CDN caches a response that carries no directive).
- Service layer: none. The only logic is reading the clock and normalising to UTC, which lives on the schema as a `now_utc()` classmethod (`datetime.now(UTC)` called inside it, so per request, never at import time). No service module: a service wrapping one stdlib call adds a layer with nothing in it.
- Schema: `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"] = "UTC"`; a `field_validator` rejects a naive datetime and converts an aware one to UTC; a `field_serializer` renders `now` with `isoformat()` so the offset is `+00:00` (Pydantic's default renders `Z`).
- Registration: `backend/app/main.py` imports the router and calls `app.include_router(server_time_router)` alongside the existing three; the module docstring's router list gains one clause naming it. No change to CORS (GET is already allowed) or to the lifespan.
- Repository layer: none. No database access; the endpoint must answer with `DATABASE_URL` unset.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no query parameters
- Response: 200, `Content-Type: application/json`, header `Cache-Control: no-store`, body:

```json
{"now": "2026-10-29T18:12:19.123456+00:00", "timezone": "UTC"}
```

- Errors: `POST /api/time` returns 405 (FastAPI default for an unregistered method); no other error path exists.

## Technology Selection
- Cache directive: chose setting the header through FastAPI's injected `Response` object (installed dependency, `fastapi`) over a custom middleware or a new caching library, because one header on one route needs no app-wide mechanism and no new dependency.
- Current-time source: chose the standard library's `datetime.now(UTC)` over any date library (`pendulum`, `arrow`), because the stdlib covers an aware UTC timestamp completely.
- Response schema with offset rendering: chose Pydantic's `field_validator` and `field_serializer` (installed through `fastapi`) over a hand-written dict or JSON encoder, because the installed validation layer already enforces awareness and controls serialisation.
- No new dependency is added; `backend/pyproject.toml` and `backend/uv.lock` are untouched.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router that sets `Cache-Control: no-store` and returns `ServerTimeResponse.now_utc()`
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (aware-UTC `now`, `timezone` literal `UTC`, `+00:00` serialisation, `now_utc()` per-call factory)
- [B] backend/tests/unit/test_server_time_unit.py: schema unit tests (aware value normalised to UTC, naive value rejected, serialised `now` ends in `+00:00`, `now_utc()` reads the clock on each call)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests asserting `Cache-Control: no-store` on the response and on a second consecutive response, the exact body key set and `+00:00` offset, two requests returning distinct `now` values under a stepped clock, an answer with `DATABASE_URL` unset, and 405 on POST
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server-time router; docstring router list gains one clause
- [B] backend/tests/unit/test_main_unit.py: one test asserting `/api/time` is among the app's custom routes
No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` changes: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints.

## Testing Strategy
- Unit tests: `ServerTimeResponse` validation and serialisation, and route registration in the app factory.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_server_time_unit.py`; `test_main_unit.py` extended)
- Integration tests: `GET /api/time` over the real HTTP request/response cycle with FastAPI's `TestClient` (the shared `client` fixture in backend/tests/conftest.py, and a fresh `create_app()` client with `DATABASE_URL` removed). The header assertion is the regression test for this defect. Per-request freshness uses a monkeypatched clock in the schema module so the two values are guaranteed distinct without a sleep.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion requires navigation or interaction through the UI (the endpoint has no UI consumer), so no spec file is written.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (POST is rejected); criterion 3's scenario is a deployed-environment check performed by a human.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header read off the router's HTTP response |
| 2 | A test asserts the header on the response | Integration | Satisfied by the integration test itself (`test_server_time_integration.py`), which asserts the header on the response; no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Integration | Locally nothing caches, so no automated tier can reproduce the CDN; the integration tier covers the two halves the fix controls (the no-store directive on every response, and two requests returning distinct `now` values), and the deployed check is the human `to_verify` step in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response is 200 and carries Cache-Control: no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check by a human | Given the fix is deployed behind the CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally on port 8000 (`uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed.
1. In a terminal, run `curl -s -i http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the response headers in the same output → a `cache-control: no-store` header is present (header names may be lower-case).
3. Read the body in the same output → JSON with exactly the keys `now` and `timezone`, `timezone` is `"UTC"`, and `now` ends in `+00:00`.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out at the merged commit; uv installed.
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` → the run ends with `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
This cannot be verified locally: nothing caches locally. The check runs on the deployed environment, by a human, after the merge (the item lands at `to_verify`).
Prerequisites: the merged commit is deployed; you know the deployed host name (`{deployed-host}` below).
1. In a terminal, run `curl -s -i https://{deployed-host}/api/time` → status 200 and a `cache-control: no-store` header in the output (if the CDN rewrites or strips it, the fix is not effective at the edge: record that as a failure).
2. Run `curl -s https://{deployed-host}/api/time; sleep 1; curl -s https://{deployed-host}/api/time` → two JSON bodies whose `now` values differ (the second is about one second later).
3. Repeat step 2 once more → again two different `now` values, confirming no cached copy is replayed.
