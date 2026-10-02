# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> Defect (BUG- item, ClickUp 123k99cwybn), depends on FEAT-1 (done).
>
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN caches the response because it carries no cache directive. Reproduction (deployed only): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → expected two different `now`, actual identical. Locally both differ because nothing caches.
>
> Notes: Backend only, `backend/app/routers/server_time.py`.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback (if applicable)
- Comment (tracker): none. The dispatch states "Tracker comments: none" and `.claude/artifacts/BUG-01/decisions.md` records "Tracker comments read: 0", so there is no tracker feedback to record.
- Comment (PR): none (first plan; autonomous mode opens no draft plan PR).
- Merged since the last plan: n/a (fresh plan, branched from current main `48c3ab7`; no prior `plan.md` on this branch).

## Plan Overview
Backend only, one handler. Root cause: `get_time()` in `backend/app/routers/server_time.py` returns the schema with FastAPI's default headers, which carry no cache directive, so a shared cache (the CDN) in front of the deployed API is free to store the 200 and replay it. Fix: the handler takes FastAPI's `Response` parameter and sets `Cache-Control: no-store` on it, which FastAPI merges into the JSON response it builds from the returned `ServerTimeResponse`. Body, status, schema, route and OpenAPI `$ref` are unchanged. No service, repository, migration, dependency, middleware, `main.py` or frontend change.

Scope decision: the header is set on this one route only, not app-wide via middleware. Only `/api/time` is reported stale, and `no-store` on every endpoint would be gold plating (`user_story_alignment.md` Section 3) and would touch `backend/app/main.py`, which TEST-09 (ready, independent) also modifies.

Reproduction classification (for `/fix` Section R1 at step 6.2): the item's own steps are **deployed-only**. Reason: the stale value is produced by the CDN, which exists only on the deployed environment; locally nothing caches, so the item's two-curl reproduction already passes on the unfixed code and cannot fail "before". Environment: `docs/DEVELOPMENT.md` → `## Test environments` has no rows, so the environment is the one the item names, "the deployed environment" (`https://<deployed-host>`, host not given in the item). The locally automatable proxy for the root cause is the AC2 header assertion: the integration test `test_get_time_sets_cache_control_no_store` fails on the base (no `cache-control` header) and passes on the fix, so it serves as the before/after check of the cause even though it is not the item's own reproduction. Steps for the deployed verification: Manual verification plan, Criterion 3.

Assumptions:
- The CDN honours the origin's `Cache-Control` (standard behaviour; RFC 9111 forbids a cache storing a `no-store` response). If the CDN is configured to override origin directives, AC3 fails on the human check and that is a CDN configuration issue outside this repository; AC3's manual check is what detects it.
- Exact header value is `no-store` alone (no `no-cache`, `max-age=0`, `private` or `Pragma`), because AC1 names exactly that value.
- Only the 200 response of `GET` is in scope; FastAPI's own 405 for `POST /api/time` is not a cached success and is left unchanged.
- Terminal status after merge is `to_verify` (AC3 is human-verified on the deployed environment), per `decisions.md`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` (existing), modified. Signature becomes `def get_time(response: Response) -> ServerTimeResponse:` with `from fastapi import APIRouter, Response`. First statement sets `response.headers["Cache-Control"] = "no-store"`, then returns `ServerTimeResponse(now=datetime.now(UTC))` as today. `response_model=ServerTimeResponse` stays on the decorator. The value `"no-store"` is a module-level constant (`NO_STORE = "no-store"`) so the tests import one source rather than restating the literal. Docstring gains one sentence saying why: the value changes per request, so no shared cache may store it (BUG-01).
- Module docstring: extend with one line noting BUG-01 sets `Cache-Control: no-store`. The existing planned-deviation note (no service module) is unchanged.
- Service layer: none (unchanged planned deviation from FEAT-1).
- Repository layer: none.
- Migrations: none.
- Error handling: unchanged; no new error path.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no path, query or body parameters (unchanged; `Response` is a FastAPI-injected parameter and does not appear in OpenAPI).
- Response: 200, `application/json`, schema `ServerTimeResponse`, body unchanged, for example:

```json
{"now": "2026-10-02T13:22:08.123456+00:00", "timezone": "UTC"}
```

- New response header: `Cache-Control: no-store` on every 200 response.
- Errors: unchanged (`POST /api/time` returns FastAPI's 405).

## Technology Selection
- Cache directive on the response: chose FastAPI's injected `Response` parameter (installed `fastapi`) setting one header, over a custom Starlette middleware and over a caching library (`fastapi-cache2` and similar), because a single route needs a single static header and the installed framework sets it in one line; no new dependency.
- No other net-new component, module or dependency: the change modifies one existing handler and two existing test files.

## File Manifest

### New files
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/routers/server_time.py: inject `Response`, set `Cache-Control: no-store` via a module constant `NO_STORE`, extend docstrings.
- [B] backend/tests/unit/test_server_time_unit.py: pass a `Response()` to the existing `get_time()` calls, add a test asserting the handler sets `cache-control: no-store` on the response it is given.
- [B] backend/tests/integration/test_server_time_integration.py: add tests asserting `GET /api/time` returns `cache-control: no-store`, on every request.

No dependency changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure. No E2E spec file: no criterion warrants E2E (see Criterion coverage). `backend/app/main.py` is not touched.

## Testing Strategy
- Unit tests: the `get_time()` handler in isolation, no HTTP.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here the existing `test_server_time_unit.py`
  - Cases: `test_get_time_sets_cache_control_no_store_on_response` builds `Response()`, calls `get_time(response)`, asserts `response.headers["cache-control"] == NO_STORE` and `NO_STORE == "no-store"` (the literal asserted once, in one place, so the wiring is asserted against the constant everywhere else); the existing `test_get_time_returns_now_within_call_window_and_increases` passes a fresh `Response()` per call and keeps its assertions. Schema tests unchanged.
- Integration tests: `GET /api/time` through the session-scoped `client` fixture; no database needed.
  - Directory: backend/tests/integration/
  - Naming: the existing `test_server_time_integration.py`
  - Cases: `test_get_time_sets_cache_control_no_store` asserts status 200 and `response.headers["cache-control"] == "no-store"` (exact value, so `no-cache` or `max-age=0` would fail); `test_get_time_sets_cache_control_no_store_on_every_request` makes two calls and asserts the header on both (the header is per response, not a first-call artefact). Existing shape, offset, freshness, OpenAPI `$ref` and 405 tests stay unchanged, which also proves the body and schema did not regress.
  - Reproduction proxy: on the base commit the first new integration test fails (`KeyError` / missing header); on the fix it passes.
- E2E tests: Enabled per CLAUDE.md, but no criterion warrants E2E: no frontend page calls `/api/time`, and every criterion is a response header or a deployed-environment check. No spec file.
  - Directory: e2e/tests/
  - File: none (would be `BUG-01_server_time_edge_cache.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (two consecutive requests both carry the header), API-level steps.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration + Unit | Verifying it needs no navigation or interaction: it is a response header of a router, checked through the HTTP cycle (integration) and on the handler (unit). |
