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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.
- [ ] 5. (From the tracker clarification, which amends criterion 2) When `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12. CI passes the full 40-character sha.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: added as acceptance criterion 5; the truncation lives in the service layer (`get_build_commit()`, constant `COMMIT_LENGTH = 12`), the raw value stays untouched in settings, and unit plus integration tests assert a 40-character input returns its first 12 characters. Assumption recorded: a value of 12 characters or fewer is returned unchanged, and `"unknown"` (7 characters) is therefore never truncated.
- Assumption (no comment, recorded so the build does not guess): a `BUILD_COMMIT` that is blank or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` treats a blank value in the same settings module, and matching `docker-compose.yml` passing `${BUILD_COMMIT:-}` (an empty string when the host has none). The value is stripped of surrounding whitespace before truncation.
- Assumption: the issue's note "Registers a router in `backend/app/main.py`" is already satisfied on main: `backend/app/main.py` includes `version_router` today (TEST-05). This plan therefore does NOT modify `main.py`; it extends the existing router, schema and service. That removes the `main.py` overlap with BUG-01 flagged at ingestion.
- Observation: main has no `BUILD_COMMIT` code (an earlier TEST-09 build, 88cb3f1, was removed by the sandbox reset d137768), but `docs/DEVELOPMENT.md` line 665 and the `README.md` `.env.example` line still describe the target behaviour. This plan builds the code to match those docs rather than rewriting them.

