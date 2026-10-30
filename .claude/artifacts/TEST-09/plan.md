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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable set at build time, default `"unknown"`), never a string typed into the router. When `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12 (tracker comment, overrides the description).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: folded into criterion 2. The truncation lives in the service layer (`get_build_commit()` in `backend/app/services/version_service.py`), not in the router and not in settings, so settings hold the raw declared value and the business rule is unit-testable on its own. Unit tests cover a 40-character sha (returns 12), a value of exactly 12 (unchanged) and a shorter value (unchanged); the integration test sets a 40-character sha and asserts the 12-character prefix. Assumption recorded: the comment names the variable `BUILD_COMMIT`, so that is the one declared source; a blank or whitespace-only value is treated as unset and reports `unknown` (matches what `docs/DEVELOPMENT.md` already documents for this endpoint).
- Assumption (no comment): the feature notes say this item "registers a router in `backend/app/main.py`", but the `/api/version` router already exists and is already registered there (TEST-05, `backend/app/main.py` line 54). This plan therefore extends the existing router and does **not** modify `backend/app/main.py`, which keeps the change minimal (CLAUDE.md Architecture Notes) and removes the `main.py` overlap with BUG-01 (wave 3, server_time router) and TEST-13.

## Plan Overview
Backend only. Extend the existing `GET /api/version` endpoint (TEST-05) with a `commit` field:
- `backend/app/core/config.py` gains a `build_commit` setting read per call from the `BUILD_COMMIT` environment variable, default `"unknown"` when unset or blank. This is the single declared source.
- `backend/app/services/version_service.py` gains `get_build_commit()`, which reads the setting and returns at most its first 12 characters.
- `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`.
- `backend/app/routers/version.py` passes `commit=get_build_commit()`; no literal commit string anywhere in the router.
- `docker-compose.yml` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` through to the backend service, and `.env.example` documents the optional variable. Both are what `docs/DEVELOPMENT.md` and `README.md` already describe, so the docs become true rather than needing an edit.
- No database, no migration, no frontend change, no new dependency, no change to `backend/app/main.py`.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item).

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response extended with `commit`. No new route; the router stays registered in `backend/app/main.py` unchanged.
- Settings (`backend/app/core/config.py`): add `build_commit: str = field(default_factory=_read_build_commit)` to the frozen `Settings` dataclass, with a module constant `DEFAULT_BUILD_COMMIT = "unknown"` and a helper `_read_build_commit()` returning `os.environ.get("BUILD_COMMIT", "").strip() or DEFAULT_BUILD_COMMIT`. Read per call via `default_factory`, matching `database_url` and `cors_origins` in the same module, so every environment-varying value in this settings module is configured the same way with a documented default (the settings invariant in coding_standards.md).
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str` returning `get_settings().build_commit[:COMMIT_LENGTH]`. The `unknown` default is 7 characters, so the slice leaves it unchanged. `get_app_version()` is untouched.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `VersionResponse` in `backend/app/schemas/version.py`:

```json
{"version": "0.1.0", "commit": "3f9c2a1b7d4e"}
```

  With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

  Field rules: `version` unchanged from TEST-05 (installed distribution metadata, sentinel `unknown`); `commit` is the first 12 characters of `BUILD_COMMIT`, the whole value when it is 12 characters or fewer, or `unknown` when unset or blank.
- Errors: `POST /api/version` stays 405 (existing behaviour, unchanged).

## Technology Selection
- Build-commit setting: chose the standard library `os.environ` read inside the existing `Settings` dataclass over adding `pydantic-settings` or reading `git` at runtime, because the module already reads every environment value this way and a runtime `git` call would fail inside the image, which carries no `.git`.
- Commit truncation: chose a plain string slice (`[:12]`) over any helper or dependency; no alternative is needed.
- No net-new dependency, module or component: every change extends an existing file, so no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per criterion plus the 12-character truncation edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()` (first 12 characters of the setting)
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`
- [B] docker-compose.yml: backend service environment gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (pass-through, as `docs/DEVELOPMENT.md` already documents)
- [B] .env.example: document the optional `BUILD_COMMIT` variable (commented, blank by default)
- [B] backend/tests/unit/test_config_unit.py: `build_commit` reads `BUILD_COMMIT`, defaults to `unknown` when unset and when blank
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set path (40-character sha returns 12, 12 returns 12, short value unchanged) and unset path (`unknown`)
- [B] backend/tests/integration/test_version_integration.py: update the two existing body assertions for the new `commit` field; add set-path (40-character sha returns its 12-character prefix) and unset-path (`unknown`) request/response tests

No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` edit is expected: `README.md` line 70 already lists the optional `BUILD_COMMIT` in `.env.example`, and `docs/DEVELOPMENT.md` already documents the variable, the compose pass-through, the 12-character rule and the `unknown` default; this item makes that text true rather than changing it. No E2E spec: no criterion needs the browser (see Criterion coverage).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank or whitespace-only) and `version_service.get_build_commit()` (40-character value truncated to 12, exactly 12 unchanged, shorter unchanged, unset returns `unknown`). Environment via `monkeypatch.setenv` and `monkeypatch.delenv`; the service test may monkeypatch `get_settings` in `version_service`. Existing `get_app_version()` tests unchanged.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: real HTTP request/response cycle through `TestClient` on `create_app()`: `GET /api/version` with `BUILD_COMMIT` set to a 40-character sha returns 200 and `commit` equal to its first 12 characters; with `BUILD_COMMIT` unset returns `commit: "unknown"`; the two existing tests assert the full body including `commit`; the existing 405 test stays. No database is involved (the existing DATABASE_URL-unset test stays).
  - Directory: backend/tests/integration/
