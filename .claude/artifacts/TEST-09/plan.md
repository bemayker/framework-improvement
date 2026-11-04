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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. When `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 characters (tracker comment, below).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service truncates the resolved value to its first 12 characters (`BUILD_COMMIT_LENGTH = 12`); a value of 12 characters or fewer is returned unchanged. Criterion 2 above carries the clarification, and the unit and integration tests assert a 40-character sha yields its 12-character prefix. The `"unknown"` default is never truncated (it is 7 characters).
- Assumption (no comment covers it): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and reports `"unknown"`; a non-blank value is stripped of surrounding whitespace before truncation. This matches the contract `docs/DEVELOPMENT.md` already states ("When the variable is unset or blank the backend reports `unknown`").
- Assumption: the item's note says it "registers a router in `backend/app/main.py`". The version router is already registered there by TEST-05 (`app.include_router(version_router)`), so this item extends the existing router and leaves `main.py` untouched. This also removes the `main.py` overlap with BUG-01 that the scheduler flagged.
- Merged since the last plan: n/a (fresh plan, no `[merged-since]` lines in the dispatch).

## Plan Overview
Extend the existing `GET /api/version` endpoint (TEST-05) with a `commit` field. The value has one declared source: a `build_commit` setting in `backend/app/core/config.py`, read from the `BUILD_COMMIT` environment variable per call with a documented default of `"unknown"`, the same way the module already reads `DATABASE_URL` and `CORS_ORIGINS` (`coding_standards.md` Section 5's invariant: one settings module, every environment-dependent value read from the environment with a documented default). The service layer (`version_service.py`) applies the 12-character truncation, the router assembles the response, and the Pydantic `VersionResponse` schema gains `commit: str`. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container as `${BUILD_COMMIT:-}`, so a build that sets it reaches the app and a local run without it falls to the default. Backend only, no database, no new dependency.

## Frontend Plan
No frontend changes required.

Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): now returns `version` and `commit`. No new route, no router registration change.
- Configuration: `backend/app/core/config.py` gains `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (returns `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank), and a `Settings.build_commit: str` field with `default_factory=_read_build_commit`, read per call like the existing fields so a test's `monkeypatch.setenv` takes effect without re-importing.
- Service layer: `backend/app/services/version_service.py` gains `BUILD_COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which returns `get_settings().build_commit[:BUILD_COMMIT_LENGTH]`. The truncation lives in the service (business rule), the default and environment read in config (single source).
- Router: `get_version()` returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string anywhere in the router.
- Container wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (blank passes through and resolves to `"unknown"` in config).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `application/json`, schema `VersionResponse` (`backend/app/schemas/version.py`):
  - With `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `{"version": "0.1.0", "commit": "0123456789ab"}`
  - With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`
  - `version` keeps its existing behaviour (installed distribution metadata, `"unknown"` sentinel when not installed). `0.1.0` above is illustrative; the real value is `[project].version` in `backend/pyproject.toml`.
- Errors: `POST /api/version` stays 405 (existing behaviour).
- Consumer note: TEST-10 (frontend footer) reads this `commit` field.

## Technology Selection
- `BUILD_COMMIT` read and default: chose the standard library `os.environ.get` inside the existing `Settings` dataclass over adding `pydantic-settings` (an installed-dependency-adjacent package not currently in `backend/pyproject.toml`), because the module already reads two variables this way and a third needs three lines.
- 12-character truncation: chose a Python slice (`value[:12]`) over any helper or library; no alternative is warranted.
- No other net-new component, module or dependency: the schema, service and router files already exist and are extended.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per criterion plus the blank-value edge case
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit` read from `BUILD_COMMIT` per call
- [B] backend/app/services/version_service.py: `BUILD_COMMIT_LENGTH` and `get_build_commit()` applying the 12-character truncation
- [B] backend/app/schemas/version.py: `VersionResponse.commit: str`
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset and blank cases
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set (40-char truncated), short value unchanged, unset default
- [B] backend/tests/integration/test_version_integration.py: existing exact-body assertions gain `commit`; new set and unset `BUILD_COMMIT` request cycles

`backend/app/main.py` is not modified: the version router is already registered there.
No dependency changes, so no lockfile entry.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: `docs/DEVELOPMENT.md` already documents `BUILD_COMMIT`, its compose passthrough, the 12-character response and the `unknown` default in `config.py` (the paragraph beginning "`BUILD_COMMIT` sets the commit"), which is exactly what this plan builds; README has no per-variable list.

## Testing Strategy
- Unit tests: `config.py` `build_commit` resolution (set value returned stripped; unset returns `"unknown"`; blank/whitespace returns `"unknown"`), and `version_service.get_build_commit()` (40-character value returns first 12; 7-character value returned unchanged; default `"unknown"` returned unchanged), with `BUILD_COMMIT` controlled through `monkeypatch.setenv`/`delenv` so the assertion is on the resolution, not on a literal fallback.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: full HTTP cycle through `TestClient` with `BUILD_COMMIT` set to a 40-character sha (body is `{"version": <pyproject version>, "commit": <first 12>}`) and unset (`"commit": "unknown"`); the two existing exact-body assertions are updated to include `commit` and explicitly `delenv("BUILD_COMMIT")` so they never depend on the CI environment; the existing 405 test stays. Settings are read per call, so the session-scoped `client` fixture picks up the monkeypatched value.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion requires navigation or interaction through a UI; this item has no frontend change (`testing_standards.md` Section 6, fourth question asked per criterion, below).
  - Directory: e2e/tests/ (no spec for this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the blank-`BUILD_COMMIT` edge case, written as API-level Given/When/Then (no browser steps).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router request/response cycle. |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, truncated to 12 | Unit | Verifying it needs no navigation or interaction: it is configuration resolution and a service rule; the integration tests also exercise it end to end. |
| 3 | Body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the router's `response_model=VersionResponse` shapes the body the integration test asserts exactly. |
| 4 | Unit and integration tests cover set and unset commit paths | Unit | Verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests themselves (set and unset cases in both tiers). |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string `version` and `commit` |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 chars | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When a client requests GET /api/version, Then `commit` is its first 12 characters; Given BUILD_COMMIT is unset, Then `commit` is `unknown` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the body has exactly the keys `version` and `commit` |
| 4 | Tests cover set and unset paths | covered at Unit, see Criterion coverage | Given the repository, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
This item has no UI. Every criterion is verified against the API with `curl` and against the test suite; the observable check is the HTTP response body.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is running with `docker compose up -d --build` from the repository root, with `BUILD_COMMIT` not set in your shell; the backend listens on `http://localhost:8010`.
1. Run `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8010/api/version` → prints `200`.
2. Run `curl -s http://localhost:8010/api/version` → prints a JSON object with exactly two keys, `version` (a string such as `0.1.0`, matching `[project].version` in `backend/pyproject.toml`) and `commit` (a string).

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters
Prerequisites: as Criterion 1.
1. With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` → `"commit": "unknown"`.
2. Restart the backend with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` → the backend container restarts.
3. Run `curl -s http://localhost:8010/api/version` → `"commit": "0123456789ab"` (the first 12 characters, not the full 40).
4. Restart with a blank value: `BUILD_COMMIT= docker compose up -d backend`, then run `curl -s http://localhost:8010/api/version` → `"commit": "unknown"`.
5. Open `backend/app/routers/version.py` → the router passes `commit=get_build_commit()` and contains no commit string literal; open `backend/app/core/config.py` → `BUILD_COMMIT` is read there with the `"unknown"` default.
6. Restore the default: `docker compose up -d backend` with `BUILD_COMMIT` unset → `"commit": "unknown"` again.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the fields `version` and `commit`, both strings.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL instance is reachable and `DATABASE_URL` points at it (the integration conftest needs one), for example the compose `db` service at `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → `0 failed`; the output lists tests for a set, an unset and a blank `BUILD_COMMIT`, and for the 12-character truncation.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`; the file holds a set-`BUILD_COMMIT` request cycle and an unset one.
