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
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
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
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, default `"unknown"`), never a string typed into the router. When `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 (tracker comment, below).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: criterion 2 above carries the 12-character rule; the service layer truncates (`get_build_commit()`, Backend Plan), and both a unit test and an integration test pass a full 40-character sha and assert the 12-character result. The comment also names the variable `BUILD_COMMIT`, which this plan adopts as the one declared source. A value of 12 characters or fewer is returned unchanged.
- Assumption (no comment covers it): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` treats a blank value in `backend/app/core/config.py`. A surrounding-whitespace value is stripped before truncation. Recorded here rather than blocking (`user_story_alignment.md` Section 4).
- Assumption: "set at build time" is honoured by passing `BUILD_COMMIT` through `docker-compose.yml` into the backend container (blank when the caller does not set it), not by a Dockerfile `ARG`. The compose service mounts `./backend` over `/app` and runs from it, so a value baked into the image adds nothing the runtime env does not already give, and the CI workflows are plugin-owned so this plan does not edit them.
- Feature Notes say this item "registers a router in `backend/app/main.py`": it does not. `backend/app/main.py` line 56 already registers `version_router` (TEST-05), and this item only extends that existing router, so **TEST-09's File Manifest does not touch `backend/app/main.py`**. That answers the orchestrator's scheduling note: no main.py overlap with BUG-01's server_time registration.

## Plan Overview
Extend the existing TEST-05 version slice with a `commit` field. The commit is read in exactly one place, `Settings.build_commit` in `backend/app/core/config.py` (env `BUILD_COMMIT`, default `"unknown"`), truncated to 12 characters in the service layer, and returned by the existing router through the extended `VersionResponse` Pydantic schema. `docker-compose.yml` passes the variable through and `.env.example` documents it. Backend only; no new endpoint, no new router registration, no dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`), body gains `commit`. Router stays free of literals: it returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`.
- Service layer: `backend/app/services/version_service.py` gains `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which returns `get_settings().build_commit[:COMMIT_LENGTH]`. Docstring per project standards.
- Settings: `backend/app/core/config.py` gains `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (env `BUILD_COMMIT`, stripped; blank or unset returns the default) and a `build_commit: str = field(default_factory=_read_build_commit)` on `Settings`, read per call like `cors_origins`. This is the one declared source and the one place the `"unknown"` default lives.
- Schema: `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`.
- Run configuration: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (blank passes through, and config.py turns blank into `"unknown"`, so the default is not stated twice). `.env.example` gains a commented `BUILD_COMMIT=` entry explaining CI passes the full sha and the API reports its first 12 characters.
- Repository layer: none (no data access).
- Migrations: none.
- `backend/app/main.py`: not modified; the version router is already registered.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters
- Response: 200, `VersionResponse`

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`. With `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `commit` is `"0123456789ab"`. The `version` field and its behaviour are unchanged from TEST-05. This is an additive change; no client in `frontend/src` reads `/api/version` today.

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` (not installed), because the module already reads `DATABASE_URL` and `CORS_ORIGINS` that way and the invariant in `coding_standards.md` Section 5 asks for one configuration mechanism per settings module.
- Truncation to 12 characters: chose a plain string slice over any git or hashing helper, because the value arrives as a string and only needs its prefix.
- No net-new module, component or dependency otherwise: every file below already exists except the UAT artifacts.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios for the commit field (set, unset, truncated)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and `Settings.build_commit`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()`
- [B] backend/app/routers/version.py: return `commit` from `get_build_commit()`
- [B] docker-compose.yml: pass `BUILD_COMMIT` through to the backend container
- [B] .env.example: document the optional `BUILD_COMMIT` variable
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` (set, unset, truncated)
- [B] backend/tests/unit/test_config_unit.py: unit tests for `Settings.build_commit` (set, unset, blank)
- [B] backend/tests/integration/test_version_integration.py: update the two existing body assertions to include `commit`; add set, unset, truncated and schema tests
- [Docs] docs/DEVELOPMENT.md: one line documenting `BUILD_COMMIT` as run configuration (a new environment variable is build-feature Section 15's run-configuration condition)

No dependency changes, so no lockfile entry. `README.md` needs no edit: its `.env.example` line already names an optional `BUILD_COMMIT`, which this item makes true. `backend/app/main.py` is not in this manifest.

## Testing Strategy
- Unit tests: `get_build_commit()` in the service layer (set value returned, 40-character sha truncated to 12, unset yields `"unknown"`), with `get_settings` monkeypatched or `BUILD_COMMIT` set via `monkeypatch.setenv`; `Settings.build_commit` resolution in config (set, unset, blank).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_version_service_unit.py`, `test_config_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` with `BUILD_COMMIT` set, unset and a full sha; OpenAPI schema check that `VersionResponse` requires both fields; the two existing TEST-05 tests updated to the two-field body. The endpoint needs no database, so these run without `DATABASE_URL`.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E is ENABLED, but no criterion requires navigation or interaction through the UI: there is no UI change and no frontend consumer of the endpoint (`testing_standards.md` Section 6, asked per criterion below).
  - Directory: e2e/tests/
  - File: not created
