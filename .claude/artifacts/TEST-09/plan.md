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
>
> Source: ClickUp task 123k99cwybk (https://app.clickup.com/t/123k99cwybk).

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification below: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the comment amends criterion 2 and overrides the description where they differ (the description says nothing about length). The variable is named `BUILD_COMMIT`, as the comment names it. Truncation to the first 12 characters lives in the service layer (`get_build_commit()` in `backend/app/services/version_service.py`), not in the router or the settings, and is covered by a unit test with a 40-character sha and an integration test asserting the 12-character response. A value of exactly 12 characters or shorter is returned unchanged. The "A full 40-character sha is what CI passes in" sentence describes the deployment input; this plan does not change any CI workflow to pass it (no criterion asks for that wiring, and tests set the variable themselves), recorded as an assumption.
- Assumption (ambiguity, no comment covers it): a `BUILD_COMMIT` that is set but empty or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` treats a blank value in `backend/app/core/config.py`. Surrounding whitespace is stripped before truncation.
- Merged since the last plan: n/a. The plan base is 689d24f (current main). The sandbox reset (#326) removed an earlier TEST-09 implementation (9a6bfd7); the current tree has the TEST-05 version endpoint without a `commit` field, and this plan is written against that tree.

## Plan Overview
Extend the existing TEST-05 `GET /api/version` endpoint (router, service and schema already present) so its response carries a `commit` field next to `version`. The commit is read from one declared source, the `BUILD_COMMIT` environment variable, through the existing settings module `backend/app/core/config.py` (same per-call `default_factory` pattern as `DATABASE_URL` and `CORS_ORIGINS`, keeping the coding_standards.md Section 5 invariant that every environment-varying value in one settings module is read the same way). The service layer resolves the value: blank or unset gives `"unknown"`, longer than 12 characters is cut to its first 12. The router composes the response from the two service calls and holds no literal (Router, Service, Repository layering per coding_standards.md Section 2.2; no repository is needed). `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container without a default of its own, so the `"unknown"` default exists in exactly one place (coding_standards.md Section 5, one value, one source). Backend only: no frontend, no database, no external API.

The router is already registered in `backend/app/main.py` (TEST-05), so this item does not need to edit `main.py`; the tracker note about registering a router there is satisfied by the existing registration.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; the feature has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. Router body becomes `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No other endpoint changes.
- Settings: `backend/app/core/config.py` gains `build_commit: str | None`, read per call from the `BUILD_COMMIT` environment variable via `default_factory` (stripped; empty or whitespace-only becomes `None`).
- Service layer: `backend/app/services/version_service.py` gains `UNKNOWN_COMMIT = "unknown"`, `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which reads `get_settings().build_commit` and returns `UNKNOWN_COMMIT` when it is `None`, otherwise the first `COMMIT_LENGTH` characters.
- Schema: `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`.
- Repository layer: none (no data access).
- Migrations: none.
- Run configuration: `docker-compose.yml` backend service `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (empty when the host does not set it, so the application's own `"unknown"` default applies and the default is not duplicated). `.env.example` gains a commented `BUILD_COMMIT=` line documenting the variable. No Dockerfile change: the variable is read at runtime from the container environment, which is how the existing settings already work.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response 200, `application/json`, shape `VersionResponse`:
  - `version`: string, the installed `task-notes-backend` distribution version (unchanged behaviour, `"unknown"` when not installed).
  - `commit`: string, `BUILD_COMMIT` stripped and cut to its first 12 characters, or `"unknown"` when unset or blank.
- Example with `BUILD_COMMIT=9a6bfd7c3e1f2a4b5c6d7e8f9a0b1c2d3e4f5a6b`:

```json
{"version": "0.1.0", "commit": "9a6bfd7c3e1f"}
```

- Example with `BUILD_COMMIT` unset:

```json
{"version": "0.1.0", "commit": "unknown"}
```

- Errors: `POST /api/version` stays 405 (unchanged). No other error path: the endpoint takes no input and never answers 500 for a missing commit.

## Technology Selection
- Reading `BUILD_COMMIT`: chose `os.environ.get` inside the existing `Settings` dataclass `default_factory` (standard library, rung 1) over adding `pydantic-settings` or a `.env` loader, because the settings module already reads every environment value this way.
- Truncation to 12 characters: chose a plain string slice in the service (standard library, rung 1); no alternative needed.
- Response field: chose the existing Pydantic `VersionResponse` model (installed dependency, rung 3) over a new schema module.
- No new dependency, component or module is introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge-case scenario (40-character sha cut to 12)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `build_commit` read per call from `BUILD_COMMIT` (stripped, blank becomes None)
- [B] backend/app/services/version_service.py: add `UNKNOWN_COMMIT`, `COMMIT_LENGTH` and `get_build_commit()`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` set, unset, blank, longer-than-12 and exactly-12 paths
- [B] backend/tests/unit/test_config_unit.py: unit tests for `Settings.build_commit` reading `BUILD_COMMIT` (set, unset, blank)
- [B] backend/tests/integration/test_version_integration.py: update existing assertions to include `commit`; add set-commit (40-char sha returns first 12) and unset-commit (returns `"unknown"`) HTTP cycle tests
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` into the backend service environment
- [B] .env.example: document `BUILD_COMMIT` (commented, empty)
- [Docs] docs/DEVELOPMENT.md: document the `BUILD_COMMIT` environment variable (run configuration change: a new environment variable the backend reads)

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is regenerated. `README.md` needs no edit: project structure, dependencies and test infrastructure are unchanged; the one run-configuration change is documented in `docs/DEVELOPMENT.md`. `backend/app/main.py` needs no edit: the version router is already registered.

## Testing Strategy
- Unit tests: `get_build_commit()` in the service (set value under 12 characters returned unchanged; exactly 12 unchanged; 40-character sha cut to first 12; unset gives `"unknown"`; blank gives `"unknown"`), with `get_settings` or the environment monkeypatched. `Settings.build_commit` in config (reads `BUILD_COMMIT`, strips whitespace, blank and unset become `None`). Assert the resolution from a set variable, not only the fallback literal (coding_standards.md Section 5).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_version_service_unit.py` and `test_config_unit.py` are extended)
- Integration tests: full HTTP cycle on `GET /api/version` with `BUILD_COMMIT` set to a 40-character sha (200, `commit` is its first 12 characters, `version` unchanged) and with it unset (200, `commit` is `"unknown"`); existing tests updated for the new field; the existing 405 test kept. Set the variable with `monkeypatch.setenv` or `monkeypatch.delenv` and build a fresh `create_app()` client, so no test depends on the runner's environment.
  - Directory: backend/tests/integration/
