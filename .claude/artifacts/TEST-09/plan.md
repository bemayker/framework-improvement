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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, default `"unknown"`), never a string typed into the router; when `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 characters (tracker clarification).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: folded into criterion 2 above; `get_build_commit()` in the version service returns `BUILD_COMMIT[:12]`, and a 40-character sha has its own unit and integration test. A value of 12 characters or fewer is returned unchanged. This also names the environment variable: `BUILD_COMMIT`.
- Comment (tracker): the ~45 other comments are mayker-dev "PR opened" notes from earlier runs → not acted on because they carry no requirement.
- Assumption (no comment settles it): a `BUILD_COMMIT` that is empty or whitespace-only is treated as unset and yields `"unknown"`, and surrounding whitespace is stripped before truncation. An empty `commit` would tell a client nothing, and this mirrors how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`.
- Assumption: the feature's note says the item "registers a router in `backend/app/main.py`", but the version router already exists (TEST-05: `backend/app/routers/version.py`) and is already registered in `create_app()`. This plan extends that router and does not touch `backend/app/main.py`, so it adds no second `/api/version` route and no conflict on `main.py`.
- Merged since the last plan: n/a (fresh plan, branched from current main e8e068c6).

## Plan Overview
Extend the existing TEST-05 version endpoint with a `commit` field. Backend only, three layers already in place:
- Config (`backend/app/core/config.py`): a new `Settings.build_commit` field read per call from `BUILD_COMMIT`, stripped, blank or unset falling back to `DEFAULT_BUILD_COMMIT = "unknown"`. This is the one declared source.
- Service (`backend/app/services/version_service.py`): a new `get_build_commit()` that reads `get_settings().build_commit` and returns its first 12 characters (`COMMIT_LENGTH = 12`).
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`.
- Router (`backend/app/routers/version.py`): passes `commit=get_build_commit()`; no literal.
- Run configuration: `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container with an empty default (`${BUILD_COMMIT:-}`), so the `"unknown"` default lives only in `config.py`; `.env.example` documents the variable.
No database, no migration, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response extended with `commit`. No new route, no change to `backend/app/main.py`.
- Service layer: `get_build_commit() -> str` in `backend/app/services/version_service.py`, returning `get_settings().build_commit[:COMMIT_LENGTH]` with `COMMIT_LENGTH = 12`. Docstring per project standards. `get_app_version()` is unchanged.
- Config: `backend/app/core/config.py` adds `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (`(os.environ.get("BUILD_COMMIT") or "").strip() or DEFAULT_BUILD_COMMIT`), and `build_commit: str = field(default_factory=_read_build_commit)` on `Settings`, the same per-call shape `cors_origins` uses (coding_standards.md Section 5: every deployment-dependent value in the settings module reads the environment, with a documented default).
- Schema: `VersionResponse` adds `commit: str`; class docstring updated to name both fields.
- Router: `return VersionResponse(version=get_app_version(), commit=get_build_commit())`; module docstring names TEST-09.
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "3f9c2a1b7d4e"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` is unchanged from TEST-05 (installed distribution metadata, `"unknown"` sentinel when not installed). `commit` is at most 12 characters.

