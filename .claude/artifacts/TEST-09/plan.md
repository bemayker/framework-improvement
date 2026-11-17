# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A client can ask the API which build it is talking to.
>
> Acceptance criteria:
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> Notes: Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete. Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router; when that value is longer than 12 characters, `commit` is its first 12 (tracker comment, below).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the declared source is the `BUILD_COMMIT` environment variable, resolved once in `backend/app/core/config.py`, which truncates a value longer than 12 characters to its first 12 and returns a value of 12 or fewer unchanged. Criterion 2 above carries the rule, and unit plus integration tests cover a 40-character sha, an exactly-12 value and a shorter value.
- Assumption (no comment covers it): an empty or whitespace-only `BUILD_COMMIT` counts as unset and yields `"unknown"`, and surrounding whitespace is stripped before truncation. This matches how `CORS_ORIGINS` already treats a blank value in the same settings module, and what `docs/DEVELOPMENT.md` (Build commit section, already on main) describes.
- Assumption: the environment variable is named `BUILD_COMMIT`, the name the tracker comment uses and `docs/DEVELOPMENT.md` already documents.
- Observation on the item's Notes: the version router is already registered in `backend/app/main.py` (TEST-05, line 56), so this item does not touch `main.py` at all. That removes the shared-file overlap with BUG-01 that the map flags.

## Plan Overview
Extend the existing TEST-05 version endpoint with a `commit` field. Backend only, no database, no new route and no new dependency:
- `core/config.py` gains a `build_commit` setting read per call from `BUILD_COMMIT` (default `"unknown"`, truncated to 12 characters), the one declared source.
- `services/version_service.py` gains `get_build_commit()`, which returns `get_settings().build_commit`.
- `schemas/version.py`'s `VersionResponse` gains `commit: str`.
- `routers/version.py` passes `commit=get_build_commit()` into the response.
- `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container and `.env.example` documents it.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. No new endpoint; the router stays registered in `backend/app/main.py` unchanged.
- Config (the one declared source, `coding_standards.md` Section 5's invariant: every environment-varying value in this settings module is read from the environment with a documented default):
  - In `backend/app/core/config.py` add module constants `UNKNOWN_BUILD_COMMIT = "unknown"` and `BUILD_COMMIT_LENGTH = 12`, and a private `_read_build_commit() -> str` that reads `os.environ.get("BUILD_COMMIT")`, strips it, returns `UNKNOWN_BUILD_COMMIT` when the result is empty, and otherwise returns `value[:BUILD_COMMIT_LENGTH]`.
  - Add `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`, so it is read per call like `database_url` and `cors_origins` (never at import time; the integration tests set the variable after import).
  - The literal `"unknown"` lives only in `config.py`; the router and service never contain it.
- Service layer: in `backend/app/services/version_service.py` add `get_build_commit() -> str` returning `get_settings().build_commit`, with a one-line docstring, and extend the module docstring to name TEST-09. `get_app_version()` is unchanged.
- Router: `get_version()` returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`; update the module docstring to name TEST-09.
- Schema: `VersionResponse` gains `commit: str` (docstring updated to describe both fields).
- Deployment wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (empty passes through as unset, so the default stays in `config.py` alone and is not duplicated in compose). `.env.example` gains a commented `BUILD_COMMIT=` entry under a `# --- Backend ---` heading explaining it is the build's git sha, optional, defaulting to `unknown`, truncated to 12 characters.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, body defined by `VersionResponse`:
  - With `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `{"version": "0.1.0", "commit": "0123456789ab"}`
  - With `BUILD_COMMIT` unset, empty or whitespace-only: `{"version": "0.1.0", "commit": "unknown"}`
  - With `BUILD_COMMIT=abc1234`: `{"version": "0.1.0", "commit": "abc1234"}`
  - (`version` is whatever `backend/pyproject.toml` declares; `0.1.0` is illustrative.)
- Error: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- `BUILD_COMMIT` resolution in `config.py`: chose the standard library (`os.environ` plus string slicing in the existing frozen `Settings` dataclass) over adding pydantic-settings or reading `git rev-parse` at runtime, because the existing settings module already reads its other values this way and the container has no `.git` to read.
- `commit` response field: chose to extend the existing pydantic `VersionResponse` (an installed dependency) over a new schema; no net-new module, component or dependency is introduced by this item.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus the edge case of a 40-character sha
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `BUILD_COMMIT_LENGTH`, `_read_build_commit()` and the `Settings.build_commit` field
- [B] backend/app/services/version_service.py: add `get_build_commit()`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response
- [B] docker-compose.yml: pass `BUILD_COMMIT` through to the backend service environment
- [B] .env.example: document the optional `BUILD_COMMIT` variable
- [B] backend/tests/unit/test_config_unit.py: unit tests for `build_commit` resolution (set, unset, blank, 40-char truncation, exactly 12, shorter)
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` set and unset
- [B] backend/tests/integration/test_version_integration.py: update the two existing exact-body assertions to include `commit`, add set, unset and schema tests

