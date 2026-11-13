# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). **Its reproduction only runs on the deployed environment**: locally there is no edge cache, so the bug cannot be seen. It exercises the `to_verify` route (merged, awaiting verification on the deployed environment).
>
> **Defect.** On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> **Reproduction (deployed only).**
> 1. `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`
> 2. Expected: two different `now` values. Actual: identical values.
>
> Locally both calls differ, because nothing caches them.
>
> **Acceptance criteria**
> 1. `GET /api/time` responses carry `Cache-Control: no-store`.
> 2. A test asserts the header on the response.
> 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
>
> **Notes.** Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 42 comments read across 2 pages, all mayker-dev's own PR-opened notes from earlier runs (none merged) → not acted on because none is a human or actionable comment; they carry no correction to the description.
- Assumption (dependency code absent from main): FEAT-1 is `complete` in the tracker, but on main at bc70dc4838eea4f209f70c9cce8bf7aa495a7352 `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, and `backend/app/main.py` registers no time router. Verified with `git ls-tree` at the plan base. The sandbox resets (#769, #779) removed the earlier landings (#770 had shipped this same fix). The defect cannot be fixed on a route that does not exist, so this plan recreates FEAT-1's endpoint (router, schema, service, registration in `main.py`) to FEAT-1's own acceptance criteria and adds the `Cache-Control: no-store` fix on it. That is the minimum the criteria need; nothing beyond FEAT-1's contract is added.
- Assumption (FEAT-1 contract): the recreated endpoint follows FEAT-1's tracker criteria verbatim: 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request and never naive, body defined by a Pydantic schema in `backend/app/schemas/`.
- Merged since the last plan: n/a (fresh plan, branched from current main bc70dc4838eea4f209f70c9cce8bf7aa495a7352; no `[merged-since]` lines in the dispatch).

## Plan Overview
Backend only. Recreate `GET /api/time` (FEAT-1's endpoint, absent from main) in the existing Router to Service to Schema shape used by the version slice, register it in `backend/app/main.py`, and set `Cache-Control: no-store` on every response from the router so a CDN never serves a cached `now`. Unit tests cover the service's UTC formatting and per-call freshness; integration tests cover the header, the body shape and freshness over the HTTP cycle; `test_main_unit.py` gains a route-registration test. No database, no frontend, no new dependency.

## Reproduction
- Classification: deployed-only. The stale value needs the edge cache (CDN) in front of the API, which exists only on the deployed environment; locally nothing caches, so two calls already differ.
- Deployed reproduction (before fix): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` returns identical `now` values. (Note: on main at the plan base the route does not exist at all, so locally it currently returns 404.)
- Local observable for the cause: `curl -sI http://localhost:8010/api/time` carries no `Cache-Control` header before the fix and `Cache-Control: no-store` after it. The integration test `test_get_time_sets_cache_control_no_store` is the automated form of that check.
- Post-deploy verification (criterion 3): a human re-runs the deployed reproduction after merge and deploy; the item rests in the `to_verify` route until then.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/time` (recreated), returns 200 with `ServerTimeResponse` and the response header `Cache-Control: no-store`.
- Router (`backend/app/routers/server_time.py`, new): `APIRouter(prefix="/api", tags=["server-time"])`; handler `get_time(response: Response) -> ServerTimeResponse` sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=get_server_time(), timezone="UTC")`. A one-line comment says why: `no-store` stops a CDN in front of the API from serving one cached `now`.
- Service layer (`backend/app/services/server_time_service.py`, new):
  - `to_utc_iso(moment: datetime) -> str`: raises `ValueError` on a naive datetime, otherwise returns `moment.astimezone(UTC).isoformat()` (explicit `+00:00`).
  - `get_server_time() -> str`: `to_utc_iso(datetime.now(UTC))`, evaluated per call, never cached at import time.
  - Import `datetime` as a module-level name (`from datetime import UTC, datetime`) so tests can patch `server_time_service.datetime`.
- Schema (`backend/app/schemas/server_time.py`, new): `class ServerTimeResponse(BaseModel)` with `now: str` and `timezone: Literal["UTC"]`.
- Registration (`backend/app/main.py`): import `router as server_time_router` from `app.routers.server_time` and `app.include_router(server_time_router)` after the existing three; update the module docstring's list of registered routers with one clause naming BUG-01 (recreating FEAT-1's time router).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `ServerTimeResponse`, header `Cache-Control: no-store`:

```json
{"now": "2026-11-13T15:42:23.123456+00:00", "timezone": "UTC"}
```