- E2E tests: not warranted for this feature. No acceptance criterion involves navigation or interaction through the UI (testing_standards.md Section 6, fourth question, asked per criterion below); the endpoint is covered at integration level. No spec file is produced.
  - Directory: e2e/tests/ (unused by this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (40-character sha), validated for well-formedness.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router request/response behaviour. |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters when longer), never a router literal | Unit | Verifying it needs no navigation or interaction: it is service and settings resolution logic; the integration set and unset tests confirm the wiring end to end. |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the router's `response_model=VersionResponse` is exercised by the HTTP cycle, and the exact JSON keys asserted there are the schema's. |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | Verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests themselves, run with `uv run --directory backend pytest`. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the response is 200 with string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version is requested, Then commit equals its first 12 characters; Given it is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When the OpenAPI document is read, Then VersionResponse lists version and commit as required strings |
| 4 | Tests cover set and unset commit paths | covered at Unit, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is running with `docker compose up -d --build` from the repository root (backend on http://localhost:8010).
1. In a terminal at the repository root, run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present.
2. Read the body printed by step 1 → it is a JSON object with exactly two keys, `version` (for example `"0.1.0"`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer
This criterion has no UI; it is verified by reading the endpoint response under different environment values.
Prerequisites: the stack from Criterion 1 can be restarted.
1. Run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` not set in the shell and not present in `.env` → the backend container restarts.
2. Run `curl -s http://localhost:8010/api/version` → the body shows `"commit":"unknown"`.
3. Run `BUILD_COMMIT=9a6bfd7c3e1f2a4b5c6d7e8f9a0b1c2d3e4f5a6b docker compose up -d --force-recreate backend` → the backend container restarts.
4. Run `curl -s http://localhost:8010/api/version` → the body shows `"commit":"9a6bfd7c3e1f"` (the first 12 characters of the 40-character sha), and `version` is unchanged from step 2.
5. Run `BUILD_COMMIT=abc1234 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → the body shows `"commit":"abc1234"` (a value of 12 characters or fewer is returned as is).
6. Open `backend/app/routers/version.py` → the router contains no commit string literal; it calls `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open http://localhost:8010/docs in a browser → the Swagger UI lists `GET /api/version`.
2. Expand `GET /api/version` and open its 200 response schema → it is `VersionResponse` with `version` (string, required) and `commit` (string, required).
3. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
This criterion has no UI; it is verified by running the tests.
Prerequisites: a PostgreSQL instance reachable through `DATABASE_URL` for the integration tier (see `.env.example`), or `docker compose up -d db`.
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` → the run ends with `0 failed`, and the output includes the build-commit set, unset, blank and longer-than-12 tests.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the run ends with `0 failed`, including the set-commit (first 12 characters) and unset-commit (`"unknown"`) tests.
