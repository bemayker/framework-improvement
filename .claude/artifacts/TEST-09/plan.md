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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. When `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12 (tracker comment, see Re-Plan Feedback).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: folded into criterion 2. The service truncates to the first 12 characters (`COMMIT_LENGTH = 12` in `version_service.py`); a value of 12 characters or fewer is returned unchanged. The comment also names the variable: `BUILD_COMMIT`, which this plan adopts as the one declared source. Unit and integration tests cover a 40-character sha, an exactly-12-character value and a shorter value.
- Assumption (no comment covers it): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `"unknown"`, mirroring how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`. This also lets `docker-compose.yml` pass `${BUILD_COMMIT:-}` through without restating the `"unknown"` default (one value, one source).
- Assumption: the item's note says it "registers a router in `backend/app/main.py`". On current main (7c1e62b2) the version router from TEST-05 already exists and is already registered in `main.py` (`app.include_router(version_router)`), so this item extends that router and **does not touch `main.py`**. This removes the shared-risk overlap with BUG-01 on `main.py`.
- Merged since the last plan: n/a. Earlier TEST-09 builds (a5357b27, d3a4fee3) were reverted by the sandbox resets (06e9f14d, 7c1e62b2); this plan is written against the tree at 7c1e62b2, where none of TEST-09's code is present.

