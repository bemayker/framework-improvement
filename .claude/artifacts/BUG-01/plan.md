# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). **Its reproduction only runs on the deployed environment**: locally there is no edge cache, so the bug cannot be seen. It exercises the `to_verify` route (merged, awaiting verification on the deployed environment).
>
> ## Defect
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> ## Reproduction (deployed only)
> 1. `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`
> 2. Expected: two different `now` values. Actual: identical values.
>
> Locally both calls differ, because nothing caches them.
>
> ## Acceptance criteria
> 1. `GET /api/time` responses carry `Cache-Control: no-store`.
> 2. A test asserts the header on the response.
> 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
>
> ## Notes
> Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete.
>
> Depends on: FEAT-1.

## Acceptance Criteria
- [ ] `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] A test asserts the header on the response.
- [ ] After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 12 comments on ClickUp task 123k99cwybn, all framework PR notices left by earlier, since-reverted runs → Addressed by: not acted on because none states a requirement, a correction or an amendment to the description; the description above is the whole scope.
- Assumption (no comment; autonomous mode, recorded per `user_story_alignment.md` Section 4): **the item's premise "FEAT-1 is complete" is false on the code.** FEAT-1 is `complete` in the tracker, but `origin/main` at b8eb92b has no `backend/app/routers/server_time.py`, no `backend/app/schemas/server_time.py`, no `/api/time` registration in `backend/app/main.py` and no server-time tests: FEAT-1's merge (f293b27, PR #318) was removed by the sandbox reset 9dcba19 (PR #326). The item's Notes name only `server_time.py`, which is not satisfiable: criterion 1 needs a `GET /api/time` to exist. This plan therefore **recreates FEAT-1's merged surface byte-for-byte from f293b27** (router, schema, `main.py` registration, FEAT-1's unit and integration tests, FEAT-1's `test_main_unit.py` route test) and applies the BUG-01 fix on top. The alternative, blocking BUG-01 until FEAT-1 is re-delivered, was rejected because the tracker would still report FEAT-1 complete and nothing would re-deliver it. The recreation adds no behaviour FEAT-1 did not already ship and no contract change; the PR body must state that BUG-01 restores FEAT-1's code, so a reviewer does not read it as gold plating.
- Assumption: the header is set on the `GET /api/time` response only, in the router, as the item's Notes direct. A global middleware or a change to the CORS block in `backend/app/main.py` is out of scope (no other endpoint is named, `user_story_alignment.md` Section 3). The one `main.py` edit is FEAT-1's two-line router registration plus its docstring clause.
- Assumption: criterion 3 is deployed-only. No local tier can reproduce the CDN, so the build cannot execute it. It is covered by the integration header assertion as the cause-level proxy plus FEAT-1's fresh-value-per-request test, and verified by a human after deploy (`## Manual verification plan`, Criterion 3). The PR body lists it as a post-deploy check, not as a verified criterion; the item carries `mayker:to-verify` for that reason.

## Plan Overview
Backend only. Restore FEAT-1's `GET /api/time` (router, response schema, router registration, its tests) exactly as merged in f293b27, then fix the defect: the handler takes FastAPI's injected `Response` and sets `Cache-Control: no-store` on it, so the CDN and any intermediate cache stop storing the per-request clock value. The response body and schema stay FEAT-1's. Integration tests assert the exact header value on the HTTP response, on a single call and on two consecutive calls. No frontend, no service layer, no repository, no migration, no dependency change.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time. Recreated from f293b27 with the BUG-01 change: `get_server_time(response: Response)` sets `response.headers["Cache-Control"] = "no-store"` before returning `ServerTimeResponse(now=utc_now(), timezone="UTC")`. `response_model=ServerTimeResponse` stays. The module keeps FEAT-1's module-level `utc_now()` (reads `datetime.now(UTC)` per call, so tests can substitute it) and its `APIRouter(prefix="/api", tags=["time"])`. Docstring: one clause saying why (BUG-01: edge caches must not store a per-request clock value).
- Schema: `backend/app/schemas/server_time.py` recreated verbatim from f293b27: `ServerTimeResponse` with `now: AwareDatetime` and `timezone: Literal["UTC"]`, the `UTC_OFFSET_SUFFIX = "+00:00"` constant and the `field_serializer("now")` that emits `value.astimezone(UTC).isoformat()`, so the suffix is `+00:00`, never `Z`, and a naive datetime is rejected.
- Registration: `backend/app/main.py` gains `from app.routers.server_time import router as server_time_router` (between the notes and version imports) and `app.include_router(server_time_router)` after the health router, last before `return app`, plus the docstring clause "and FEAT-1 the server time router". Nothing else in `main.py` changes (CORS block, lifespan, other routers untouched).
- Service layer: none. The endpoint has no business logic beyond reading the clock, as in FEAT-1.
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no parameters.
- Response: 200, header `Cache-Control: no-store` (the BUG-01 change); body FEAT-1's shape, exactly two keys:

```json
{"now": "2026-10-27T20:30:00.123456+00:00", "timezone": "UTC"}
```

