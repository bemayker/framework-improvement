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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification: when `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 characters.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service function `get_build_commit()` returns `BUILD_COMMIT[:12]` (constant `COMMIT_MAX_LENGTH = 12`); a value of 12 characters or fewer is returned unchanged. Covered by unit tests for a 40-character sha (truncated) and a short value (unchanged), and by an integration test that sets a full 40-character sha and expects its first 12 in the response. Folded into criterion 2 above.
- Other tracker comments: mayker-dev bot notes from earlier runs whose PRs were reset → not acted on because they are not requirements (per dispatch).
- Assumption (recorded instead of blocking): the issue note says the item "registers a router in `backend/app/main.py`", but on current `main` (0418677) the version router from TEST-05 is already registered there (`app.include_router(version_router)`). This plan therefore extends the existing `/api/version` endpoint and does **not** modify `backend/app/main.py`. That also removes the `main.py` overlap with BUG-01 that the feature map flags.
- Assumption: a `BUILD_COMMIT` that is unset, empty or whitespace-only is treated as unset and yields `"unknown"`; surrounding whitespace is stripped before truncation. (Mirrors how `CORS_ORIGINS` treats a blank value as unset in `backend/app/core/config.py`.)
- Assumption: "set at build time" is wired through the backend image: `docker-compose.yml` passes `BUILD_COMMIT` as a build arg (default `unknown`), and `backend/Dockerfile` turns it into an `ENV` the app reads at runtime. This matches the line `README.md` already carries (`BUILD_COMMIT=<sha> docker compose build backend`).
- Merged since the last plan: n/a (fresh plan on current main; no `[merged-since]` lines in the dispatch).

## Plan Overview
Backend-only extension of the existing TEST-05 endpoint `GET /api/version`. A new settings field `build_commit` in `backend/app/core/config.py` is the single declared source, read per call from the `BUILD_COMMIT` environment variable with the documented default `"unknown"`. The version service gains `get_build_commit()`, which applies the 12-character cap from the tracker clarification. `VersionResponse` gains a `commit: str` field and the router fills it from the service. The Docker build passes `BUILD_COMMIT` through as a build arg so an image carries the commit it was built from. `.env.example` documents the optional variable. No database, frontend, or `main.py` change.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`) now returns `{"version": ..., "commit": ...}`. Router stays thin: `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string in the router.
- Service layer: `backend/app/services/version_service.py` adds `COMMIT_MAX_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_MAX_LENGTH]`.
- Configuration: `backend/app/core/config.py` adds `DEFAULT_BUILD_COMMIT = "unknown"` and a `Settings.build_commit: str` field with a `default_factory` that reads `BUILD_COMMIT` per call, strips it, and falls back to `DEFAULT_BUILD_COMMIT` when unset or blank (same per-call pattern as `database_url` and `cors_origins`, so `coding_standards.md` Section 5's invariant holds: the value is read from the environment with a documented default).
- Build wiring: `backend/Dockerfile` adds `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT=$BUILD_COMMIT`, placed after the dependency `uv sync` layers so a commit change does not invalidate the dependency cache. `docker-compose.yml` backend `build:` gains `args: BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`; the runtime `environment:` block does not set it, so the image's value is what the app reads.
- Repository layer: none (no data access).
- Migrations: none.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `application/json`, schema `VersionResponse` (`backend/app/schemas/version.py`):
  - `version: str`: installed `task-notes-backend` distribution version (unchanged from TEST-05).
  - `commit: str`: first 12 characters of `BUILD_COMMIT`, or `"unknown"` when unset or blank.
  - Example, built with `BUILD_COMMIT=0418677a1b2c3d4e5f60718293a4b5c6d7e8f901`: `{"version": "0.1.0", "commit": "0418677a1b2c"}`
  - Example, unset: `{"version": "0.1.0", "commit": "unknown"}`
- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- Commit source (`Settings.build_commit`): chose the standard library's `os.environ` read inside the existing `Settings` dataclass over a new settings dependency (e.g. pydantic-settings) or a generated version file, because the project already reads every environment value that way and stdlib covers it in a few lines.
- Build-time injection: chose the native Docker `ARG`/`ENV` pair and a Compose `build.args` entry over a build script or git invocation inside the image, because the image has no `.git` and the platform feature covers it.
- Truncation: chose plain string slicing over any sha-parsing library; no alternative needed.
- No net-new dependency is introduced, so no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (40-character sha truncated to 12).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: add `COMMIT_MAX_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`.
- [B] backend/Dockerfile: `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT=$BUILD_COMMIT` after the dependency layers.
- [B] docker-compose.yml: backend `build.args.BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`.
- [B] .env.example: document the optional `BUILD_COMMIT` (commented out, with the 12-character note).
- [B] backend/tests/unit/test_config_unit.py: build_commit set, unset and blank cases.
- [B] backend/tests/unit/test_version_service_unit.py: get_build_commit set, unset, 40-character truncation, short value unchanged.
- [B] backend/tests/integration/test_version_integration.py: existing tests assert the `commit` key with `BUILD_COMMIT` removed; add set-path test (40-character sha) and the OpenAPI schema test.

No lockfile changes: no dependency is added or removed. README.md already documents `BUILD_COMMIT=<sha> docker compose build backend`, the `unknown` default and the 12-character cut (line 20), and its tree comment already names `.env.example`'s optional BUILD_COMMIT, so neither README.md nor docs/DEVELOPMENT.md needs an edit; the build's Section 15 check should confirm that rather than rewrite them. `backend/app/main.py` is not modified: the version router is already registered there.

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank) in the config module; `get_build_commit()` (set, unset, 40-character truncation, 12-or-fewer unchanged) in the service layer, with `BUILD_COMMIT` driven through `monkeypatch.setenv` / `delenv`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle on `GET /api/version` with `BUILD_COMMIT` unset (`commit == "unknown"`) and set to a 40-character sha (`commit` is its first 12); the OpenAPI document's `VersionResponse` schema declares `version` and `commit` as required strings; existing 405 test kept. Every test that asserts the body controls `BUILD_COMMIT` itself, so a CI environment that happens to set it cannot break them. The settings are read per call, so the session `client` fixture works after `monkeypatch`.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion involves UI navigation or interaction (backend-only item, no frontend change), per `testing_standards.md` Section 6.
  - Directory: e2e/tests/ (no file for this item)
  - File: n/a, no spec for this item
- UAT scenarios: one scenario per criterion plus the truncation edge case, verified by HTTP request rather than browser.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_answers_when_database_url_is_unset` | Verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI. |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters), never a router literal | Unit | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_build_commit_truncates_full_sha_to_12_characters`, `test_get_build_commit_returns_short_value_unchanged` | Verifying it needs no navigation or interaction: it is configuration resolution and a service rule. |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_version_response_schema_declares_version_and_commit` | Verifying it needs no navigation or interaction: the schema is observable in the app's OpenAPI document. |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_returns_commit_from_build_commit_env`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_get_build_commit_returns_env_value_when_set`, `test_get_build_commit_returns_unknown_when_unset` | Verifying it needs no navigation or interaction: it is a statement about the unit and integration suites themselves. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, capped at 12 | covered at Unit, see Criterion coverage | Given the backend image was built with BUILD_COMMIT set to a 40-character sha, When GET /api/version is called, Then commit equals the sha's first 12 characters; Given it was built without BUILD_COMMIT, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads /openapi.json, Then VersionResponse declares version and commit as required strings |
| 4 | Unit and integration tests cover set and unset paths | covered at Integration, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
Prerequisites: from the repository root, `cp .env.example .env` done once; Docker running; no `BUILD_COMMIT` exported in the shell.
1. Run `docker compose build backend` then `docker compose up -d` → both commands finish without error; `docker compose ps` shows `backend` running.
2. Run `curl -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK`, header `content-type: application/json`.
3. Read the body from step 2 → it has exactly two keys, `version` (e.g. `0.1.0`, the value of `[project].version` in `backend/pyproject.toml`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: Criterion 1's setup.
1. With no `BUILD_COMMIT` set, run `docker compose build backend` and `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
2. Run `BUILD_COMMIT=0418677a1b2c3d4e5f60718293a4b5c6d7e8f901 docker compose build backend` then `docker compose up -d backend` → build succeeds and the backend restarts.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `0418677a1b2c` (the first 12 characters of the value from step 2).
4. Run `BUILD_COMMIT=abc123 docker compose build backend`, `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc123` (shorter than 12, unchanged).
5. Open `backend/app/routers/version.py` → it contains no commit literal; `commit` is filled from `get_build_commit()`.

### Criterion 3: Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running from Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with `version` (string) and `commit` (string), both required.
2. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: test database available per `docs/DEVELOPMENT.md` → Running tests locally (`DATABASE_URL` exported for the integration tier).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → `0 failed`; the output lists the build_commit set, unset and truncation tests as passed.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`, including `test_get_version_returns_commit_from_build_commit_env` and `test_get_version_returns_unknown_commit_when_build_commit_unset`.
