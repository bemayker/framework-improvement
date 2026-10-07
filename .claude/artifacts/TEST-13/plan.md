# Implementation Plan, TEST-13: Ping endpoint

## Feature
> Add `GET /api/ping` (backend only, its own router, no database).
>
> ## Acceptance criteria
> * AC1: `GET /api/ping` returns 200 with `{"pong": true}`.
> * AC2: the endpoint is listed in the OpenAPI schema at `/openapi.json`.
> * AC3: the full backend test suite passes with the new tests included.

(ClickUp task 123k99cxe5x, status `to do`, no labels, no comments.)

## Acceptance Criteria
- [ ] AC1: `GET /api/ping` returns 200 with `{"pong": true}`.
- [ ] AC2: the endpoint is listed in the OpenAPI schema at `/openapi.json`.
- [ ] AC3: the full backend test suite passes with the new tests included.

## Plan Overview
One backend-only endpoint, following the sibling pattern of `echo.py` and `version.py`: a Pydantic response schema in `backend/app/schemas/ping.py`, a dedicated `APIRouter(prefix="/api", tags=["ping"])` in `backend/app/routers/ping.py`, and one `app.include_router(ping_router)` line in `backend/app/main.py`. No service layer (there is no business logic: the response is a constant), no repository, no database access, no migration, no frontend. Tests: unit tests for the schema and handler, integration tests through the real HTTP cycle (including `/openapi.json`), and a route-registration assertion in the existing `test_main_unit.py`.

Assumptions (no tracker comments to override them):
- `pong` is a JSON boolean `true`, not the string `"true"`; the schema types it `bool` and the integration test asserts the exact body, so `{"pong": "true"}` fails.
- The response body has exactly one key. Nothing else (timestamp, version) is added: no gold plating (`user_story_alignment.md` Section 3).
- AC2 is satisfied by FastAPI's own schema generation once the router is included with a `response_model`; nothing is hand-written into the OpenAPI document.
- The endpoint is GET only; other methods get FastAPI's default 405, which one integration test pins as the error case.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/ping`, liveness probe that returns `{"pong": true}` with status 200. Registered via its own router (`backend/app/routers/ping.py`), `response_model=PingResponse`, `tags=["ping"]`.
- Service layer: none. The handler returns a constant; `coding_standards.md` Section 2.2's Router to Service to Repository pattern applies "when the project includes a backend with data persistence", and this endpoint touches none. `echo.py` is the precedent for a router with no service.
- Repository layer: none (no database, per the feature text).
- Migrations: none.
- Schema: `PingResponse(BaseModel)` with one field `pong: bool`. The handler returns `PingResponse(pong=True)`.
- `backend/app/main.py`: import `router as ping_router` from `app.routers.ping`, add `app.include_router(ping_router)` after `server_time_router`, and extend the module docstring's registration list with "TEST-13 the ping router". No change to `lifespan` or CORS (the CORS `allow_methods` already includes GET).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/ping`
- Request: no parameters, no body.
- Response: 200, `application/json`, body exactly:

```json
{"pong": true}
```

- OpenAPI: `paths["/api/ping"]["get"]` present, tagged `ping`, with the 200 response referencing `#/components/schemas/PingResponse`, whose `pong` property is `type: boolean` and listed in `required`.
- Other methods: 405 Method Not Allowed (FastAPI default).

## Technology Selection
- `PingResponse` schema: chose a Pydantic model (already installed through FastAPI) over returning a bare `dict`, because a bare dict gives the OpenAPI schema no typed response component, and AC2 is best served by the endpoint appearing with its typed response; this is also the sibling convention (`EchoResponse`, `VersionResponse`).
- Ping router: chose FastAPI's `APIRouter` (installed) over adding the route directly on the app in `main.py`, because the feature text requires "its own router" and every sibling endpoint uses one.
- No new dependency: the standard library and the installed FastAPI/Pydantic/pytest cover everything; nothing is added to `backend/pyproject.toml`.