`now` is the server's current time at request, ISO 8601, always UTC with an explicit `+00:00` offset. Any other method returns 405.

## Technology Selection
- Cache directive: chose FastAPI's native `Response` parameter setting one header in the router (rung 3, already installed) over a cache-control middleware or a new dependency; one route needs it, so a middleware would widen the change to every endpoint unasked.
- UTC timestamp: chose the standard library's `datetime.now(UTC).isoformat()` (rung 1) over `pendulum`, `arrow` or any time library.
- Response schema: chose Pydantic `BaseModel` with `typing.Literal` (rung 3, already installed via FastAPI) over a bare dict, as FEAT-1 requires.
- Router, service and schema modules: no stdlib call, native platform feature or installed dependency replaces them; they are the project's existing layering, recreated here.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router, sets `Cache-Control: no-store` on the response (recreates FEAT-1's router plus the fix)
- [B] backend/app/services/server_time_service.py: `to_utc_iso()` and `get_server_time()`, per-call UTC time with explicit offset
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now`, `timezone`)
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for UTC formatting, non-UTC conversion, naive rejection and per-call freshness
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for the `no-store` header, body shape, per-request freshness and 405 on POST
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-01/uat_script.md: build-feature Section 14 step 3 copy of the manual UAT script

### Modified files
- [B] backend/app/main.py: import and `include_router` the server-time router; docstring clause naming it
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: neither lists the API's endpoints, and this item changes no project structure, run configuration, dependency or test infrastructure. No E2E spec is produced, because no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `server_time_service` (`to_utc_iso` happy path with `+00:00`, aware non-UTC input converted, naive input raises `ValueError`; `get_server_time` differs between calls with a patched clock) and the app factory's route registration.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle on `GET /api/time` through the session `client` fixture in `backend/tests/conftest.py` (no database needed): `Cache-Control` equals `no-store`, 200 with `timezone` `"UTC"` and a `now` whose offset is zero, two requests with a patched clock return different `now`, POST returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. The toggle is ENABLED, but no criterion requires navigation or interaction through a UI (backend only, no frontend consumer).
  - Directory: e2e/tests/
  - File: none (no spec for BUG-01)
- UAT scenarios: one scenario per criterion plus the "POST is rejected" edge case, phrased against the API response; criterion 3's scenario is marked as verified on the deployed environment.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_sets_cache_control_no_store`, `test_create_app_registers_server_time_route` | Verifying it needs no navigation or interaction: it is a response header on the router's HTTP cycle |
| 2 | A test asserts the header on the response | Integration | `test_get_time_sets_cache_control_no_store` | Verifying it needs no navigation or interaction: the criterion is the existence of the router-level header assertion itself |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_time_returns_fresh_now_per_request`, `test_get_time_sets_cache_control_no_store`, `test_get_server_time_differs_between_calls_with_patched_clock` | Verifying it needs no navigation or interaction, and the edge cache exists only on the deployed environment, so no local tier can reproduce it: the automated tiers cover both causes (per-request `now` and the `no-store` directive) and the deployed check is the human step in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the status is 200 and the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the header assertion passes with 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the fix is deployed behind the CDN, When a client requests GET /api/time twice a second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the stack is running from the repository root with `docker compose up -d --build backend`, and the backend answers on `http://localhost:8010`. This criterion has no UI; the observable check is the response header.
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK` and the headers include `cache-control: no-store`.
2. In the same output, read the body → a JSON object with `now` (for example `"2026-11-13T15:42:23.123456+00:00"`, ending in `+00:00`) and `timezone` equal to `"UTC"`.
3. Run `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8010/api/time` → prints `405`.

### Criterion 2: a test asserts the header on the response
Prerequisites: `uv` installed; run from the repository root.
1. Open `backend/tests/integration/test_server_time_integration.py` → `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → expected `0 failed`; the run includes `test_get_time_sets_cache_control_no_store`.

### Criterion 3: after deploy, the reproduction returns two different values
Prerequisites: the fix is merged and deployed; the deployed host name is known (replace `<deployed-host>` below). This cannot be verified locally, because the edge cache exists only on the deployed environment.
1. Run `curl -sI https://<deployed-host>/api/time` → the headers include `cache-control: no-store`, and no CDN cache-hit header (for example `x-cache: HIT` or `cf-cache-status: HIT`) is present.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ by about one second (for example `...T15:42:23...+00:00` then `...T15:42:24...+00:00`).
3. Repeat step 2 once more a minute later → the `now` values again differ from each other and from the earlier run.