## Plan Overview
Extend the existing TEST-05 version slice with a `commit` field. The build commit is a deployment-dependent value, so it is declared once in `Settings` (`backend/app/core/config.py`) as `build_commit`, read per call from `BUILD_COMMIT` with `"unknown"` as the documented default, the same way `database_url` and `cors_origins` are read. The service layer (`version_service.py`) exposes `get_build_commit()`, which applies the 12-character truncation. The router composes `VersionResponse(version=..., commit=...)`; the schema gains `commit: str`. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container so a build can set it. Backend only, no frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders nothing).

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response extended with `commit`. No new endpoint and no new router registration.
- Config (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT", "").strip()` or the default when that is empty. Add field `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`, with a one-line comment that the value is set at build time and blank means unset. Read per call, so tests can `monkeypatch.setenv` without re-importing.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. The default `"unknown"` (7 characters) passes through unchanged. Docstring per project convention, and the module docstring gains a line naming TEST-09.
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string in the router. Module docstring names TEST-09 as well.
- Schema (`backend/app/schemas/version.py`): add `commit: str` to `VersionResponse`, and update the class docstring.
- Deployment wiring (`docker-compose.yml`): under `backend.environment`, add `BUILD_COMMIT: ${BUILD_COMMIT:-}`, with a comment that CI passes the full 40-character sha and the code owns the `"unknown"` default. No Dockerfile `ARG` is added: compose already passes runtime environment and the sandbox builds no image for deploy beyond compose.
- Repository layer: none. Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: none
- Response: 200, `application/json`, schema `VersionResponse`

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` keeps its TEST-05 behaviour (package metadata, `"unknown"` sentinel when not installed). `POST /api/version` stays 405.

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` or a `.env` loader, because `config.py` already reads every deployment-dependent value this way and a new dependency would buy nothing for one string.
- Truncation to 12 characters: chose a plain string slice (`[:12]`) over `git rev-parse --short` or any subprocess, because the container has no `.git` and the value arrives as an environment string.
- No other net-new component, module or dependency: every other change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus the truncation edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature writes alongside it

### Modified files
- [B] backend/app/core/config.py: declare `build_commit` on `Settings`, read per call from `BUILD_COMMIT`, default `"unknown"`, blank treated as unset
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()` with the 12-character truncation
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit` from `get_build_commit()`
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service
- [B] backend/tests/unit/test_config_unit.py: unit tests for `build_commit` set, unset and blank
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` set, unset, 40-character sha and exactly 12 characters
- [B] backend/tests/integration/test_version_integration.py: update the two existing exact-body assertions to include `commit`, and add set, unset, truncation and schema tests
- [Docs] docs/DEVELOPMENT.md: document the `BUILD_COMMIT` variable (what it is, that CI passes the full sha, that `commit` shows its first 12 characters, default `"unknown"`), because this item adds run configuration

No lockfile changes: this item adds no dependency. `backend/app/main.py` is not modified: the version router is already registered there. README.md needs no edit: it does not document backend environment variables. No E2E spec is produced: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution from the environment (set, unset, blank) and `get_build_commit()` (set short value, unset default, 40-character sha truncated, exactly 12 characters kept). Isolation via `monkeypatch.setenv` / `monkeypatch.delenv`; no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` through `create_app()` with `BUILD_COMMIT` set to a 40-character sha, set to a short value, and unset; the response body includes both keys; `/openapi.json` shows `VersionResponse` with `version` and `commit` as required strings. The two existing TEST-05 tests are updated from `{"version": ...}` to the two-key body, with `BUILD_COMMIT` removed via `monkeypatch.delenv` so their expected `commit` is deterministic.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI; this item has no frontend change, and an E2E test that calls the API directly is a router integration test (`testing_standards.md` Section 5).
  - Directory: e2e/tests/ (no file produced)
  - File: none
- UAT scenarios: one scenario per criterion plus the 40-character sha edge case, written as API-level Given/When/Then against `GET /api/version`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_and_commit`, `test_get_version_answers_when_database_url_is_unset` | Verifying it needs no navigation or interaction: it is a router response shape, checked over a real HTTP cycle |
| 2 | `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters only | Unit | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_build_commit_truncates_full_sha_to_twelve_characters`, `test_get_build_commit_keeps_exactly_twelve_characters` | Verifying it needs no navigation or interaction: it is configuration resolution and a string rule in the service layer |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_version_response_schema_has_version_and_commit` | Verifying it needs no navigation or interaction: the schema is observable in the app's OpenAPI document |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | `test_get_build_commit_returns_value_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_commit_from_build_commit_env`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_get_version_truncates_full_sha_commit_to_twelve_characters` | Verifying it needs no navigation or interaction: the criterion is about the unit and integration tiers themselves |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When GET /api/version is requested Then commit is the sha's first 12 characters; Given BUILD_COMMIT is unset Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running When /openapi.json is requested Then VersionResponse lists version and commit as required strings |
| 4 | Tests cover set and unset commit paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite When the version and config unit and integration tests run Then they pass |

## Manual verification plan
No criterion is verifiable through the UI: this item has no frontend change. Each block below gives the observable check (an HTTP response read with curl, or a test run) instead.

### Criterion 1: GET /api/version returns 200 with version and commit
Prerequisites: Docker running; from the repository root, the stack is up with `docker compose up -d --build` and `BUILD_COMMIT` not set in your shell.
1. Run `curl -s -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is `{"version":"0.1.0","commit":"unknown"}` (the `version` value is whatever `[project].version` in `backend/pyproject.toml` says).
2. Run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/version` → prints `405`.

### Criterion 2: commit comes from BUILD_COMMIT, default "unknown", first 12 characters only
Prerequisites: Docker running, repository root.
1. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` → the backend container is recreated.
2. Run `curl -s http://localhost:8010/api/version` → the body's `commit` is exactly `0123456789ab` (12 characters, not the full 40).
3. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234`, unchanged.
4. Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
5. Open `backend/app/routers/version.py` → it contains no quoted commit value; `commit` comes from `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/
Prerequisites: stack running as in Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with `version` (string) and `commit` (string), both required.
2. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL reachable at the stack's `localhost:5442` (from `docker compose up -d db`).
1. Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports no failed or errored test and the command exits 0.
2. Read the collected test names (add `-v`) → they include `test_get_build_commit_returns_value_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_commit_from_build_commit_env` and `test_get_version_returns_unknown_commit_when_build_commit_unset`, each reported as passed.
