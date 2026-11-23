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
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`; when `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 characters (tracker clarification, see Re-Plan Feedback).
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, default `"unknown"`), never a string typed into the router.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the comment overrides the description where it narrows it. The variable is named `BUILD_COMMIT` (the description names no variable), and `get_build_commit()` in the version service returns the first 12 characters of a longer value. Values of 12 characters or fewer, including the `"unknown"` default, are returned unchanged. Covered by `test_get_build_commit_truncates_full_sha_to_first_12_characters` (unit) and `test_get_version_returns_first_12_characters_of_full_sha_commit` (integration).
- Assumption (no comment, recorded per `user_story_alignment.md` Section 4): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`. A blank commit string tells a client nothing about the build.
- Assumption: "set at build time" means the build or deploy pipeline sets `BUILD_COMMIT` in the backend process's environment. `docker-compose.yml` forwards it from the host shell (`${BUILD_COMMIT:-}`, empty when unset, so the `"unknown"` default lives in one place: `config.py`). No Dockerfile build argument is added; nothing in the criteria needs the value baked into the image, and the compose passthrough is the smallest wiring that lets the set path reach a running container.
- Map note (feature_map shared-risk column): the note expects TEST-09 to register a router in `backend/app/main.py`. On the plan base (8b2ca059) the version router already exists (TEST-05, `backend/app/routers/version.py`) and `create_app()` already calls `app.include_router(version_router)`. This plan therefore extends the existing router and does **not** touch `backend/app/main.py`, which removes the overlap with BUG-01 on that file.
- Merged since the last plan: n/a (fresh plan, no earlier plan.md for this item on this branch, branched from current main 8b2ca059).

## Plan Overview
Backend only. The existing `GET /api/version` (TEST-05) gains a `commit` field. The value is read in exactly one place, `Settings.build_commit` in `backend/app/core/config.py`, from the `BUILD_COMMIT` environment variable with the documented default `"unknown"` (blank counts as unset). The version service adds `get_build_commit()`, which applies the 12-character limit from the tracker clarification. `VersionResponse` in `backend/app/schemas/version.py` gains `commit: str`, and the router fills it from the service. `docker-compose.yml` forwards `BUILD_COMMIT` to the backend container and `.env.example` documents it. No database, no migration, no frontend change, no new dependency, no change to `backend/app/main.py`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response now `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No new route, no router registration change.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank. Add the field `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`, read per call like `database_url` and `cors_origins` (the Section 5 invariant of `coding_standards.md`: every environment-dependent value in this settings module reads the environment, with a documented default). Update the module docstring to name TEST-09's addition.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_DISPLAY_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_DISPLAY_LENGTH]`. One-line docstring per the project documentation convention; module docstring updated to name TEST-09.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`. Module docstring names TEST-09.
- Repository layer: none (no data access).
- Migrations: none.
- Deployment wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`; `.env.example` gains a commented `# BUILD_COMMIT=` entry under a new `# --- Build ---` heading explaining it is set by CI to the full commit sha and that the API reports its first 12 characters, `unknown` when unset.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

  With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`. `version` keeps TEST-05's behaviour (installed package metadata, `"unknown"` when the distribution is not installed). The change is additive: an existing consumer reading only `version` is unaffected.
- Errors: `POST /api/version` stays 405 (existing behaviour, unchanged).

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ.get` inside the existing `Settings` dataclass over adding `pydantic-settings` or a new config module, because `config.py` already reads every environment value this way and a new dependency is not warranted for one variable.
- 12-character limit: chose a plain string slice (`value[:12]`) over any git or hashing library; the standard library covers it in one expression.
- No other net-new component, module or dependency: every other change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (blank `BUILD_COMMIT`).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3.

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: add `COMMIT_DISPLAY_LENGTH` and `get_build_commit()` returning the configured commit limited to 12 characters.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`.
- [B] docker-compose.yml: forward `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service environment.
- [B] .env.example: document the optional `BUILD_COMMIT` variable.
- [B] backend/tests/unit/test_config_unit.py: unit tests for `Settings.build_commit` (set, unset, blank).
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` (short value, 40-character sha, unknown default).
- [B] backend/tests/integration/test_version_integration.py: update the two exact-body assertions to include `commit`; add set, unset, 40-character and schema tests.

No dependency changes, so no lockfile is regenerated. `backend/app/main.py` is not modified: the version router is already registered there. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: README's project tree already describes `.env.example` as carrying an optional `BUILD_COMMIT`, which this feature makes true, and DEVELOPMENT.md lists no individual environment variables.

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution in `config.py` (set value, unset falls back to `"unknown"`, blank falls back to `"unknown"`); `get_build_commit()` in `version_service.py` (value of 12 characters or fewer returned verbatim, 40-character sha returned as its first 12, default `"unknown"` returned unchanged). The service tests monkeypatch `version_service.get_settings` or set `BUILD_COMMIT` via `monkeypatch.setenv`, per `testing_standards.md` Section 1.1 (happy path, edge case, error/fallback case).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: full HTTP cycle through `TestClient` on `GET /api/version` with `BUILD_COMMIT` set (short value, 40-character sha) and unset; the response body equals `{"version": <pyproject version>, "commit": ...}` exactly; the OpenAPI document names `VersionResponse` as the 200 response with `version` and `commit` properties. The existing two exact-body tests (`test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_answers_when_database_url_is_unset`) are updated to include `commit` with `BUILD_COMMIT` deleted via monkeypatch, so they stay deterministic whatever the CI runner's environment carries. No database is needed.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The feature has no user-facing navigation or interaction (`testing_standards.md` Section 6, fourth question asked per criterion: no criterion involves the UI). No spec file is produced.
  - Directory: e2e/tests/ (unused for this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus a blank-value edge case, verifying the response body of `GET /api/version`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit`; a value longer than 12 characters is returned as its first 12 | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_returns_first_12_characters_of_full_sha_commit` | Verifying it needs no navigation or interaction: it is a router response shape and status. |
| 2 | `commit` comes from `BUILD_COMMIT`, default `"unknown"`, never a literal in the router | Unit | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_version_returns_commit_from_build_commit_env` | Verifying it needs no navigation or interaction: it is configuration resolution, asserted on the resolved value rather than the literal. |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_get_version_openapi_schema_declares_version_and_commit` | Verifying it needs no navigation or interaction: the OpenAPI document generated from the schema is read over HTTP. |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | `test_get_build_commit_returns_configured_value_when_set`, `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_unknown_commit_when_build_commit_unset` | Verifying it needs no navigation or interaction: it is a statement about the unit and integration suites themselves, satisfied by these tests passing. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit`, 12-character limit | covered at Integration, see Criterion coverage | Given the backend runs with BUILD_COMMIT set to a 40-character sha When a client requests GET /api/version Then the status is 200 and the body has version and commit, commit being the sha's first 12 characters |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"` | covered at Unit, see Criterion coverage | Given the backend runs with BUILD_COMMIT unset When a client requests GET /api/version Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend runs When a client reads /openapi.json Then GET /api/version's 200 response references VersionResponse with properties version and commit |
| 4 | Unit and integration tests cover set and unset | covered at Unit, see Criterion coverage | Given the backend test suites When they run Then the version and config tests pass |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`, a long value limited to 12 characters
Prerequisites: Docker running; repository root as the working directory; no `.env` entry for `BUILD_COMMIT`.
1. In a terminal at the repository root, run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` → the command finishes and `docker compose ps` shows the backend service running.
2. Open `http://localhost:8010/api/version` in a browser → the page shows JSON with `"version": "0.1.0"` and `"commit": "0123456789ab"` (exactly the first 12 characters of the value from step 1).
3. Open the browser's developer tools Network tab and reload the page → the `version` request shows status 200 and content type `application/json`.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`
Prerequisites: the stack from Criterion 1 can be restarted.
1. Run `BUILD_COMMIT=abc1234 docker compose up -d backend` → the backend container is recreated.
2. Open `http://localhost:8010/api/version` → the JSON shows `"commit": "abc1234"` (a value of 12 characters or fewer is returned unchanged).
3. Run `docker compose up -d backend` with `BUILD_COMMIT` not set in the shell (open a new terminal) → the backend container is recreated.
4. Reload `http://localhost:8010/api/version` → the JSON shows `"commit": "unknown"`.
5. Run `BUILD_COMMIT="   " docker compose up -d backend` → the backend container is recreated.
6. Reload `http://localhost:8010/api/version` → the JSON shows `"commit": "unknown"` (a blank value counts as unset).
7. Open `backend/app/routers/version.py` in an editor → it contains no commit string literal; `commit` is filled from `get_build_commit()`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running from Criterion 2.
1. Open `http://localhost:8010/docs` → the Swagger UI lists `GET /api/version`.
2. Expand `GET /api/version` and look at the 200 response → the schema shown is `VersionResponse` with string properties `version` and `commit`.
3. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports no failed or errored test and the command exits 0.
2. Read the pytest output with `-v` added to the same command → tests named `test_get_build_commit_returns_configured_value_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_commit_from_build_commit_env` and `test_get_version_returns_unknown_commit_when_build_commit_unset` are listed as passed.
