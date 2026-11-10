# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A client can ask the API which build it is talking to.
>
> Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete. Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. When that value is longer than 12 characters, `commit` returns only its first 12 (tracker clarification, below).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the comment names it, so the plan adopts that name as the one declared source); the service truncates to the first 12 characters, and criterion 2 above carries the rule. A value of 12 characters or fewer (including the `unknown` default) is returned unchanged. Unit tests cover a 40-character sha, an exactly-12-character value and the unset default.
- Assumption (no comment): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `unknown`, matching how `CORS_ORIGINS` treats a blank value in `backend/app/core/config.py`. Surrounding whitespace is stripped before truncation.
- Assumption (no comment): the feature note says this item "registers a router in `backend/app/main.py`". On main @ ac6e44c the `/api/version` router already exists (TEST-05) and is already registered in `create_app()`, so this plan extends that router and does **not** modify `backend/app/main.py`. This is recorded for the BUG-01 concurrency question in `shared_risks.md`.
- Assumption (no comment): "set at build time" is satisfied by passing `BUILD_COMMIT` through the backend service's environment in `docker-compose.yml` (`${BUILD_COMMIT:-unknown}`), which a CI or deploy step sets from the commit sha before `docker compose up --build`. No Dockerfile `ARG` is added: the value is read at runtime from the environment, the same way `DATABASE_URL` and `CORS_ORIGINS` are, which keeps one source (coding_standards.md Section 5's invariant: every deployment-dependent value in the settings module reads the environment, with a documented default).

## Plan Overview
Extend the existing `GET /api/version` slice (TEST-05) with a `commit` field. The value is read once per call from the `BUILD_COMMIT` environment variable in the settings module (`backend/app/core/config.py`, default `unknown`), normalised (blank to `unknown`, truncated to 12 characters) in `backend/app/services/version_service.py`, and returned through the existing `VersionResponse` Pydantic schema, which gains a `commit: str` field. The router only composes the two service calls. `docker-compose.yml` and `.env.example` declare the variable. No database, no frontend, no new dependency, no change to `backend/app/main.py`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05): response gains `commit`. No new endpoint, no new router, no registration change in `backend/app/main.py`.
- Settings (`backend/app/core/config.py`): add `build_commit: str` to `Settings`, read per call with `field(default_factory=...)` from `os.environ.get("BUILD_COMMIT")`, stripped, falling back to a module constant `DEFAULT_BUILD_COMMIT = "unknown"` when unset or blank. Per-call read keeps `get_settings()`'s documented "read fresh from the environment" promise, so tests can `monkeypatch.setenv` against the session client.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which returns `get_settings().build_commit[:COMMIT_LENGTH]`. The router never holds a literal.
- Router (`backend/app/routers/version.py`): return `VersionResponse(version=get_app_version(), commit=get_build_commit())`; update the docstring to name TEST-09.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`.
- Repository layer: none (no data access).
- Migrations: none.
- Run configuration: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`; `.env.example` gains a commented `BUILD_COMMIT=` entry explaining CI passes the full sha and the API reports its first 12 characters.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version
- Request: no body, no query parameters
- Response: 200, `application/json`, schema `VersionResponse`

```json
{"version": "0.1.0", "commit": "ac6e44ce1a90"}
```

  With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

- Errors: none reachable beyond the framework's own (`POST /api/version` stays 405).

## Technology Selection
- Commit source (`BUILD_COMMIT` read in `Settings`): chose the standard library's `os.environ` inside the existing dataclass settings module over adding `pydantic-settings` or a build-time generated file, because the project's settings already read every deployment-dependent value with `os.environ` and a few lines cover it.
- Truncation to 12 characters: chose a plain string slice in the service over any git or sha library, because the value is already a string and no parsing is needed.
- `commit` response field: chose a field on the existing Pydantic `VersionResponse` over a new schema, because Pydantic is already installed and the endpoint already uses that schema.
- No net-new dependency is introduced, so no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the truncation edge case
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-09/uat_script.md: build-feature Section 14 step 3's copy of the manual UAT script

