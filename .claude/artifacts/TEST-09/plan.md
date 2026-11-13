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
> **Notes:** Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete. Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. Amended by the tracker comment: a value longer than 12 characters is returned as its first 12 only.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the variable is named `BUILD_COMMIT` (the comment names it; the description does not), and `get_build_commit()` in `backend/app/services/version_service.py` returns `value[:12]` (constant `COMMIT_LENGTH = 12`). Unit and integration tests assert a 40-character sha comes back as its first 12 characters. This overrides the description's silence on length.
- Assumption (ambiguity, no human to ask): a value of 12 characters or fewer is returned unchanged, so the default `"unknown"` (7 characters) is never truncated. A value that is empty or whitespace-only counts as unset and yields `"unknown"`; surrounding whitespace is stripped before truncation. That follows the existing `CORS_ORIGINS` handling in `backend/app/core/config.py`.
- Assumption: "A full 40-character sha is what CI passes in" describes the input this feature must handle. It is not a request to edit `.github/workflows/*`, which `/sync-project` owns. This plan changes no CI workflow, and the CI build-time value reaches the image through the compose build argument added below.
- Assumption: the tracker note "Registers a router in `backend/app/main.py`" predates TEST-05. On main at bc70dc4, `backend/app/main.py` already registers `app.routers.version` (TEST-05), so this plan extends the existing router and does **not** modify `main.py`.
- Merged since the last plan: n/a (fresh plan, branched from current main bc70dc4838eea4f209f70c9cce8bf7aa495a7352). TEST-09 merged twice in earlier release runs (#763, #771), and the sandbox resets (#769, #779) removed both. The `commit` field is absent on main, so nothing here duplicates landed work.

## Plan Overview
Backend only. TEST-05 already serves `GET /api/version` with `{"version": ...}` (package metadata through `version_service.get_app_version()`). This feature adds a `commit` field:

- Configuration: `Settings.build_commit` in `backend/app/core/config.py` reads `BUILD_COMMIT` per call, with documented default `"unknown"`. This is the one declared source.
- Service: `get_build_commit()` in `backend/app/services/version_service.py` reads `get_settings().build_commit` and truncates it to 12 characters.
- Schema: `VersionResponse` gains `commit: str`.
- Router: passes `commit=get_build_commit()`. No literal in the router.
- Build time: `backend/Dockerfile` declares `ARG BUILD_COMMIT` and exports it as `ENV BUILD_COMMIT`. `docker-compose.yml` passes it as a build arg, and `.env.example` documents it.

No database, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this feature has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05). The response gains `commit`; the route, status code (200) and `version` field are unchanged.
- Configuration (`backend/app/core/config.py`):
  - Add module constant `UNKNOWN_BUILD_COMMIT = "unknown"`.
  - Add `_read_build_commit() -> str`: `(os.environ.get("BUILD_COMMIT") or "").strip() or UNKNOWN_BUILD_COMMIT`.
  - Add field `build_commit: str = field(default_factory=_read_build_commit)` to the frozen `Settings` dataclass. It is read per call, like `database_url` and `cors_origins`, so it follows `coding_standards.md` Section 5's invariant: every environment-dependent value in this module reads the environment, with a documented default.
  - Add one comment line naming the variable and its default.
- Service layer (`backend/app/services/version_service.py`):
  - Add `COMMIT_LENGTH = 12`.
  - Add `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`.
  - Call `get_settings()` inside the function, never at import time, so a changed environment is seen per request (the integration tests rely on this).
  - `get_app_version()` is untouched.
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`. Update the docstring to name TEST-09.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`, with a docstring line saying it is the build commit truncated to 12 characters, or `"unknown"`.
- Build-time wiring:
  - `backend/Dockerfile`: `ARG BUILD_COMMIT` (no default, so the default lives only in `config.py`) and `ENV BUILD_COMMIT=$BUILD_COMMIT`. An unset arg yields an empty value, which `Settings` reads as `"unknown"`.
  - `docker-compose.yml` → `services.backend.build.args`: `BUILD_COMMIT: ${BUILD_COMMIT:-}`.
  - `.env.example`: a commented `# BUILD_COMMIT=` entry under a `# --- Build ---` heading, explaining that it is set at build time (CI passes the full 40-character sha) and that the API reports its first 12 characters, or `unknown` when unset.
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "3f9c2a1b7d4e"}
```

When `BUILD_COMMIT` is unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` is the installed `task-notes-backend` distribution version (unchanged from TEST-05). `commit` is `BUILD_COMMIT` stripped, first 12 characters, or `"unknown"`.

## Technology Selection
- Build-commit setting: chose a `dataclasses.field(default_factory=...)` reading `os.environ` in the existing `Settings` over adding `pydantic-settings` (not installed). Rung 1, the standard library, covers it, matching the module's two existing fields.
- Commit truncation: chose a string slice (`value[:12]`, rung 1) over any helper or dependency.
- Build-time injection: chose Docker's native `ARG` to `ENV` (rung 2, a platform feature) over a generated version file or a build script.
- Response field: extends the existing Pydantic `VersionResponse` (rung 3, already installed). No net-new module.

