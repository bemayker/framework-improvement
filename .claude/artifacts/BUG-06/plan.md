# Implementation Plan, BUG-06: VERIFY MDF-515: Health endpoint omits the Cache-Control no-store header

## Feature
> Loop: staged by the loop verify phase (cycle 20261101T221046Z) for Section 8.5 rows 253 (MDF-515: a to do item with a stale mayker:to-verify tag is built, ingestion's item-status.sh call is not refused) and 254 (MDF-520: planner dispatch peak). The tag is stale on purpose: the item was never merged. Cancelled after the run.
>
> Defect
>
> GET /api/health answers without a Cache-Control header, so an edge cache can serve a stale health answer. It must carry Cache-Control: no-store.
>
> Reproduction (local, run from the repository root)
>
> A new integration test, backend/tests/integration/test_health_cache_control_integration.py, calls GET /api/health and asserts the response header Cache-Control equals no-store. Run it with:
>
> uv run --directory backend pytest tests/integration/test_health_cache_control_integration.py -q
>
> Expected: Cache-Control: no-store. Actual: no Cache-Control header.
>
> Acceptance criteria
>
> GET /api/health responses carry Cache-Control: no-store, status and body unchanged.
> A test reproduces the defect: it fails before the fix and passes after it.
>
> Notes
>
> Backend only, backend/app/routers/health.py.

## Acceptance Criteria
- [ ] 1. GET /api/health responses carry Cache-Control: no-store, status and body unchanged.
- [ ] 2. A test reproduces the defect: it fails before the fix and passes after it.

## Re-Plan Feedback
- Comment (tracker): none. The item carries 0 top-level comments and 0 replies, so nothing amends the description.
- Assumption (scope of the "Loop:" paragraph): the first paragraph of the description is the operator's note on why the item exists, not an acceptance criterion. It adds no work to this plan.
- Assumption ("responses", plural): the router answers 200 when the database probe succeeds and 503 when it fails. Both are responses of GET /api/health, so both carry the header, and the integration test asserts it on each. No other endpoint gets the header (no gold plating; the defect names only this one).
- Assumption (shared constant): `backend/app/routers/server_time.py` already defines `NO_STORE_CACHE_CONTROL = "no-store"` (BUG-01). This plan defines its own constant in `health.py` rather than importing it from a sibling router or moving it into a shared module, because importing one router from another couples two unrelated endpoints and a shared module would edit `server_time.py`, which is outside this item. Two occurrences of one literal is below the point where an abstraction pays for itself (`coding_standards.md` Section 1, DRY with "be wary of hasty abstractions"). A follow-up may consolidate them.
- Merged since the last plan: n/a (fresh plan, branched from current `origin/main` at 55759ed; no `[merged-since]` lines in the dispatch).

## Plan Overview
Backend only, one router file. `backend/app/routers/health.py` builds and returns a `JSONResponse` itself, so the header goes onto that `JSONResponse` through its `headers` argument, on both the 200 and the 503 branch. FastAPI's injected `Response` parameter (the pattern `server_time.py` uses) is deliberately not used here: FastAPI copies the injected response's headers only onto a response it builds itself, and this endpoint returns its own `Response` object, so headers set on an injected parameter would be silently dropped. Status codes and body shape stay exactly as they are. A new integration test file, the one the defect names, is written first, run against the unchanged router to show it fails (no `cache-control` header), then the fix makes it pass. No frontend, no schema, no service, no dependency change.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/health`, unchanged in path, method, status codes (200 ok, 503 degraded) and body (`HealthResponse`: `status`, `database.host`, `database.port`). The only change: every response it returns carries `Cache-Control: no-store`.
- Router: in `backend/app/routers/health.py`, add a module-level constant `NO_STORE_CACHE_CONTROL = "no-store"` with a one-line comment saying why (an edge cache must never serve a stale health answer), and change the return to `JSONResponse(status_code=status_code, content=body.model_dump(), headers={"Cache-Control": NO_STORE_CACHE_CONTROL})`. The module docstring names BUG-06 beside TEST-02. Nothing else in the file changes.
- Service layer: none (`backend/app/services/health_service.py` unchanged; the header is a transport concern, owned by the router).
- Repository layer: none.
- Migrations: none.
- Registration: none (`backend/app/main.py` already registers the health router; no middleware is added, because the directive is scoped to this endpoint).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/health
- Request: no body, no parameters
- Response: unchanged status and body; new header `Cache-Control: no-store` on every response.
  - 200 when the database answers the probe:

```json
{"status": "ok", "database": {"host": "localhost", "port": 5442}}
```

  - 503 when it does not, same schema:

```json
{"status": "degraded", "database": {"host": "127.0.0.1", "port": 9}}
```

- Any other method on `/api/health`: 405 (FastAPI default), unchanged by this item.

## Technology Selection
- Cache directive: chose the `headers` argument of FastAPI's `JSONResponse` (an installed dependency, already imported in the router) over the injected `Response` parameter, a new middleware, or a cache-control package, because the endpoint returns its own `JSONResponse` (an injected parameter's headers would be dropped) and only `GET /api/health` is in scope.
- `NO_STORE_CACHE_CONTROL` constant: chose a local module constant over importing BUG-01's constant from `app.routers.server_time` or a new shared module, for the reason recorded under Re-Plan Feedback.
- Integration test file: no stdlib call, native platform feature or installed dependency replaces it; it uses the installed pytest and FastAPI `TestClient`. No new dependency, so no lockfile change.

## File Manifest
### New files
- [B] backend/tests/integration/test_health_cache_control_integration.py: reproduction test named in the defect; asserts `cache-control` equals its own `EXPECTED_CACHE_CONTROL = "no-store"` on the 200 response (real database) and on the 503 response (unreachable database), each with status and body unchanged
- [G] e2e/uat/scenarios/BUG-06_health_cache_control.feature: Gherkin scenarios, one per criterion plus one edge case (the 503 response also carries the header)
- [G] e2e/uat/scripts/BUG-06_health_cache_control_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-06/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/routers/health.py: add `NO_STORE_CACHE_CONTROL` and pass `headers` to the returned `JSONResponse`; docstring names BUG-06

No dependency is added or changed, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit and no [Docs] entry is listed. The existing `backend/tests/integration/test_health_integration.py` is left unchanged: its status and body assertions keep holding and are part of the evidence for "status and body unchanged".

## Testing Strategy
- Unit tests: not warranted. The change adds no service or utility logic; it is one header on a router response, which only the HTTP cycle can observe (`testing_standards.md` Section 6, first question answers no). `backend/tests/unit/test_health_service_unit.py` is unchanged.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (no new file)
- Integration tests: new file `test_health_cache_control_integration.py`. It asserts against its own module constant `EXPECTED_CACHE_CONTROL = "no-store"`, the criterion's literal value, and deliberately does not import `NO_STORE_CACHE_CONTROL` from the router: that constant does not exist before the fix, so importing it would make the pre-fix run fail on an `ImportError` at collection rather than on the missing header, and the reproduction would then prove nothing about the defect.
  - `test_get_health_ok_response_carries_cache_control_no_store`: through the session `client` fixture with the `database_url` fixture requested (so it skips locally without a database and fails in CI, per `conftest.py`); asserts status 200, `payload["status"] == "ok"`, the body has exactly the keys `status` and `database`, and `response.headers.get("cache-control") == EXPECTED_CACHE_CONTROL` (`.get`, so the pre-fix run fails as an assertion naming `None`, not a `KeyError`).
  - `test_get_health_degraded_response_carries_cache_control_no_store`: same unreachable-database pattern as the existing 503 test (`monkeypatch.setenv("DATABASE_URL", "postgresql://tasknotes:tasknotes@127.0.0.1:9/tasknotes")`, a fresh `create_app()`, an unmanaged `TestClient`); asserts status 503, the exact body `{"status": "degraded", "database": {"host": "127.0.0.1", "port": 9}}`, and the header. This test needs no database, so it reproduces the defect on any machine.
  - Order of work (criterion 2): the builder writes this file first and runs `uv run --directory backend pytest tests/integration/test_health_cache_control_integration.py -q` against the unchanged router, records the failing run (an assertion failure on the missing `cache-control` header, `None` against `no-store`) in the run record, then applies the router fix and re-runs it to `0 failed`.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion requires navigation or interaction through the UI; this item has no frontend. No spec is written.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (the degraded 503 response also carries the header), validated for well-formedness.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/health responses carry Cache-Control: no-store, status and body unchanged | Integration | verifying it needs no navigation or interaction: it is a response header, status and body on a router, asserted on the real HTTP cycle for both the 200 and the 503 branch |
| 2 | A test reproduces the defect: it fails before the fix and passes after it | Integration | the criterion is the integration test itself: `test_health_cache_control_integration.py`, run once against the unchanged router (fails) and once after the fix (passes) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Cache-Control: no-store on GET /api/health, status and body unchanged | covered at Integration, see Criterion coverage | Given the API is running with its database, When a client requests GET /api/health, Then the response is 200 with status ok and carries Cache-Control: no-store |
| 2 | A test reproduces the defect | covered at Integration, see Criterion coverage | Given the backend test suite, When the health cache-control integration tests run, Then 0 failed |

## Manual verification plan
### Criterion 1: GET /api/health responses carry Cache-Control: no-store, status and body unchanged
Prerequisites: the stack is running from the repo root with `docker compose up -d`, the backend reachable at `http://localhost:8010` and its database up. This criterion has no UI; the observable check is the response's status line, header and body.
1. In a terminal, run `curl -si http://localhost:8010/api/health` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers of that same response → one header reads `cache-control: no-store` (header names are case-insensitive).
3. Read the body → `{"status":"ok","database":{"host":"db","port":5432}}` (the host and port of the compose file's `DATABASE_URL`): the keys are exactly `status` and `database`, as before the fix.
4. Stop only the database with `docker compose stop db`, then run `curl -si http://localhost:8010/api/health` again → the status line reads `HTTP/1.1 503 Service Unavailable`, the body's `status` is `degraded`, and the response still carries `cache-control: no-store`.
5. Restart the database with `docker compose start db` → a third `curl -si http://localhost:8010/api/health` is back to `200 OK` with the header.

### Criterion 2: A test reproduces the defect: it fails before the fix and passes after it
Prerequisites: `uv` installed; run from the repo root. For the 200 test, `DATABASE_URL` points at a running PostgreSQL (without it that test skips locally; the 503 test needs no database).
1. On the feature branch, put back the pre-fix router with `git checkout origin/main -- backend/app/routers/health.py`, then run `uv run --directory backend pytest tests/integration/test_health_cache_control_integration.py -q` → the run reports failures on the missing `cache-control` header (the 503 test fails even without a database).
2. Restore the fixed router with `git checkout HEAD -- backend/app/routers/health.py` and run the same command → expected result `0 failed`.
3. Run `uv run --directory backend pytest -q tests/integration/test_health_integration.py tests/unit/test_health_service_unit.py` → expected result `0 failed`, showing the existing status and body assertions still hold.