## Plan Overview
Backend only. Extend the existing `GET /api/version` endpoint (TEST-05) so its response carries a `commit` field next to `version`. The commit is read from the `BUILD_COMMIT` environment variable through the settings module (`backend/app/core/config.py`, the single declared source, default `"unknown"`), truncated to 12 characters in the version service, and returned through the existing `VersionResponse` Pydantic schema. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container, and `.env.example` documents it as optional. No database, no frontend, no new router, no new dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. The router builds `VersionResponse(version=get_app_version(), commit=get_build_commit())` and contains no literal commit value.
- Settings (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank. Add `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`, read per call like `database_url` and `cors_origins`, so the module keeps one configuration style (`coding_standards.md` Section 5's invariant: every environment-varying value in this module reads the environment with a documented default).
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. Truncation is business logic, so it lives here and not in the router or the settings.
- Schema (`backend/app/schemas/version.py`): add `commit: str` to `VersionResponse`.
- Repository layer: none (no data access).
- Migrations: none.
- Composition (`docker-compose.yml`): add `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the `backend` service's `environment`, the pass-through `docs/DEVELOPMENT.md` already documents. The default `"unknown"` lives only in `config.py` (one value, one source); compose passes a blank through, which the settings treat as unset.
- `.env.example`: add a commented, optional `BUILD_COMMIT=` entry under a `# --- Build ---` heading explaining CI sets the full sha and the API reports the first 12 characters, `unknown` when unset.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `VersionResponse`:
  - `version`: string, from installed package metadata (unchanged, TEST-05).
  - `commit`: string, the first 12 characters of `BUILD_COMMIT`, or `"unknown"` when unset or blank.
  - Example with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `{"version": "0.1.0", "commit": "0123456789ab"}`
  - Example with `BUILD_COMMIT` unset: `{"version": "0.1.0", "commit": "unknown"}`
- Errors: `POST /api/version` stays 405 (existing behaviour, unchanged).

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` or `python-dotenv`, because the module already reads `DATABASE_URL` and `CORS_ORIGINS` this way and a new dependency would split one settings module into two configuration styles.
- Truncating to 12 characters: chose Python string slicing (`value[:12]`) over any helper or library; no alternative needed.
- Response field: chose a field on the existing Pydantic `VersionResponse` (pydantic is already installed via FastAPI) over a new schema class; no net-new schema module.
- No net-new component, module or dependency is introduced otherwise: every code change extends a file that already exists.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (blank BUILD_COMMIT reports unknown).
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field (read per call, blank treated as unset).
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`.
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` through to the backend service.
- [B] .env.example: document the optional `BUILD_COMMIT` variable.
- [B] backend/tests/unit/test_config_unit.py: unit tests for `Settings.build_commit` set, unset and blank.
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` truncation, short value passthrough and the unknown default.
- [B] backend/tests/integration/test_version_integration.py: update the existing equality assertions to include `commit`, and add set (40-character sha returns first 12) and unset (`unknown`) request/response tests.

No lockfile changes: no dependency is added or removed.
No README.md or docs/DEVELOPMENT.md edit is expected: both already describe BUILD_COMMIT exactly as this plan builds it (DEVELOPMENT.md line 665 names the compose pass-through, the 12-character truncation and the `unknown` default in config.py; README.md line 70 lists BUILD_COMMIT in .env.example). The Section 15 documentation check should confirm rather than edit.
`backend/app/main.py` is not modified: the version router is already registered there.

## Testing Strategy
- Unit tests: settings resolution and service-layer truncation.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend the existing `test_config_unit.py` and `test_version_service_unit.py`)
  - `test_config_unit.py`: `BUILD_COMMIT` set returns that value; unset returns `DEFAULT_BUILD_COMMIT == "unknown"`; blank or whitespace-only returns `"unknown"`; surrounding whitespace is stripped. Use `monkeypatch.setenv` and `delenv`; assert the resolution through `get_settings()`, not the literal alone.
  - `test_version_service_unit.py`: happy path (40-character value returns its first 12); edge (value of exactly 12 and shorter than 12 returned unchanged; `"unknown"` returned unchanged); error-style case (unset variable yields `"unknown"`, never a raise). Patch the environment, not `get_build_commit` itself.
- Integration tests: full HTTP cycle through `TestClient` (no database needed).
  - Directory: backend/tests/integration/
  - `test_version_integration.py`: existing tests updated so the body includes `commit`; new tests with `BUILD_COMMIT` set to a 40-character sha (asserts `commit` equals its first 12 and `version` unchanged) and with it unset (asserts `"unknown"`). Settings are read per request, so `monkeypatch` on the session `client` fixture works without rebuilding the app. The existing 405 test stays.
- E2E tests: none warranted. No criterion requires navigation or interaction through a UI; the footer display of the commit is TEST-10's scope, not this item's. E2E CI scope is `plan` and no criterion below is assigned to E2E.
  - Directory: e2e/tests/ (no spec added)
- UAT scenarios: one Gherkin scenario per criterion plus the blank-value edge case, validated for well-formedness.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour, asserted through TestClient |
| 2 | `commit` comes from `BUILD_COMMIT`, default `"unknown"`, never typed into the router | Unit and Integration | verifying it needs no UI: unit tests assert the settings resolution, integration tests assert the endpoint reflects a changed environment value |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no UI: the router's `response_model=VersionResponse` shapes the body the integration test asserts key for key |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | it is a statement about the test suite itself, satisfied by the set and unset tests in both tiers listed above |
| 5 | `BUILD_COMMIT` longer than 12 characters returns only its first 12 | Unit and Integration | verifying it needs no UI: truncation is service logic (unit) and the integration test asserts a 40-character sha yields 12 characters |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | commit from `BUILD_COMMIT`, default unknown | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is unset, When GET /api/version, Then commit is "unknown"; Given BUILD_COMMIT is "abc1234", Then commit is "abc1234" |
| 3 | Pydantic schema in backend/app/schemas/ | covered at Integration, see Criterion coverage | Given the backend source, When reading backend/app/schemas/version.py, Then VersionResponse declares version and commit as str |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the version and config tests run, Then 0 failed |
| 5 | Truncate to 12 characters | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit is its first 12 characters |

## Manual verification plan
This item has no UI. Every criterion is verified against the running API with `curl`, from a terminal at the repository root. The backend listens on http://localhost:8010 under `docker compose`.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
Prerequisites: Docker running; no `BUILD_COMMIT` in your shell or `.env`.
1. Run `docker compose up -d --build backend` → the `backend` container reports running in `docker compose ps`.
2. Run `curl -s -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is JSON with exactly two keys, `version` (for example `"0.1.0"`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`
Prerequisites: as for criterion 1.
1. With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` → the body's `commit` is `"unknown"`.
2. Run `BUILD_COMMIT=abc1234 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"abc1234"`.
3. Run `BUILD_COMMIT= docker compose up -d --force-recreate backend` (blank value), then the same curl → `commit` is `"unknown"`.
4. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()`.

### Criterion 3: the response body is a Pydantic schema in `backend/app/schemas/`
Prerequisites: none.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `backend/app/routers/version.py` → the route declares `response_model=VersionResponse`.

### Criterion 4: unit and integration tests cover the set and unset paths
Prerequisites: `uv` installed; run from the repository root.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary reports `0 failed`.
2. Read the three files → each covers `BUILD_COMMIT` set and `BUILD_COMMIT` unset at least once.

### Criterion 5: a value longer than 12 characters returns only its first 12
Prerequisites: as for criterion 1.
1. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --force-recreate backend` → the backend restarts.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `"0123456789ab"` (12 characters).
3. Run `BUILD_COMMIT=0123456789ab docker compose up -d --force-recreate backend` and the same curl → `commit` is `"0123456789ab"`, unchanged.
4. Clean up: `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` unset → `commit` is back to `"unknown"`.