## File Manifest
### New files
- [B] backend/app/schemas/ping.py: `PingResponse` Pydantic schema with one field, `pong: bool`, and a module docstring naming TEST-13.
- [B] backend/app/routers/ping.py: `router = APIRouter(prefix="/api", tags=["ping"])` with `@router.get("/ping", response_model=PingResponse)` handler `get_ping()` returning `PingResponse(pong=True)`.
- [B] backend/tests/unit/test_ping_unit.py: unit tests: `PingResponse(pong=True).model_dump()` equals the one-key dict with boolean `True` (happy path); `get_ping()` returns a `PingResponse` whose `pong is True` (handler happy path); `PingResponse()` without `pong` raises `ValidationError` (error case); `PingResponse(pong="not-a-bool")` raises `ValidationError` (edge case: Pydantic does not coerce an arbitrary string).
- [B] backend/tests/integration/test_ping_integration.py: full HTTP cycle via the session `client` fixture (no database fixture): `GET /api/ping` returns 200 and `response.json()` equals the one-key body with boolean `True` (asserting `is True`, so a string `"true"` fails); response `content-type` starts with `application/json`; `GET /openapi.json` contains `/api/ping` with a `get` operation whose 200 response references `PingResponse`, and `components.schemas.PingResponse.properties.pong.type` is `boolean` and `pong` is in `required`; `POST /api/ping` returns 405.
- [G] e2e/uat/scenarios/TEST-13_ping_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (POST returns 405).
- [G] e2e/uat/scripts/TEST-13_ping_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-13/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `router as ping_router` from `app.routers.ping`; `app.include_router(ping_router)` after the server time router; docstring clause naming TEST-13.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_ping_route` asserting `/api/ping` is among the custom routes, matching the existing version/health/echo/uptime/time registration tests.

No dependency changes, so no lockfile entry (`backend/uv.lock` and `frontend/package-lock.json` are untouched). No `[Docs]` entries: the feature adds one endpoint and changes no project structure, run configuration, dependencies or test infrastructure, and neither `README.md` nor `docs/DEVELOPMENT.md` enumerates endpoints, so build-feature Section 15's condition is not met. No E2E spec file: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
Tier selection (`testing_standards.md` Section 6): the feature adds an API endpoint (integration warranted) and a schema plus handler (unit, cheap and matching the sibling convention); it has no user-facing navigation or interaction (E2E not warranted for any criterion).

- Unit tests: `PingResponse` serialisation and validation, `get_ping()` handler return value, and `/api/ping` route registration in the app factory.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_ping_unit.py`; the registration test joins the existing `test_main_unit.py`)
- Integration tests: `GET /api/ping` through the real HTTP request/response cycle (200 and exact body, JSON content type, 405 for POST) and `GET /openapi.json` listing the path and its typed response. No database fixture: the endpoint touches no database, so these tests run without `DATABASE_URL`.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (`test_ping_integration.py`)
- E2E tests: ENABLED in `CLAUDE.md`, but not warranted for this feature: no criterion requires navigation or interaction through the UI (the feature is backend only, and no screen consumes the endpoint). Calling the API from Playwright would be a router integration test in the wrong tier (`testing_standards.md` Section 5). No spec file is written.
  - Directory: e2e/tests/
  - File: none (no criterion's covering tier is E2E)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), written as API-level Given/When/Then; validated for well-formedness, not executed.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/ping` returns 200 with `{"pong": true}` | Integration | Verifying it needs no navigation or interaction: it is a router response, asserted on status and exact body through the real HTTP cycle (plus unit tests on the schema and handler). |
| 2 | The endpoint is listed in the OpenAPI schema at `/openapi.json` | Integration | Verifying it needs no navigation or interaction: it is a property of the generated schema document, asserted by fetching `/openapi.json` (plus the unit route-registration test). |
| 3 | The full backend test suite passes with the new tests included | Integration | Verifying it needs no navigation or interaction: it is the outcome of running the backend suite (unit and integration tiers), which the pre-push gate and the CI `pr-tests` unit and integration jobs execute. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/ping` returns 200 with `{"pong": true}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends `GET /api/ping`, Then the status is 200 and the body is exactly `{"pong": true}` |
| 2 | Listed in `/openapi.json` | covered at Integration, see Criterion coverage | Given the backend is running, When a client fetches `/openapi.json`, Then `paths` contains `/api/ping` with a `get` operation |
| 3 | Full backend suite passes | covered at Integration, see Criterion coverage | Given the branch with the new tests, When the backend suite is run, Then it reports 0 failed and includes `test_ping_unit.py` and `test_ping_integration.py` |
| E | Edge case: wrong method | covered at Integration | Given the backend is running, When a client sends `POST /api/ping`, Then the status is 405 |

## Manual verification plan
This feature has no UI: no screen calls `/api/ping`. Each criterion is verified in a browser tab pointed at the backend or with `curl`, which is the observable check instead of a click path.

### Criterion 1: `GET /api/ping` returns 200 with `{"pong": true}`
Prerequisites: the stack is running (`docker compose up -d --build` from the repo root), and the backend answers on `http://localhost:8010` (the host port `docker-compose.yml` maps; if a handover rebuild moved it, use the port the handover report names).
1. Open `http://localhost:8010/api/ping` in a browser tab → the page shows the JSON `{"pong":true}` (Firefox's JSON viewer shows `pong: true`), with `true` unquoted, meaning a boolean, not a string.
2. Run `curl -i http://localhost:8010/api/ping` in a terminal → the first line is `HTTP/1.1 200 OK`, a `content-type: application/json` header is present, and the body is `{"pong":true}`.
3. Run `curl -i -X POST http://localhost:8010/api/ping` (edge case) → the first line shows status `405 Method Not Allowed`.

### Criterion 2: the endpoint is listed in the OpenAPI schema at `/openapi.json`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/openapi.json` in a browser tab → the JSON document has a `paths` object that contains the key `/api/ping`, with a `get` entry tagged `ping`.
2. In that same document, find `components` → `schemas` → `PingResponse` → its `properties` has `pong` with `type` `boolean`, and `required` lists `pong`.
3. Open `http://localhost:8010/docs` → the Swagger UI shows a `ping` section with `GET /api/ping`; expand it and click "Try it out" then "Execute" → the response code is 200 and the response body is `{"pong": true}`.

### Criterion 3: the full backend test suite passes with the new tests included
Prerequisites: on branch `feature/TEST-13-ping-endpoint`, a PostgreSQL instance reachable and `DATABASE_URL` set to its connection string (the notes integration tests need it; without it they skip locally rather than fail), `uv` installed.
1. From the repo root run `uv run --directory backend pytest -q` → the summary line reports `0 failed` (and no errors).
2. Run `uv run --directory backend pytest -q tests/unit/test_ping_unit.py tests/integration/test_ping_integration.py tests/unit/test_main_unit.py` → the new ping tests and the route-registration test are collected and the summary reports `0 failed`.
3. On the implementation PR, open the Checks tab → the `pr-tests` check is green, with its unit and integration jobs passed.
