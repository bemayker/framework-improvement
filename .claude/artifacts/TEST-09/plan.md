# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> Version endpoint reports the build commit. Backend only. Depends on TEST-01 (done).
>
> Acceptance criteria:
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback (if applicable)
No tracker comments, no PR review comments, and no `[merged-since]` notice were carried in the dispatch (first plan, branched from current main at 48c3ab7). Nothing to record.

## Plan Overview
`GET /api/version` already exists (TEST-05): `backend/app/routers/version.py`, `backend/app/schemas/version.py` (`VersionResponse` with `version`), `backend/app/services/version_service.py`, registered in `backend/app/main.py`. This item **extends** that endpoint additively with a `commit` field; it creates no second router and does not touch `main.py`.

- The commit's single declared source is the `BUILD_COMMIT` environment variable, read by `backend/app/core/config.py` (the existing settings module, so `coding_standards.md` Section 5's invariant holds: every deployment-dependent value in that module is read from the environment per call). Unset or empty resolves to the default `"unknown"`, declared once as a module constant in `config.py`.
- `version_service.get_build_commit()` returns `get_settings().build_commit`; the router composes `VersionResponse(version=..., commit=...)` from service calls only, never a literal.
- "Set at build time" is made real with the smallest wiring: `backend/Dockerfile` declares `ARG BUILD_COMMIT` (no default) and promotes it to `ENV BUILD_COMMIT`; `docker-compose.yml` passes the host's `BUILD_COMMIT` through as a backend build arg (list form, no default literal). The default `"unknown"` therefore lives in exactly one place (`config.py`): an unset arg becomes an empty env value, which config resolves to `"unknown"`.
- The change is additive for concurrent TEST-08 (frontend, reads `version`) and downstream TEST-10 (reads `commit`).

