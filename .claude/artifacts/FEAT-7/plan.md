# Implementation Plan, FEAT-7: VERIFY MDF-485: GET /api/ping returns a JSON pong

## Feature
> Loop: staged by the loop verify phase for MDF-485 and MDF-484. Backend only: add GET /api/ping returning {"pong": true}, with one pytest test. No frontend change.

## Acceptance Criteria
- [ ] GET /api/ping responds with HTTP 200 and the JSON body {"pong": true}
- [ ] The endpoint is covered by one pytest test, which passes

## Plan Overview
One backend-only change: a new FastAPI router at `backend/app/routers/ping.py` exposing `GET /api/ping`, a Pydantic response schema at `backend/app/schemas/ping.py` (one field, `pong: bool`), and the router registered in `create_app()` in `backend/app/main.py`, following the shape every other router in this app already uses (`echo.py`, `server_time.py`: `APIRouter(prefix="/api", tags=[...])` plus a `response_model`). The endpoint has no input, no state, no database access and no business logic, so it gets no service or repository layer: a service that returns a constant would be a layer with nothing in it.

One pytest test, at the integration tier, drives the real HTTP request/response cycle through the session-scoped `client` fixture in `backend/tests/conftest.py` and asserts the status code and the exact body.

No frontend change, per the item text.

