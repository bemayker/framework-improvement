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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification: when `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 characters.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service truncates the configured value to its first 12 characters (`BUILD_COMMIT_LENGTH = 12` in `version_service.py`); a value of 12 characters or fewer is returned unchanged. Folded into criterion 2 and covered by `test_get_build_commit_truncates_full_sha_to_first_12_characters` (unit) and `test_get_version_reports_first_12_characters_of_build_commit_when_set` (integration, with a 40-character sha). Assumption recorded: truncation applies to the stripped value, and the `"unknown"` default (7 characters) is unaffected by it.
- Assumption (no comment, recorded per `user_story_alignment.md` Section 4): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and reports `"unknown"`, because docker-compose passes the variable through as an empty string when the host does not set it. The name `BUILD_COMMIT` is taken from the tracker comment, which already names it.
- Base state: this is a first plan against base `49c5d32d`, which reset the earlier TEST-09 code. `GET /api/version` exists today from TEST-05 and returns `{"version": ...}` only; the version router is already registered in `backend/app/main.py`.

## Plan Overview
Backend only. Extend the existing TEST-05 version slice so `GET /api/version` also reports `commit`:
- `backend/app/core/config.py` declares `Settings.build_commit`, read per call from the `BUILD_COMMIT` environment variable with the documented default `"unknown"` (blank counts as unset). This is the one declared source.
- `backend/app/services/version_service.py` gains `get_build_commit()`, which reads that setting and returns its first 12 characters.
- `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`.
- `backend/app/routers/version.py` returns both fields from the service; it holds no literal.
- `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container and `.env.example` documents it (the README already describes `.env.example` as carrying an optional `BUILD_COMMIT`).

**`backend/app/main.py` is NOT modified**: the version router is already registered there (`app.include_router(version_router)`). This removes the overlap with BUG-01, which registers a server_time router in that file, so the two builds need not serialize on it.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05) extended to return `{"version": str, "commit": str}`. No new endpoint, no new router registration.
- Config (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a helper `_read_build_commit()` returning `os.environ.get("BUILD_COMMIT", "").strip() or DEFAULT_BUILD_COMMIT`; add field `build_commit: str = field(default_factory=_read_build_commit)` on `Settings`, with a one-line comment that it is set at build time and read per call. This follows the module's existing per-call environment pattern (`database_url`, `cors_origins`), which keeps the settings module consistent per `coding_standards.md` Section 5.
- Service layer (`backend/app/services/version_service.py`): add `BUILD_COMMIT_LENGTH = 12` and `get_build_commit() -> str` returning `get_settings().build_commit[:BUILD_COMMIT_LENGTH]`, with a docstring naming the tracker clarification (CI passes a full 40-character sha). Update the module docstring to name TEST-09. `get_app_version()` is unchanged.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gets `commit: str` alongside `version: str`; docstrings updated.
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`; module docstring names TEST-09.
- Deployment config: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (empty passthrough, so the `"unknown"` default lives only in `config.py`: one value, one source per `coding_standards.md` Section 5). `.env.example` gains a commented `BUILD_COMMIT=` entry explaining CI sets it to the full sha at build time and the API reports its first 12 characters.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "49c5d32dbdfb"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

Additive change: the existing `version` key is unchanged, so any client reading only `version` (TEST-08's footer, planning concurrently) is unaffected.

## Technology Selection
- Build-commit setting: chose `os.environ.get` inside the existing `Settings` dataclass (standard library, rung 1) over adding `pydantic-settings`, which `backend/pyproject.toml` does not install; the module already reads every other deployment value this way.
- Truncation to 12 characters: chose a plain string slice (standard library, rung 1); no alternative module is needed.
- Response schema field: extends the existing Pydantic `VersionResponse` (installed dependency, rung 3) rather than a new schema.
- No net-new dependency, component or module is introduced; the only new file is a unit test module.

## File Manifest
### New files
- [B] backend/tests/unit/test_version_schema_unit.py: unit test that `VersionResponse` requires both `version` and `commit` as strings (criterion 3).
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (blank `BUILD_COMMIT`).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: add `BUILD_COMMIT_LENGTH` and `get_build_commit()` (first 12 characters of the setting).
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: return `commit` from `get_build_commit()` alongside `version`.
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` into the backend service environment.
- [B] .env.example: document the optional `BUILD_COMMIT` variable.
- [B] backend/tests/unit/test_config_unit.py: tests for `build_commit` set, unset and blank.
- [B] backend/tests/unit/test_version_service_unit.py: tests for `get_build_commit()` truncation, short value and unset default.
- [B] backend/tests/integration/test_version_integration.py: update the existing assertions to the two-key body and add the set and unset commit request cycles.

`backend/app/main.py` is deliberately not listed: the version router is already registered. No dependency changes, so no lockfile entry. No `[Docs]` entry: `README.md` already describes `.env.example` as carrying an optional `BUILD_COMMIT`, which this change makes true, and `docs/DEVELOPMENT.md` points to `.env.example` for environment keys rather than listing them, so neither needs an edit.

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank) in the config module; `get_build_commit()` truncation, short value, unset default in the service layer, with `get_settings` monkeypatched or `BUILD_COMMIT` set via `monkeypatch.setenv`; `VersionResponse` field contract.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: real HTTP request/response cycle through `create_app()` with `BUILD_COMMIT` set to a 40-character sha and unset; existing TEST-05 tests updated to the two-key body; the existing 405 error case stays.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. No criterion involves navigation or interaction through the UI (backend-only; see Criterion coverage), so per `testing_standards.md` Section 6 no E2E spec is warranted and no `[D]` entry exists.
  - Directory: e2e/tests/
  - File: none
