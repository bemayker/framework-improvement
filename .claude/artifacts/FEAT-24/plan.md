# Implementation Plan, FEAT-24: VERIFY MDF-455: backend GET /api/verify455c returns ok

## Feature
> Loop: staged by the verify phase for MDF-455 row 289 (second sample). Add backend GET /api/verify455c returning {"status":"ok"}.

## Acceptance Criteria
- [ ] A GET request to `/api/verify455c` on the backend responds with HTTP 200 and the JSON body `{"status":"ok"}`.

## Plan Overview
One read-only backend endpoint, nothing else: a new FastAPI router `backend/app/routers/verify455c.py` exposing `GET /api/verify455c`, a one-field response schema in `backend/app/schemas/verify455c.py`, and one `app.include_router(...)` line in `backend/app/main.py`. No service, repository, migration, database access, frontend or external integration: the response is a constant, so there is no business logic to put in a service layer.

The router follows the existing per-endpoint layout (`routers/version.py` with `schemas/version.py`): `APIRouter(prefix="/api", tags=["verify455c"])` and `response_model=Verify455cResponse`.

Assumptions (the tracker item has no acceptance-criteria field and no comments; the description is the whole input, so each of these is recorded rather than asked):
1. Success status is 200, FastAPI's default for a GET; the description names only the body.
2. The body is exactly `{"status":"ok"}`, no other fields, so the schema's `status` is typed `Literal["ok"]`.
3. The endpoint needs no database and no authentication, and must answer when `DATABASE_URL` is unset (the app's lifespan already tolerates that, `backend/app/main.py`).
4. No frontend consumer: the description says "backend" and names no UI, so no frontend work and no CORS change (the existing middleware already allows GET).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/verify455c`, returns `{"status":"ok"}` with 200.
- Service layer: none. The response is a constant with no logic to isolate; adding a service would be a layer with nothing in it.
- Repository layer: none, no data access.
- Migrations: none.
- Registration: `backend/app/main.py` imports `router as verify455c_router` from `app.routers.verify455c` and adds `app.include_router(verify455c_router)` after the existing three `include_router` calls. Nothing else in `create_app()` or `lifespan` changes.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/verify455c`
- Request: no body, no query parameters, no auth.
- Response: 200, `Content-Type: application/json`, body exactly:

```json
{"status": "ok"}
```

- Other methods on the path (e.g. POST) get FastAPI's default 405 Method Not Allowed; nothing custom is added for them.

## Technology Selection
- Response schema `Verify455cResponse`: chose a Pydantic model with `status: Literal["ok"]` over a bare `dict` return, because Pydantic and `typing.Literal` (stdlib) are already installed and used by every existing endpoint schema (`schemas/health.py`, `schemas/version.py`), and the model pins the response shape in the OpenAPI schema; no new dependency.
- Router `verify455c.py`: chose FastAPI's `APIRouter`, already installed and used by every existing router, over adding the route inline in `main.py`, to keep the factory free of handlers as its docstring prescribes; no stdlib or native alternative applies.
- No new dependency is introduced.

## File Manifest
### New files
- [B] backend/app/schemas/verify455c.py: `Verify455cResponse` Pydantic model, single field `status: Literal["ok"]`.
- [B] backend/app/routers/verify455c.py: `APIRouter(prefix="/api", tags=["verify455c"])` with `GET /verify455c` returning `Verify455cResponse(status="ok")`.
- [B] backend/tests/integration/test_verify455c_integration.py: router integration tests (200 with exact body, answers with `DATABASE_URL` unset, POST gets 405).
- [G] e2e/uat/scenarios/FEAT-24_api_verify455c.feature: Gherkin scenarios for the criterion plus one edge case (UAT Generation is ENABLED).
- [G] e2e/uat/scripts/FEAT-24_api_verify455c_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/FEAT-24/uat_script.md: the copy of the manual UAT script build-feature writes alongside it.

### Modified files
- [B] backend/app/main.py: import the verify455c router and register it with one `app.include_router(...)` call.

No dependency manifest changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: not warranted. There is no service-layer or utility logic (the handler returns a constant), so the first tier question is answered no.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: router tests over the real HTTP request/response cycle with FastAPI's `TestClient` (the session `client` fixture in `backend/tests/conftest.py`, plus a fresh `create_app()` with `DATABASE_URL` removed via `monkeypatch`, the same shape as `test_version_integration.py`). Cases: GET returns 200 and exactly `{"status": "ok"}`; GET still answers with `DATABASE_URL` unset; POST returns 405 (the only reachable error case for an input-less read-only endpoint). No database fixture is used.
  - Directory: backend/tests/integration/
  - File: test_verify455c_integration.py
- E2E tests: not warranted. The criterion involves no UI navigation or interaction (no frontend consumes the endpoint), so no spec is written.
  - Directory: e2e/tests/
  - File: none for this feature
- UAT scenarios: one scenario for the criterion and one edge-case scenario (POST is rejected with 405).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A GET request to `/api/verify455c` responds with HTTP 200 and the JSON body `{"status":"ok"}` | Integration | `test_get_verify455c_returns_200_with_status_ok`, `test_get_verify455c_answers_when_database_url_is_unset` | verifying it needs no navigation or interaction: it is a router response behaviour with no UI consumer |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | A GET request to `/api/verify455c` responds with HTTP 200 and the JSON body `{"status":"ok"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/verify455c, Then the response status is 200 and the body is {"status":"ok"} |

## Manual verification plan
### Criterion 1: A GET request to `/api/verify455c` responds with HTTP 200 and the JSON body `{"status":"ok"}`
This criterion has no UI: nothing in the frontend calls the endpoint, so it is verified by reading the HTTP response directly.
Prerequisites: the stack is running with `docker compose up -d --build` from the repository root, and the backend container reports healthy (it listens on host port 8010 per `docker-compose.yml`).
1. Open `http://localhost:8010/api/verify455c` in a browser → the page shows the JSON `{"status":"ok"}` and nothing else.
2. In a terminal run `curl -i http://localhost:8010/api/verify455c` → the first line reads `HTTP/1.1 200 OK`, the headers include `content-type: application/json`, and the body is `{"status":"ok"}`.
3. Edge case: run `curl -i -X POST http://localhost:8010/api/verify455c` → the first line reads `HTTP/1.1 405 Method Not Allowed`.
4. Open `http://localhost:8010/docs` → the Swagger UI lists `GET /api/verify455c` under the `verify455c` tag, with a response schema of one `status` field.
5. Run `uv run --directory backend pytest -q tests/integration/test_verify455c_integration.py` → the summary line reports no failed or errored test and the command exits 0.
