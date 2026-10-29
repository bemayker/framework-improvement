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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable set at build time, default `"unknown"`), never a string typed into the router; when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12 (tracker comment, which amends this criterion).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the comment names it; the description only says "an environment variable"), and the service truncates the value to its first 12 characters (`COMMIT_LENGTH = 12` in `backend/app/services/version_service.py`). A value of 12 characters or fewer is returned unchanged. Folded into criterion 2 above and covered by unit and integration tests with a 40-character sha.
- Assumption (no comment, recorded per the ambiguity rule): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and reports `unknown`. Reason: `docker-compose.yml` passes the variable through as `${BUILD_COMMIT:-}`, so on a local `docker compose up` it is present and empty; reporting an empty string would defeat the documented `unknown` default (docs/DEVELOPMENT.md already describes this behaviour). Surrounding whitespace on a non-blank value is stripped before truncation.
- Assumption: `GET /api/version` already exists on main (TEST-05: `backend/app/routers/version.py`, `schemas/version.py`, `services/version_service.py`, registered in `backend/app/main.py`). This item extends that endpoint with a `commit` field rather than adding a new router, so `backend/app/main.py` is NOT modified. The description's note "Registers a router in backend/app/main.py" is stale against current main; recorded rather than acted on, which also removes the main.py overlap with BUG-01 flagged at ingest.
- Assumption: no CI workflow change. The comment says CI passes the full sha in; there is no deploy/image-build workflow in this repository that builds a release image, so wiring `BUILD_COMMIT` into a CI job is out of scope (no criterion asks for it). The compose pass-through and `.env.example` entry are the declared source this repo controls.

