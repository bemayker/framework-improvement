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
- [ ] `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the comment names it, so the plan adopts that name rather than inventing one), and the service layer returns `BUILD_COMMIT[:12]`. A value of 12 characters or fewer, including the `"unknown"` default, is returned unchanged. Unit and integration tests pin the 40-character case.
- Assumption (no comment, recorded per `user_story_alignment.md` Section 4): a `BUILD_COMMIT` that is empty or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`. Surrounding whitespace is stripped before truncation.
- Assumption: "set at build time" is satisfied by an environment variable the deploy or CI supplies to the backend process; docker-compose passes it through with `${BUILD_COMMIT:-unknown}`. No Dockerfile `ARG` is added, because the backend Dockerfile is not built per commit in this sandbox and the env passthrough is the one declared source either way.
- Scope note on the item's Notes line: `backend/app/main.py` already registers `version_router` on the plan base (7ec0ce6e, line 56, added by TEST-05). This item extends that existing router, so it does not edit `main.py` and does not list it. That keeps it disjoint from BUG-01, which registers a server_time router there.

## Plan Overview
Extend the existing `GET /api/version` slice (TEST-05: router, service, schema) with a `commit` field. The value has one source: `Settings.build_commit` in `backend/app/core/config.py`, read per call from `BUILD_COMMIT` with the default `"unknown"`. `version_service.get_build_commit()` applies the 12-character cap from the tracker clarification, the router composes `VersionResponse(version=..., commit=...)`, and `VersionResponse` gains `commit: str`. docker-compose and `.env.example` declare the variable. Backend only; no database, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`), response gains `commit`. No new route, no router registration change.
- Configuration: `backend/app/core/config.py` adds `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (strip; empty after strip returns the default) and the field `build_commit: str = field(default_factory=_read_build_commit)`, read per call like `database_url` and `cors_origins` (the Section 5 invariant in `coding_standards.md`: every deployment-dependent value in this module reads the environment with a documented default).
- Service layer: `backend/app/services/version_service.py` adds `COMMIT_DISPLAY_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_DISPLAY_LENGTH]`. It calls `get_settings()` on every call, never at import, so a changed environment is reflected without restarting the app (the session-scoped test client depends on this).
- Router: `get_version()` returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No string literal for the commit in the router.
- Schema: `VersionResponse` in `backend/app/schemas/version.py` gains `commit: str`.
- Deployment wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`; `.env.example` gains a commented `BUILD_COMMIT=` entry explaining CI passes the full sha and the API shows the first 12 characters.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version
- Request: no body, no parameters
- Response: 200, `VersionResponse`

```json
{"version": "0.1.0", "commit": "3f9c2ab71d04"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` keeps TEST-05's behaviour (installed package metadata, `"unknown"` when not installed). `commit` is at most 12 characters.

## Technology Selection
- Build commit source: chose `os.environ` read through the existing `Settings` dataclass (standard library, the pattern `config.py` already uses) over adding `pydantic-settings` or reading the environment in the router, because the installed pattern covers it and the criterion demands one declared source.
- 12-character cap: chose a plain string slice over any helper or dependency, because the standard library covers it in one expression.
- No net-new module, component or dependency otherwise: every file this item touches already exists except the UAT artifacts.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus the 40-character truncation edge case
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script build-feature writes

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_DISPLAY_LENGTH` and `get_build_commit()` applying the 12-character cap
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit` from `get_build_commit()`
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}` to the backend service
- [B] .env.example: document the optional `BUILD_COMMIT` variable
- [B] backend/tests/unit/test_config_unit.py: set, unset and blank `BUILD_COMMIT` tests for `Settings.build_commit`
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set, unset and 40-character truncation tests
- [B] backend/tests/integration/test_version_integration.py: update the two existing body assertions to include `commit`, add set, unset, truncation and schema tests

No lockfile changes: no dependency is added or changed.
No E2E spec: no criterion needs navigation or interaction through the UI (see Criterion coverage), so Phase D has no file.
Docs: neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. README line 70 already describes `.env.example` as carrying an optional `BUILD_COMMIT`, and `docs/DEVELOPMENT.md` keeps no per-variable list (it does not list `CORS_ORIGINS` either).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank) and `version_service.get_build_commit()` (set, unset default, 40-character sha truncated to 12), with the environment controlled through `monkeypatch`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: the full HTTP cycle on `GET /api/version` through `TestClient`, with `BUILD_COMMIT` set via `monkeypatch.setenv` and unset via `monkeypatch.delenv`; the OpenAPI document's `VersionResponse` component; the existing 405 test stays. The two existing tests that compare the whole body to `{"version": ...}` are updated to expect the `commit` key, because the body gains a field.
  - Directory: backend/tests/integration/