Assumptions (the item states no separate acceptance criteria, so they are derived from its description; `user_story_alignment.md` Section 4, autonomous mode):
- The two acceptance criteria above are the description's two deliverables. "Backend only" and "No frontend change" are scope constraints, recorded here and enforced by the File Manifest listing no `frontend/` path, rather than criteria of their own.
- "One pytest test" is read literally as one test function. `testing_standards.md` Section 4 asks each router endpoint for a happy path and one error case; the item caps this at one test, and the item's scope wins (`user_story_alignment.md` Section 3). The only reachable error case, a non-GET method answering 405, is therefore not added; the build lists that as a known deviation in the PR description. For the same reason `backend/tests/unit/test_main_unit.py` gets no new route-registration test: the integration test already proves the route is registered, since an unregistered route answers 404.
- The endpoint is unauthenticated and sets no cache header, like `/api/echo`. Nothing in the item asks for either.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/ping`, returns `{"pong": true}` with HTTP 200. Router module `backend/app/routers/ping.py`, `router = APIRouter(prefix="/api", tags=["ping"])`, handler `get_ping() -> PingResponse` decorated `@router.get("/ping", response_model=PingResponse)`, returning `PingResponse(pong=True)`.
- Schema: `backend/app/schemas/ping.py`, `class PingResponse(BaseModel)` with the single field `pong: bool`, so the OpenAPI document describes the response like every other endpoint here.
- Registration: `backend/app/main.py` imports `router as ping_router` from `app.routers.ping` and calls `app.include_router(ping_router)` after the existing registrations; the module docstring's list of features that register routers gains FEAT-7. Nothing else in `create_app()` or `lifespan` changes. CORS `allow_methods` already includes GET.
- Service layer: none. The handler returns a constant; there is no logic to place in a service.
- Repository layer: none. No data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/ping
- Request: no body, no query parameters, no headers required
- Response: 200, `Content-Type: application/json`, body:

```json
{"pong": true}
```

`pong` is a JSON boolean `true`, never the string `"true"`.

## Technology Selection
- Ping response schema (`backend/app/schemas/ping.py`): chose Pydantic `BaseModel`, already installed with FastAPI, over a hand-built dict return, because the project registers a `response_model` on every endpoint and Pydantic is what FastAPI uses to document it; no new dependency.
- Ping router (`backend/app/routers/ping.py`): chose FastAPI `APIRouter`, already installed, over any alternative; no stdlib call or native feature serves an HTTP route in this stack.
- Ping test: chose FastAPI's `TestClient` through the existing `client` fixture in `backend/tests/conftest.py`, already installed, over a new HTTP client or fixture.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/ping.py: `PingResponse` Pydantic model with the single field `pong: bool`
- [B] backend/app/routers/ping.py: `APIRouter` with prefix `/api` and `GET /ping` returning `PingResponse(pong=True)`
- [B] backend/tests/integration/test_ping_integration.py: the one pytest test, `test_get_ping_returns_200_with_pong_true`, asserting status 200 and body exactly `{"pong": true}` via the `client` fixture
- [G] e2e/uat/scenarios/FEAT-7_api_ping_json_pong.feature: Gherkin scenarios for both acceptance criteria plus one edge-case scenario (UAT Generation is ENABLED)
- [G] e2e/uat/scripts/FEAT-7_api_ping_json_pong_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/FEAT-7/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import the ping router, add `app.include_router(ping_router)` in `create_app()`, add FEAT-7 to the module docstring's list of router registrations

No dependency manifest changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit; neither file lists the API endpoints today.

## Testing Strategy
- Unit tests: none. Tier not warranted: the change adds no service-layer or utility logic (`testing_standards.md` Section 6, first question), and the item caps the feature at one test.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: one router test through the real HTTP request/response cycle, `test_get_ping_returns_200_with_pong_true`, asserting `response.status_code == 200` and `response.json() == {"pong": True}`. The exact-equality assertion also proves the value is the boolean, not the string. The endpoint needs no database, so the test does not touch `database_url` or `db_connection` and runs without a backing service.
  - Directory: backend/tests/integration/
  - File: backend/tests/integration/test_ping_integration.py
- E2E tests: none for this feature. E2E Tests is ENABLED, but no criterion involves navigation or interaction through the UI and there is no frontend change, so no criterion is assigned to E2E (table below) and no spec is written.
  - Directory: e2e/tests/
  - File: none for this feature
- UAT scenarios: one scenario per acceptance criterion plus one edge-case scenario (the response body carries no field other than `pong`).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/ping responds with HTTP 200 and the JSON body {"pong": true} | Integration | verifying it needs no navigation or interaction: it is a router response, checked through the real HTTP cycle |
| 2 | The endpoint is covered by one pytest test, which passes | Integration | verifying it needs no navigation or interaction: it is satisfied by the integration test existing and passing in the pytest run |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/ping responds with HTTP 200 and the JSON body {"pong": true} | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/ping, Then the status is 200 and the body is {"pong": true} |
| 2 | The endpoint is covered by one pytest test, which passes | covered at Integration, see Criterion coverage | Given the backend test suite, When the ping integration test runs, Then it reports 0 failed |

## Manual verification plan
### Criterion 1: GET /api/ping responds with HTTP 200 and the JSON body {"pong": true}
This criterion has no UI: there is no frontend change, so it is verified against the running API instead of through a screen.
Prerequisites: the backend is running (for example `docker compose up -d` at the repository root), and you know its host port from `docker compose ps` (the API service's published port, called `{API_PORT}` below).
1. In a terminal, run `curl -i http://localhost:{API_PORT}/api/ping` → the status line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json`.
2. Read the body printed under the headers → it is exactly `{"pong":true}`, with `true` unquoted (a boolean, not the string `"true"`) and no other field.
3. Open `http://localhost:{API_PORT}/docs` in a browser and expand `GET /api/ping` under the `ping` tag → the documented 200 response schema is `PingResponse` with one boolean field `pong`.

### Criterion 2: The endpoint is covered by one pytest test, which passes
This criterion has no UI: it is verified by running the test.
Prerequisites: backend dependencies installed (`uv sync --directory backend`). No database is needed for this test.
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_ping_integration.py` → the run collects the single test `test_get_ping_returns_200_with_pong_true` and reports `0 failed`.
2. Open `backend/tests/integration/test_ping_integration.py` → it holds exactly one test function, and that function asserts both the 200 status and the body `{"pong": True}`.