## Plan Overview
Backend-only extension of the existing TEST-05 version endpoint. A new `build_commit` setting in `backend/app/core/config.py` reads `BUILD_COMMIT` from the environment per call (the one declared source), defaulting to `unknown` when unset or blank. A new `get_build_commit()` in the version service returns that value truncated to its first 12 characters. The `VersionResponse` Pydantic schema gains a `commit: str` field and the router fills it from the service. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container and `.env.example` documents it. Unit tests cover the setting and the service (set, long sha, unset, blank); integration tests cover the HTTP response with the variable set and unset.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item).

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response extended with `commit`. No new endpoint, no router registration change in `backend/app/main.py`.
- Service layer: `backend/app/services/version_service.py` gains `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which reads `get_settings().build_commit` and returns `value[:COMMIT_LENGTH]`. `get_app_version()` is unchanged.
- Config: `backend/app/core/config.py` gains `UNKNOWN_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (strip; blank or unset returns `UNKNOWN_BUILD_COMMIT`), and a `build_commit: str = field(default_factory=_read_build_commit)` field on `Settings`, read per call exactly like `cors_origins` and `database_url` (keeps the settings module's "every environment-varying value reads the environment" invariant).
- Router: `backend/app/routers/version.py` returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string in the router.
- Schema: `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`.
- Repository layer: none (no data access).
- Migrations: none.
- Runtime wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`; `.env.example` gains a commented `BUILD_COMMIT=` entry explaining the default.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: none (no body, no query parameters)
- Response: 200, `application/json`, schema `VersionResponse`:
  ```json
  {"version": "0.1.0", "commit": "a1b2c3d4e5f6"}
  ```
  With `BUILD_COMMIT` unset or blank:
  ```json
  {"version": "0.1.0", "commit": "unknown"}
  ```
- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- Build-commit setting: chose a stdlib `os.environ.get` read in the existing `Settings` dataclass over adding `pydantic-settings` or `python-dotenv`, because the settings module already reads every environment value this way and a few lines cover it.
- Truncation to 12 characters: chose a plain string slice (stdlib) over any git or hashing library; nothing more is needed.
- `commit` response field: chose a field on the existing Pydantic `VersionResponse` (installed dependency, already used) over a new schema; no new component is introduced.
- No new dependency, so no lockfile change.

## File Manifest
### New files
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script, expanded from the Manual verification plan below
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED)
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()` returning the first 12 characters of the configured commit
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: fill `commit` from `get_build_commit()`
- [B] backend/tests/unit/test_config_unit.py: `build_commit` reads `BUILD_COMMIT`, strips whitespace, defaults to `unknown` when unset or blank
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set short value, 40-character sha truncated to 12, exactly 12 unchanged, unset returns `unknown`
- [B] backend/tests/integration/test_version_integration.py: response carries `commit` with `BUILD_COMMIT` set (40-char sha gives first 12) and unset (`unknown`); existing exact-body assertions updated for the new field
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service
- [B] .env.example: document the optional `BUILD_COMMIT` variable and its `unknown` default

No dependency change, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: README.md line 70 already lists `BUILD_COMMIT` in `.env.example`, and docs/DEVELOPMENT.md already documents `BUILD_COMMIT`, the compose pass-through, the 12-character truncation and the `unknown` default exactly as this plan builds them; the build's Section 15 check should confirm rather than rewrite. No E2E spec file: no criterion is assigned to E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, whitespace-stripped, unset, blank, whitespace-only) and `get_build_commit()` (short value unchanged, exactly 12 unchanged, 40-character sha truncated to the first 12, unset gives `unknown`), with `monkeypatch.setenv` / `delenv`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extending test_config_unit.py and test_version_service_unit.py)
- Integration tests: real HTTP cycle through `create_app()` and `TestClient`: 200 with `{"version": <pyproject version>, "commit": <first 12 of BUILD_COMMIT>}` when set to a 40-character sha; `commit == "unknown"` when unset; existing DATABASE_URL-unset and 405 tests kept, exact-body assertions updated for the new field. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E is ENABLED, but no criterion requires navigation or interaction through the UI (backend-only item; the footer display is TEST-10's).
  - Directory: e2e/tests/
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (blank `BUILD_COMMIT`), validated for well-formedness, not executed.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters), never a router literal | Unit | verifying it needs no navigation or interaction: it is a settings-resolution and truncation rule; integration also asserts it end to end |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the response shape is asserted over HTTP and the schema is the router's `response_model` |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests themselves, run in the gate |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the response is 200 with string `version` and `commit` fields |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version is requested, Then `commit` is its first 12 characters; Given BUILD_COMMIT is unset, Then `commit` is `unknown` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When GET /api/version is requested, Then the body has exactly the fields `version` and `commit` |
| 4 | Tests cover set and unset paths | covered at Unit, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
This item has no UI: every criterion is verified by an HTTP call or a test run, which is the observable check.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: repository checked out at the built branch; port 8010 free; no `BUILD_COMMIT` exported in the shell.
1. In a terminal at the repository root, run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` → the `backend` container starts (and `db` with it).
2. Run `curl -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK`, header `content-type: application/json`.
3. Read the body → it is `{"version":"0.1.0","commit":"0123456789ab"}` (the version is whatever `[project].version` in `backend/pyproject.toml` says; both values are strings in quotes).

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: the stack from Criterion 1 is running.
1. With the stack started in Criterion 1 step 1, run `curl -s http://localhost:8010/api/version` → `commit` is `0123456789ab`, the first 12 of the 40-character value passed in, not the full sha.
2. Run `BUILD_COMMIT=abc1234 docker compose up -d backend` then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (a value of 12 characters or fewer is returned unchanged).
3. Run `docker compose up -d backend` with no `BUILD_COMMIT` in the shell or `.env`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
4. Run `BUILD_COMMIT="   " docker compose up -d backend` then `curl -s http://localhost:8010/api/version` → `commit` is `unknown` (blank counts as unset).
5. Open `backend/app/routers/version.py` → it calls `get_build_commit()` and contains no quoted commit value.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack is running.
1. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the two string fields `version` and `commit`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → `0 failed`.
2. Read the test names in those three files → there is at least one test with `BUILD_COMMIT` set (including a 40-character sha truncated to 12) and one with it unset, in both the unit files and the integration file.
3. Finish with `docker compose down` → the stack stops.
