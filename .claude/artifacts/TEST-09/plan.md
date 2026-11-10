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
>
> (Source: ClickUp task 123k99cwybk, workspace 30307190.)

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification below: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the comment overrides the description where they differ (the description says nothing about length). The service function `get_build_commit()` returns the first 12 characters of the configured value; a value of 12 characters or fewer is returned unchanged, and the `"unknown"` default (7 characters) is unaffected. Criterion 2 above carries the rule, and the unit and integration tests assert a 40-character sha comes back as its first 12 characters.
- Assumption (no comment, recorded per `user_story_alignment.md` Section 4): the environment variable is named `BUILD_COMMIT` (the name the tracker comment uses). "Set at build time" is read as: whatever builds or deploys the image injects it into the backend process environment; the backend reads it at request time through the settings module. A blank or whitespace-only value is treated as unset and yields `"unknown"`, the same treatment `CORS_ORIGINS` already gets in `backend/app/core/config.py`.
- Assumption: no `[merged-since]` notice was dispatched. Earlier TEST-09 builds (#654, #672) landed and were reset off `main` by 1cee27a; this plan is written against `main` as it stands at 1cee27a, where `/api/version` returns only `{"version": ...}`.

## Plan Overview
TEST-05 already shipped `GET /api/version` (router `backend/app/routers/version.py`, schema `backend/app/schemas/version.py`, service `backend/app/services/version_service.py`), and `backend/app/main.py` already registers that router. TEST-09 extends that slice with a `commit` field:

- **Config:** `backend/app/core/config.py` gains `Settings.build_commit`, read per call from `BUILD_COMMIT`, defaulting to the module constant `UNKNOWN_BUILD_COMMIT = "unknown"`. This is the one declared source (criterion 2).
- **Service:** `version_service.get_build_commit()` reads `get_settings().build_commit` and returns at most its first 12 characters (tracker clarification).
- **Schema:** `VersionResponse` gains `commit: str` (criterion 3).
- **Router:** returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`; no literal in the router (criterion 2).
- **Wiring:** `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container, and `.env.example` documents it.

**`backend/app/main.py` is NOT modified**: the version router is already included (`app.include_router(version_router)`), so no registration change is needed. That keeps this item off the file BUG-01, TEST-13 and CHORE-06 contend for.

Backend only. No frontend, no database, no external API.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, extended). Returns 200 with `{"version": str, "commit": str}`. No new endpoint.
- Config (`backend/app/core/config.py`):
  - Add `UNKNOWN_BUILD_COMMIT = "unknown"` as a module constant.
  - Add `_read_build_commit() -> str`: returns `os.environ.get("BUILD_COMMIT", "").strip()` or `UNKNOWN_BUILD_COMMIT` when that is empty.
  - Add `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`, read per call like `database_url` and `cors_origins`. This follows the settings module's existing invariant (`coding_standards.md` Section 5): every environment-varying value is read from the environment with a documented default, and the default lives only here.
- Service layer (`backend/app/services/version_service.py`):
  - Add `BUILD_COMMIT_LENGTH = 12`.
  - Add `get_build_commit() -> str`: returns `get_settings().build_commit[:BUILD_COMMIT_LENGTH]`. Settings are read on every call, never cached at import, so a monkeypatched environment is seen by the session-scoped test client.
  - Update the module docstring to mention the commit lookup, keeping `get_app_version()` unchanged.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str` with a one-line docstring for the field's meaning (short build commit, or `"unknown"`).
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`; update the module docstring to reference TEST-09.
- Repository layer: none. Migrations: none.
- Run configuration:
  - `docker-compose.yml`, `backend.environment`: add `BUILD_COMMIT: ${BUILD_COMMIT:-}`. The empty default is deliberate: the `"unknown"` fallback lives in `config.py` only, so compose never names it a second time ("one value, one source").
  - `.env.example`: add a commented `BUILD_COMMIT=` line explaining it is optional, set by the build (CI passes the full 40-character sha), and that the API reports the first 12 characters, or `unknown` when unset.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, shape `VersionResponse`:
  - With `BUILD_COMMIT=3f9a2c1b7d4e5f60718293a4b5c6d7e8f9a0b1c2`: `{"version": "0.1.0", "commit": "3f9a2c1b7d4e"}`
  - With `BUILD_COMMIT=abc1234` (12 characters or fewer): `{"version": "0.1.0", "commit": "abc1234"}`
  - With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`
  - (`version` is the installed `task-notes-backend` distribution version, unchanged from TEST-05; `0.1.0` is illustrative.)
- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- Build-commit source: chose the standard library `os.environ` read inside the existing `Settings` dataclass over adding `pydantic-settings` (a new dependency) or a Docker build-arg baked into the image, because the settings module already reads `DATABASE_URL` and `CORS_ORIGINS` this way and a few lines cover it.
- Truncation to 12 characters: chose a plain string slice in the service over a validator or a `git` call, because the standard library covers it in one expression.
- No other net-new component, module or dependency: every application file touched already exists from TEST-05, and no package is added, so no lockfile changes.

## File Manifest
### New files
No new application files: the version slice already exists from TEST-05. The only new files are the UAT artifacts below.
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the over-12-characters edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-09/uat_script.md: build-feature Section 14 step 3 copy of the manual UAT script.

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and `Settings.build_commit` (per-call read of `BUILD_COMMIT`, blank treated as unset).
- [B] backend/app/services/version_service.py: add `BUILD_COMMIT_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`.
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service.
- [B] .env.example: document the optional `BUILD_COMMIT` variable.
- [B] backend/tests/unit/test_config_unit.py: `Settings.build_commit` set, unset and blank cases.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` truncation, short-value and unknown cases.
- [B] backend/tests/integration/test_version_integration.py: update existing body assertions to include `commit`, add set (40-char sha to 12) and unset (`unknown`) request cycles.

