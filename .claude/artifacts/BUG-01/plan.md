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
> **Notes.** Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 37 comments read by the dispatching session (2 pages), all framework PR-opened notes from earlier runs → not acted on because none carries a correction or amendment to the item text (recorded in decisions.md for run deliver-20261110T131433Z).
- Merged since the last plan: n/a (fresh plan, branched from current main ac6e44c; no earlier plan.md for BUG-01 exists in this checkout).
- Assumption (dependency code absent on main): FEAT-1 is `complete` in the tracker, but `backend/app/routers/server_time.py` and its schema and service do not exist on main @ ac6e44c (removed by the sandbox reset commit ac6e44c, confirmed with `git log -- backend/app/routers/server_time.py` and a grep of `backend/app`; `backend/app/main.py` registers only version, notes and health). The item's own notes name `server_time.py` as the file to fix, and criterion 1 cannot hold on an endpoint that answers 404. This plan therefore recreates the endpoint to FEAT-1's tracker contract (`{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, computed per request, Pydantic schema in `backend/app/schemas/`) with the `Cache-Control: no-store` fix built in, and registers it in `backend/app/main.py`. This adds nothing past FEAT-1's contract and BUG-01's three criteria (no other headers, no query parameters, no frontend).
- Assumption (offset spelling): `now` is serialised as `datetime.now(timezone.utc).isoformat()`, which spells the offset `+00:00`. A Pydantic `datetime` field would serialise UTC as `Z`; the explicit numeric offset is the unambiguous reading of FEAT-1's "explicit offset, never naive", so the schema field is `str`, produced by the service.
- Assumption (criterion 3): it is a human check on the deployed environment, outside anything this checkout can run. The build covers its cause (criterion 1's header) with an integration test and hands the deployed check over through the `mayker:to-verify` route the item already carries.

## Plan Overview
Backend only. Recreate `GET /api/time` as a router, a Pydantic response schema and a one-function service, following the existing version slice's shape (`routers/version.py`, `schemas/version.py`, `services/version_service.py`), and set `Cache-Control: no-store` on every response from that route through FastAPI's injected `Response` object. Register the router in `backend/app/main.py`. Unit tests cover the service (UTC-aware, explicit offset, per-call freshness); integration tests cover the HTTP cycle including the header (criteria 1 and 2). No database, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time; every response carries `Cache-Control: no-store` so no shared cache (the deployed CDN) may store it.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, handler `get_server_time(response: Response) -> ServerTimeResponse` that sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=..., timezone="UTC")`. The header is set in the handler for this route only, not as app-wide middleware: the item scopes the defect to `/api/time`, and other endpoints' caching is out of scope.
- Service layer: `backend/app/services/server_time_service.py`, `current_utc_iso() -> str` returning `datetime.now(timezone.utc).isoformat()`, evaluated on every call (never at import time), so two calls a second apart differ. A module constant `SERVER_TIMEZONE = "UTC"` is the schema's timezone value.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: str` and `timezone: Literal["UTC"]`.
- Registration: `backend/app/main.py` imports `router as server_time_router` and adds `app.include_router(server_time_router)` after the existing three; the module docstring gains one clause naming FEAT-1/BUG-01's time router. No other change to the factory.
- Repository layer: none, the endpoint needs no database (it must answer with `DATABASE_URL` unset, like `/api/version`).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-10T13:14:33.512301+00:00", "timezone": "UTC"}
```

- Errors: `POST /api/time` returns 405 (FastAPI default for an unregistered method); no other error path exists.

## Technology Selection
- UTC timestamp: chose the standard library's `datetime.now(timezone.utc).isoformat()` over any date library, because the stdlib already yields a timezone-aware ISO 8601 string with an explicit offset.
- Cache directive: chose FastAPI's injected `Response` parameter (an installed dependency) to set the header on this route over a custom middleware or a new package, because a single header on a single route needs one line in the handler.
- Response schema: chose Pydantic `BaseModel` (installed, the pattern every existing schema uses); no alternative needed.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: str`, `timezone: Literal["UTC"]`)
- [B] backend/app/services/server_time_service.py: `current_utc_iso()` and `SERVER_TIMEZONE`, computed per call
- [B] backend/tests/unit/test_server_time_service_unit.py: service unit tests (offset present, parses as UTC-aware, two calls differ)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP cycle tests (200 shape, `Cache-Control: no-store` header, answers with DATABASE_URL unset, POST 405)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server-time router; docstring clause
- [B] backend/tests/unit/test_main_unit.py: assert `/api/time` is among the registered custom routes

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and the README lists no endpoints.

## Testing Strategy
- Unit tests: `server_time_service.current_utc_iso()` happy path (string parses with `datetime.fromisoformat` to an aware datetime with `utcoffset() == timedelta(0)` and ends `+00:00`), edge case (two calls with a patched clock returning distinct instants give distinct values, proving per-call evaluation, no `sleep`), error/robustness case (patched clock returning a fixed instant yields exactly its isoformat, proving no naive value and no caching inside the service). `create_app()` registers `/api/time` (in the existing `test_main_unit.py`).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: through the `client` fixture in `backend/tests/conftest.py`: `GET /api/time` returns 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` UTC-aware with explicit offset; the response's `Cache-Control` header equals `no-store` (criteria 1 and 2); the endpoint answers with `DATABASE_URL` unset (fresh `create_app()` as in the version test); `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E Tests is ENABLED, but no criterion involves navigation or interaction through the UI and there is no frontend change, so no spec is written (the per-criterion answer is below).
  - Directory: e2e/tests/
  - File: none (would be BUG-01_server_time_edge_cache.spec.ts)
- UAT scenarios: one scenario per criterion plus an edge case (the header is present on every repeated call), written as API-level Given/When/Then; criterion 3's scenario names the deployed host as its environment.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a response header of a router, read off the HTTP cycle |
| 2 | A test asserts the header on the response | Integration | the criterion is the integration test itself (`test_get_time_sets_cache_control_no_store` in test_server_time_integration.py) |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration, plus the human deployed check | no UI is involved and no local tier can reproduce the edge cache; the integration header test covers the cause, the deployed curl pair is the human verification carried by the `mayker:to-verify` route |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response status is 200 and the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then they report 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration (cause) plus human deployed check | Given the fix is deployed, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally (`docker compose up` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this endpoint.
1. In a terminal run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`.
2. Read the headers of that response → a line `cache-control: no-store` is present.
3. Read the body → JSON of the shape `{"now":"2026-11-10T13:14:33.512301+00:00","timezone":"UTC"}`: `now` ends in `+00:00`, `timezone` is `UTC`.
4. Run the same command again → `cache-control: no-store` is present again and `now` is later than in step 3.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the feature branch, `uv` installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → summary line reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable locally: there is no edge cache in front of the local API, so locally the two values always differ. Verify on the deployed environment after merge.
Prerequisites: the merged fix is deployed; you know the deployed host.
1. Run `curl -si https://<deployed-host>/api/time` → 200, header `cache-control: no-store`.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (the second about one second later).
3. If they differ, remove the `mayker:to-verify` tag from the item → the item is verified; if they are identical, the CDN is ignoring the header and the item stays open.
