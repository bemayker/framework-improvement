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
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. Amended by the tracker comment: when the variable is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the name the comment uses), and the version service truncates its value to the first 12 characters (`COMMIT_LENGTH = 12`); a value of 12 characters or fewer is returned unchanged. Criterion 2 above carries the amendment, and the criterion coverage table names a dedicated truncation test at both unit and integration tier. Assumption recorded: truncation applies to the configured value only, never to the `"unknown"` default (7 characters, so unaffected either way).
- Dispatch note (not a tracker or PR comment): the tracker Notes say this item "registers a router in backend/app/main.py". Verified against current main (d7663f0d): `backend/app/routers/version.py` (TEST-05) already exists and `create_app()` already includes `version_router`. This plan therefore extends the existing endpoint and does NOT list `backend/app/main.py`, which removes the main.py overlap with BUG-01.

## Plan Overview
Extend the existing `GET /api/version` endpoint (TEST-05) with a `commit` field. The commit is read from the `BUILD_COMMIT` environment variable through the one settings module (`backend/app/core/config.py`, read per call like `DATABASE_URL` and `CORS_ORIGINS`), defaulting to `"unknown"` when unset or blank. The version service exposes `get_build_commit()`, which applies the 12-character truncation; the router builds `VersionResponse(version=..., commit=...)` from the two service calls and holds no literal. `VersionResponse` in `backend/app/schemas/version.py` gains `commit: str`. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container with an empty fallback (the default lives once, in config.py), and `.env.example` documents the key. Backend only; no frontend, no database, no migration.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`) now returns `{"version": str, "commit": str}`. No new route, no new router registration.
- Config: `backend/app/core/config.py` adds `UNKNOWN_COMMIT = "unknown"`, a `_read_build_commit()` helper (strip `BUILD_COMMIT`; blank or unset returns `UNKNOWN_COMMIT`), and a `Settings.build_commit: str` field with `default_factory=_read_build_commit`, matching the existing per-call `CORS_ORIGINS` pattern so a monkeypatched environment is seen per request (coding_standards.md Section 5: every environment-dependent value in the module reads the environment, with a documented default).
- Service layer: `backend/app/services/version_service.py` adds `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. Module docstring updated to name TEST-09 and the truncation reason (CI passes a full 40-character sha; clients get the short form).
- Router: `get_version()` returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. Docstring updated.
- Schema: `VersionResponse` gains `commit: str` with a field docstring/comment naming its source.
- Repository layer: none (no data access).
- Migrations: none.
- Deployment wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (empty fallback so config.py stays the one owner of the `"unknown"` default); `.env.example` gains a commented `BUILD_COMMIT=` entry under a new `# --- Backend ---` block.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version
- Request: no body, no query parameters.
- Response: 200, `application/json`, shape `{"version": string, "commit": string}`.
  - With `BUILD_COMMIT=3f9c2a7b1d4e8f60a5b2c9d1e7f3a4b6c8d0e2f1`: `{"version": "0.1.0", "commit": "3f9c2a7b1d4e"}`
  - With `BUILD_COMMIT=abc1234`: `{"version": "0.1.0", "commit": "abc1234"}`
  - With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`
  - (`version` is whatever `backend/pyproject.toml` declares; `0.1.0` is illustrative.)
- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` (not installed) or a new config module, because the module already reads `DATABASE_URL` and `CORS_ORIGINS` this way and a second mechanism would break its one-way-of-configuring invariant.
- Truncation to 12 characters: chose a plain string slice over any git library or subprocess call (`git rev-parse --short`), because the value arrives as a string from the environment and the running container has no repository to ask.
- Response field: chose extending the existing Pydantic `VersionResponse` over a new schema, because criterion 3 is satisfied by the schema already in `backend/app/schemas/` and a second one would duplicate it.
- No new dependency and no new module is introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the truncation edge case.
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_COMMIT`, `_read_build_commit()` and `Settings.build_commit` (read per call from `BUILD_COMMIT`, blank or unset gives `"unknown"`).
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()` (truncates the configured value to its first 12 characters); docstring names TEST-09.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: return `VersionResponse(version=get_app_version(), commit=get_build_commit())`.
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service.
- [B] .env.example: document the `BUILD_COMMIT` key (commented, empty) under a `# --- Backend ---` block.
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` (set, unset, truncation).
- [B] backend/tests/unit/test_config_unit.py: unit tests for `Settings.build_commit` (reads env, default when unset or blank).
- [B] backend/tests/integration/test_version_integration.py: update the two existing body-equality assertions to include `commit`; add set, unset, truncation and schema tests.

No lockfile changes: no dependency is added or changed.
No E2E spec: no criterion requires navigation or interaction through a UI (see Criterion coverage), so Phase D produces nothing for this item.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, dependency or test infrastructure changes, and the one new run-configuration key is documented in `.env.example`, which both documents already point to for environment keys.

## Testing Strategy
- Unit tests: `get_build_commit()` in the service layer (configured value returned, `"unknown"` when unset, a 40-character value truncated to 12, a value of exactly 12 unchanged) with `BUILD_COMMIT` set or removed via `monkeypatch`; `Settings.build_commit` in the config module (reads `BUILD_COMMIT`, defaults to `"unknown"` when unset or blank). No database, no network.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend the existing test_version_service_unit.py and test_config_unit.py)
- Integration tests: full HTTP cycle through the session `client` fixture with `BUILD_COMMIT` set, unset and over 12 characters (settings are read per request, so `monkeypatch.setenv`/`delenv` take effect without rebuilding the app); body equality against `{"version": <pyproject version>, "commit": ...}`; OpenAPI check that the `VersionResponse` component declares exactly `version` and `commit` as required strings. Existing `test_get_version_returns_200_with_version_from_pyproject` and `test_get_version_answers_when_database_url_is_unset` are updated to expect the `commit` key (with `BUILD_COMMIT` removed so the value is deterministic).
  - Directory: backend/tests/integration/
- E2E tests: none warranted. E2E is ENABLED, but no acceptance criterion involves navigation or interaction through the UI (backend-only endpoint), so per testing_standards.md Section 6 every criterion is covered at a cheaper tier.
  - Directory: e2e/tests/
  - File: no spec for this item (would be TEST-09_version_build_commit.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, exercising the HTTP endpoint (no browser step).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}` | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_returns_commit_from_build_commit_env` | verifying it needs no navigation or interaction: it is a router response shape over a real HTTP cycle |
| 2 | `commit` comes from one declared source (`BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer), never a router literal | Unit | `test_settings_build_commit_reads_build_commit_env`, `test_settings_build_commit_defaults_to_unknown_when_unset_or_blank`, `test_get_build_commit_truncates_long_value_to_first_12_characters`, `test_get_build_commit_returns_short_value_unchanged` | verifying it needs no navigation or interaction: it is a configuration and service rule, checked by varying the environment |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_version_response_schema_declares_version_and_commit` | verifying it needs no navigation or interaction: the schema is observable in the generated OpenAPI document |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_build_commit_returns_configured_commit_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_commit_from_build_commit_env`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_get_version_truncates_long_build_commit_to_12_characters` | verifying it needs no navigation or interaction: the criterion is itself about the unit and integration tiers, so both are named |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with version and commit | covered at Integration, see Criterion coverage | Given the backend is running When a client sends GET /api/version Then the status is 200 and the body has string keys version and commit |
| 2 | commit from BUILD_COMMIT, default unknown, truncated to 12 | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When GET /api/version Then commit is its first 12 characters; Given BUILD_COMMIT is unset Then commit is unknown |
| 3 | Pydantic schema in backend/app/schemas/ | covered at Integration, see Criterion coverage | Given the backend is running When a client reads /openapi.json Then VersionResponse declares version and commit as required strings |
| 4 | set and unset paths tested | covered at Integration, see Criterion coverage | Given the backend test suite When the version unit and integration tests run Then the run passes |

## Manual verification plan
This item has no UI: every criterion is verified against the HTTP endpoint with `curl` from a terminal at the repository root, or by running the named tests. The backend listens on `http://localhost:8010`.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: Docker running; no `BUILD_COMMIT` exported in your shell (`unset BUILD_COMMIT`).
1. Run `docker compose up -d --build backend` → the `db` and `backend` containers start; `docker compose ps` shows backend as running.
2. Run `curl -s -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is JSON with exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer
Prerequisites: the stack from Criterion 1 is up.
1. With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
2. Run `BUILD_COMMIT=3f9c2a7b1d4e8f60a5b2c9d1e7f3a4b6c8d0e2f1 docker compose up -d backend` → the backend container is recreated.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `"3f9c2a7b1d4e"` (the first 12 characters of the 40-character value).
4. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"abc1234"` (shorter than 12, returned unchanged).
5. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()`.
6. Run `docker compose up -d backend` with `BUILD_COMMIT` unset again → `commit` returns to `"unknown"`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack from Criterion 1 is up.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with required string fields `version` and `commit`.
2. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL database reachable at `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes` (the compose `db` service) for the integration tier.
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the run passes: no failed or errored test on the summary line, exit code 0.
3. Read the test names in both files → set (`..._when_set`, `..._from_build_commit_env`), unset (`..._when_unset`, `..._when_build_commit_unset`) and truncation tests are present.
