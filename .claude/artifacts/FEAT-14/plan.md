# Implementation Plan, FEAT-14: VERIFY MDF-510: backend GET /api/verify510 returns ok

## Feature
> Loop: staged for verify of MDF-510 (row 250) and MDF-511 (row 251), cycle 20261031T225406Z. Backend only: add GET /api/verify510 in backend/app/main.py returning {"status": "ok"}, with one pytest test. No frontend change.

## Acceptance Criteria
- [ ] `GET /api/verify510`, added in `backend/app/main.py`, returns HTTP 200 with the JSON body `{"status": "ok"}`.
- [ ] The endpoint is covered by one pytest test, which passes in the backend suite.

## Plan Overview
Backend-only, single-route feature. Add `GET /api/verify510` directly in `backend/app/main.py` inside `create_app()`, returning the constant body `{"status": "ok"}`, and cover it with exactly one pytest test that exercises the route through the full HTTP request/response cycle (FastAPI `TestClient`, the shared session-scoped `client` fixture in `backend/tests/conftest.py`). No frontend work, no service, repository, schema, migration or dependency change.

Recorded assumptions (the tracker item carries no checklist and no comments, so the criteria above are derived from the description text alone):
- Criteria wording: the description's two deliverables (the route and its one test) are the two criteria. "No frontend change" is recorded as a scope constraint rather than a third criterion, because it is a boundary on the diff and not a behaviour a test can exercise: it is honoured by this plan carrying no `frontend/` path in its File Manifest and no `[A]` entry, which the review's manifest/diff cross-check verifies.
- Route location: the description names `backend/app/main.py`, so the route is declared there, not as a new module under `backend/app/routers/` the way the version, health, notes and server-time endpoints are. This departs from the project's router-module convention on purpose: the item specifies the file, and a new router module plus a schema module would be three files where the item asks for one (scope containment, `user_story_alignment.md` Section 3; `CLAUDE.md` Architecture Notes "Keep every feature as small as possible"). The handler holds no business logic (it returns a constant), so the Router → Service → Repository layering (`coding_standards.md` Section 2.2) has no service or repository layer to place anywhere.
- One test, not two: the item asks for "one pytest test", so the plan contracts exactly one test function. `testing_standards.md` Section 4's integration row asks every router endpoint for a happy path plus one error case (for example 405 on POST); adding that second test would exceed the item's explicit count, so it is not planned. This deviation is to be listed in the PR description so the plan reviewer can overrule it here, while the plan is cheap to change, rather than at code review.
- No existing test is edited: `backend/tests/unit/test_main_unit.py` has a registration test per router, but adding one for this route would be a second pytest test, so it is not planned.

## Frontend Plan
No frontend changes required. (The item says "No frontend change"; nothing consumes the endpoint in the UI. Design Reference mode is NONE.)
- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders no UI).

