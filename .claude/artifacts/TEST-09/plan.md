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
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.
- [ ] 5. (From the tracker comment, amends criterion 2) When `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12 characters. A full 40-character sha is what CI passes in.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: recorded as acceptance criterion 5; the environment variable is named `BUILD_COMMIT` (the comment names it, the description did not), and the 12-character cut lives in `version_service.get_build_commit()` with `COMMIT_DISPLAY_LENGTH = 12`, tested with a 40-character sha, an exactly-12-character value and a shorter value.
- Assumption (comment ambiguity): values of 12 characters or fewer, including the `"unknown"` default (7 characters), are returned unchanged; surrounding whitespace is stripped and a blank `BUILD_COMMIT` counts as unset, matching how `CORS_ORIGINS` is already read in `backend/app/core/config.py`.
- Assumption (comment ambiguity): "CI passes it in" is read as CI supplying the value as a build argument. This plan makes the image accept it (`ARG BUILD_COMMIT` in `backend/Dockerfile`, a compose build arg) but does not edit any CI workflow: wiring the sha into a CI build step is not in the criteria, and it is listed as a known improvement for the PR body.
- Description note "Registers a router in `backend/app/main.py`" → not acted on: `backend/app/routers/version.py` already exists (TEST-05) and `create_app()` already calls `app.include_router(version_router)`. This plan extends that router and does not touch `main.py`, which also removes the `main.py` overlap with the concurrently planned BUG-01.

## Plan Overview
Backend only. Extend the existing `GET /api/version` endpoint (TEST-05) with a `commit` field. The value has one declared source: the `BUILD_COMMIT` environment variable, read per call in `backend/app/core/config.py` with the single default `"unknown"` declared there. The version service cuts it to its first 12 characters, the router passes the service result into `VersionResponse`, and the schema gains `commit: str`. The backend image accepts `BUILD_COMMIT` as a build argument and exposes it as an environment variable, so a value given at build time reaches the running app. No database, no migration, no frontend change, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. The router builds `VersionResponse(version=get_app_version(), commit=get_build_commit())` and contains no commit literal.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a `Settings.build_commit: str` field with a `default_factory` that reads `BUILD_COMMIT`, strips it, and falls back to `DEFAULT_BUILD_COMMIT` when unset or blank. This is the one place the default is declared (`coding_standards.md` Section 5: one value, one source; every environment-dependent value in this settings module reads the environment with a documented default).
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_DISPLAY_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_DISPLAY_LENGTH]`.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`.
- Build wiring: `backend/Dockerfile` adds `ARG BUILD_COMMIT` (no default) and `ENV BUILD_COMMIT=${BUILD_COMMIT}` before `CMD`; `docker-compose.yml` backend `build:` gains `args: BUILD_COMMIT: ${BUILD_COMMIT:-}`. Neither carries a default value: an absent argument yields a blank variable, which config treats as unset, so `"unknown"` stays declared once.
- `.env.example`: add a commented `BUILD_COMMIT=` entry explaining it is optional and set at build time (README line 70 already describes `.env.example` as holding an optional `BUILD_COMMIT`).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: none
- Response: 200, `application/json`

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` is unchanged from TEST-05 (installed package metadata). `commit` is the first 12 characters of `BUILD_COMMIT`, or `"unknown"`. `POST /api/version` stays 405.

## Technology Selection
- `BUILD_COMMIT` reading in `Settings`: chose the standard library `os.environ` inside the existing dataclass `default_factory` pattern over adding `pydantic-settings` or reading git at runtime, because the module already reads `DATABASE_URL` and `CORS_ORIGINS` this way and a runtime `git` call would fail in an image built without `.git`.
- 12-character cut: chose plain string slicing over any helper or dependency; no alternative is needed.
- Build-time injection: chose the native Docker `ARG` to `ENV` mechanism and a compose `build.args` entry over a generated version file, because both are built into the tools the project already uses.
- No other net-new component, module or dependency is introduced.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (exactly-12-character and blank values)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: the artifacts copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT = "unknown"` and `Settings.build_commit` read per call from `BUILD_COMMIT`, blank treated as unset
- [B] backend/app/services/version_service.py: add `COMMIT_DISPLAY_LENGTH = 12` and `get_build_commit()`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: pass `get_build_commit()` into `VersionResponse`; docstring mentions TEST-09
- [B] backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=${BUILD_COMMIT}`, no default value
- [B] docker-compose.yml: backend `build.args` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}`
- [B] .env.example: optional `BUILD_COMMIT` entry with a one-line explanation
- [B] backend/tests/unit/test_config_unit.py: tests for `build_commit` set, unset and blank
- [B] backend/tests/unit/test_version_service_unit.py: tests for `get_build_commit()` with a 40-character sha, a short value, and the unset default
- [B] backend/tests/integration/test_version_integration.py: set and unset commit paths over HTTP, OpenAPI schema check, and the two existing tests updated to the new two-field body

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is regenerated.
No E2E spec is produced: no criterion requires navigation or interaction through the UI (see Criterion coverage).
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: README line 70 already describes `.env.example` as carrying an optional `BUILD_COMMIT`, which this feature makes true, and `docs/DEVELOPMENT.md` documents no application environment variables (`CORS_ORIGINS` is not listed there either).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank) in the config module; `get_build_commit()` cut and passthrough in the version service, with `get_settings` or the environment monkeypatched.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_config_unit.py` and `test_version_service_unit.py` are extended)
- Integration tests: full HTTP cycle of `GET /api/version` with `BUILD_COMMIT` set to a 40-character sha and unset, via `monkeypatch.setenv` and `monkeypatch.delenv` against the session `client` (settings are read per request, so no app rebuild is needed); `GET /openapi.json` shows `VersionResponse` with required string fields `version` and `commit`. The two existing tests assert the full body, so they are updated to delete `BUILD_COMMIT` and expect `"commit": "unknown"`. No database is needed.
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. The E2E toggle is ENABLED, but every criterion is an API or configuration behaviour with no UI (the footer reads the version from `frontend/package.json`, not from this endpoint), so integration is the cheapest covering tier for all of them.
  - Directory: e2e/tests/
  - File: none produced (would be `TEST-09_version_build_commit.spec.ts`)