- Other methods: `POST /api/time` returns 405 (FastAPI default, asserted by FEAT-1's test).

## Technology Selection
- Cache-Control header: chose FastAPI's own `Response` parameter injection (`fastapi.Response`, an installed dependency) over a custom middleware or a new caching dependency, because the framework sets a per-response header in one line and a middleware would widen the change to every route.
- Server time router and response schema (restored FEAT-1 modules): chose the standard library's `datetime.now(UTC)` for the clock and Pydantic's `AwareDatetime` plus `field_serializer` (installed with FastAPI) for validation and the `+00:00` suffix, over a date library such as `pendulum` or `arrow`; no new dependency is needed. These are restored from f293b27 unchanged, not new designs.
- No other net-new component, module or dependency is introduced.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: restore FEAT-1's `GET /api/time` router from f293b27, with `get_server_time(response: Response)` setting `Cache-Control: no-store` (the BUG-01 fix) and a docstring clause saying why
- [B] backend/app/schemas/server_time.py: restore FEAT-1's `ServerTimeResponse` schema verbatim from f293b27
- [B] backend/tests/unit/test_server_time_unit.py: restore FEAT-1's schema and clock unit tests verbatim from f293b27
- [B] backend/tests/integration/test_server_time_integration.py: restore FEAT-1's integration tests from f293b27, plus `test_get_time_response_carries_cache_control_no_store` (200, header `cache-control` equals exactly `no-store`) and `test_get_time_cache_control_is_set_on_every_request` (two consecutive calls, both carry it)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan, including the post-deploy check for criterion 3
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import `server_time_router` and register it with `app.include_router(server_time_router)` after the health router; docstring clause for FEAT-1's router. No other change
- [B] backend/tests/unit/test_main_unit.py: restore FEAT-1's `test_create_app_registers_server_time_route` (asserts `/api/time` is among the custom routes)

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure (the endpoint lists in `README.md` and `docs/DEVELOPMENT.md` do not exist), so neither file needs an edit.

## Testing Strategy
- Unit tests: FEAT-1's schema and clock tests restored unchanged (`ServerTimeResponse` key set, `+00:00` suffix, naive datetime rejected, non-UTC converted, non-UTC literal rejected, `utc_now()` aware and non-decreasing), plus FEAT-1's route-registration test in `test_main_unit.py`. The BUG-01 change itself adds no service or utility logic, so no unit test is added for the header (`testing_standards.md` Section 6's first question is no for it).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: the real HTTP request/response cycle through the session-scoped `client` fixture in `backend/tests/conftest.py`, which needs no database (the lifespan skips schema setup when `DATABASE_URL` is unset). FEAT-1's five tests restored (exact keys, `+00:00` suffix, computed at request time, fresh value per request with a substituted `utc_now`, `POST` returns 405) plus the two header tests named in the File Manifest.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. No criterion requires navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion, is no for all three), so no spec is written and the `plan`-scoped e2e CI tier stays skipped.
  - Directory: e2e/tests/
  - File: none (no criterion is assigned to E2E)
- UAT scenarios: one scenario per criterion plus an edge case (the header is present on a second consecutive call); criterion 3's scenario is tagged as a post-deploy manual check.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a router response header, read off the HTTP response |
| 2 | A test asserts the header on the response | Integration | the criterion is the integration test itself; its execution in the test gate and CI is the coverage |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment) | Integration | the CDN exists only on the deployed environment, so no browser or local tier can reproduce it; the header assertion covers the cause and FEAT-1's fresh-value-per-request test covers the origin, and the effect is a human post-deploy check (Manual verification plan, Criterion 3) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When I request GET /api/time, Then the response has header Cache-Control with value no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When I run the server time integration tests, Then 0 failed and the cache-control tests are among them |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; post-deploy human check | Given the fix is deployed behind the CDN, When I request GET /api/time twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally at `http://localhost:8000`, for example `uv run --directory backend uvicorn app.main:app --port 8000` (no database needed for this endpoint), or the compose stack.
1. In a terminal, run `curl -sS -D - -o /dev/null http://localhost:8000/api/time` → the status line reads `200 OK` and the header block contains the line `cache-control: no-store`.
2. Run `curl -sS http://localhost:8000/api/time` → the body is `{"now":"<ISO 8601 timestamp ending +00:00>","timezone":"UTC"}`, exactly those two keys.
3. Open `http://localhost:8000/api/time` in a browser with DevTools open, Network tab, click the `time` request, Headers panel → Response Headers lists `cache-control: no-store`.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the BUG-01 branch, uv installed.
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py` → expected `0 failed`, and the run includes `test_get_time_response_carries_cache_control_no_store` and `test_get_time_cache_control_is_set_on_every_request`.
2. Open `backend/tests/integration/test_server_time_integration.py` and read `test_get_time_response_carries_cache_control_no_store` → it asserts the response header `cache-control` equals exactly `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion cannot be verified locally or by any test tier: the stale value comes from the CDN in front of the deployed API, which exists only on the deployed environment. It is a human check after the fix is deployed.
Prerequisites: the BUG-01 change is merged and deployed; you know the deployed host name (`<deployed-host>`).
1. In a terminal, run `curl -sS -D - -o /dev/null https://<deployed-host>/api/time` → the header block contains `cache-control: no-store` (if the CDN adds its own cache status header, such as `x-cache` or `cf-cache-status`, it reads a miss, bypass or dynamic value, not a hit).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies are printed and their `now` values differ, the second about one second later than the first.
3. Repeat step 2 once more → the `now` values differ again. If they are identical, the CDN may still hold an entry cached before the deploy: purge the CDN cache for `/api/time`, repeat step 2, and record the result on the item.
