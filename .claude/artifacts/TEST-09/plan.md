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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build/deploy time, default `"unknown"`), never a string typed into the router. Per the tracker clarification below: when `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: `get_build_commit()` in `backend/app/services/version_service.py` returns `settings.build_commit[:12]` (constant `BUILD_COMMIT_LENGTH = 12`); values of 12 characters or fewer, including the default `"unknown"`, are returned unchanged. Unit tests cover 40 → 12, exactly 12, shorter, unset and blank. Added to criterion 2 above, since a comment overrides the description where they differ.
- Assumption (no comment decides it): surrounding whitespace in `BUILD_COMMIT` is stripped before the 12-character cut, and a blank or whitespace-only value counts as unset and reports `"unknown"`. This matches the existing `CORS_ORIGINS` handling in `backend/app/core/config.py`.
- Assumption: no hex validation and no lower-casing is applied to the value; the endpoint reports what the build declared.
- Assumption: wiring CI to export `BUILD_COMMIT` is out of scope. `.github/workflows/pr-tests.yml` is a plugin-owned generated workflow and no criterion asks for it. The source is declared in `docker-compose.yml` (passed through from the host environment) and documented in `.env.example`.
- Context (dispatch): commit 91e19ee3 reset this item's earlier code on main, so this plan rebuilds the slice afresh against 91e19ee37652a14621403c9bfdd0263de8767a5f. The TEST-05 version slice (router, schema, service, tests) is present on main and is extended here, not recreated.
- Merged since the last plan: n/a (fresh plan, branched from current main; no previous plan exists on this branch).

## Plan Overview
Extend the existing TEST-05 `GET /api/version` slice with a `commit` field. The value is read from one declared source, the `BUILD_COMMIT` environment variable, through the existing `Settings` dataclass in `backend/app/core/config.py`, following the same per-call `default_factory` pattern as `CORS_ORIGINS` (coding_standards.md Section 5: within one settings module every deployment-dependent value is read the same way, with a documented default). The service layer applies the 12-character rule. The router only assembles `VersionResponse(version=..., commit=...)` and types no commit literal.

**`backend/app/main.py` is NOT in this manifest.** The version router is already registered there (`app.include_router(version_router)`, from TEST-05), so adding a field to that router needs no change to the app factory. This removes the shared-risk overlap with BUG-01, which registers a server-time router in `main.py`.

## Frontend Plan
No frontend changes required. (TEST-10, downstream, renders the commit in the footer.)

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05): response gains `commit: str`. No new route, no new router registration.
- Config (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper returning `(os.environ.get("BUILD_COMMIT") or "").strip() or DEFAULT_BUILD_COMMIT`, and a `build_commit: str = field(default_factory=_read_build_commit)` field on `Settings`, read per call like `cors_origins`. Comment the field with the env var name and its default.
- Service layer (`backend/app/services/version_service.py`): add `BUILD_COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:BUILD_COMMIT_LENGTH]`. Docstring names the tracker clarification (full sha in, first 12 out). Update the module docstring to name TEST-09.
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`. Docstring updated to name TEST-09.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`. Docstring updated.
- Run configuration: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`. The default stays empty in compose on purpose, so the one `"unknown"` default lives in `config.py` only (coding_standards.md Section 5, "One value, one source"). `.env.example` gains a commented `# BUILD_COMMIT=` entry under a `# --- Build ---` heading explaining that CI or the deploy supplies the full sha and the API shows its first 12 characters.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version
- Request: none
- Response: 200, `application/json`, schema `VersionResponse` (`backend/app/schemas/version.py`):