No lockfile changes: no dependency is added or removed.
No README.md or docs/DEVELOPMENT.md edit: README.md's `.env.example` line already names the optional `BUILD_COMMIT`, and the project structure, dependencies and test infrastructure are unchanged.
`backend/app/main.py` is deliberately absent: the version router is already registered.

## Testing Strategy
- Unit tests (service and config layer, environment mocked with `monkeypatch`):
  - `test_config_unit.py`: `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset` (parametrized over `""` and `"   "`).
  - `test_version_service_unit.py`: `test_get_build_commit_truncates_full_sha_to_first_12_characters` (40-char sha in, first 12 out), `test_get_build_commit_returns_short_value_unchanged` (`abc1234`, and an exactly-12-character value), `test_get_build_commit_returns_unknown_when_unset`. Existing `get_app_version` tests unchanged.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests (real HTTP request/response cycle through `TestClient`; no database involved):
  - Update `test_get_version_returns_200_with_version_from_pyproject` and `test_get_version_answers_when_database_url_is_unset` to `monkeypatch.delenv("BUILD_COMMIT", raising=False)` and assert `{"version": <pyproject version>, "commit": "unknown"}`.
  - Add `test_get_version_returns_first_12_characters_of_build_commit_when_set` (set a 40-char sha, assert `commit` equals its first 12 characters and the response validates against both keys only).
  - Add `test_get_version_returns_unknown_commit_when_build_commit_unset`.
  - Keep `test_post_version_returns_405_method_not_allowed`.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No acceptance criterion involves navigation or interaction through the UI; TEST-09 is backend only, so no spec under e2e/tests/ is written.
- UAT scenarios: Gherkin for each criterion plus the over-12-characters edge case, request-level (Given the backend runs with BUILD_COMMIT ..., When a client requests GET /api/version, Then ...).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router request/response behaviour, checked through `TestClient`. |
| 2 | `commit` comes from one declared source (`BUILD_COMMIT`, default `unknown`, first 12 characters when longer) | Unit | Verifying it needs no navigation or interaction: it is settings resolution and a service rule, checked by `test_config_unit.py` and `test_version_service_unit.py`; the integration set/unset cases confirm the wiring end to end. |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the router's `response_model=VersionResponse` shapes the body, and the integration tests assert the exact key set. |
| 4 | Unit and integration tests cover set and unset commit paths | Unit | Verifying it needs no navigation or interaction: it is satisfied by the named unit and integration tests existing and passing (`0 failed`). |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 when longer | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When a client requests GET /api/version, Then commit is its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the body has exactly the keys version and commit |
| 4 | Tests cover set and unset paths | covered at Unit, see Criterion coverage | Given the repository, When the backend unit and integration version tests run, Then 0 failed |

## Manual verification plan
TEST-09 has no UI: every check below is made against the running backend with `curl` (or a browser address bar) on http://localhost:8010.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is running with `docker compose up -d --build` from the repository root, with no `BUILD_COMMIT` in your shell or `.env`.
1. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is a JSON object with exactly two keys, `version` (for example `"0.1.0"`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer
Prerequisites: the stack from Criterion 1 is running.
1. With no `BUILD_COMMIT` set, run `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
2. Restart the backend with a full sha: `BUILD_COMMIT=3f9a2c1b7d4e5f60718293a4b5c6d7e8f9a0b1c2 docker compose up -d backend` → the backend container is recreated.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `"3f9a2c1b7d4e"` (exactly the first 12 characters).
4. Restart with a short value: `BUILD_COMMIT=abc1234 docker compose up -d backend`, then run the same `curl` → `commit` is `"abc1234"`, unchanged.
5. Restart with a blank value: `BUILD_COMMIT= docker compose up -d backend`, then run the same `curl` → `commit` is `"unknown"`.
6. Open `backend/app/routers/version.py` → it contains no commit literal; the value comes from `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: none.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open http://localhost:8010/docs and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the two string fields `version` and `commit`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL instance reachable through `DATABASE_URL` (the conftest needs it for the integration tier), for example the compose `db` on port 5442.
1. Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the run ends with `0 failed`.
2. In those files, find the set path (`test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_version_returns_first_12_characters_of_build_commit_when_set`) and the unset path (`test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_unknown_commit_when_build_commit_unset`) → all four are present and were part of the run in step 1.
