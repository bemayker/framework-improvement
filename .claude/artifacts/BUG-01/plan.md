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
- Comment (tracker): 13 comments on the item, all bot notes from earlier runs (PR links, phase notes); none is a stakeholder correction → Addressed by: not acted on because none changes the feature text or its criteria (dispatch: "none actionable").
- Merged since the last plan: n/a (fresh plan, branched from current main c5a6e64; no `[merged-since]` lines in the dispatch).
- Assumption (verified on main, recorded per the ambiguity rule in `user_story_alignment.md` Section 4): the item says "FEAT-1 is complete" and names only `server_time.py`, but on main at c5a6e64 there is **no** `GET /api/time` at all. `git ls-files` lists no `backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py` or server-time test, and `backend/app/main.py` registers only the version, notes and health routers; `git log` shows the sandbox reset c5a6e64 removed what FEAT-1 (f293b27) and the previous BUG-01 build (f40a4b5) added. Criterion 1 cannot hold for an endpoint that does not exist, so this plan recreates the endpoint in FEAT-1's documented shape (`{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, a Pydantic schema under `backend/app/schemas/`, registered in `backend/app/main.py`) and adds the fix on it. This is the minimum needed to satisfy the criteria, not gold plating; nothing beyond FEAT-1's contract plus the header is built. The PR description must state this.

## Plan Overview
Backend only. Recreate the `GET /api/time` router and its response schema (absent from main), register the router in the app factory, and set `Cache-Control: no-store` on every response it returns so no shared cache (the CDN in front of the deployed API) stores it. Tests at unit and integration tier assert the header, the response shape, the explicit UTC offset and per-request freshness. Criterion 3 is deployed-only and is handed to a human through the manual verification plan; the merge lands the item at to_verify (`mayker:to-verify`), not Done.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item)

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time in UTC and carries `Cache-Control: no-store` on the response.
- Router (`backend/app/routers/server_time.py`): `APIRouter(prefix="/api", tags=["server-time"])`, one `@router.get("/time", response_model=ServerTimeResponse)` handler that takes FastAPI's injected `Response`, sets `response.headers["Cache-Control"] = "no-store"`, and returns `ServerTimeResponse.now_utc()`. Name the header value in one module-level constant (`CACHE_CONTROL_NO_STORE = "no-store"`) so the test imports nothing it re-spells. The handler sets the header unconditionally, before returning, so no code path returns without it.
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"] = "UTC"`. A field validator rejects a naive datetime and normalises an aware one to UTC (`astimezone(timezone.utc)`), so `now` always serialises with an explicit `+00:00` offset and never naive. A `now_utc()` classmethod builds the response from `datetime.now(timezone.utc)` computed per call; there is no module-level or cached value anywhere.
- Service layer: none. The only logic is one stdlib clock read plus the UTC normalisation, which lives on the schema as in FEAT-1's shipped shape; a service module would wrap a single call. This matches the existing version router's thin-router shape.
- App factory (`backend/app/main.py`): import `router as server_time_router` from `app.routers.server_time` and `app.include_router(server_time_router)` after the existing three. Update the module docstring's list of feature routers by one clause. No other change (CORS stays as is: GET is already allowed).
- Repository layer: none (no database access; the endpoint must answer with `DATABASE_URL` unset, as the version endpoint does).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `Content-Type: application/json`, header `Cache-Control: no-store`. Body:

```json
{"now": "2026-10-27T21:40:12.345678+00:00", "timezone": "UTC"}
```

- Errors: `POST /api/time` returns 405 (FastAPI default; the route is read-only).