### Modified files
- [B] backend/app/core/config.py: `Settings.build_commit` read per call from `BUILD_COMMIT`, default `unknown`, blank treated as unset
- [B] backend/app/services/version_service.py: `COMMIT_LENGTH = 12` and `get_build_commit()` returning the first 12 characters
- [B] backend/app/schemas/version.py: `VersionResponse.commit: str`
- [B] backend/app/routers/version.py: response carries `commit=get_build_commit()`
- [B] docker-compose.yml: backend `environment:` passes `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`
- [B] .env.example: documents `BUILD_COMMIT` and the 12-character report
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit` set, unset, blank, 40-character and exactly-12-character cases
- [B] backend/tests/unit/test_config_unit.py: `Settings.build_commit` resolution from the environment and its default
- [B] backend/tests/integration/test_version_integration.py: existing equality assertions extended with `commit`; set (40-character sha, truncated) and unset cases over HTTP

No dependency manifest changes, so no lockfile (`uv.lock`, `package-lock.json`) is regenerated.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the new variable is optional with a working default and is documented where the other run variables are, in `.env.example`; project structure, dependencies and test infrastructure are unchanged.
No E2E spec is produced: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `backend/app/services/version_service.py` `get_build_commit()` with `get_settings` monkeypatched or `BUILD_COMMIT` set via `monkeypatch.setenv`: set to a 40-character sha returns its first 12; exactly 12 characters returned unchanged; unset returns `unknown`; blank or whitespace returns `unknown`. `backend/app/core/config.py`: `Settings().build_commit` reflects `BUILD_COMMIT` set after import (per-call read), strips whitespace, and defaults to `DEFAULT_BUILD_COMMIT`. Assert the resolution, not only the literal (coding_standards.md Section 5).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_version_service_unit.py`, `test_config_unit.py` are extended)
- Integration tests: `GET /api/version` through the session `client` fixture: with `BUILD_COMMIT` set to a 40-character sha via `monkeypatch.setenv`, 200 and body `{"version": <pyproject version>, "commit": <first 12>}`; with it deleted via `monkeypatch.delenv`, 200 and `commit == "unknown"`; the two existing tests' expected bodies gain the `commit` key (set explicitly via monkeypatch so they do not depend on the ambient environment). No database needed.
  - Directory: backend/tests/integration/
- E2E tests: no spec. The feature has no UI; every criterion is an HTTP or code behaviour (see Criterion coverage).
  - Directory: e2e/tests/ (unused for this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the over-12-character edge case, using HTTP request steps; manual script from the plan below.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router response shape over HTTP |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`), truncated to 12 characters | Unit | verifying it needs no navigation or interaction: it is settings resolution and a service rule; the integration set/unset tests confirm the wiring end to end |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the router's `response_model=VersionResponse` is exercised by the HTTP tests, and the schema file is checked at review |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | verifying it needs no navigation or interaction: the criterion is the existence of those unit and integration tests, satisfied by the tests listed above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit is its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the API's OpenAPI document, When the client reads the version response schema, Then VersionResponse lists version and commit as strings |
| 4 | Unit and integration tests for set and unset | covered at Unit, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
Prerequisites: repository checked out at the feature branch; Docker running; no `BUILD_COMMIT` exported in the shell.
This criterion has no UI; the observable check is the HTTP response.
1. From the repository root run `docker compose up -d --build backend` → the backend container reports running.
2. Run `curl -s -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK`, header `content-type: application/json`.
3. Read the body → exactly two keys, `version` (the `[project].version` value in `backend/pyproject.toml`, e.g. `0.1.0`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: as Criterion 1.
This criterion has no UI; the observable check is the `commit` value in the HTTP response.
1. With `BUILD_COMMIT` unset, run `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `"commit":"unknown"`.
2. Run `BUILD_COMMIT=ac6e44ce1a904f608a5ee6d69dcd1f04429c458e docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `"commit":"ac6e44ce1a90"` (the first 12 characters, not the full 40).
3. Run `BUILD_COMMIT=abc123 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `"commit":"abc123"` (shorter values are returned unchanged).
4. Open `backend/app/routers/version.py` → no commit string literal appears; the value comes from `get_build_commit()`.
5. Run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` unset again to restore the default.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running as in Criterion 1.
1. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with `version` and `commit`, both strings.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a running PostgreSQL is not needed for these files; `uv` installed.
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` → `0 failed`.
2. Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` → each has at least one test setting `BUILD_COMMIT` and one with it unset.
