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
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: criterion 2 now carries the 12-character truncation; the service layer (`get_build_commit()`) slices the configured value to its first 12 characters, and unit plus integration tests assert a 40-character sha becomes its 12-character prefix while a value of 12 characters or fewer is returned unchanged. Assumption recorded: truncation applies to the configured value only, never to the `"unknown"` default (7 characters, unaffected either way).
- Assumption (no comment, description silent): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` treats a blank value in the same settings module, and matching the existing `docs/DEVELOPMENT.md` text that already says "When the variable is unset or blank the backend reports `unknown`". Surrounding whitespace is stripped before truncation.
- Assumption (description note vs code): the description says the item "registers a router in `backend/app/main.py`". The version router already exists (TEST-05) and is already registered there, so this plan extends the existing router and does **not** modify `backend/app/main.py`. Registering a second router for the same path would be an invented endpoint (`review_standards.md` Section 3).

## Plan Overview
Extend the existing `GET /api/version` endpoint (TEST-05) so its response carries a `commit` field next to `version`. The commit is read from one declared source: a new `build_commit` field on `Settings` in `backend/app/core/config.py`, read from the `BUILD_COMMIT` environment variable per call with the documented default `"unknown"`. The service layer (`version_service.get_build_commit()`) applies the 12-character truncation the tracker clarification asks for, the schema gains a `commit: str` field, and the router passes both values through. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container and `.env.example` documents it as optional. Backend only; no frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05) gains the `commit` field in its response. No new endpoint, no new router, no change to `backend/app/main.py`.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank. Add `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`, so it is read per call like `database_url` and `cors_origins` (the settings-module invariant in coding_standards.md: every environment-dependent value reads the environment, with a documented default).
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. The default `"unknown"` passes through unchanged because it is shorter than 12. The existing `get_app_version()` is untouched.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str` (both fields required).
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string in the router. Called per request, so the session-scoped test client sees a monkeypatched environment.
- Deployment wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (blank passes through, the config default resolves it to `"unknown"`); `.env.example` gains a commented, optional `BUILD_COMMIT=` entry explaining that CI passes the full sha.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response 200, `BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678`:
  `{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}`
- Response 200, `BUILD_COMMIT` unset or blank:
  `{"version": "0.1.0", "commit": "unknown"}`
- `version` is unchanged from TEST-05 (installed distribution version of `task-notes-backend`, or `"unknown"`).
- Response 405 for any non-GET method (unchanged).

## Technology Selection
- Commit source (`Settings.build_commit`): chose the standard library's `os.environ` inside the existing `Settings` dataclass over a settings dependency such as pydantic-settings, because the module already reads every environment value this way and a few lines cover it; no new dependency.
- 12-character truncation (`get_build_commit()`): chose a plain string slice over invoking `git` at runtime or a helper library, because the value is supplied at build time and the slice is the whole operation.
- Response field (`VersionResponse.commit`): chose the already-installed Pydantic over a hand-built dict serializer; the existing schema is extended, no net-new module.
- No net-new component, module or dependency beyond these extensions of existing files.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the truncation edge case
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()` with the 12-character truncation
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service
- [B] .env.example: document the optional `BUILD_COMMIT` variable
- [B] backend/tests/unit/test_config_unit.py: cover `build_commit` set, unset and blank
- [B] backend/tests/unit/test_version_service_unit.py: cover `get_build_commit()` set (40-char truncated to 12), short value unchanged, and unset default
- [B] backend/tests/integration/test_version_integration.py: update the two existing equality assertions to include `commit`, and add set (truncated) and unset commit cases through the HTTP cycle

No dependency is added or changed, so no lockfile changes. `README.md` and `docs/DEVELOPMENT.md` need no edit: `README.md` already lists `.env.example` as carrying an optional `BUILD_COMMIT`, and `docs/DEVELOPMENT.md` already documents `BUILD_COMMIT`, its compose passthrough, the 12-character truncation and the `unknown` default exactly as this plan builds them. `backend/app/main.py` is not modified: the version router is already registered.

## Testing Strategy
- Unit tests: `Settings.build_commit` (set, unset, blank, whitespace stripped) and `version_service.get_build_commit()` (40-char sha truncated to its first 12, a value of 12 or fewer returned unchanged, unset returns `"unknown"`). Environment set with `monkeypatch.setenv` and `monkeypatch.delenv`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing `test_config_unit.py` and `test_version_service_unit.py` extended)
- Integration tests: full HTTP cycle on `GET /api/version` with `BUILD_COMMIT` set to a 40-character sha (asserts `commit` is the 12-char prefix and `version` unchanged), with `BUILD_COMMIT` unset (asserts `"unknown"`), and the existing DATABASE_URL-unset and 405 cases updated for the new body shape. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The item has no UI: no criterion requires navigation or interaction through a browser (`testing_standards.md` Section 6), and an E2E test calling the API directly is an anti-pattern (`testing_standards.md` Section 5). The footer display of the commit is TEST-10's scope.
  - Directory: e2e/tests/ (no file for this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, validated for well-formedness.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, truncated to 12 chars), never a router literal | Unit | verifying it needs no navigation or interaction: it is configuration resolution and a service rule, also exercised end to end by the integration set/unset cases |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the response shape is asserted on the HTTP body and the schema is the router's `response_model` |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests themselves, which name the set and unset cases |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, first 12 chars | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit is its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When GET /api/version, Then the body contains exactly the keys version and commit |
| 4 | Tests cover set and unset paths | covered at Unit, see Criterion coverage | Given the backend test suite, When it runs, Then the set and unset commit tests report 0 failed |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
Prerequisites: Docker running; from the repository root, the stack is up with `docker compose up -d --build` and no `BUILD_COMMIT` in the shell or `.env`.
1. Run `curl -i http://localhost:8010/api/version` in a terminal → the status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body from step 1 → it is `{"version":"0.1.0","commit":"unknown"}` (the version is whatever `backend/pyproject.toml` `[project].version` holds).
3. Open `http://localhost:8010/api/version` in a browser tab → the same JSON is shown, with both `version` and `commit` as quoted strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: the stack from Criterion 1 is up.
1. Run `curl -s http://localhost:8010/api/version` with `BUILD_COMMIT` unset → `commit` is `unknown`.
2. Restart the backend with a full sha: `BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 docker compose up -d backend` → the backend container is recreated.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `a1b2c3d4e5f6` (the first 12 characters), and `version` is unchanged.
4. Restart with a short value: `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234`.
5. Restart with a blank value: `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
6. Open `backend/app/routers/version.py` → no commit string literal appears in it; the value comes from `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema
Not verifiable through the UI. Observable check instead:
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the string properties `version` and `commit`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; the repository checked out at the feature branch.
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` → the run reports `0 failed`, and the test names include a set (truncated) case and an unset (`unknown`) case for the commit.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the run reports `0 failed`, and the test names include a set-commit and an unset-commit case.
