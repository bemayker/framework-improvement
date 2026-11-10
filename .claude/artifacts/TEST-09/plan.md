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
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. Amended by the tracker comment below: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT`; `version_service.get_build_commit()` returns the value's first 12 characters (a value of 12 or fewer characters is returned whole). Unit tests cover a 40-character sha (first 12 returned), an exactly-12-character value (unchanged) and a shorter value (unchanged); the integration test sets a 40-character sha and asserts the 12-character prefix in the response.
- Assumption (no comment, recorded per item 4): a `BUILD_COMMIT` that is set but blank (empty or whitespace only) is treated as unset and yields `"unknown"`, the same blank-means-unset rule `CORS_ORIGINS` already follows in `backend/app/core/config.py`. Surrounding whitespace is stripped before truncation.
- Assumption: the dispatch's note that `GET /api/version` must be "registered in `backend/app/main.py`" is already satisfied: TEST-05 created `backend/app/routers/version.py` and `main.py` already calls `app.include_router(version_router)`. This plan therefore extends the existing endpoint and does **not** modify `backend/app/main.py`, which keeps it disjoint from BUG-01's `main.py` edit.
- Merged since the last plan: n/a (fresh plan, branched from current main c6196fa).

## Plan Overview
Extend the existing `GET /api/version` endpoint (TEST-05) so its response carries a `commit` field next to `version`. The value has exactly one declared source: the `BUILD_COMMIT` environment variable, read per call through the existing settings module `backend/app/core/config.py` (new `Settings.build_commit` field), defaulting to `"unknown"` when unset or blank. The service layer (`backend/app/services/version_service.py`) truncates it to its first 12 characters per the tracker clarification; the router only assembles the schema from service calls and holds no literal. The Pydantic schema `VersionResponse` in `backend/app/schemas/version.py` gains `commit: str`. To make the value settable at build time, `backend/Dockerfile` declares `ARG BUILD_COMMIT` and promotes it to `ENV BUILD_COMMIT`, with no default of its own, so `"unknown"` is defined in one place only (`coding_standards.md` Section 5, one value, one source). Backend only; no database, no migration, no frontend.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): now returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No new route, no change to `backend/app/main.py` (router already registered).
- Settings (`backend/app/core/config.py`): add `BUILD_COMMIT_ENV_VAR = "BUILD_COMMIT"` and `UNKNOWN_BUILD_COMMIT = "unknown"` module constants, a `_read_build_commit()` helper returning the stripped env value or `UNKNOWN_BUILD_COMMIT` when unset or blank, and a `build_commit: str = field(default_factory=_read_build_commit)` field on `Settings`, so it is read fresh per `get_settings()` call like `database_url` and `cors_origins`.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which calls `get_settings()` on every call (never cached at import, so integration tests can monkeypatch the environment) and returns `settings.build_commit[:COMMIT_LENGTH]`. `"unknown"` (7 characters) passes through unchanged.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str` (field order `version`, `commit`).
- Build (`backend/Dockerfile`): add `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=$BUILD_COMMIT` (no default value on the ARG, so an image built without the arg carries an empty value, which settings resolves to `"unknown"`). Placed after the dependency `uv sync` layers so a new commit does not invalidate the dependency cache.
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, shape `{"version": string, "commit": string}`.
  - With `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `{"version": "0.1.0", "commit": "0123456789ab"}` (version is whatever `backend/pyproject.toml` `[project].version` holds).
  - With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`.
- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- `BUILD_COMMIT` reading (`Settings.build_commit`): chose stdlib `os.environ.get` inside the existing `backend/app/core/config.py` dataclass over adding `pydantic-settings`, because the settings module already reads every environment value this way and a new dependency is not needed for one variable.
- Truncation to 12 characters: chose plain string slicing (stdlib) over any helper or library; no alternative is warranted.
- Build-time injection: chose the native Docker `ARG` and `ENV` instructions in `backend/Dockerfile` over a generated version file or a build script, because Docker already passes `--build-arg` values through without new tooling.
- No new dependency is introduced, so no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (40-character sha truncated to 12; blank value reads unknown)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/core/config.py: add `BUILD_COMMIT_ENV_VAR`, `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field (read per call, blank means unset)
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()` returning the first 12 characters of `get_settings().build_commit`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`
- [B] backend/Dockerfile: declare `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=$BUILD_COMMIT` (no default; the default lives in config.py)
- [B] backend/tests/unit/test_config_unit.py: `build_commit` read from `BUILD_COMMIT` when set, `"unknown"` when unset, `"unknown"` when blank, stripped of surrounding whitespace
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set path (short value unchanged), exactly 12 characters unchanged, 40-character sha truncated to its first 12, unset path returns `"unknown"`
- [B] backend/tests/integration/test_version_integration.py: existing assertions extended to the two-field body; new tests for the set path (40-character sha, response carries its first 12) and the unset path (`"unknown"`)
- [Docs] docs/DEVELOPMENT.md: document the `BUILD_COMMIT` build argument (how to pass it with `docker compose build --build-arg BUILD_COMMIT=...`, the 12-character truncation, the `"unknown"` default), because the feature adds run configuration

`backend/app/main.py` is not modified: the version router is already registered there. No dependency changes, so no lockfile (`backend/uv.lock`, `package-lock.json`) is regenerated. `README.md` needs no edit: it documents no environment variables or endpoints. No E2E spec: no criterion requires UI navigation or interaction (see Criterion coverage).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank, whitespace stripped) and `version_service.get_build_commit()` (set short value, exactly 12, 40-character sha truncated, unset returns `"unknown"`), with the environment controlled via `monkeypatch.setenv` and `monkeypatch.delenv`. Names follow `test_{action}_{scenario}_{expected_outcome}` (`testing_standards.md` Section 3), e.g. `test_get_build_commit_with_40_char_sha_returns_first_12_chars`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extending the existing `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: full HTTP cycle through `TestClient` against `create_app()`: set path (`BUILD_COMMIT` set to a 40-character sha, 200 and `commit` equals its first 12 characters), unset path (`BUILD_COMMIT` deleted, 200 and `commit` equals `"unknown"`), the existing version and no-database tests updated to assert the two-field body, the existing 405 case kept. Each test sets or deletes `BUILD_COMMIT` itself so none depends on the runner's environment (CI may set the variable).
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. E2E Tests is ENABLED, but no criterion requires navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion): the endpoint has no frontend consumer.
  - Directory: e2e/tests/
  - File: none (would be `TEST-09_version_build_commit.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus the edge cases (40-character sha truncated; blank value reads `"unknown"`), API-level Given/When/Then since there is no UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version", "commit"}` strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape, asserted over the real HTTP cycle |
| 2 | `commit` from one declared env source set at build time, default `"unknown"`, first 12 characters when longer | Unit and Integration | Verifying it needs no navigation or interaction: env resolution and truncation are settings and service logic (unit), and the env-to-response wiring is a router behaviour (integration) |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the router's `response_model=VersionResponse` shapes the body the integration test asserts exactly; the file location is checked at review |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | Verifying it needs no navigation or interaction: the criterion is the existence of those unit and integration tests themselves |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with version and commit | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | commit from BUILD_COMMIT, default unknown, truncated to 12 | covered at Unit and Integration, see Criterion coverage | Given the backend was built with BUILD_COMMIT set to a 40-character sha, When GET /api/version, Then commit equals the sha's first 12 characters; Given it was built without BUILD_COMMIT, Then commit equals unknown |
| 3 | Pydantic schema in backend/app/schemas/ | covered at Integration, see Criterion coverage | Given the API is running, When a client reads the OpenAPI document, Then the /api/version 200 response references the VersionResponse schema with version and commit |
| 4 | Unit and integration tests cover set and unset | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
This feature has no UI: every criterion is verified against the API with `curl` and the test suite, which is the observable check in place of a click path.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is running from the repository root with `docker compose up -d --build` (no `BUILD_COMMIT` passed); the backend listens on `http://localhost:8010`.
1. In a terminal, run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`, e.g. `"0.1.0"`) and `commit`, both JSON strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT` set at build time, default `"unknown"`, first 12 characters when longer
Prerequisites: same running stack as Criterion 1.
1. Run `curl -s http://localhost:8010/api/version` on the image built without the argument → the body reads `{"version":"0.1.0","commit":"unknown"}` (version as in `backend/pyproject.toml`).
2. Rebuild the backend with a full sha: `docker compose build --build-arg BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 backend` then `docker compose up -d backend` → the build completes and the backend container restarts.
3. Run `curl -s http://localhost:8010/api/version` → `commit` reads `"0123456789ab"` (the first 12 characters), not the full 40.
4. Rebuild with a short value: `docker compose build --build-arg BUILD_COMMIT=abc1234 backend` then `docker compose up -d backend`, and run the same curl → `commit` reads `"abc1234"` unchanged.
5. Open `backend/app/routers/version.py` → it contains no commit literal; `commit` comes from `get_build_commit()`.
6. Restore the default by running `docker compose build backend` then `docker compose up -d backend`, and curl again → `commit` reads `"unknown"`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: same running stack as Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with properties `version` (string) and `commit` (string), both required.
2. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL instance reachable at the `DATABASE_URL` below (for example `docker compose up -d db`, host port 5442).
1. From the repository root run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → the summary line reads `0 failed`, and the run includes tests for `BUILD_COMMIT` set (including the 40-character truncation) and unset.
2. Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the summary line reads `0 failed`, and the file contains a set-path test (commit equals the 12-character prefix) and an unset-path test (commit equals `unknown`).
