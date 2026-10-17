# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A small backend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, wave 1). Independent of TEST-08, so the first wave has two items that can run in parallel.
>
> ## What
>
> A client can ask the API which build it is talking to.
>
> ## Acceptance criteria
>
> 1. GET /api/version returns 200 with {"version": "<string>", "commit": "<string>"}.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> ## Notes
>
> Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete.
>
> Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. GET /api/version returns 200 with {"version": "<string>", "commit": "<string>"}.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `unknown`), never a string typed into the router.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service function `get_build_commit()` returns `BUILD_COMMIT[:12]`; a value of 12 characters or fewer is returned unchanged, and the `unknown` default is never truncated (it is 7 characters). This comment also names the variable, so `BUILD_COMMIT` is the declared source for criterion 2. Unit and integration tests assert a 40-character sha yields its first 12 characters.
- Assumption (recorded, not blocking): a `BUILD_COMMIT` that is empty or whitespace only is treated as unset and yields `unknown`, matching how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`. Surrounding whitespace is stripped before truncation.
- Assumption (recorded, not blocking): the feature Notes say this item registers a router in `backend/app/main.py`. On main as it stands (e8e01b6) the version router already exists and is registered by TEST-05, so this item extends that router and does NOT modify `main.py`. The shared-risk note on `main.py` therefore does not apply.
- Assumption (recorded, not blocking): the comment says CI passes the full sha in. Wiring `BUILD_COMMIT` into `.github/workflows/pr-tests.yml` or an image build arg is not in the acceptance criteria and is left out (no gold plating). This item declares the variable in `backend/app/core/config.py`, passes it through to the backend container in `docker-compose.yml`, and documents it in `.env.example`, so whatever sets it at build or deploy time reaches the endpoint.

## Plan Overview
Backend only. Extend the existing `GET /api/version` endpoint (TEST-05) with a `commit` field. The value is read in one place, `Settings.build_commit` in `backend/app/core/config.py` (env `BUILD_COMMIT`, default `unknown`, read per call like the other settings), shortened to its first 12 characters in `backend/app/services/version_service.py`, and returned through the existing `VersionResponse` schema, which gains `commit: str`. No database, no new router, no new dependency, no frontend (the footer display is TEST-10).

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE); this item renders no UI.

## Backend Plan
- Endpoints: GET `/api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. Router calls `get_build_commit()` from the service; it holds no commit literal.
- Config: `backend/app/core/config.py` adds `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (stripped `BUILD_COMMIT`, or the default when unset or blank) and a `build_commit: str` field on `Settings` with `default_factory=_read_build_commit`, consistent with `database_url` and `cors_origins` (`coding_standards.md` Section 5 invariant: every environment-dependent value in the settings module is read from the environment with a documented default).
- Service layer: `backend/app/services/version_service.py` adds `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`.
- Schema: `backend/app/schemas/version.py` `VersionResponse` adds `commit: str`.
- Container wiring: `docker-compose.yml` backend `environment` adds `BUILD_COMMIT: ${BUILD_COMMIT:-}` (blank when unset, so the one default lives in `config.py` only).
- Repository layer: none.
- Migrations: none.
- `backend/app/main.py`: unchanged (router already registered by TEST-05).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, application/json, body {"version": "0.1.0", "commit": "0123456789ab"}. With BUILD_COMMIT unset or blank the body is {"version": "0.1.0", "commit": "unknown"}. A POST stays 405.

## Technology Selection
- Commit source: chose the standard library `os.environ` read inside the existing `Settings` dataclass over adding `pydantic-settings` or reading git at runtime (`subprocess` calling git), because the env read is already this module's pattern and a container has no `.git` to read.
- Truncation to 12 characters: chose a plain string slice over any sha-parsing helper; no dependency covers less.
- No other net-new component, module or dependency: the router, service and schema files already exist and are extended.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per acceptance criterion plus the truncation edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and `Settings.build_commit`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit=get_build_commit()`; update docstring to name TEST-09
- [B] docker-compose.yml: pass `BUILD_COMMIT` through to the backend container, blank when unset
- [B] .env.example: document `BUILD_COMMIT` (commented, with the unknown default and the 12-character rule)
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset and blank cases
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` 40-character sha truncated to 12, short value unchanged, unset yields unknown
- [B] backend/tests/integration/test_version_integration.py: existing assertions include `commit`; new set (40-character sha) and unset cases through the HTTP cycle
- [Docs] docs/DEVELOPMENT.md: name `BUILD_COMMIT` as a run-configuration variable (what sets it, default, truncation)

No dependency change in this item, so no lockfile entry. README.md needs no edit: it carries no environment-variable reference for the backend. No E2E spec file: no criterion has E2E as its covering tier (see Criterion coverage). `backend/app/main.py` is not modified: the version router is already registered.

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank, surrounding whitespace) in the config module; `get_build_commit()` in the service (40-character sha returns its first 12, a value of 12 or fewer characters is unchanged, unset returns unknown). Tests set and delete `BUILD_COMMIT` with `monkeypatch` and assert the resolved value, not the literal default alone (`coding_standards.md` Section 5: assert the resolution).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend test_config_unit.py and test_version_service_unit.py)
- Integration tests: full HTTP cycle on GET /api/version through the `client` fixture: commit set to a 40-character sha returns its first 12; commit unset returns unknown; the two existing tests now expect both keys; the existing 405 case stays.
  - Directory: backend/tests/integration/ (extend test_version_integration.py)
- E2E tests: not warranted. E2E Tests is ENABLED, but no criterion involves navigation or interaction through the UI; the endpoint is API only and the footer display is TEST-10 (`testing_standards.md` Section 6, fourth question asked per criterion).
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/version returns 200 with version and commit strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked in the real HTTP cycle |
| 2 | commit comes from BUILD_COMMIT, default unknown, never typed into the router | Unit and Integration | No UI involved: env resolution is a config and service rule (unit), and the set and unset values reaching the response is a router behaviour (integration) |
| 3 | Response body defined by a Pydantic schema in backend/app/schemas/ | Integration | No UI involved: the integration tests assert the exact body the `response_model` serialises, and the schema file is checked at review |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | The criterion is the tests themselves; it is met by the unit and integration cases listed above running green |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/version returns 200 with version and commit strings | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/version, Then the status is 200 and the body holds a version string and a commit string |
| 2 | commit comes from BUILD_COMMIT, default unknown | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is unset, When the client requests the version, Then commit is unknown; Given BUILD_COMMIT is a 40-character sha, Then commit is its first 12 characters |
| 3 | Response body defined by a Pydantic schema | covered at Integration, see Criterion coverage | Given the API docs at /docs, When the version endpoint is inspected, Then its response schema VersionResponse lists version and commit |
| 4 | Unit and integration tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the version and config tests run, Then 0 failed |

## Manual verification plan
This item has no UI: every criterion is verified against the API with a terminal and a browser tab on the API docs. The footer display of the commit is TEST-10.

### Criterion 1: GET /api/version returns 200 with version and commit strings
Prerequisites: from the repo root, BUILD_COMMIT not exported in your shell, stack started with `docker compose up -d --build`, backend answering on http://localhost:8010.
1. Run `curl -i http://localhost:8010/api/version` → the status line reads HTTP/1.1 200 OK and Content-Type is application/json.
2. Read the body of that response → it has exactly two keys, version and commit, both strings; version equals `[project].version` in backend/pyproject.toml.