- UAT scenarios: one per criterion plus an edge case (blank `BUILD_COMMIT` reports `"unknown"`).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_and_commit_keys`, `test_get_version_answers_when_database_url_is_unset` | Verifying it needs no navigation or interaction: it is a router response shape, checked by a real HTTP cycle. |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters), never a router literal | Unit | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_returns_short_value_unchanged` | Verifying it needs no navigation or interaction: it is configuration resolution and a service rule; the integration set-path test below also proves the value varies with the environment, so no literal can satisfy it. |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_version_response_requires_version_and_commit_strings` | Verifying it needs no navigation or interaction: it is a schema contract. |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_reports_first_12_characters_of_build_commit_when_set`, `test_get_version_reports_unknown_commit_when_build_commit_unset`, `test_get_build_commit_returns_unknown_when_unset` | Verifying it needs no navigation or interaction: the criterion names the unit and integration tiers itself. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/version, Then the status is 200 and the body has string keys version and commit |
| 2 | `commit` from `BUILD_COMMIT`, first 12 characters, default `"unknown"` | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit equals its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend source, When reading backend/app/schemas/version.py, Then VersionResponse declares version and commit as str |
| 4 | Set and unset paths tested | covered at Integration, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then they pass |

## Manual verification plan
This item has no UI: every check below is an HTTP request or a test run from a terminal at the repository root.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: backend dependencies installed (`uv sync --directory backend`); no database is needed for this endpoint.
1. Start the backend with no commit set: `uv run --directory backend uvicorn app.main:app --port 8010` → the log shows `Uvicorn running on http://127.0.0.1:8010` (a warning that DATABASE_URL is not set is expected and harmless).
2. In a second terminal run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is `{"version":"0.1.0","commit":"unknown"}`.
3. Stop the server with Ctrl+C.

### Criterion 2: `commit` comes from `BUILD_COMMIT` (first 12 characters, default `"unknown"`), never a router literal
Prerequisites: as for criterion 1, server stopped.
1. Start the backend with a full sha: `BUILD_COMMIT=49c5d32dbdfb9ac66826decc406cf33bdfe68f13 uv run --directory backend uvicorn app.main:app --port 8010` → server starts.
2. Run `curl -s http://localhost:8010/api/version` → body is `{"version":"0.1.0","commit":"49c5d32dbdfb"}` (exactly the first 12 characters).
3. Stop the server, restart it with `BUILD_COMMIT=abc1234` in front of the same command, and repeat the curl → `commit` is `abc1234` (a short value is returned unchanged).
4. Stop the server, restart it with `BUILD_COMMIT=` (blank) in front of the same command, and repeat the curl → `commit` is `unknown`.
5. Open `backend/app/routers/version.py` → the handler passes `get_build_commit()` and contains no quoted commit or `"unknown"` literal.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: none.
1. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser while the server runs, expand `GET /api/version` → the 200 response schema is `VersionResponse` with both `version` and `commit` as strings.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: backend dependencies installed.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_schema_unit.py tests/integration/test_version_integration.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. In the output (add `-v` to the same command) find `test_get_version_reports_first_12_characters_of_build_commit_when_set` and `test_get_version_reports_unknown_commit_when_build_commit_unset` → both are listed as PASSED.