## Technology Selection
- `BUILD_COMMIT` reading: chose the standard library `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` or `python-dotenv`, because the module already reads `DATABASE_URL` and `CORS_ORIGINS` this way and a new dependency would buy nothing for one string.
- 12-character truncation: chose a plain string slice over any helper or library; no rung below it is needed.
- `commit` response field: chose a field on the existing Pydantic `VersionResponse` (an installed dependency) over a new schema class.
- No net-new component, module or dependency otherwise: every file this plan touches already exists except the UAT artifacts.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (40-character sha truncated to 12)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, and `Settings.build_commit` read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` (set, unset, blank, 40-character truncation)
- [B] backend/tests/unit/test_config_unit.py: unit tests for `Settings.build_commit` (env value, unset default, blank default)
- [B] backend/tests/integration/test_version_integration.py: update the two existing exact-body assertions to include `commit`, add set, unset, truncation and schema tests
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` into the backend service environment
- [B] .env.example: document `BUILD_COMMIT` (optional, the build's git sha, blank means `unknown`)
- [Docs] docs/DEVELOPMENT.md: document the `BUILD_COMMIT` variable and how `/api/version` reports it, because this item changes run configuration

No dependency manifest changes, so no lockfile is regenerated. `README.md` needs no edit: its `.env.example` line already names the optional `BUILD_COMMIT`. `backend/app/main.py` is not modified: the version router is already registered.

## Testing Strategy
- Unit tests: `get_build_commit()` in the service layer (set value returned, unset and blank give `unknown`, 40-character sha cut to 12, a value of exactly 12 returned unchanged) with `BUILD_COMMIT` set through `monkeypatch.setenv`/`delenv`; `Settings.build_commit` resolution in config (env value, unset default, blank default). Existing `get_app_version()` tests stay as they are.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_version_service_unit.py`, `test_config_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` through a fresh `create_app()` + `TestClient` with `BUILD_COMMIT` set, unset, and set to a 40-character sha; the OpenAPI document's `VersionResponse` component declares `version` and `commit` as required strings. The two existing tests that compare the exact body are updated to include `commit`. These tests need no database.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E is ENABLED in `CLAUDE.md`, but no criterion requires navigation or interaction through a UI: the item is backend only and no frontend reads `commit` (testing_standards.md Section 6, fourth question asked per criterion below).
  - Directory: e2e/tests/
  - File: none (would be `e2e/tests/TEST-09_version_build_commit.spec.ts`)
- UAT scenarios: one scenario per criterion plus the truncation edge case, verified by calling the API directly.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version", "commit"}` strings | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_returns_commit_from_build_commit_env` | verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters | Unit | `test_get_build_commit_returns_configured_value_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_build_commit_returns_unknown_when_blank`, `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset` | verifying it needs no navigation or interaction: it is a config resolution and service rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_version_response_declares_version_and_commit` | verifying it needs no navigation or interaction: it is the router's declared response model |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_returns_commit_from_build_commit_env`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_get_version_truncates_full_sha_commit_to_12_characters` | verifying it needs no navigation or interaction: the set and unset paths are environment states read over HTTP; the unit half is row 2 |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When a client requests GET /api/version Then commit is the sha's first 12 characters |
| 3 | Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running When a client reads /openapi.json Then VersionResponse declares version and commit |
| 4 | Set and unset paths tested | covered at Integration, see Criterion coverage | Given BUILD_COMMIT is unset When a client requests GET /api/version Then commit is unknown |

## Manual verification plan
This item has no UI: every criterion is verified against the running backend at `http://localhost:8010` with `curl` (or a browser tab on the same URL), or by running the named tests.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is up with `docker compose up -d --build` from the repository root, and `BUILD_COMMIT` is not set in your shell or `.env`.
1. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present.
2. Read the body printed after the headers → it is a JSON object with exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`, e.g. `0.1.0`) and `commit`, and both values are quoted strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters
Prerequisites: as for Criterion 1.
1. With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
2. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234`.
3. Run `BUILD_COMMIT=3f9c2a1b7d4e8f60a1b2c3d4e5f60718293a4b5c docker compose up -d backend` (40 characters), then `curl -s http://localhost:8010/api/version` → `commit` is `3f9c2a1b7d4e`, exactly 12 characters.
4. Run `BUILD_COMMIT="   " docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
5. Open `backend/app/routers/version.py` → the router builds `commit` from `get_build_commit()` and contains no commit string of its own.
6. Restore the default with `docker compose up -d backend` (no `BUILD_COMMIT`) → `commit` is back to `unknown`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response names the schema `VersionResponse`.
2. Expand `VersionResponse` under Schemas at the bottom of the page → it lists `version` (string, required) and `commit` (string, required).
3. Open `backend/app/schemas/version.py` → `VersionResponse` is a `BaseModel` with `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
3. Run `uv run --directory backend pytest -q -k "build_commit or commit"` → the selected tests include both a set path (`test_get_build_commit_returns_configured_value_when_set`, `test_get_version_returns_commit_from_build_commit_env`) and an unset path (`test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_unknown_commit_when_build_commit_unset`), and the run passes with no failed or errored test.
