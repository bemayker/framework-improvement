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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, default `"unknown"`), never a string typed into the router; when `BUILD_COMMIT` is longer than 12 characters only its first 12 are returned (tracker comment).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the comment names it; the description only said "an environment variable"), and the version service truncates the configured value to its first 12 characters. A value of 12 characters or fewer is returned unchanged. Folded into criterion 2 above and covered by dedicated unit and integration tests (Criterion coverage rows 2 and 4).
- Assumption (ambiguity, recorded rather than blocking): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`. Surrounding whitespace is stripped before truncation.
- Assumption: "set at build time" is satisfied by the deploy/CI environment supplying `BUILD_COMMIT` to the backend process. The backend reads it at runtime through the existing settings module (the project's one declared configuration source); `docker-compose.yml` passes it through to the backend container with the same `${VAR:-default}` shape `CORS_ORIGINS` uses, so a value exported by CI reaches the container. No Dockerfile build-arg is added: the backend image is built from a bind-mounted source tree in compose, and a runtime pass-through is the smallest wiring that makes the declared source reachable.
- Merged since the last plan: n/a (fresh plan, plan base 283fc31 is the current main tip named in the dispatch; no `[merged-since]` lines were supplied).

## Plan Overview
Backend-only change to the existing `GET /api/version` endpoint (TEST-05). The router is already registered in `backend/app/main.py`, so **`main.py` is not modified** by this item (the feature note's "registers a router" is already true on main). Changes:
- `backend/app/core/config.py`: new `build_commit` setting read per call from `BUILD_COMMIT`, defaulting to `"unknown"` (blank treated as unset).
- `backend/app/services/version_service.py`: new `get_build_commit()` returning the setting truncated to its first 12 characters.
- `backend/app/schemas/version.py`: `VersionResponse` gains `commit: str`.
- `backend/app/routers/version.py`: response carries `commit=get_build_commit()`.
- `docker-compose.yml` and `.env.example`: declare and pass through `BUILD_COMMIT`.
Tests extend the existing unit and integration files for config, version service and version router.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): now returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No new route; router registration in `backend/app/main.py` is unchanged.
- Settings (`backend/app/core/config.py`):
  - Add module constant `UNKNOWN_BUILD_COMMIT = "unknown"`.
  - Add `_read_build_commit() -> str`: returns `os.environ.get("BUILD_COMMIT")` stripped, or `UNKNOWN_BUILD_COMMIT` when unset or blank.
  - Add field `build_commit: str = field(default_factory=_read_build_commit)` to the frozen `Settings` dataclass, so it is read per call like `database_url` and `cors_origins` (coding_standards.md Section 5's invariant: every deployment-dependent value in this module reads the environment, with a documented default).
- Service layer (`backend/app/services/version_service.py`):
  - Add `COMMIT_DISPLAY_LENGTH = 12`.
  - Add `get_build_commit() -> str`: returns `get_settings().build_commit[:COMMIT_DISPLAY_LENGTH]`. The `"unknown"` default is 7 characters, so it passes through unchanged. Never raises.
  - `get_app_version()` is unchanged.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str` (docstring updated to name TEST-09).
- Repository layer: none (no data access).
- Migrations: none.
- Configuration wiring:
  - `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`.
  - `.env.example` gains a commented `BUILD_COMMIT=unknown` entry explaining that CI sets the full commit sha and the API reports its first 12 characters.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `VersionResponse`:
  - `version` (string): the installed `task-notes-backend` distribution version (unchanged from TEST-05).
  - `commit` (string): first 12 characters of `BUILD_COMMIT`, or `"unknown"` when unset or blank.
  - Example with `BUILD_COMMIT=283fc31296537221cbdef4aedabbd59d0237dc95`: `{"version": "0.1.0", "commit": "283fc3129653"}`
  - Example with `BUILD_COMMIT` unset: `{"version": "0.1.0", "commit": "unknown"}`
- Error: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- `build_commit` setting: chose the standard library's `os.environ` inside the existing `Settings` dataclass over a new settings dependency (e.g. pydantic-settings), because the module already reads every deployment-dependent value this way and one more field needs no library.
- Commit truncation: chose a plain string slice (`[:12]`) in the service over any git/sha helper, because the value is already a string and no parsing or validation is asked for.
- No new dependency, component or module is introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the 12-character truncation edge case
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` settings field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_DISPLAY_LENGTH` and `get_build_commit()` truncating to 12 characters
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}` to the backend service
- [B] .env.example: document `BUILD_COMMIT` with its `unknown` default
- [B] backend/tests/unit/test_config_unit.py: unit tests for the `build_commit` setting (set, unset, blank)
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` (set, full-sha truncation, unset)
- [B] backend/tests/integration/test_version_integration.py: update the existing exact-body assertions to include `commit`, and add set, truncated, unset and schema tests