Assumptions (recorded per `user_story_alignment.md` Section 4, no blocking):
- A1. Env var name `BUILD_COMMIT` (the criterion names no variable). Its value is reported verbatim (full SHA or short, whatever the build supplies); TEST-10 truncates to 7 characters on its side, so no truncation here.
- A2. An empty or whitespace-only `BUILD_COMMIT` is treated as unset and yields `"unknown"`, so an unset Docker build arg never produces `"commit": ""`.
- A3. No CI workflow change: CI does not build or publish an image for deployment in this sandbox, so wiring `BUILD_COMMIT` into a workflow would be gold plating. Dockerfile ARG + compose passthrough is the whole build-time mechanism.
- A4. `version` behaviour is unchanged (still package metadata with its own `UNKNOWN_VERSION` sentinel).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, extended) — response gains `commit: str`.
- Settings (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a `Settings.build_commit: str` field using `default_factory` (same per-call pattern as `database_url`) that reads `os.environ.get("BUILD_COMMIT")`, strips it, and returns `DEFAULT_BUILD_COMMIT` when the result is empty or missing. A small module-level helper function `_read_build_commit()` holds that logic so it is unit-testable.
- Service layer (`backend/app/services/version_service.py`): add `get_build_commit() -> str` returning `get_settings().build_commit`. No logging needed (an unset commit is the normal local-dev state, not a warning).
- Router (`backend/app/routers/version.py`): return `VersionResponse(version=get_app_version(), commit=get_build_commit())`. Docstring updated. No literal string for commit.
- Schema (`backend/app/schemas/version.py`): add `commit: str` to `VersionResponse` with a field docstring/comment noting its source.
- Build wiring: `backend/Dockerfile` adds `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT` set from that arg, placed after the dependency-install layers (just before `EXPOSE`) so a changing commit does not invalidate the cached `uv sync` layers. `docker-compose.yml` backend `build:` gains `args:` with the list-form passthrough entry `- BUILD_COMMIT` (Compose takes the host value if set, otherwise passes nothing). `.env.example` gains a commented `BUILD_COMMIT` entry documenting it.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response 200, `application/json`, schema `VersionResponse`:
  - `version`: string — installed package version, or `"unknown"` (unchanged from TEST-05).
  - `commit`: string — value of `BUILD_COMMIT` at build time, or `"unknown"` when unset or empty.
- Example (unset): `{"version": "0.1.0", "commit": "unknown"}`
- Example (set): `{"version": "0.1.0", "commit": "3f9c2a1b7e0d4c5a"}`
- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- Commit source: chose the standard library's `os.environ` read inside the existing `Settings` dataclass (`backend/app/core/config.py`) over a new settings dependency (pydantic-settings) or reading the commit from git at runtime (`subprocess` + `git rev-parse`), because a runtime git call needs `.git` and the git binary inside the image, and the project already reads env values with stdlib in that module.
- Build-time injection: chose the native Docker `ARG`/`ENV` pair plus Compose `build.args` passthrough over a generated version file written at build time, because the platform feature already carries a value from build into the process environment with no extra file or script.
- Response field: chose extending the existing Pydantic `VersionResponse` (already installed) over a new schema; no net-new module or dependency is introduced.
- No new dependency, so no lockfile change.

## File Manifest
### New files
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field (env `BUILD_COMMIT`, empty or unset resolves to `"unknown"`)
- [B] backend/app/services/version_service.py: add `get_build_commit()` returning the settings value
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`
- [B] backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT` after the dependency layers
- [B] docker-compose.yml: backend `build.args` passthrough `- BUILD_COMMIT`
- [B] .env.example: commented `BUILD_COMMIT` entry describing the build-time source and the `"unknown"` default
- [B] backend/tests/unit/test_config_unit.py: unit tests for `build_commit` set, unset, empty and whitespace, and that the field has no literal default
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` set and unset paths
- [B] backend/tests/integration/test_version_integration.py: update the existing exact-body assertions to include `commit`; add set and unset commit request/response tests
- [Docs] README.md: one line under "Running the project" saying the backend reports the commit passed as `BUILD_COMMIT` at `docker compose build` time (run configuration changed)

No dependency change in this feature, so no lockfile entry. `docs/DEVELOPMENT.md` needs no edit: its test-running instructions are unchanged (the tests set `BUILD_COMMIT` through monkeypatch, not the command line). No E2E spec file: no criterion's covering tier is E2E (see `### Criterion coverage`).

## Testing Strategy
- Unit tests: `backend/app/core/config.py` (`_read_build_commit` / `Settings.build_commit`: set value returned verbatim, unset yields `"unknown"`, empty string and whitespace-only yield `"unknown"`, value is re-read per `get_settings()` call, field declares no literal default) and `backend/app/services/version_service.py` (`get_build_commit()` returns the env value when set and `"unknown"` when unset). Environment controlled with `monkeypatch.setenv` / `monkeypatch.delenv`; no external dependency.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend the existing `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: full HTTP cycle through the session `client` fixture (settings are read per request, so `monkeypatch` env changes take effect): `BUILD_COMMIT=3f9c2a1b7e0d4c5a` set → 200 with `commit` equal to it and `version` from pyproject; `BUILD_COMMIT` unset → 200 with `"commit": "unknown"`; response keys are exactly `version` and `commit` (both strings). Existing tests asserting `{"version": ...}` exactly are updated to the two-field body. `POST` 405 test kept. No database needed (the existing DATABASE_URL-unset test stays and gains the commit field).
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (extend `test_version_integration.py`)
- E2E tests: not warranted. The feature is backend only and no criterion requires navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion). Toggle is ENABLED; TEST-10 will own the browser coverage of the commit in the footer.
  - Directory: e2e/tests/ (no file for this item)
- UAT scenarios: Gherkin scenarios per criterion against the HTTP response (set and unset commit), plus an edge case for an empty `BUILD_COMMIT`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour, asserted on the real HTTP cycle |
| 2 | `commit` comes from one declared env source set at build time, default `"unknown"`, never a router literal | Unit + Integration | verifying it needs no navigation or interaction: env resolution is a settings rule (unit), and the set-vs-unset difference reaching the response proves the router carries no literal (integration) |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the router declares `response_model=VersionResponse`, and the integration test asserts the body's exact key set and types, which the schema governs |
| 4 | Unit and integration tests cover set and unset commit paths | Unit + Integration | verifying it needs no navigation or interaction: the criterion is about the test suite itself, satisfied by the named unit and integration cases above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET `/api/version`, Then the status is 200 and the body has string fields `version` and `commit` |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"` | covered at Unit + Integration, see Criterion coverage | Given the backend was built with `BUILD_COMMIT=3f9c2a1`, When I GET `/api/version`, Then `commit` is `3f9c2a1`; Given it was built without it, Then `commit` is `unknown` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When I open `/docs`, Then `VersionResponse` lists `version` and `commit` as required strings |
| 4 | Unit and integration tests cover set and unset | covered at Unit + Integration, see Criterion coverage | Given the repository, When I run the backend test suite, Then the commit set and unset tests pass |

## Manual verification plan
This feature is backend only, so no criterion is verified by clicking through the app UI. Each block below uses the browser address bar (or a terminal HTTP client) against the running backend, which is the observable check for an API response.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: the stack is running with `docker compose up` from the repository root (backend at http://localhost:8010).
1. Open `http://localhost:8010/api/version` in a browser → the page shows a JSON body with exactly two keys, `version` and `commit`.
2. Open the browser dev tools Network tab and reload the same URL → the request shows status `200` and content type `application/json`.
3. Read the body → `version` is the value of `[project].version` in `backend/pyproject.toml` (for example `0.1.0`) and `commit` is a non-empty string.

### Criterion 2: `commit` comes from `BUILD_COMMIT` at build time, default `"unknown"`
Prerequisites: Docker running; terminal at the repository root; no `BUILD_COMMIT` exported in the shell.
1. Run `docker compose build backend` and then `docker compose up -d backend` → the backend container starts.
2. Open `http://localhost:8010/api/version` → `commit` reads `unknown`.
3. In the terminal run `export BUILD_COMMIT=3f9c2a1`, then `docker compose build backend` and `docker compose up -d --force-recreate backend` → the backend container is rebuilt and restarted.
4. Reload `http://localhost:8010/api/version` → `commit` reads `3f9c2a1`, and `version` is unchanged from step 2.
5. Run `unset BUILD_COMMIT`, rebuild and recreate the backend as in step 3 → reloading the URL shows `commit` back at `unknown`.
6. Open `backend/app/routers/version.py` → no commit string appears in the file; the value comes from `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running as in Criterion 1.
1. Open `http://localhost:8010/docs` → the Swagger UI lists `GET /api/version`.
2. Expand `GET /api/version` and select the 200 response's Schema tab → it is named `VersionResponse` with `version` (string, required) and `commit` (string, required).
3. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; the dev database from `docker compose up -d db` reachable (for the integration tier's shared fixtures).
1. In a terminal at the repository root run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → all tests pass, including the commit set, unset and empty cases.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → all tests pass, including one asserting `commit` equals the set `BUILD_COMMIT` and one asserting `"unknown"` when it is unset.
