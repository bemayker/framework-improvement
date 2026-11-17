# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A client can ask the API which build it is talking to.
>
> Acceptance criteria
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> Notes: Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete. Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router; when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12 (tracker comment, below).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: folded into criterion 2. The environment variable is named `BUILD_COMMIT` (the description only says "an environment variable"; the comment names it). Truncation to the first 12 characters lives in the service layer (`get_build_commit()` in `backend/app/services/version_service.py`), so the router stays free of logic and the rule is unit-testable. A value of 12 characters or fewer is returned unchanged. Covered by unit and integration tests on a 40-character sha.
- Assumption (no comment covers it): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `"unknown"`, and surrounding whitespace is stripped before truncation. This matches how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`, and it keeps docker-compose's empty pass-through (`${BUILD_COMMIT:-}`) from reporting an empty commit.
- Assumption: the router is NOT re-registered. `backend/app/main.py` already includes `version_router` (TEST-05 registered it), so the feature note's "registers a router in main.py" is already true on main; this item extends the existing endpoint instead of adding a second one.
- Scheduling note from the dispatch (BUG-01 registers a server_time router in `backend/app/main.py` concurrently) → TEST-09 does **not** touch `backend/app/main.py`; see File Manifest. No serialization with BUG-01 is needed on that file.

## Plan Overview
Extend the existing `GET /api/version` endpoint (TEST-05) with a `commit` field. The value is read from the `BUILD_COMMIT` environment variable through the single settings module (`backend/app/core/config.py`, new `build_commit` field, default `"unknown"`, read per call like `cors_origins`), shortened to its first 12 characters by a new service function, and returned through the existing `VersionResponse` Pydantic schema, which gains a `commit: str` field. The docker-compose backend service passes `BUILD_COMMIT` through from the host environment, and `.env.example` documents it. Backend only; no frontend, no database, no new dependency, no change to `backend/app/main.py`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`) now returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No new route, no new router, no registration change.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"`, a private reader `_read_build_commit()` that returns `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank, and a `Settings.build_commit: str` field with `default_factory=_read_build_commit`. This is the one declared source (criterion 2) and follows `coding_standards.md` Section 5's invariant: every environment-varying value in this settings module reads the environment per call with a documented default.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. Settings are read per call so a changed environment is honoured without an app restart in tests. One-line docstrings per the project's documentation convention, module docstring updated to name TEST-09.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`; module docstring names TEST-09.
- Deployment wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (empty pass-through, so the default stays owned by `config.py` alone and is not duplicated in compose); `.env.example` gains a commented, optional `BUILD_COMMIT=` entry with one comment line explaining that CI passes the full 40-character sha and the API reports its first 12 (README.md line 70 already advertises this key).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, shape `VersionResponse`:
  - `version`: string, the installed distribution version (unchanged from TEST-05, e.g. `0.1.0`)
  - `commit`: string, the first 12 characters of `BUILD_COMMIT`, or `unknown` when it is unset or blank
- Example with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`:
  `{"version": "0.1.0", "commit": "0123456789ab"}`
- Example with `BUILD_COMMIT` unset:
  `{"version": "0.1.0", "commit": "unknown"}`
- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- `BUILD_COMMIT` reader in `config.py`: chose the standard library's `os.environ` inside the existing dataclass `Settings` over adding `pydantic-settings` (not installed; the module already reads `DATABASE_URL` and `CORS_ORIGINS` this way, so a second mechanism would split the settings module).
- `get_build_commit()` truncation: chose plain string slicing (`[:12]`) in the existing service module; no stdlib alternative is needed and no new module is created.
- No new dependency, and no new component or module: every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the 40-character truncation edge case
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()` returning the first 12 characters of the configured commit
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`
- [B] backend/tests/unit/test_config_unit.py: unit tests for the `build_commit` setting (set, unset, blank)
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` (40-character sha truncated, short value unchanged, unset yields unknown)
- [B] backend/tests/integration/test_version_integration.py: update the two existing exact-body assertions to include `commit`, and add set, unset, truncation and schema tests
- [B] docker-compose.yml: pass `BUILD_COMMIT` through to the backend container as `${BUILD_COMMIT:-}`
- [B] .env.example: document the optional `BUILD_COMMIT` key

`backend/app/main.py` is NOT modified by this item: `version_router` is already registered there (TEST-05), and this item only extends that router's existing handler. BUG-01's concurrent server_time registration in `main.py` therefore does not overlap with TEST-09.
No lockfile changes: no dependency is added or removed, so neither `backend/uv.lock` nor any `package-lock.json` changes.
No `README.md` or `docs/DEVELOPMENT.md` edit is expected: README.md's tree already describes `.env.example` as carrying an optional `BUILD_COMMIT`, project structure and test infrastructure are unchanged, and DEVELOPMENT.md defers environment keys to `.env.example` and the README.
No E2E spec file: no criterion has E2E as its covering tier (see Criterion coverage).