### Criterion 2: commit comes from BUILD_COMMIT, default unknown, never typed into the router
Prerequisites: the stack from Criterion 1 is running.
1. With BUILD_COMMIT still unset, run `curl -s http://localhost:8010/api/version` → commit is unknown.
2. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend`, wait for the container to be up, then repeat the curl → commit is 0123456789ab (the first 12 characters).
3. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then repeat the curl → commit is abc1234 (unchanged, shorter than 12).
4. Run `BUILD_COMMIT= docker compose up -d backend` (blank), then repeat the curl → commit is unknown.
5. Run `grep -rn BUILD_COMMIT backend/app` → the only hits are in backend/app/core/config.py; backend/app/routers/version.py contains no commit literal and calls get_build_commit().
6. Run `docker compose up -d backend` with BUILD_COMMIT unset to restore the default.

### Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/
Prerequisites: the stack from Criterion 1 is running.
1. Open backend/app/schemas/version.py → class VersionResponse(BaseModel) declares version: str and commit: str.
2. Open http://localhost:8010/docs in a browser and expand GET /api/version → the 200 response schema is VersionResponse with the two string fields version and commit.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: the compose database is up (`docker compose up -d db`) on host port 5442.
1. From the repo root run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line shows 0 failed and no skipped tests.
2. Open backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py → each has a test for BUILD_COMMIT set to a 40-character sha (expects its first 12 characters) and one for BUILD_COMMIT unset (expects unknown).