No dependency changes, so no lockfile is regenerated. No E2E spec: no criterion needs navigation or interaction through the UI (see Criterion coverage). Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the one new environment variable is documented in `.env.example`, which the README's run steps already point to, and project structure, dependencies and test infrastructure are unchanged.

## Testing Strategy
- Unit tests: `build_commit` setting resolution (set, unset, blank) in the settings module; `get_build_commit()` business logic (configured value returned, 40-character sha truncated to 12, unset yields `unknown`), with settings mocked via `monkeypatch` environment changes.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` through `TestClient` with `BUILD_COMMIT` set, set to a full sha, and unset; the OpenAPI schema exposes `VersionResponse` with `version` and `commit`; existing 405 and no-database tests kept, their body assertions updated to include `commit`.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E is ENABLED in CLAUDE.md, but no criterion requires navigation or interaction through the UI (backend-only JSON endpoint); a browser spec would be a router test through a browser (testing_standards.md Section 5's anti-pattern).
  - Directory: e2e/tests/
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, phrased as API-client steps.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version", "commit"}` | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_returns_commit_from_build_commit_env` | Verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters), never typed into the router | Unit | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_build_commit_truncates_full_sha_to_first_12_characters` | Verifying it needs no navigation or interaction: it is configuration resolution and a service rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_version_response_schema_has_version_and_commit` | Verifying it needs no navigation or interaction: it is the router's declared response model |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_build_commit_returns_configured_value`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_get_version_returns_truncated_commit_for_full_sha` | Verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests themselves (unit ids above, integration ids here) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with version and commit | covered at Integration, see Criterion coverage | Given the API is running When a client requests GET /api/version Then the status is 200 and the body has string fields version and commit |
| 2 | commit from BUILD_COMMIT, default unknown, first 12 chars | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When a client requests GET /api/version Then commit is its first 12 characters; Given BUILD_COMMIT is unset Then commit is unknown |
| 3 | Pydantic schema in backend/app/schemas/ | covered at Integration, see Criterion coverage | Given the API is running When a client reads /openapi.json Then VersionResponse lists version and commit as strings |
| 4 | set and unset paths tested | covered at Integration, see Criterion coverage | Given the backend test suites When they run Then the set and unset commit tests pass with 0 failed |

## Manual verification plan
This feature has no UI: every criterion is verified against the backend API from a terminal. Prerequisites for every block: the repository checked out on the feature branch, `uv` installed, and no other process listening on port 8010 (check with `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --probe 8010`). No database is needed for this endpoint.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the backend started with a commit set: `BUILD_COMMIT=abc123 uv run --directory backend uvicorn app.main:app --port 8010` in its own terminal.
1. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK`.
2. Read the body of that response → it is exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`, e.g. `0.1.0`) and `commit` with value `abc123`, both JSON strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters)
Prerequisites: none beyond the shared ones; stop any backend started in another block.
1. Start the backend with a full sha: `BUILD_COMMIT=283fc31296537221cbdef4aedabbd59d0237dc95 uv run --directory backend uvicorn app.main:app --port 8010` → server logs `Uvicorn running on http://127.0.0.1:8010`.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `283fc3129653` (12 characters), not the full 40.
3. Stop the server, restart it without the variable: `uv run --directory backend uvicorn app.main:app --port 8010` → server starts.
4. Run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
5. Stop the server, restart it with a blank value: `BUILD_COMMIT= uv run --directory backend uvicorn app.main:app --port 8010`, then run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
6. Open `backend/app/routers/version.py` → the router contains no commit string literal; it calls `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running as in Criterion 1.
1. Run `curl -s http://localhost:8010/openapi.json` and find `components.schemas.VersionResponse` → its `properties` are `version` and `commit`, each `"type": "string"`, and both are listed under `required`.
2. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a backing Postgres reachable through `DATABASE_URL` for the shared integration fixtures (per CLAUDE.md Backing Services).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → output ends with `0 failed` (or no `failed` count), and includes `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_get_build_commit_returns_configured_value`, `test_get_build_commit_returns_unknown_when_unset` when run with `-v`.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`, and with `-v` the run lists `test_get_version_returns_commit_from_build_commit_env` and `test_get_version_returns_unknown_commit_when_build_commit_unset` as passed.