| 2 | A test asserts the header on the response | Integration | Verifying it needs no navigation or interaction: it is satisfied by `test_get_time_sets_cache_control_no_store` existing and passing in the gate. |
| 3 | After deploy, two requests a second apart return different `now` | Manual (deployed environment) + Integration proxy | Verifying it needs no UI and cannot run in this checkout or CI: the stale value comes from the CDN, which exists only on the deployed environment. The integration header test covers the cause; the effect is the human check in the Manual verification plan, Criterion 3, and the item ends `to_verify`. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on responses | covered at Integration + Unit, see Criterion coverage | Given the backend is running, When I GET /api/time, Then the status is 200 and the Cache-Control header is exactly "no-store" |
| 2 | a test asserts the header | covered at Integration, see Criterion coverage | Given the repository, When I run the backend test suite, Then the server_time cache-control tests pass |
| 3 | deployed: two different `now` values | not automatable; manual on the deployed environment | Given the fix is deployed behind the CDN, When I GET /api/time twice one second apart, Then the two `now` values differ |
| edge | header on every request | covered at Integration | Given the backend is running, When I GET /api/time twice, Then both responses carry Cache-Control "no-store" |

## Manual verification plan

No criterion is verifiable through the application UI: no frontend page calls `/api/time`. Every check reads the HTTP response in a terminal with `curl`. Local backend host port is 8010 (`docker-compose.yml`).

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: Docker running; repository on branch `feature/BUG-01-server-time-edge-cache`; from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows `backend` running; a terminal with `curl`.
1. Run `curl -si http://localhost:8010/api/time` → first line reads `HTTP/1.1 200 OK`.
2. Read the headers of the same response → there is a line `cache-control: no-store` (header name case may differ), with exactly the value `no-store` and nothing else.
3. Read the body of the same response → unchanged two-key JSON, for example `{"now": "2026-10-02T13:22:08.123456+00:00", "timezone": "UTC"}`.
4. Run `curl -si http://localhost:8010/api/time` a second time → the second response also carries `cache-control: no-store`.

### Criterion 2: a test asserts the header on the response
Not a UI behaviour; the observable check is the test run.
1. From the repository root run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` → all tests pass, none skipped.
2. Open `backend/tests/integration/test_server_time_integration.py` → `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.
3. Optional: run `git show main:backend/app/routers/server_time.py` → the handler on `main` sets no header, which is why the same test fails on `main` and passes on the branch.

### Criterion 3: after deploy, the reproduction returns two different values
Not verifiable through the UI and not runnable locally (the CDN exists only on the deployed environment). A human runs it after the merge has been deployed.
Prerequisites: the merge commit of BUG-01 is deployed to the deployed environment; you know its public host (written below as `<deployed-host>`; `docs/DEVELOPMENT.md` → `## Test environments` has no row yet, so take the host from whoever operates the deployment); a terminal with `curl`.
1. Run `curl -si https://<deployed-host>/api/time` → status 200, and the headers include `cache-control: no-store`. If the CDN adds its own cache-status header (for example `x-cache` or `cf-cache-status`), it reads as a miss or bypass, not a hit.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies print.
3. Compare the two `now` values → they differ, the second about one second later than the first. Identical values mean the defect persists: record the headers from step 1 on the item.
4. Repeat step 2 two more times → every pair differs.
5. Move the item from `to_verify` to done only when steps 1 to 4 pass.