## File Manifest
### New files
- [B] backend/tests/unit/test_version_schema_unit.py: unit tests for `VersionResponse` (declares `version` and `commit`; rejects a payload missing `commit`)
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus the truncation edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-09/uat_script.md: build-feature Section 14 step 3 copy of the manual UAT script

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response
- [B] backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=$BUILD_COMMIT`
- [B] docker-compose.yml: `services.backend.build.args.BUILD_COMMIT: ${BUILD_COMMIT:-}`
- [B] .env.example: document the optional `BUILD_COMMIT` build-time variable
- [B] backend/tests/unit/test_config_unit.py: tests for `build_commit` set, unset and blank
- [B] backend/tests/unit/test_version_service_unit.py: tests for `get_build_commit()` short value, 40-character truncation and unset
- [B] backend/tests/integration/test_version_integration.py: update the two existing body assertions to include `commit` (with `BUILD_COMMIT` cleared for determinism), and add set-path and unset-path tests

No dependency changes, so no lockfile entry. `backend/app/main.py` is not modified: the version router is already registered there by TEST-05. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. README line 70 already describes `.env.example` as carrying an optional `BUILD_COMMIT`, which this change makes true, and `docs/DEVELOPMENT.md` has no environment-variable reference to extend. No E2E spec is produced, because no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests:
  - `Settings.build_commit` resolution: set, unset, blank.
  - `version_service.get_build_commit()`: 12 or fewer characters unchanged, 40-character sha truncated to 12, unset gives `"unknown"`.
  - `VersionResponse` schema fields.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle on `GET /api/version` through the session `client` fixture, using `monkeypatch.setenv` and `monkeypatch.delenv` on `BUILD_COMMIT`. This works because settings are read per request. Covers 200 with both fields, set path (40-character sha in, first 12 out), unset path (`"unknown"`), the DATABASE_URL-unset case updated to the new body, and the existing 405 case unchanged. Assert the resolution through the HTTP response, not the fallback literal alone (`coding_standards.md` Section 5).
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. The toggle is ENABLED, but no criterion requires navigation or interaction through a UI (backend only; TEST-10 adds the footer that displays the commit).
  - Directory: e2e/tests/
  - File: none (no spec for TEST-09)
- UAT scenarios: one scenario per criterion plus the truncation edge case, phrased against the API response.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_and_commit`, `test_get_version_answers_when_database_url_is_unset` | Verifying it needs no navigation or interaction: it is a router response shape on the HTTP cycle |
| 2 | `commit` comes from one declared env var set at build time, default `"unknown"`, truncated to 12 per the tracker comment | Unit | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_returns_full_value_when_12_characters_or_fewer` | Verifying it needs no navigation or interaction: it is configuration resolution and a service rule |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_version_response_declares_version_and_commit_fields`, `test_version_response_rejects_missing_commit` | Verifying it needs no navigation or interaction: it is a schema definition |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_returns_truncated_commit_when_build_commit_set`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_get_build_commit_returns_unknown_when_unset` | Verifying it needs no navigation or interaction: both paths are environment-driven API behaviour, covered at unit (service) and integration (HTTP) level as the criterion names |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, first 12 characters | covered at Unit, see Criterion coverage | Given the backend image was built with BUILD_COMMIT set to a 40-character sha, When a client requests GET /api/version, Then commit equals the sha's first 12 characters |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API is running, When the OpenAPI document is fetched, Then the VersionResponse schema lists version and commit as required strings |
| 4 | Set and unset paths tested | covered at Integration, see Criterion coverage | Given the backend image was built without BUILD_COMMIT, When a client requests GET /api/version, Then commit is "unknown" |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is running from the repository root with `docker compose up -d --build backend`, and the backend answers on `http://localhost:8010`.
1. In a terminal, run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/version` → prints `200`.
2. Run `curl -s http://localhost:8010/api/version` → prints a JSON object with exactly two keys, `version` (for example `"0.1.0"`, matching `[project].version` in `backend/pyproject.toml`) and `commit`, both strings.
3. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response example shows both `version` and `commit`.

### Criterion 2: `commit` comes from the `BUILD_COMMIT` environment variable set at build time, default `"unknown"`, first 12 characters
Prerequisites: Docker running; the repository root is the working directory.
1. Run `BUILD_COMMIT=3f9c2a1b7d4e5f60718293a4b5c6d7e8f9012345 docker compose build backend`, then `docker compose up -d backend` → the backend container starts.
2. Run `curl -s http://localhost:8010/api/version` → the body's `commit` is `"3f9c2a1b7d4e"`, the first 12 of the 40 characters passed in.
3. Run `BUILD_COMMIT=abc123 docker compose build backend`, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"abc123"`, unchanged because it is shorter than 12 characters.
4. Open `backend/app/routers/version.py` → the response's `commit` value is `get_build_commit()`, not a quoted string.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend is running as in Criterion 1.
1. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Run `curl -s http://localhost:8010/openapi.json` and find `components.schemas.VersionResponse` → its `required` list contains `version` and `commit`, and both properties have `type` `string`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; a PostgreSQL connection string in `DATABASE_URL` for the integration tier (see `.env.example`).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_schema_unit.py` → expected `0 failed`. The run includes `test_get_build_commit_truncates_full_sha_to_first_12_characters` and `test_get_build_commit_returns_unknown_when_unset`.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → expected `0 failed`. The run includes `test_get_version_returns_truncated_commit_when_build_commit_set` and `test_get_version_returns_unknown_commit_when_build_commit_unset`.
3. For the unset path through the real stack, run `docker compose build backend` with `BUILD_COMMIT` not exported, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