No dependency changes, so no lockfile is regenerated. `backend/app/main.py` is not modified: the version router is already registered there. `README.md` and `docs/DEVELOPMENT.md` need no edit: `docs/DEVELOPMENT.md` → Build commit already documents `BUILD_COMMIT` exactly as planned here, and the README's run instructions do not change. No E2E spec: no criterion needs browser navigation or interaction (see Criterion coverage).

## Testing Strategy
- Unit tests: `config.py` build-commit resolution and `version_service.get_build_commit()`, with the environment controlled by `monkeypatch` (no database, no network).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: the real HTTP request/response cycle through `TestClient` for `GET /api/version` with `BUILD_COMMIT` set (40-char sha, truncated), unset, and the body validated against `VersionResponse`. No database needed (the router reads none).
  - Directory: backend/tests/integration/
- E2E tests: none warranted. Every criterion is a backend response, configuration or schema behaviour with no UI navigation or interaction (`testing_standards.md` Section 6, asked per criterion below), so each is covered at integration or unit level.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: Gherkin scenarios per criterion plus a 40-character sha edge case, and the manual UAT script, both from the sections below.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}` | Integration | `test_get_version_returns_200_with_version_and_commit`, `test_get_version_answers_when_database_url_is_unset` | Verifying it needs no navigation or interaction: it is a router response shape over HTTP |
| 2 | `commit` comes from one declared source (`BUILD_COMMIT`, default `"unknown"`, truncated to 12 characters), never a router literal | Unit | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_settings_build_commit_truncates_long_value_to_12_characters`, `test_settings_build_commit_keeps_value_of_12_or_fewer_characters`, `test_get_version_returns_truncated_commit_when_build_commit_is_set` | Verifying it needs no navigation or interaction: it is configuration resolution, asserted on the resolved value and through the HTTP wiring |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_get_version_response_is_defined_by_version_response_schema` | Verifying it needs no navigation or interaction: it is the OpenAPI response model and body validation of the router |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | `test_get_build_commit_returns_configured_commit`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_truncated_commit_when_build_commit_is_set`, `test_get_version_returns_unknown_commit_when_build_commit_is_unset` | Verifying it needs no navigation or interaction: it is a statement about the unit and integration suites themselves |

Test detail for the builder:
- `test_config_unit.py`: `test_settings_build_commit_reads_env_value` (`BUILD_COMMIT=abc1234` gives `abc1234`); `test_settings_build_commit_defaults_to_unknown_when_unset` (delenv gives `UNKNOWN_BUILD_COMMIT`, and assert that constant equals `"unknown"`); `test_settings_build_commit_treats_blank_value_as_unset` (parametrized `""`, `"   "`); `test_settings_build_commit_truncates_long_value_to_12_characters` (a 40-character sha gives its first 12); `test_settings_build_commit_keeps_value_of_12_or_fewer_characters` (parametrized exactly 12 and 7 characters, unchanged).
- `test_version_service_unit.py`: `test_get_build_commit_returns_configured_commit` (monkeypatch `BUILD_COMMIT`, assert the resolved value, not a literal fallback); `test_get_build_commit_returns_unknown_when_unset`.
- `test_version_integration.py`: rename `test_get_version_returns_200_with_version_from_pyproject` to `test_get_version_returns_200_with_version_and_commit` and assert body `{"version": <pyproject version>, "commit": <str>}` with `BUILD_COMMIT` deleted so the expected commit is `"unknown"`; update `test_get_version_answers_when_database_url_is_unset` to expect the `commit` key; add `test_get_version_returns_truncated_commit_when_build_commit_is_set` (40-char sha via `monkeypatch.setenv`, expect the first 12) and `test_get_version_returns_unknown_commit_when_build_commit_is_unset`; add `test_get_version_response_is_defined_by_version_response_schema` (the app's OpenAPI 200 response for `GET /api/version` references `VersionResponse`, and `VersionResponse.model_validate(response.json())` succeeds with exactly the keys `version` and `commit`). The session-scoped `client` fixture works for these because settings are read per request. Keep `test_post_version_returns_405_method_not_allowed`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the response is 200 with string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When a client requests GET /api/version, Then commit is its first 12 characters; Given BUILD_COMMIT is unset, Then commit is unknown |
| 3 | Body defined by a Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads /openapi.json, Then the 200 response of GET /api/version references VersionResponse with properties version and commit |
| 4 | Tests cover set and unset paths | covered at Unit, see Criterion coverage | Given the backend test suites, When the version and config tests run, Then they pass |

## Manual verification plan
This item has no UI; every criterion is verified against the running backend with `curl` and the test suites.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is up with `docker compose up -d --build backend` from the repository root, with no `BUILD_COMMIT` in the shell or in `.env`.
1. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is exactly two keys, `version` holding the `[project].version` string from `backend/pyproject.toml` and `commit` holding `unknown`.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters of a longer value
Prerequisites: same as Criterion 1.
1. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` → the backend container is recreated.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `0123456789ab` (the first 12 characters).
3. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234`, unchanged.
4. Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
5. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend is running as in Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with string properties `version` and `commit`.
2. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Read the test names in those files → `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_get_version_returns_truncated_commit_when_build_commit_is_set` and `test_get_version_returns_unknown_commit_when_build_commit_is_unset` are present.
