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
- [ ] 2. `commit` comes from one declared source (environment variable `BUILD_COMMIT`, set at build time, default `"unknown"`), never a string typed into the router. Amended by the tracker comment: a value longer than 12 characters is returned as its first 12 only.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback (if applicable)
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service truncates to the first 12 characters (`COMMIT_DISPLAY_LENGTH = 12` in `version_service.py`); a value of 12 or fewer characters is returned unchanged. Unit and integration tests cover a 40-character sha (returns its first 12) and a short value (returned as-is). This comment also fixes the variable name: `BUILD_COMMIT`.
- Other tracker comments (framework PR-link notes from earlier, reset runs, PRs #69 and #94) → not acted on because they carry no requirement; verified against the worktree (origin/main 366d535) that no `commit` field, `BUILD_COMMIT` read or related test exists, so this is a fresh plan.
- Assumption (tracker note vs. codebase): the note says this item "registers a router in `backend/app/main.py`". On main, `GET /api/version` already exists (TEST-05: `routers/version.py`, `schemas/version.py`, `services/version_service.py`) and its router is already included in `main.py`. This plan therefore EXTENDS the existing endpoint with a `commit` field and does NOT touch `backend/app/main.py`. A second router or a second `/api/version` route would be a duplicate that FastAPI resolves to whichever was registered first.
- Assumption: `version` keeps its TEST-05 source (installed package metadata, `"unknown"` fallback); this item changes nothing about it.
- Assumption: an empty or whitespace-only `BUILD_COMMIT` counts as unset and yields `"unknown"`; surrounding whitespace is stripped before truncation. Same convention `config.py` already uses for `CORS_ORIGINS`.
- Assumption: "set at build time" is honoured by a Docker build argument: `backend/Dockerfile` declares `ARG BUILD_COMMIT=unknown` and promotes it to an `ENV BUILD_COMMIT` of the same value, and `docker-compose.yml` passes a `BUILD_COMMIT` build arg taken from the host environment, defaulting to `unknown`. The app itself only reads the environment variable at request time, so `uv run` outside Docker works the same way. No CI workflow is edited: wiring CI's sha into an image build is outside these criteria.

## Plan Overview
Backend-only, additive change to the existing `GET /api/version` endpoint:
- `Settings` (`backend/app/core/config.py`) gains a `build_commit` field read per call from `BUILD_COMMIT`, defaulting to `"unknown"`. This is the one declared source.
- `version_service` gains `get_build_commit()`, which reads `get_settings().build_commit` and returns at most its first 12 characters.
- `VersionResponse` gains `commit: str`; the router fills it from the service.
- Docker build plumbing so the value can be set at image build time; `.env.example` and `README.md` document the variable.
No database, no frontend, no new dependency, no new router.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response extended with `commit`.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a reader `_read_build_commit()` returning `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank. Add `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`, so it is read fresh per `get_settings()` call like `database_url` and `cors_origins` (`coding_standards.md` Section 5: within one settings module, every environment-varying value is configured the same way, with a documented default).
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_DISPLAY_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_DISPLAY_LENGTH]`. The default `"unknown"` is 7 characters, so it passes through unchanged. Keep `get_app_version()` as is.
- Router (`backend/app/routers/version.py`): return `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No string literal for the commit in the router. Update the module docstring to mention TEST-09.
- Schema (`backend/app/schemas/version.py`): add `commit: str` to `VersionResponse`, with a docstring line naming its source.
- Build plumbing: `backend/Dockerfile` adds `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT` set from that argument (placed after the dependency-sync layers so a new sha does not bust the dependency cache). `docker-compose.yml` adds `args:` with `BUILD_COMMIT` from the host environment, default `unknown`, under `backend.build`. `.env.example` gains a commented `BUILD_COMMIT=unknown` entry.
- Repository layer: none. Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response 200, `BUILD_COMMIT` set to `0123456789abcdef0123456789abcdef01234567`: `{"version": "0.1.0", "commit": "0123456789ab"}`
- Response 200, `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`
- `version` is whatever `backend/pyproject.toml` declares (shown as `0.1.0` for illustration). Both fields are always strings; the endpoint has no error response other than 405 for a non-GET method.

## Technology Selection
- `BUILD_COMMIT` reader in `Settings`: chose the standard library `os.environ.get` inside the existing `dataclass` `Settings`, over adding `pydantic-settings` or any new dependency, because the module already reads every other environment value this way and a few lines cover it.
- Truncation to 12 characters: chose a plain string slice in `version_service.get_build_commit()`, over a Pydantic validator or `constr(max_length=...)` on the schema, because a max-length constraint would reject a 40-character sha with a 500 rather than shorten it, and the slice is one line of standard Python.
- Build-time injection: chose the native Docker `ARG` to `ENV` promotion and a compose `build.args` entry, over a generated version file or a build script, because both are platform features the project already uses (Dockerfile, compose) and need no new tooling.
- No new component, module or dependency is introduced otherwise: every code change extends a file TEST-05 created.

## File Manifest
### New files
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED).

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit` read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: `COMMIT_DISPLAY_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: `VersionResponse.commit: str`.
- [B] backend/app/routers/version.py: response carries `commit=get_build_commit()`.
- [B] backend/Dockerfile: `ARG BUILD_COMMIT=unknown` promoted to `ENV BUILD_COMMIT`.
- [B] docker-compose.yml: `backend.build.args.BUILD_COMMIT` from the host environment, default `unknown`.
- [B] .env.example: documented `BUILD_COMMIT` entry with its `unknown` default and the 12-character note.
- [B] backend/tests/unit/test_config_unit.py: `Settings.build_commit` set, unset and blank cases.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set (short), set (40-character sha, first 12 returned) and unset cases.
- [B] backend/tests/integration/test_version_integration.py: existing exact-body assertions gain `commit`; new set and unset `BUILD_COMMIT` request/response tests.
- [Docs] README.md: one sentence under "Running the project" naming `BUILD_COMMIT` (optional build-time variable, default `unknown`, reported by `GET /api/version` truncated to 12 characters), because this item changes run configuration.

No dependency change, so no lockfile entry. `docs/DEVELOPMENT.md` needs no edit: test infrastructure and commands are unchanged. `backend/app/main.py` is deliberately absent: the version router is already registered there (see `## Re-Plan Feedback`). No E2E spec file: no criterion is covered at E2E (see `### Criterion coverage`).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set value returned stripped, unset gives `unknown`, blank gives `unknown`) and `get_build_commit()` (short value unchanged, 40-character sha cut to its first 12, unset gives `unknown`). Environment controlled with `monkeypatch.setenv` / `monkeypatch.delenv`; no network, no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: full HTTP cycle through the session `client` fixture (settings are read per request, so `monkeypatch` on the environment takes effect without a new app): `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` gives 200 with `commit` `0123456789ab`; `BUILD_COMMIT` unset gives 200 with `commit` `unknown`; body keys are exactly `version` and `commit`. Existing TEST-05 tests that compare the whole body are updated to include `commit` and to delete `BUILD_COMMIT` first so they stay deterministic. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: enabled per CLAUDE.md, but no criterion warrants it: the feature has no UI and nothing in the frontend consumes `/api/version` on main. No spec is written; Phase D has nothing to cover.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a 40-character sha is shortened to 12), and the manual script from `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router request/response behaviour, and no UI renders it. |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters), never a router literal | Unit + Integration | Verifying it needs no navigation or interaction: it is configuration resolution and a string rule, checked in `Settings`/service unit tests and end to end over HTTP. |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the router declares `response_model=VersionResponse`, and the integration test asserts the body's exact key set. |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit + Integration | It is a statement about the test suite itself; it is met by the unit and integration tests listed above, which no browser test can add to. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields `version` and `commit` |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit + Integration, see Criterion coverage | Given the backend was built with BUILD_COMMIT `0123456789abcdef0123456789abcdef01234567`, When a client requests GET /api/version, Then `commit` is `0123456789ab`; Given it was built without BUILD_COMMIT, Then `commit` is `unknown` |
| 3 | Response body defined by a Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When a client opens the OpenAPI document, Then the `/api/version` response references the `VersionResponse` schema with `version` and `commit` |
| 4 | Unit and integration tests cover set and unset commit | covered at Unit + Integration, see Criterion coverage | Given the repository at this branch, When the version unit and integration tests run, Then 0 tests fail |

## Manual verification plan
This feature has no UI. Every criterion is verified against the running API with `curl` or a browser address bar, and by running the named tests. Run all commands from the repository root.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: Docker running; `.env` copied from `.env.example`; no `BUILD_COMMIT` exported in your shell.
1. Run `docker compose up --build -d backend` → the `backend` and `db` containers report healthy/running in `docker compose ps`.
2. Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` → prints `200`.
3. Run `curl -s http://localhost:8010/api/version` → a JSON object with exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: the stack from Criterion 1 is up.
1. With no `BUILD_COMMIT` set, run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
2. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up --build -d backend` → the backend image is rebuilt and the container restarts.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `0123456789ab` (the first 12 characters, not all 40).
4. Run `BUILD_COMMIT=abc1234 docker compose up --build -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (shorter than 12, returned unchanged).
5. Open `backend/app/routers/version.py` → the commit value comes from `get_build_commit()`; no commit string literal appears in the router.
6. Run `docker compose up --build -d backend` with `BUILD_COMMIT` unset again → `commit` returns to `unknown`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack from Criterion 1 is up.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with string fields `version` and `commit`.
2. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the run ends with `0 failed` (pytest prints no failures line).
2. Read `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` → each contains a test with `BUILD_COMMIT` set (including a 40-character sha expecting its first 12) and a test with `BUILD_COMMIT` unset expecting `unknown`.