## Technology Selection
- `Cache-Control: no-store` on the response: chose FastAPI's injected `Response` header assignment in the handler (installed dependency) over a custom middleware or a new caching library, because one header on one route needs no app-wide hook and no new dependency.
- Current time in UTC with an explicit offset: chose the standard library's `datetime.now(timezone.utc)` and its `isoformat()` via Pydantic's own datetime serialisation over a date library (`pendulum`, `arrow`), because stdlib produces an aware UTC value and Pydantic (installed) serialises it with the offset.
- `ServerTimeResponse` schema: chose a Pydantic model (installed dependency, the project's existing schema convention) over a bare dict, which FEAT-1's contract forbids.
- `server_time` router module: no stdlib call, native platform feature or installed dependency replaces a route module; it is FastAPI's own `APIRouter`, built here.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router that sets `Cache-Control: no-store` and returns `ServerTimeResponse`
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (aware-UTC `now`, `timezone` literal `UTC`, `now_utc()` per-call factory)
- [B] backend/tests/unit/test_server_time_unit.py: unit tests for the schema (UTC normalisation, naive datetime rejected, offset in the serialised value, `now_utc()` reads the clock per call)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests asserting `Cache-Control: no-store` on the response, on two consecutive responses, the body shape and offset, per-request freshness, no database needed, and 405 on POST
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server-time router; docstring router list updated
- [B] backend/tests/unit/test_main_unit.py: one test asserting `/api/time` is among the app's custom routes

No dependency manifest changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the item changes no project structure, run configuration, dependency or test infrastructure (one endpoint and its tests), so build-feature Section 15's condition does not hold.

## Testing Strategy
- Unit tests: `ServerTimeResponse` in isolation, with the clock patched where freshness is asserted. Happy path (an aware UTC value serialises with `+00:00`), edge case (an aware non-UTC value, e.g. `+02:00`, is normalised to UTC), error case (a naive datetime raises a validation error), and `now_utc()` returns two different values for two patched clock reads. Plus the app-factory registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle through the shared session `client` fixture (no database needed). `GET /api/time` → 200, `response.headers["cache-control"] == "no-store"`; two consecutive requests both carry the header and their `now` values differ (clock patched at the schema module's `datetime` so the test never sleeps); body keys are exactly `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with zero UTC offset; a fresh `create_app()` answers with `DATABASE_URL` unset; `POST /api/time` → 405.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. The tier is ENABLED, but no criterion requires navigation or interaction through the UI (the item has no UI), so no spec file is planned and no criterion is assigned to E2E below.
  - Directory: e2e/tests/ (unused by this item)
  - File: none
- UAT scenarios: one scenario per criterion plus one edge case (POST is rejected with 405 and caches nothing), validated for well-formedness only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a response header on a router, asserted through the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | it is satisfied by the integration test itself (`test_server_time_integration.py` asserts the header on one and on two consecutive responses); no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human on the deployed environment) | Integration (local proxy: header on two consecutive responses whose `now` differs), then manual check on the deployed environment | there is no UI and no edge cache locally; no automated tier can reach the deployed CDN, so the executed test covers the cause (the directive) and a human covers the effect after deploy, which is why the merge lands the item at to_verify |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the response status is 200 and the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration locally plus a manual deployed check, see Criterion coverage | Given the deployed environment behind its CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion has no UI; the observable check is the response header.
Prerequisites: the app stack is running locally (`docker compose up -d --build` at the repo root), backend on `http://localhost:8010`.
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers of that output → a `cache-control: no-store` line is present (header names are case-insensitive).
3. Read the body of that output → JSON with exactly two keys, `now` ending in `+00:00` (for example `2026-10-27T21:40:12.345678+00:00`) and `timezone` equal to `UTC`.

### Criterion 2: A test asserts the header on the response
This criterion has no UI; the observable check is the test run.
Prerequisites: a checkout of the branch with `uv` installed.
1. From the repo root run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` → `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion cannot be verified locally (there is no edge cache) or through any UI; it is a human check on the deployed environment after merge.
Prerequisites: the merged commit is deployed; you know the deployed host (replace `<deployed-host>` below).
1. Run `curl -si https://<deployed-host>/api/time` → status 200, and the headers include `cache-control: no-store` (a CDN may add its own headers such as `age` or `x-cache`; an `x-cache: HIT` here is the defect).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (about one second apart), not identical.
3. If both checks hold, remove the `mayker:to-verify` tag from the ClickUp item to mark it verified; if the two `now` values are identical, leave the tag and reopen the item with the curl output attached.