## Testing Strategy
- Unit tests: the settings reader and the service truncation rule, all external state via `monkeypatch` (environment) and no HTTP.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend the existing `test_config_unit.py` and `test_version_service_unit.py`)
  - `test_settings_build_commit_reads_env_value`: `BUILD_COMMIT=abc1234` gives `get_settings().build_commit == "abc1234"`.
  - `test_settings_build_commit_defaults_to_unknown_when_unset`: `BUILD_COMMIT` deleted gives `"unknown"` and equals `DEFAULT_BUILD_COMMIT`.
  - `test_settings_build_commit_treats_blank_value_as_unset`: parametrized over `""` and `"   "`, gives `"unknown"`.
  - `test_get_build_commit_truncates_full_sha_to_twelve_characters`: a 40-character sha gives its first 12 characters.
  - `test_get_build_commit_returns_short_value_unchanged`: `abc1234` stays `abc1234`.
  - `test_get_build_commit_returns_unknown_when_unset`: `BUILD_COMMIT` deleted gives `"unknown"`.
- Integration tests: full HTTP request/response cycle through `TestClient`, environment set per test with `monkeypatch` (settings are read per request, so the session `client` fixture reflects it).
  - Directory: backend/tests/integration/
  - `test_get_version_returns_200_with_version_from_pyproject` and `test_get_version_answers_when_database_url_is_unset`: updated to delete `BUILD_COMMIT` and assert the full body `{"version": <pyproject version>, "commit": "unknown"}`, so they cannot be broken by a `BUILD_COMMIT` exported in the runner's environment.
  - `test_get_version_returns_commit_from_build_commit_env`: `BUILD_COMMIT=abc1234` gives `commit == "abc1234"`.
  - `test_get_version_returns_unknown_commit_when_build_commit_unset`: gives `commit == "unknown"`.
  - `test_get_version_returns_first_twelve_characters_of_full_sha`: a 40-character sha gives its first 12.
  - `test_version_openapi_schema_declares_version_and_commit`: `/openapi.json` names the response model `VersionResponse` for `GET /api/version`, with required string properties `version` and `commit`.
  - `test_post_version_returns_405_method_not_allowed`: unchanged.
- E2E tests: no spec for this item. The feature has no UI: no criterion requires navigation or interaction through the browser (`testing_standards.md` Section 6, fourth question asked per criterion), and an E2E test calling the API directly is a router integration test (Section 5).
  - Directory: e2e/tests/
  - File: none for TEST-09
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, phrased at the API level.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_returns_commit_from_build_commit_env` | verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `commit` from `BUILD_COMMIT` (default `unknown`), first 12 characters when longer | Unit | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_get_build_commit_truncates_full_sha_to_twelve_characters`, `test_get_version_returns_first_twelve_characters_of_full_sha` | verifying it needs no navigation or interaction: it is a configuration and service rule, also exercised end to end through the router at integration level |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_version_openapi_schema_declares_version_and_commit` | verifying it needs no navigation or interaction: it is the route's declared response model, read from the OpenAPI document |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_returns_commit_from_build_commit_env`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_get_build_commit_returns_unknown_when_unset`, `test_settings_build_commit_reads_env_value` | verifying it needs no navigation or interaction: the criterion is the existence of these unit and integration tests |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the API is running When a client requests GET /api/version Then the response is 200 with string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When a client requests GET /api/version Then commit equals its first 12 characters; Given BUILD_COMMIT is unset Then commit is unknown |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the API is running When a client reads /openapi.json Then GET /api/version responds with VersionResponse declaring version and commit |
| 4 | Unit and integration tests cover set and unset paths | covered at Integration, see Criterion coverage | Given the backend test suite When the version and config tests run Then they pass |

## Manual verification plan
This feature has no UI: every criterion is verified against the running API with curl, or by running the named tests. Run all commands from the repository root.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
Prerequisites: backend dependencies installed (`uv sync --directory backend`); port 8010 free; no database needed.
1. Start the API without a commit: `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` → the log shows `Uvicorn running on http://127.0.0.1:8010` (a warning about DATABASE_URL is expected and harmless).
2. In a second terminal run `curl -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK`, `content-type: application/json`, and body `{"version":"0.1.0","commit":"unknown"}` (version is whatever `backend/pyproject.toml` declares).
3. Stop the server with Ctrl+C.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters when longer
Prerequisites: as for criterion 1, server stopped.
1. Start the API with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:create_app --factory --port 8010` → server starts.
2. Run `curl -s http://localhost:8010/api/version` → body `{"version":"0.1.0","commit":"0123456789ab"}`: exactly the first 12 characters, not the full 40.
3. Stop the server and restart it with a short value: `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234`, unchanged.
4. Stop the server and restart it with a blank value: `BUILD_COMMIT= uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
5. Open `backend/app/routers/version.py` → no commit string literal appears in it; the value comes from `get_build_commit()`.
6. Stop the server.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: API running as in criterion 1 step 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with string fields `version` and `commit`, both required.
2. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.
3. Stop the server.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: backend dependencies installed. Integration tests that need a database are not in these files, so no `DATABASE_URL` is needed.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports no failed or errored test and the command exits 0.
2. Confirm the set and unset paths are present by name in that output with `-v` added: `test_get_version_returns_commit_from_build_commit_env`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset` each show `PASSED`.