```json
{"version": "0.1.0", "commit": "91e19ee37652"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- `BUILD_COMMIT` reading: chose the standard library `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings`, because the module already reads `DATABASE_URL` and `CORS_ORIGINS` this way and a new dependency is not needed for one field.
- 12-character truncation: chose a plain string slice (standard library) over any helper or dependency; no alternative is needed.
- `commit` response field: chose to extend the existing Pydantic `VersionResponse` (installed dependency) over a new schema; no net-new module is introduced.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios per criterion plus one edge case (40-char sha truncated to 12)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit` read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: `BUILD_COMMIT_LENGTH = 12` and `get_build_commit()`
- [B] backend/app/schemas/version.py: `VersionResponse.commit: str`
- [B] backend/app/routers/version.py: response carries `commit=get_build_commit()`
- [B] docker-compose.yml: backend `BUILD_COMMIT: ${BUILD_COMMIT:-}` pass-through
- [B] .env.example: documented optional `BUILD_COMMIT`
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset, blank and stripped cases
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` 40 to 12, exactly 12, shorter, unset
- [B] backend/tests/integration/test_version_integration.py: existing assertions gain `commit`; set and unset commit paths; OpenAPI schema check
- [Docs] docs/DEVELOPMENT.md: one short note that `BUILD_COMMIT` is the optional build-commit source for `GET /api/version` (run configuration change)

No dependency is added, so no lockfile changes. `README.md` needs no edit: its `.env.example` line already names the optional `BUILD_COMMIT`. `backend/app/main.py` is not modified (the version router is already registered).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (config) and `get_build_commit()` truncation (service), environment and settings monkeypatched, no I/O.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend the existing `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` through `TestClient`, with `BUILD_COMMIT` set and unset via `monkeypatch`. Settings are read per call, so the session-scoped `client` fixture sees the patched environment. No database is needed.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI; this is an API-only item (testing_standards.md Section 6, asked per criterion below). No spec file.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus the 40-character truncation edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_answers_when_database_url_is_unset` | Verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters), never a router literal | Unit | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_settings_build_commit_strips_surrounding_whitespace`, `test_get_build_commit_truncates_a_40_character_sha_to_12`, `test_get_build_commit_keeps_a_12_character_value_unchanged`, `test_get_build_commit_returns_a_shorter_value_unchanged` | Verifying it needs no navigation or interaction: it is a configuration and service rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_declares_version_response_with_version_and_commit` | Verifying it needs no navigation or interaction: it is the router's declared response model |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_returns_commit_from_build_commit_env`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_get_build_commit_returns_unknown_when_unset` | Verifying it needs no navigation or interaction: it is the set and unset paths through the HTTP cycle and the service |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When GET /api/version Then commit is its first 12 characters |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the OpenAPI document When it is read Then VersionResponse declares version and commit as strings |
| 4 | Set and unset paths tested | covered at Integration, see Criterion coverage | Given BUILD_COMMIT is unset When GET /api/version Then commit is "unknown" |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
This criterion has no UI; the observable check is the HTTP response.
Prerequisites: the stack is running (`docker compose up -d --build` at the repo root), backend on port 8010.
1. In a terminal run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body → it is a JSON object with exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`, e.g. `0.1.0`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
This criterion has no UI; the observable check is the `commit` field.
Prerequisites: the repo root as the working directory; no `BUILD_COMMIT` exported in the shell.
1. Run `docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
2. Run `BUILD_COMMIT=91e19ee37652a14621403c9bfdd0263de8767a5f docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `91e19ee37652` (the first 12 characters).
3. Run `BUILD_COMMIT=abc123 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc123`, unchanged.
4. Run `BUILD_COMMIT="   " docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
5. Open `backend/app/routers/version.py` → no commit string literal appears; the value comes from `get_build_commit()`.

### Criterion 3: Response body defined by a Pydantic schema in `backend/app/schemas/`
This criterion has no UI; the observable check is the OpenAPI document.
Prerequisites: the stack is running as for Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response shows the schema `VersionResponse` with `version` (string) and `commit` (string).
2. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: a database reachable for the integration tier, e.g. `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes` with `docker compose up -d db`.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → the run passes: no failed or errored test on the summary line, exit code 0.
2. Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the run passes: no failed or errored test on the summary line, exit code 0.
3. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py -k "build_commit_env or build_commit_unset"` → both the set and the unset tests are collected and pass, exit code 0.
