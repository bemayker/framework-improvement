# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A small backend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, wave 1). Independent of TEST-08, so the first wave has two items that can run in parallel.
>
> **What:** A client can ask the API which build it is talking to.
>
> **Acceptance criteria**
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> **Notes:** Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete.
>
> Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router; when `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 (tracker clarification, see Re-Plan Feedback).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: criterion 2 now carries the 12-character rule; the truncation lives in the service (`get_build_commit`, `COMMIT_LENGTH = 12`), not in settings, so settings keeps the raw declared value and the response shape is decided in one place. Covered by unit tests on the service and by one integration test that sets a full 40-character sha and asserts the 12-character prefix. Assumption recorded: a value of 12 characters or fewer is returned unchanged, and the comment also names the variable, so `BUILD_COMMIT` is the declared source the description left unnamed.
- Assumption (no comment, description ambiguous): "an environment variable set at build time" is honoured by the runtime reading `BUILD_COMMIT` plus a Docker build argument that bakes it into the image (`ARG BUILD_COMMIT` then `ENV BUILD_COMMIT`), forwarded by `docker-compose.yml` from the host environment. A blank or whitespace-only value is treated as unset and yields `"unknown"`, the same blank-is-unset rule `CORS_ORIGINS` already follows in `config.py`. The plugin-owned CI workflows are not edited: how CI passes the sha in is outside this item's criteria.
- Merged since the last plan: n/a (fresh plan, no `[merged-since]` lines in the dispatch; plan base 4e631128).

## Plan Overview
The endpoint already exists: TEST-05 shipped `GET /api/version` returning `{"version": ...}` through `routers/version.py`, `services/version_service.py` and `schemas/version.py`, and `backend/app/main.py` already registers that router. TEST-09 therefore extends the existing slice rather than adding a route:

- `Settings` gains `build_commit`, read per call from `BUILD_COMMIT` with the documented default `"unknown"` (one declared source, `coding_standards.md` Section 5's invariant: every environment-varying value in the settings module reads the environment with a documented default).
- `version_service` gains `get_build_commit()`, which returns the settings value cut to its first 12 characters.
- `VersionResponse` gains `commit: str`; the router passes `commit=get_build_commit()`.
- The backend image accepts `BUILD_COMMIT` as a build argument and exposes it as an environment variable; compose forwards it.

`backend/app/main.py` needs **no change** (the version router is already included), which removes the main.py conflict the feature map warns about. Backend only; no frontend, no E2E.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response extended with `commit`. No new route, no change to `backend/app/main.py`.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and `_read_build_commit() -> str`, which returns `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank. Add the field `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`, read per call like `database_url` and `cors_origins` (the module docstring explains why a plain default would be captured at import time). One-line docstrings on the new function (ruff D103 gate).
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. The default `"unknown"` is 7 characters and passes through unchanged. Extend the module docstring with a TEST-09 line naming the 12-character rule and its source (the tracker clarification).
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`, docstring updated to name both fields.
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit value in the router.
- Build-time wiring: `backend/Dockerfile` adds `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=${BUILD_COMMIT}` (no default in the Dockerfile, so `"unknown"` has exactly one source, `config.py`; an empty build argument is blank and resolves to the default). `docker-compose.yml` adds `args: BUILD_COMMIT: ${BUILD_COMMIT:-}` under `backend.build`. `.env.example` documents `BUILD_COMMIT` as optional and commented out, which also makes README line 70's existing mention of it true.
- Repository layer: none. Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: none (no body, no query parameters)
- Response: 200, `application/json`, schema `VersionResponse` (`backend/app/schemas/version.py`)

```json
{"version": "0.1.0", "commit": "4e631128d728"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

- `version`: unchanged from TEST-05 (installed distribution metadata, `"unknown"` when not installed).
- `commit`: `BUILD_COMMIT` stripped, first 12 characters; `"unknown"` when unset or blank.
- `POST /api/version` keeps answering 405 (existing behaviour).

## Technology Selection
- Build commit source: chose `os.environ` read through the existing `Settings` dataclass (stdlib, existing pattern) over adding `pydantic-settings` or reading `git rev-parse` at runtime, because the image carries no `.git` directory and the settings module already reads every environment value this way.
- Truncation: chose a stdlib string slice over any helper or dependency; no alternative is needed.
- Build-time injection: chose Docker's native `ARG` and `ENV` plus compose `build.args` (platform feature already in use) over a generated version file written during the build.
- No net-new component, module or dependency is introduced: every change extends an existing module.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus the 40-character truncation edge case
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit` read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: `COMMIT_LENGTH = 12` and `get_build_commit()`
- [B] backend/app/schemas/version.py: `VersionResponse.commit: str`
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response
- [B] backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=${BUILD_COMMIT}`
- [B] docker-compose.yml: forward `BUILD_COMMIT` as a backend build argument
- [B] .env.example: document the optional `BUILD_COMMIT`
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset and blank cases
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit` set, unset, short and 40-character cases
- [B] backend/tests/integration/test_version_integration.py: existing exact-body assertions updated to include `commit`; set, unset, truncation and schema tests added
- [Docs] docs/DEVELOPMENT.md: one short paragraph naming `BUILD_COMMIT` (build argument, runtime variable, default `"unknown"`, 12-character response) because run configuration changes

No dependency changes, so no lockfile entry. README.md needs no edit: its line 70 already names the optional `BUILD_COMMIT` in `.env.example`, which this item makes true. `backend/app/main.py` is not modified: the version router is already registered. No E2E spec: no criterion requires navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: settings resolution of `BUILD_COMMIT` (set, unset, blank) and the service's 12-character rule (set, unset, exactly-short, full 40-character sha), with the environment patched through `monkeypatch`; no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: the real HTTP cycle through `TestClient` for `GET /api/version` with `BUILD_COMMIT` set to a short value, set to a 40-character sha, and unset; body validated against `VersionResponse`. Existing tests whose exact-body assertion `{"version": ...}` would now fail are updated to include `commit`. The endpoint needs no database, so these do not depend on `DATABASE_URL`. `get_settings()` is read per request, so `monkeypatch.setenv` reaches the session `client` fixture without building a new app.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The E2E toggle is ENABLED, but no criterion involves navigation or interaction through the UI: the frontend does not call `/api/version` (the footer reads `frontend/package.json`), so a browser spec would only call the API directly, which `testing_standards.md` Section 5 classes as a router integration test.
  - Directory: e2e/tests/ (no file this item)
  - File: none
- UAT scenarios: one scenario per criterion plus the 40-character truncation edge case, written against the HTTP response.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_and_commit`, `test_get_version_answers_when_database_url_is_unset` | No UI reaches this endpoint; it is a router request/response behaviour. |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`), first 12 characters when longer | Unit | `test_settings_build_commit_reads_build_commit_env`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_returns_short_value_unchanged` | It is a configuration and service rule with no navigation or interaction. |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_get_version_response_validates_against_version_response_schema` | It is a response-shape property checked at the router boundary, not in a browser. |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_reports_commit_from_build_commit_env`, `test_get_version_reports_unknown_commit_when_build_commit_unset`, `test_get_version_truncates_full_sha_commit_to_12_characters`, `test_get_build_commit_returns_unknown_when_build_commit_unset` | It is a statement about the test suite, met by the router and service tests named here; no UI involved. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When a client requests GET /api/version, Then commit equals the sha's first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema defines the body | covered at Integration, see Criterion coverage | Given the OpenAPI document at /openapi.json, Then the /api/version 200 response references the VersionResponse schema with properties version and commit |
| 4 | Tests cover set and unset paths | covered at Integration, see Criterion coverage | Given the backend test suite, When the version tests run, Then the run passes with no failed or errored test |

## Manual verification plan
None of these criteria can be verified through the UI: the frontend does not call `/api/version`. Each block below uses a terminal and the HTTP response instead.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: a terminal at the repository root; `uv` installed; port 8010 free. No database is needed.
1. Run `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` → the log ends with `Uvicorn running on http://127.0.0.1:8010` (a warning that `DATABASE_URL` is not set is expected and harmless).
2. In a second terminal run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is a JSON object with exactly two keys, `version` (for example `0.1.0`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters
Prerequisites: the server from Criterion 1 stopped (Ctrl+C).
1. Start the server with no `BUILD_COMMIT` in the environment: `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` → server starts.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`. Stop the server.
3. Start it with a full sha: `BUILD_COMMIT=4e631128d7285ec47eb354795bf120878553505b uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then run the same curl → `commit` is `4e631128d728` (12 characters). Stop the server.
4. Start it with a short value: `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then curl → `commit` is `abc1234`. Stop the server.
5. Start it with a blank value: `BUILD_COMMIT=" " uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then curl → `commit` is `unknown`. Stop the server.
6. Open `backend/app/routers/version.py` → it contains no literal commit string; the value comes from `get_build_commit()`.
7. Optional container check: run `BUILD_COMMIT=4e631128d7285ec47eb354795bf120878553505b docker compose build backend` then `docker compose up -d backend` and `curl -s http://localhost:8010/api/version` → `commit` is `4e631128d728`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the server running as in Criterion 1 step 1.
1. Open `backend/app/schemas/version.py` → class `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Run `curl -s http://localhost:8010/openapi.json` and find the path `/api/version` → its 200 response references `#/components/schemas/VersionResponse`, whose properties are `version` and `commit`, both of type `string` and both required.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a terminal at the repository root.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports no failed or errored test and the command exits 0.
2. In that output, or with `-v` added, confirm `test_get_version_reports_commit_from_build_commit_env` and `test_get_version_reports_unknown_commit_when_build_commit_unset` both appear as passed.