## Backend Plan
- Endpoints: `GET /api/verify510`, declared in `backend/app/main.py` inside `create_app()` after the existing `include_router(...)` calls, as a plain synchronous handler (e.g. `verify510()`) annotated to return `dict[str, str]` and returning `{"status": "ok"}`. The body comes from a module-level constant in `main.py` (e.g. `VERIFY510_RESPONSE`) so the literal lives once. Default 200 status; FastAPI's default 405 for any other method on the path. Declaring it inside `create_app()` (not on the module-level `app`) keeps it present on every app the factory builds, which is what the test fixture and `test_main_unit.py` instantiate.
- Service layer: none. There is no business logic: the handler returns a constant.
- Repository layer: none. No data access.
- Migrations: none. No schema change.
- CORS: untouched. The existing middleware already allows `GET`; the `add_middleware(CORSMiddleware, ...)` block BUG-02 targets is not edited (see shared risks).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/verify510`
- Request: none (no parameters, no body)
- Response 200:

  ```json
  {"status": "ok"}
  ```

- Any other method on the path: 405 (FastAPI default, not separately tested, see the one-test assumption above).

## Technology Selection
- `GET /api/verify510` handler: chose a plain FastAPI route function returning a `dict` (FastAPI's built-in JSON serialization, already installed) over a new pydantic response schema module under `backend/app/schemas/`, because a constant one-field body needs no validation model and the item asks for the route in `main.py` only. No net-new dependency is added by this feature.

## File Manifest
### New files
- [B] backend/tests/integration/test_verify510_integration.py: the item's one pytest test, `test_get_verify510_returns_200_with_status_ok`: `GET /api/verify510` through the shared `client` fixture, asserting status 200 and body exactly `{"status": "ok"}`.
- [G] e2e/uat/scenarios/FEAT-14_verify510_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (POST to the path answers 405).
- [G] e2e/uat/scripts/FEAT-14_verify510_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/FEAT-14/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: add the `VERIFY510_RESPONSE` constant and the `GET /api/verify510` route inside `create_app()`; update the module docstring's list of registered endpoints to name FEAT-14's route.

No dependency manifest changes, so no lockfile is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the backend's endpoints (DEVELOPMENT.md names `/api/version` only for its `BUILD_COMMIT` configuration).

## Testing Strategy
- Unit tests: not warranted. There is no service or utility logic (`testing_standards.md` Section 6, first question: the handler returns a constant), and a route-registration unit test in `test_main_unit.py` would be a second test, which the item excludes.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: the one test, `test_get_verify510_returns_200_with_status_ok`, router through the full HTTP request/response cycle using the session-scoped `client` fixture. It needs no database: the app lifespan only warns when `DATABASE_URL` is unset, and the route touches no database, so the test runs with or without the backing service. Test function naming per `testing_standards.md` Section 3.
  - Directory: backend/tests/integration/ (`test_verify510_integration.py`, naming `test_{module}_integration.py`)
- E2E tests: not warranted. Neither criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion), so no `e2e/tests/FEAT-14_*.spec.ts` is produced and the per-feature edge-case spec obligation does not attach.
  - Directory: e2e/tests/
  - File: none produced (no criterion is assigned to E2E)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (POST answers 405), validated for well-formedness, not executed.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/verify510` returns HTTP 200 with `{"status": "ok"}` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour over the real HTTP cycle, and no UI consumes the endpoint |
| 2 | The endpoint is covered by one pytest test, which passes | Integration | It is satisfied by the integration test itself existing and passing in the backend suite; a browser cannot observe a test file |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/verify510` returns 200 `{"status": "ok"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/verify510, Then the response is HTTP 200 with body {"status": "ok"} |
| 2 | One pytest test covers the endpoint and passes | covered at Integration, see Criterion coverage | Given the backend test suite, When the verify510 integration test file is run, Then it collects one test and reports 0 failed |

## Manual verification plan
### Criterion 1: `GET /api/verify510` returns HTTP 200 with the JSON body `{"status": "ok"}`
This criterion is not verifiable through the UI (no frontend consumes the endpoint); the observable check is the HTTP response itself, read with curl.
Prerequisites: Docker running; the stack up via `docker compose up -d --build` from the repo root, so the backend image carries this branch's `main.py`; `docker compose ps` shows the `backend` service running.
1. In a terminal, run `curl -i http://localhost:8010/api/verify510` → the first response line reads `HTTP/1.1 200 OK` and the `content-type` header reads `application/json`.
2. Read the response body → exactly `{"status":"ok"}`, with no other field.
3. Run `curl -i -X POST http://localhost:8010/api/verify510` → the first response line reads `HTTP/1.1 405 Method Not Allowed` (edge case: the route is GET only).

### Criterion 2: the endpoint is covered by one pytest test, which passes
This criterion is not verifiable through the UI; the observable check is the test run's own output.
Prerequisites: `uv` installed; run from the repo root on this branch. No database is needed for this test.
1. Run `uv run --directory backend pytest -q tests/integration/test_verify510_integration.py` → the summary line reports `0 failed`, and the run lists `test_get_verify510_returns_200_with_status_ok` as its only test (add `-v` to see it by name).
2. Open `backend/tests/integration/test_verify510_integration.py` → it holds that one test function, which requests `/api/verify510` and asserts both the 200 status and the exact `{"status": "ok"}` body.
3. Run the project's test gate, `uv run --directory backend pytest -q && npm --prefix frontend test`, covering every test under `backend/tests/` and the frontend Vitest suite → both report `0 failed`.
