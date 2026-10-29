# Implementation Plan, FEAT-10: VERIFY MDF-505: backend GET /api/ping returns ok

## Feature
> Loop: staged for verify of MDF-505 (row 248), wave 1. Backend only: add GET /api/ping in a new file backend/app/ping.py, registered in main.py, returning {"status": "ok"}, with a pytest test. Acceptance: the route answers 200 with that body.

## Acceptance Criteria
- [ ] 1. `GET /api/ping` answers HTTP 200 with the JSON body `{"status": "ok"}`.
- [ ] 2. The route lives in a new file `backend/app/ping.py` and is registered in `backend/app/main.py`.
- [ ] 3. A pytest test asserts criterion 1.

## Re-Plan Feedback
- Assumption (no tracker comments; autonomous run, no human to ask): the ticket names `backend/app/ping.py` explicitly, so the router goes there rather than under `backend/app/routers/`, where TEST-05, TEST-02 and BUG-01 put theirs. The explicit file path in the feature text wins over the sibling convention; FEAT-11 is planned to extend the same file.
- Assumption: the response model `PingResponse` lives in `backend/app/ping.py` beside the router instead of a separate `backend/app/schemas/ping.py`, because the ticket asks for one new file. It is still a Pydantic model, separate from any domain model.
- Assumption: no service layer. The handler returns a constant; there is no business logic, persistence or transaction to put behind a service, so a service module would be an empty indirection (KISS, `coding_standards.md` Section 1; "Keep every feature as small as possible" in CLAUDE.md Architecture Notes).
- Tracker comments read: 0. Merged since: n/a (fresh plan, branched from current main).

## Plan Overview
One backend-only change: a FastAPI `APIRouter` with prefix `/api` in a new module `backend/app/ping.py`, exposing `GET /ping` that returns `PingResponse(status="ok")`, registered in `create_app()` in `backend/app/main.py`. No database, no configuration, no frontend. Covered by an integration test through the full HTTP cycle and one route-registration unit test following the existing `test_main_unit.py` precedent.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/ping`, liveness ping returning `{"status": "ok"}` with 200. No database access, so it answers with `DATABASE_URL` unset, like `/api/version`.
- Service layer: none (constant response, no business logic; see Re-Plan Feedback).
- Repository layer: none.
- Migrations: none.
- `backend/app/ping.py` contents: module docstring naming FEAT-10; `class PingResponse(BaseModel)` with `status: str`; `router = APIRouter(prefix="/api", tags=["ping"])`; `@router.get("/ping", response_model=PingResponse)` handler `get_ping() -> PingResponse` returning `PingResponse(status="ok")`. Use a module constant `STATUS_OK = "ok"` for the literal.
- `backend/app/main.py`: `from app.ping import router as ping_router` and `app.include_router(ping_router)` after the existing includes; add FEAT-10 to the module docstring's router list. Touch nothing else in the factory (CORS middleware and lifespan unchanged).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/ping`
- Request: no body, no query parameters
- Response: 200, `application/json`, body exactly `{"status": "ok"}`
- Other methods: `POST /api/ping` answers 405 (FastAPI default for an unregistered method; not new behaviour, asserted as the router's error case)

## Technology Selection
- `PingResponse` model: chose Pydantic `BaseModel` (already installed via FastAPI, same as `VersionResponse`) over a raw `dict` return, because the project's routers declare `response_model` for a typed, documented contract.
- `ping` router: chose FastAPI `APIRouter` (already installed) over anything new; no stdlib or native feature serves HTTP routes in this app.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/ping.py: `PingResponse` schema and `GET /api/ping` router returning `{"status": "ok"}`
- [B] backend/tests/integration/test_ping_integration.py: HTTP-cycle tests: 200 with exact body `{"status": "ok"}`; answers with `DATABASE_URL` unset; `POST /api/ping` returns 405
- [G] e2e/uat/scenarios/FEAT-10_api_ping_returns_ok.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/FEAT-10_api_ping_returns_ok_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/FEAT-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the ping router; docstring router list updated
- [B] backend/tests/unit/test_main_unit.py: one test asserting `/api/ping` is among the app's custom routes
No dependency changes, so no lockfile entry. Neither README.md nor docs/DEVELOPMENT.md needs an edit: no project structure, run configuration, dependency or test infrastructure change.

## Testing Strategy
- Unit tests: one route-registration test in the existing app-factory test file (follows the TEST-05, TEST-02, BUG-01 precedent). No unit test of the handler: it holds no business logic (tier question 1 is no).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file test_main_unit.py)
- Integration tests: `GET /api/ping` through the session `client` fixture, asserting status 200 and `response.json() == {"status": "ok"}`; a fresh `create_app()` with `DATABASE_URL` removed still answers 200; `POST /api/ping` answers 405. No database fixture used.
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion involves navigation or interaction through the UI (backend-only feature, no frontend change); every criterion is covered at integration or unit level below.
  - Directory: e2e/tests/ (no file for this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST rejected), validated for well-formedness.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/ping` answers 200 with `{"status": "ok"}` | Integration | verifying it needs no navigation or interaction: it is a router response, checked through the real HTTP cycle |
| 2 | Route in `backend/app/ping.py`, registered in `main.py` | Unit | verifying it needs no navigation or interaction: it is app wiring, checked by the route-registration test (the integration test also imports through `create_app()`) |
| 3 | A pytest test asserts criterion 1 | Integration | verifying it needs no navigation or interaction: the criterion is satisfied by `test_ping_integration.py` existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/ping` answers 200 with `{"status": "ok"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/ping, Then the status is 200 and the body is {"status": "ok"} |
| 2 | Route in `backend/app/ping.py`, registered in `main.py` | covered at Unit, see Criterion coverage | Given the app is created by create_app, When its routes are listed, Then /api/ping is among them |
| 3 | A pytest test asserts criterion 1 | covered at Integration, see Criterion coverage | Given the backend test suite, When the ping integration tests run, Then 0 failed |

## Manual verification plan
### Criterion 1: `GET /api/ping` answers 200 with `{"status": "ok"}`
Not verifiable through the UI: the feature adds no frontend. The observable check is the HTTP response.
Prerequisites: backend running locally (for example `docker compose up` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`); no database required.
1. In a terminal, run `curl -i http://localhost:8000/api/ping` → the status line reads `HTTP/1.1 200 OK` and the body is exactly `{"status":"ok"}`.
2. Open `http://localhost:8000/api/ping` in a browser → the page shows `{"status":"ok"}`.
3. Edge case: run `curl -i -X POST http://localhost:8000/api/ping` → status `405 Method Not Allowed`.

### Criterion 2: route in `backend/app/ping.py`, registered in `main.py`
Not verifiable through the UI. The observable check is the code and the OpenAPI listing.
Prerequisites: the FEAT-10 branch checked out; backend running as in Criterion 1.
1. Open `backend/app/ping.py` → it defines the `/api` router with the `GET /ping` handler.
2. Open `backend/app/main.py` → `create_app()` calls `app.include_router(ping_router)`.
3. Open `http://localhost:8000/docs` → the `ping` section lists `GET /api/ping`.

### Criterion 3: a pytest test asserts criterion 1
Prerequisites: the FEAT-10 branch checked out; uv installed.
1. From the repo root, run `uv run --directory backend pytest -q tests/integration/test_ping_integration.py tests/unit/test_main_unit.py` → the run ends with `0 failed`, and the test asserting status 200 and body `{"status": "ok"}` is among the tests run.