- UAT scenarios: one scenario per criterion plus the truncation edge case, as API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_and_commit`, `test_get_version_answers_when_database_url_is_unset` | verifying it needs no navigation or interaction: it is a router response shape, checked over the real HTTP cycle |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters), never a router literal | Unit | `test_get_build_commit_returns_configured_commit`, `test_get_build_commit_truncates_full_sha_to_twelve_characters`, `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset` | verifying it needs no navigation or interaction: it is settings resolution and a service rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_version_response_schema_requires_version_and_commit` | verifying it needs no navigation or interaction: the router's `response_model` is read from the app's OpenAPI document |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_reports_commit_from_build_commit_env`, `test_get_version_reports_unknown_commit_when_build_commit_unset`, `test_get_version_truncates_full_sha_commit_to_twelve_characters`, `test_get_build_commit_returns_unknown_when_unset` | verifying it needs no navigation or interaction: the set and unset paths are environment states exercised at unit and integration level |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version is requested, Then commit equals its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the API is running, When the OpenAPI document is fetched, Then VersionResponse requires version and commit |
| 4 | Tests cover set and unset paths | covered at Integration, see Criterion coverage | Given the backend test suite, When the version tests run, Then they pass |

## Manual verification plan
This feature has no UI; every criterion is verified against the running API with `curl` and against the test suite. Run from the repository root.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: Docker running; no other process on host port 8010.
1. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` → the `db` and `backend` containers start (`docker compose ps` shows `backend` running).
2. Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` → prints `200`.
3. Run `curl -s http://localhost:8010/api/version` → prints a JSON object with exactly two keys, `version` and `commit`, both strings, with `version` equal to `0.1.0` (the value in `backend/pyproject.toml`).

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters
Prerequisites: the stack from Criterion 1 is running.
1. With the container started as in Criterion 1 step 1, run `curl -s http://localhost:8010/api/version` → `commit` is `0123456789ab` (the first 12 characters of the 40-character value).
2. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, wait for the container to be running, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (a short value is returned unchanged).
3. Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
4. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()` in `backend/app/services/version_service.py`, which reads `get_settings().build_commit` from `backend/app/core/config.py`.

### Criterion 3: the response body is a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack from Criterion 1 is running.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Run `curl -s http://localhost:8010/openapi.json` and find `components.schemas.VersionResponse` → its `required` list is `version` and `commit`, and `/api/version`'s 200 response references `VersionResponse`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Read the three files → each set path (a `BUILD_COMMIT` value, including a 40-character sha) and each unset path (variable deleted, and blank) has a named test, matching the Test ids in `### Criterion coverage`.