- E2E tests: none warranted. E2E is ENABLED, but no criterion involves navigation or interaction through the UI (backend only; the frontend footer that displays the commit is TEST-10's), so testing_standards.md Section 6's fourth question is answered no for every criterion.
  - Directory: e2e/tests/ (no file for this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, validated for well-formedness only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked through a real HTTP cycle |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters when longer), never a router literal | Unit and Integration | Verifying it needs no navigation or interaction: it is settings resolution and a service rule (unit), plus the set and unset values on the wire (integration) |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the exact body equality in the router tests is produced by `response_model=VersionResponse`; the schema's location is a review check |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | Verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests themselves running with 0 failed |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit is its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When GET /api/version, Then the body has exactly the fields version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the repository, When the backend unit and integration version tests run, Then 0 failed |

## Manual verification plan
This item is backend only and has no screen; every criterion is verified against the API with `curl` (or a browser tab opened on the URL) and, for criterion 4, by running the tests.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: the stack is up with `BUILD_COMMIT` exported: run `BUILD_COMMIT=3f9c2a1b7d4e5f60718293a4b5c6d7e8f9012345 docker compose up -d --build` from the repository root and wait until the backend container is running.
1. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is `{"version":"0.1.0","commit":"3f9c2a1b7d4e"}` (the `version` value is whatever `[project].version` in `backend/pyproject.toml` says), with exactly the two keys `version` and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: as for criterion 1.
1. With the stack started as above (40-character `BUILD_COMMIT`), run `curl -s http://localhost:8010/api/version` → `commit` is `3f9c2a1b7d4e`, the first 12 characters of the value passed in, not all 40.
2. Restart with a short value: `BUILD_COMMIT=abc123 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc123`, unchanged.
3. Restart with the variable unset: `docker compose up -d backend` from a shell where `BUILD_COMMIT` is not exported and `.env` does not set it, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
4. Open `backend/app/routers/version.py` → the router contains no commit string literal; the value comes from `get_build_commit()` in `backend/app/services/version_service.py`, which reads `build_commit` from `backend/app/core/config.py`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: none beyond a checkout of the branch.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `backend/app/routers/version.py` → the route is declared with `response_model=VersionResponse` and returns a `VersionResponse`.
3. Open `http://localhost:8010/docs` in a browser with the stack running, expand `GET /api/version` → the 200 response schema shows `VersionResponse` with the two string fields `version` and `commit`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary reports `0 failed`.
2. Read the test names in those three files → there is at least one test for a set `BUILD_COMMIT` (including the 40-character truncation) and one for an unset `BUILD_COMMIT` (`unknown`) at both the unit and the integration level.
