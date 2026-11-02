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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, default `"unknown"`), never a string typed into the router. Per the tracker clarification: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: criterion 2 now carries the truncation rule; `version_service.get_build_commit()` returns `settings.build_commit[:12]` (constant `SHORT_COMMIT_LENGTH = 12`); unit and integration tests pass a 40-character sha and assert the 12-character prefix, and a value of 12 characters or fewer is returned unchanged.
- Assumption (no comment covers it): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and reports `"unknown"`, matching how `CORS_ORIGINS` treats a blank value in `backend/app/core/config.py` and what `docs/DEVELOPMENT.md` already states. Leading and trailing whitespace is stripped before truncation.
- Assumption (feature Notes vs code): the Notes say this item "registers a router in `backend/app/main.py`". On main as of plan base 13925e1, `main.py` already imports and includes `version_router` (TEST-05), so the existing router is extended and `main.py` is NOT touched. This removes the `main.py` overlap with BUG-01 flagged in `feature_map.md`.
- Merged since the last plan: n/a (fresh plan, no `[merged-since]` lines in the dispatch).

## Plan Overview
Extend the existing TEST-05 version slice with a `commit` field. The value is read from the `BUILD_COMMIT` environment variable in the one settings module (`backend/app/core/config.py`), defaulting to `"unknown"`; the service layer truncates it to 12 characters; the router builds the existing `VersionResponse` schema with the extra field. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container so a CI or image build that sets it reaches the running app. Backend only; no database, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. No new route, no change to `main.py`.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank. Add `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`, read per call like `database_url` and `cors_origins` so tests that change the variable after import see the change. This is the single declared source (criterion 2); the default lives here and nowhere else.
- Service layer (`backend/app/services/version_service.py`): add `SHORT_COMMIT_LENGTH = 12` and `get_build_commit() -> str` returning `get_settings().build_commit[:SHORT_COMMIT_LENGTH]`. `get_settings()` is called per invocation, not cached, so the value always reflects the environment.
- Router: `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string in the router.
- Schema (`backend/app/schemas/version.py`): add `commit: str` to `VersionResponse` (criterion 3).
- Run configuration (`docker-compose.yml`): backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`, so a value exported by CI or the shell when the stack is built and started reaches the container, and a blank pass-through falls back to `"unknown"` in `config.py`. No default is written in compose (one value, one source).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: none
- Response: 200, `application/json`, schema `VersionResponse`

```json
{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

- Errors: `POST /api/version` stays 405 (existing behaviour). The endpoint never returns 500 for a missing commit.
- Compatibility: additive field; the frontend footer (`frontend/src/components/AppFooter.tsx`) reads `version` only and is unaffected.

## Technology Selection
- Commit source: chose the standard library `os.environ` read inside the existing `Settings` dataclass over adding `pydantic-settings` or a build-info file, because `config.py` already reads `DATABASE_URL` and `CORS_ORIGINS` this way and one more field needs no dependency.
- Truncation: chose a string slice over a git call or a library, because the sha arrives as a string and a slice covers it.
- No new module and no new dependency are introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit`
- [B] backend/app/services/version_service.py: `SHORT_COMMIT_LENGTH`, `get_build_commit()`
- [B] backend/app/schemas/version.py: `commit: str` on `VersionResponse`
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()`
- [B] docker-compose.yml: backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset and blank cases
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` truncation, short value, unset cases
- [B] backend/tests/integration/test_version_integration.py: existing exact-body assertions gain `commit`; new set (40-char sha) and unset cases

No dependency changes, so no lockfile is regenerated. `docs/DEVELOPMENT.md` already documents `BUILD_COMMIT` (the paragraph beginning "`BUILD_COMMIT` sets the commit `GET /api/version` reports"), and it matches this plan's behaviour exactly, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit; the builder confirms that paragraph still matches the built code and edits it only if it does not.

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank, whitespace stripped) and `get_build_commit()` (40-char sha truncated to 12, 7-char value unchanged, unset gives `unknown`) with `monkeypatch` on the environment; no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing `test_config_unit.py` and `test_version_service_unit.py` are extended)
- Integration tests: `GET /api/version` through `TestClient`: with `BUILD_COMMIT` set to a 40-character sha the body is `{"version": <pyproject version>, "commit": <first 12>}`; with it unset the commit is `unknown`; the two existing tests that assert the exact body are updated to include `commit`; POST stays 405. Use `monkeypatch.setenv`/`delenv` with the existing session `client` fixture, which works because settings are read per request. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E is ENABLED in `CLAUDE.md`, but no criterion involves navigation or interaction through the UI (backend only, no UI change), so no spec is written.
  - Directory: e2e/tests/
  - File: none (would be TEST-09_version_build_commit.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (blank `BUILD_COMMIT` reports `unknown`), API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` | Integration | verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | Unit | verifying it needs no navigation or interaction: it is configuration resolution and a truncation rule (also exercised end to end by the integration set/unset tests) |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the router's `response_model=VersionResponse` shapes the HTTP body the integration test asserts exactly |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests named above existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit equals its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When GET /api/version, Then the body has exactly the keys version and commit |
| 4 | Tests cover set and unset paths | covered at Unit, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
This item has no UI: every criterion is verified against the HTTP response, with `curl` from a terminal at the repository root.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
Prerequisites: port 8010 is free; no `BUILD_COMMIT` exported in the shell.
1. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:app --port 8010` → the log shows `Uvicorn running on http://127.0.0.1:8010` (a `DATABASE_URL is not set` warning is expected and harmless).
2. In a second terminal run `curl -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK` and body `{"version":"0.1.0","commit":"0123456789ab"}` (the version is whatever `backend/pyproject.toml` `[project].version` holds).

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: the server from Criterion 1 is stopped (Ctrl+C).
1. Start the server as in Criterion 1 step 1 with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`, then `curl http://localhost:8010/api/version` → `"commit":"0123456789ab"` (12 characters, not 40).
2. Stop it, start it with `BUILD_COMMIT=abc1234` instead, and repeat the curl → `"commit":"abc1234"` (shorter values are unchanged).
3. Stop it, start it with no `BUILD_COMMIT` at all (`uv run --directory backend uvicorn app.main:app --port 8010`), and repeat the curl → `"commit":"unknown"`.
4. Stop it, start it with `BUILD_COMMIT=` (empty), and repeat the curl → `"commit":"unknown"`.
5. Run `grep -n "commit" backend/app/routers/version.py` → the only match is the call `commit=get_build_commit()`; no quoted sha or `"unknown"` literal appears in the router.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `backend/app/routers/version.py` → the route is declared with `response_model=VersionResponse` and returns a `VersionResponse`.
3. With the server running, `curl http://localhost:8010/openapi.json` and look under `components.schemas.VersionResponse` → `required` lists `version` and `commit`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → `0 failed`.
2. Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` → each contains a test that sets `BUILD_COMMIT` (to a 40-character sha, asserting the 12-character prefix) and one that deletes it (asserting `unknown`).