- UAT scenarios: one scenario per criterion plus an edge case for an exactly-12-character and a blank `BUILD_COMMIT`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_returns_unknown_commit_when_build_commit_unset` | Verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `commit` comes from one declared source, env var with default `"unknown"`, never a router literal | Unit | `test_settings_build_commit_reads_environment_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_version_returns_first_12_characters_of_build_commit_when_set` | Verifying it needs no navigation or interaction: it is configuration resolution, proven end to end by the integration set path |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_declares_version_response_with_version_and_commit` | Verifying it needs no navigation or interaction: it is the declared response model in the OpenAPI document |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_returns_unknown_when_build_commit_unset`, `test_get_version_returns_first_12_characters_of_build_commit_when_set`, `test_get_version_returns_unknown_commit_when_build_commit_unset` | Verifying it needs no navigation or interaction: the criterion is about the unit and integration tiers themselves |
| 5 | `BUILD_COMMIT` longer than 12 characters returns only its first 12 | Unit | `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_returns_short_value_unchanged`, `test_get_version_returns_first_12_characters_of_build_commit_when_set` | Verifying it needs no navigation or interaction: it is a service-layer string rule |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the response is 200 with string fields version and commit |
| 2 | One declared source, default `"unknown"` | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is not set at build time, When a client requests GET /api/version, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When a client opens /openapi.json, Then VersionResponse lists version and commit as required strings |
| 4 | Set and unset paths tested | covered at Unit, see Criterion coverage | Given the backend test suite, When the version and config tests run, Then 0 failed |
| 5 | 40-character sha cut to 12 | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha at build time, When a client requests GET /api/version, Then commit is its first 12 characters |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: the stack is running via `docker compose up -d --build` from the repo root, with no `BUILD_COMMIT` set in the shell or `.env`.
1. Open `http://localhost:8010/api/version` in a browser → the page shows JSON with exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`, for example `0.1.0`) and `commit`.
2. Open the browser developer tools Network tab and reload → the request to `/api/version` shows status 200 and content type `application/json`.

### Criterion 2: `commit` comes from one declared source, default `"unknown"`
Prerequisites: as for criterion 1 (no `BUILD_COMMIT` anywhere).
1. Open `http://localhost:8010/api/version` → `commit` reads `unknown`.
2. Stop the backend, then from the repo root run `BUILD_COMMIT=abc123 docker compose up -d --build backend` → the backend restarts.
3. Reload `http://localhost:8010/api/version` → `commit` reads `abc123`, proving the value comes from the build-time variable and not from the router.
4. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()`.

### Criterion 3: Response body defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack is running.
1. Open `http://localhost:8010/docs` → the Swagger UI lists `GET /api/version`.
2. Expand `GET /api/version` and look at the 200 response schema → it is `VersionResponse` with required string fields `version` and `commit`.
3. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Not verifiable through the UI; the observable check is the test run.
1. From the repo root run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports `0 failed`, and the run includes the set-path tests (`test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_version_returns_first_12_characters_of_build_commit_when_set`) and the unset-path tests (`test_get_build_commit_returns_unknown_when_build_commit_unset`, `test_get_version_returns_unknown_commit_when_build_commit_unset`).

### Criterion 5: A `BUILD_COMMIT` longer than 12 characters returns only its first 12
Prerequisites: the stack is running.
1. From the repo root run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` (a 40-character sha) → the backend restarts.
2. Open `http://localhost:8010/api/version` → `commit` reads `0123456789ab` (12 characters).
3. Repeat step 1 with `BUILD_COMMIT=0123456789ab` (exactly 12 characters) and reload → `commit` reads `0123456789ab`, unchanged.
4. Repeat step 1 with no `BUILD_COMMIT` and reload → `commit` reads `unknown` again.
