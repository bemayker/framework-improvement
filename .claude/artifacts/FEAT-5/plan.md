# Implementation Plan, FEAT-5: VERIFY MDF-456: GET /api/health returns a JSON health

## Feature
> Loop: staged for verify row 212 (attended build-feature); restated because /api/version already exists.
>
> Add a backend endpoint GET /api/health.
>
> Acceptance criteria:
> - [ ] GET /api/health answers 200 with the JSON body {"health": "green"}
> - [ ] A POST to /api/health answers 405 with the JSON body {"detail": "Method Not Allowed"}
> - [ ] A pytest in backend/tests covers both responses

## Acceptance Criteria
- [ ] 1. GET /api/health answers 200 with the JSON body {"health": "green"}
- [ ] 2. A POST to /api/health answers 405 with the JSON body {"detail": "Method Not Allowed"}
- [ ] 3. A pytest in backend/tests covers both responses

## Re-Plan Feedback
No comments to record: the ClickUp task carries 0 comments (0 replies), this is a first plan (no PR review comments), and no `[merged-since]` lines were passed (fresh branch from current main). The item text conflicts with code already on main, so the assumptions below are recorded here in place of a blocking question (`user_story_alignment.md` Section 4):
- Assumption (path already exists): GET /api/health is NOT a new endpoint. TEST-02 (Health endpoint, done) already registers it in backend/app/routers/health.py, served through backend/app/services/health_service.py, and today it answers 200 with {"status": "ok", "database": {"host": ..., "port": ...}} when PostgreSQL answers a probe, and 503 with {"status": "degraded", "database": {...}} when it does not. POST already answers 405 (FastAPI's built-in handling, only GET is declared). The tracker restated FEAT-5 away from /api/version to avoid a duplicate, and landed on a second existing path; the path is named in every criterion, so it is kept rather than renamed.
- Assumption (how criterion 1 is met without breaking TEST-02): the plan EXTENDS the existing body with one field, `"health"`, instead of replacing it. A 200 answers {"status": "ok", "health": "green", "database": {...}}. "Answers 200 with the JSON body {...}" is read as "the body carries that field and value", which is exactly how the project already accepted TEST-02: its criterion says `returns HTTP 200 with JSON {"status": "ok"}` and the done implementation returns status plus a database object. Replacing the body with exactly {"health": "green"} would delete TEST-02's degraded-database reporting (its criterion 2, the 503 path) and its service, which no FEAT-5 criterion asks for. Consequence the reviewer should weigh: a strict exact-equality reading of criterion 1 is not met by this plan; if the plan PR reviewer wants exact equality, that is a re-plan that retires TEST-02's behaviour, and should be said on the PR.
- Assumption (the 503 path): the response schema is one shape on both paths (TEST-02's design), so the degraded body needs a `health` value too. It carries `"red"`, the minimal opposite of "green"; answering "green" on a 503 would be false. No other value or field is added.
- Assumption (criterion 1 needs the database): because the existing endpoint answers 200 only when PostgreSQL answers its probe, criterion 1 is verified against a running database. This is TEST-02's existing behaviour, deliberately left unchanged.
- Assumption (UAT slug): the feature map's branch and title predate the restatement (`version-returns-json-version`). The branch name is kept as the map has it, but the UAT artifact slug follows the tracker title, `health_returns_json_health`, so the files name what they verify.

## Plan Overview
Extend the existing TEST-02 health endpoint so its body carries `"health": "green"` on the 200 path (and `"health": "red"` on the existing 503 path), and pin the existing 405 POST response's exact body in a test. Backend only: one field added to `HealthResponse` in backend/app/schemas/health.py and set in the router backend/app/routers/health.py, derived from the same healthy/degraded decision that already chooses the status code. No new router, no change to backend/app/main.py (the health router is already registered), no service, repository, database, migration or frontend change. Tests: the existing integration tests in backend/tests/integration/test_health_integration.py are extended for the new field and the exact 405 body. Assumptions about the existing endpoint are in Re-Plan Feedback above.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI)

## Backend Plan
- Endpoints: `GET /api/health` (existing, TEST-02). 200 body gains `"health": "green"`; 503 body gains `"health": "red"`; every existing field and status code is unchanged. `POST /api/health` (and any method other than GET) keeps FastAPI's built-in 405 with {"detail": "Method Not Allowed"} and an `Allow: GET` header; nothing is added to produce it.
- Service layer: unchanged. backend/app/services/health_service.py keeps owning the probe and the ok/degraded verdict. The green/red value is a presentation of that verdict, so it is derived in the router from the same comparison that already picks 200 or 503 (`report.status == health_service.STATUS_OK`): compute that boolean once, then derive both `status_code` and `health` from it, so the two can never disagree.
- Repository layer: none.
- Migrations: none.
- Schema: `HealthResponse` in backend/app/schemas/health.py gains `health: Literal["green", "red"]`, declared between `status` and `database`; its docstring names FEAT-5. `DatabaseTarget` is unchanged.
- Registration: none needed; `health_router` is already included in `create_app()` (backend/app/main.py read). backend/app/main.py is not modified.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/health
- Request: no parameters, no body
- Response: 200, `application/json`, when the database probe succeeds

```json
{"status": "ok", "health": "green", "database": {"host": "db", "port": 5432}}
```

- Response: 503, `application/json`, when the probe fails or DATABASE_URL is unset (existing TEST-02 path, one field added)

```json
{"status": "degraded", "health": "red", "database": {"host": "127.0.0.1", "port": 9}}
```

- Method: POST (and any other method except GET)
- URL: /api/health
- Response: 405, `application/json`, header `Allow: GET`

```json
{"detail": "Method Not Allowed"}
```

## Technology Selection
- `health` field: chose a `typing.Literal["green", "red"]` field on the existing Pydantic `HealthResponse` (installed, already used by this schema's `status`) over a second response model or a hand-built dict, because the endpoint already serializes through that model on both paths.
- 405 response: chose FastAPI's built-in method-not-allowed handling (installed framework, already producing this response today) over an explicit POST route or an exception handler, because it already returns exactly {"detail": "Method Not Allowed"}.
- No net-new component, module or dependency is introduced otherwise.

## File Manifest
### New files
- [G] e2e/uat/scenarios/FEAT-5_health_returns_json_health.feature: Gherkin scenarios, one per acceptance criterion plus at least one edge case (POST with a JSON body still answers the same 405); UAT Generation is ENABLED.
- [G] e2e/uat/scripts/FEAT-5_health_returns_json_health_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/FEAT-5/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/schemas/health.py: add `health: Literal["green", "red"]` to `HealthResponse`; docstring names FEAT-5.
- [B] backend/app/routers/health.py: compute the healthy boolean once from `report.status == health_service.STATUS_OK`, derive `status_code` (200/503, unchanged) and `health` ("green"/"red") from it, pass `health` into `HealthResponse`; module docstring names FEAT-5. Nothing else changes.
- [B] backend/tests/integration/test_health_integration.py: (a) the existing 200 test also asserts `payload["health"] == "green"`; (b) the existing 503 exact-equality assertion becomes {"status": "degraded", "health": "red", "database": {"host": "127.0.0.1", "port": 9}}; (c) the existing POST test also asserts `response.json() == {"detail": "Method Not Allowed"}` and that the `allow` header is `GET`; (d) new edge case: POST with a JSON body answers the same 405 and body.

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit (neither mentions /api/health). backend/app/main.py and backend/tests/unit/test_main_unit.py are not touched: the route is already registered and its registration test already exists.

## Testing Strategy
- Unit tests: none added. No service-layer or utility logic changes (`testing_standards.md` Section 6, first question): the new field is a two-way mapping of an existing verdict inside the router, exercised through the real HTTP cycle on both paths below. The existing backend/tests/unit/test_health_service_unit.py stays green unchanged.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: the router's full HTTP cycle through the session-scoped `client` fixture in backend/tests/conftest.py: GET 200 with `health` "green" against the real database (the existing test uses the `database_url` fixture, so it skips locally without DATABASE_URL and fails in CI without it, per conftest); GET 503 with `health` "red" against an unreachable target (no database needed); POST 405 with the exact body and Allow header, with and without a request body (no database needed).
  - Directory: backend/tests/integration/ (test_health_integration.py)
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI (Section 6's fourth question, asked per criterion below), and an E2E spec calling the API directly is a router integration test (Section 5). No spec file is produced.
  - Directory: e2e/tests/
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the POST-with-body edge case, validated for well-formedness only.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/health answers 200 with {"health": "green"} | Integration | verifying it needs no navigation or interaction: it is a router response, checked through the real HTTP cycle against the real database |
| 2 | POST /api/health answers 405 with {"detail": "Method Not Allowed"} | Integration | verifying it needs no navigation or interaction: it is the router's method handling, checked through the real HTTP cycle |
| 3 | A pytest in backend/tests covers both responses | Integration | the criterion is the existence of the pytest itself; backend/tests/integration/test_health_integration.py is that test, and it runs in the integration tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/health answers 200 with {"health": "green"} | covered at Integration, see Criterion coverage | Given the backend and its database are running, When a client sends GET /api/health, Then the response is 200 and the body field "health" is "green" |
| 2 | POST /api/health answers 405 with {"detail": "Method Not Allowed"} | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends POST /api/health, Then the response is 405 with body {"detail": "Method Not Allowed"} |
| 3 | A pytest covers both responses | covered at Integration, see Criterion coverage | Given the backend test suite and a running database, When the health integration tests run, Then they report 0 failed |

## Manual verification plan
This item has no UI, so each criterion is verified with an HTTP client against the running backend, and criterion 3 by running the tests.

### Criterion 1: GET /api/health answers 200 with {"health": "green"}
Prerequisites: the stack is up with `docker compose up -d --build` from the repository root, the `db` service reports healthy in `docker compose ps`, and the backend listens on http://localhost:8010 (docker-compose.yml backend port).
1. Run `curl -i http://localhost:8010/api/health` → the status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body of the same response → it carries `"health":"green"`, alongside the existing `"status":"ok"` and a `"database"` object with a host and a port.
3. Run `docker compose stop db`, then `curl -i http://localhost:8010/api/health` → the status line reads `HTTP/1.1 503 Service Unavailable` and the body carries `"status":"degraded"` and `"health":"red"` (TEST-02's degraded path, unchanged apart from the new field). Run `docker compose start db` afterwards.

### Criterion 2: POST /api/health answers 405 with {"detail": "Method Not Allowed"}
Prerequisites: the backend is running as for Criterion 1 (the database is not needed for this criterion).
1. Run `curl -i -X POST http://localhost:8010/api/health` → the status line reads `HTTP/1.1 405 Method Not Allowed` and an `allow` header reads `GET`.
2. Read the body of the same response → it is exactly `{"detail":"Method Not Allowed"}`.
3. Run `curl -i -X POST -H "Content-Type: application/json" -d '{"x": 1}' http://localhost:8010/api/health` → the same 405 status and the same `{"detail":"Method Not Allowed"}` body; a request body changes nothing.

### Criterion 3: A pytest in backend/tests covers both responses
Prerequisites: backend dependencies installed (`uv sync --directory backend`), and a PostgreSQL reachable through DATABASE_URL (for example the compose `db` service, with DATABASE_URL taken from .env.example), because the 200 test runs against a real database and skips without one outside CI.
1. Open backend/tests/integration/test_health_integration.py → it contains a test asserting GET /api/health returns 200 with `"health": "green"`, and a test asserting POST /api/health returns 405 with exactly {"detail": "Method Not Allowed"}.
2. Run `uv run --directory backend pytest -q -rs tests/integration/test_health_integration.py tests/unit/test_health_service_unit.py` → the summary line reports 0 failed, and the `-rs` report lists no skipped test (a skip means DATABASE_URL was not set and criterion 1's test did not run).