- E2E tests: no spec for this item. E2E is ENABLED, but every criterion is an API or configuration behaviour with no UI surface; Section 5 of `testing_standards.md` rules out an E2E test that calls the API directly.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, phrased against the API response.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}` | Integration | `test_get_version_returns_200_with_version_and_commit`, `test_get_version_answers_when_database_url_is_unset` | Verifying it needs no navigation or interaction: it is a router response shape. |
| 2 | `commit` comes from one declared source (env var, default `"unknown"`), never a string typed into the router | Unit | `test_settings_build_commit_reads_build_commit_env`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_as_unset`, `test_get_build_commit_returns_configured_commit`, `test_get_build_commit_truncates_full_sha_to_twelve_characters`, `test_get_version_reports_commit_from_build_commit_env` | Verifying it needs no navigation or interaction: it is configuration resolution, proven by changing the environment and observing the response follow it. |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_version_response_schema_declares_version_and_commit` | Verifying it needs no navigation or interaction: it is the app's OpenAPI document. |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | `test_get_build_commit_returns_configured_commit`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_reports_commit_from_build_commit_env`, `test_get_version_reports_unknown_commit_when_build_commit_unset` | Verifying it needs no navigation or interaction: the criterion is the existence of these unit and integration tests. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with version and commit | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/version, Then the response is 200 with string fields version and commit |
| 2 | `commit` comes from `BUILD_COMMIT`, default `"unknown"` | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version is requested, Then commit equals its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Body defined by a Pydantic schema | covered at Integration, see Criterion coverage | Given the API is running, When a client reads /openapi.json, Then VersionResponse declares version and commit as strings |
| 4 | Tests cover set and unset paths | covered at Unit, see Criterion coverage | Given the backend test suite, When the version tests run, Then the run passes |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
This criterion has no UI. The observable check is the HTTP response.
Prerequisites: the repository checked out on the feature branch, uv installed, no process listening on port 8010.
1. In a terminal at the repository root, run `BUILD_COMMIT=3f9c2ab71d04e5a6b7c8d9e0f1a2b3c4d5e6f708 uv run --directory backend uvicorn app.main:app --port 8010` → the log ends with `Uvicorn running on http://127.0.0.1:8010` (a warning that DATABASE_URL is unset is expected and harmless).
2. In a second terminal, run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is `{"version":"0.1.0","commit":"3f9c2ab71d04"}` (the version is whatever `backend/pyproject.toml` declares under `[project].version`).

### Criterion 2: `commit` comes from one declared source (env var, default `"unknown"`), never a string typed into the router
This criterion has no UI. The observable checks are the response under different environments, and the router source.
Prerequisites: the server from Criterion 1 stopped (Ctrl+C).
1. Run `uv run --directory backend uvicorn app.main:app --port 8010` with no `BUILD_COMMIT` set in the shell (`unset BUILD_COMMIT` first) → the server starts.
2. Run `curl -s http://localhost:8010/api/version` → the body's `commit` is `"unknown"`.
3. Stop the server and start it again with `BUILD_COMMIT=abc123` in front of the same command, then repeat the curl → `commit` is `"abc123"` (fewer than 12 characters, returned unchanged).
4. Stop the server and start it again with `BUILD_COMMIT="   "` in front of the command, then repeat the curl → `commit` is `"unknown"` (blank is treated as unset).
5. Open `backend/app/routers/version.py` → the `commit` value comes from `get_build_commit()`; the file contains no commit string literal.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
This criterion has no UI. The observable check is the OpenAPI document.
Prerequisites: the server running as in Criterion 1 step 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with `version` (string) and `commit` (string), both required.
2. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
This criterion has no UI. The observable check is the test run.
Prerequisites: a PostgreSQL instance reachable through `DATABASE_URL` (the conftest fails the integration tier in CI and skips it locally without one).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports no failed or errored test and the command exits 0.
2. Confirm the run's output lists `test_get_build_commit_returns_configured_commit`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_reports_commit_from_build_commit_env` and `test_get_version_reports_unknown_commit_when_build_commit_unset` by re-running step 1 with `-v` instead of `-q` → each of the four is reported PASSED.
