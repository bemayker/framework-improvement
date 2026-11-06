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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router; when the value is longer than 12 characters only its first 12 are returned (tracker comment, below).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service function `get_build_commit()` returns `BUILD_COMMIT[:12]`; criterion 2 above carries the rule; unit and integration tests pass a full 40-character sha and assert the 12-character prefix, and a value of 12 characters or fewer is returned unchanged.
- Description note "Registers a router in `backend/app/main.py`" → not acted on: the `/api/version` router already exists (`backend/app/routers/version.py`, registered in `main.py` by TEST-05), so this plan extends that router's response in place and does not touch `backend/app/main.py`. This also keeps TEST-09 disjoint from BUG-01, which registers a server_time router in `main.py` concurrently (dispatch scheduling note, `feature_map.md` row).
- Assumption (ambiguity, not blocking): a blank or whitespace-only `BUILD_COMMIT` is treated as unset and reports `"unknown"`, matching how `CORS_ORIGINS` treats a blank value in `backend/app/core/config.py` and how `docs/DEVELOPMENT.md` already describes this variable. Surrounding whitespace is stripped before truncation.
- Assumption: "set at build time" is satisfied by the deployment passing `BUILD_COMMIT` into the backend container's environment (`docker-compose.yml` → `backend.environment`, `${BUILD_COMMIT:-}`), read through the existing settings module, the same mechanism as `CORS_ORIGINS`. No Dockerfile `ARG` and no CI workflow change are added: no criterion requires CI to set it, and the default `"unknown"` keeps every existing run working.
- Merged since the last plan: n/a (fresh plan, no `[merged-since]` lines in the dispatch; plan base 27689b4).

## Plan Overview
Extend the existing `GET /api/version` endpoint (TEST-05) with a `commit` field. The value is declared once in the settings module (`Settings.build_commit`, read per call from `BUILD_COMMIT`, default `"unknown"`), resolved and truncated to 12 characters in the version service, and returned through the existing `VersionResponse` Pydantic schema. `docker-compose.yml` passes the variable through to the backend container. Backend only; no frontend, no database, no new route, no change to `backend/app/main.py`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. The router builds `VersionResponse(version=get_app_version(), commit=get_build_commit())`; it contains no commit literal.
- Service layer: `backend/app/services/version_service.py` gains `get_build_commit() -> str`, which reads `get_settings().build_commit` and returns its first 12 characters (`COMMIT_LENGTH = 12` module constant). The settings default already supplies `"unknown"`, which is shorter than 12, so it passes through unchanged.
- Settings: `backend/app/core/config.py` gains `DEFAULT_BUILD_COMMIT = "unknown"` and a `build_commit: str` field with a `default_factory` that reads `BUILD_COMMIT`, strips it, and falls back to `DEFAULT_BUILD_COMMIT` when unset or blank. Read per call, like `database_url` and `cors_origins`, so the settings invariant (every environment-varying value read from the environment with a documented default) holds.
- Schema: `backend/app/schemas/version.py` → `VersionResponse` gains `commit: str`.
- Deployment: `docker-compose.yml` → `backend.environment` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (blank passes through, the settings default applies).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "1a2b3c4d5e6f"}
```

  With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

  `version` is unchanged from TEST-05 (installed package metadata, `"unknown"` sentinel). `commit` is at most 12 characters. `POST /api/version` remains 405.

## Technology Selection
- `BUILD_COMMIT` read: chose `os.environ.get` inside the existing `Settings` dataclass `default_factory` (stdlib) over adding `pydantic-settings` or `python-dotenv`, because the settings module already reads every other environment value this way.
- 12-character truncation: chose a stdlib string slice over any helper or dependency; no alternative is needed.
- `commit` schema field: chose the existing `pydantic` `BaseModel` already installed and used by `VersionResponse`; no new dependency.
- No net-new module or dependency is introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (40-character sha truncated to 12, blank value reports unknown).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT` and the `build_commit` settings field read per call from `BUILD_COMMIT` (blank or unset falls back to the default).
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()` returning the first 12 characters of the configured commit.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`.
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` into the backend service environment.
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset, blank and whitespace-stripped cases.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set (40-char sha to 12), exactly 12 and shorter values unchanged, unset returns `unknown`.
- [B] backend/tests/integration/test_version_integration.py: update the existing body assertions to include `commit`; add set (40-char sha returns 12) and unset (`unknown`) request cycles.

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `package-lock.json`) is regenerated.
No `README.md` or `docs/DEVELOPMENT.md` edit is expected: `docs/DEVELOPMENT.md` already documents `BUILD_COMMIT` exactly as this plan builds it (compose pass-through as `${BUILD_COMMIT:-}`, first 12 characters, `unknown` default in `backend/app/core/config.py`); the Docs check should confirm it still matches the built code.

## Testing Strategy
- Unit tests: settings resolution of `build_commit` (set, unset, blank, surrounding whitespace) and the service's `get_build_commit()` (40-character sha returns the first 12, a value of exactly 12 and a shorter value return unchanged, unset returns `unknown`). Environment controlled with `monkeypatch.setenv` / `delenv`; no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: full HTTP cycle through `TestClient` on `GET /api/version`: with `BUILD_COMMIT` set to a 40-character sha the body is `{"version": <pyproject version>, "commit": <first 12>}`; with it unset the body carries `"commit": "unknown"`; the existing DATABASE_URL-unset and POST 405 tests stay, the first updated for the new field. Settings are read per request, so `monkeypatch` on the shared `client` fixture suffices.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion involves navigation or interaction through the UI (backend-only feature; the footer that displays the commit is TEST-10's, not this item's).
  - Directory: e2e/tests/
  - File: none for this item.
- UAT scenarios: one Gherkin scenario per criterion plus the truncation and blank-value edge cases, verified against the HTTP endpoint.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with version and commit | Integration | Verifying it needs no navigation or interaction: it is a router request/response behaviour |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | Unit | Verifying it needs no navigation or interaction: it is settings resolution and a service rule, tested by setting the environment (also exercised end to end at Integration) |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the exact response body equals the schema's two fields, asserted on the HTTP cycle |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | Verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests above, set and unset paths at both tiers |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with version and commit | covered at Integration, see Criterion coverage | Given the backend is running When a client sends GET /api/version Then the status is 200 and the body has string fields version and commit |
| 2 | commit from BUILD_COMMIT, default unknown, 12 chars | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When GET /api/version Then commit is its first 12 characters; Given BUILD_COMMIT is unset Then commit is unknown |
| 3 | Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running When GET /api/version Then the body has exactly the keys version and commit |
| 4 | Tests cover set and unset paths | covered at Unit, see Criterion coverage | Given the repository When the backend unit and integration version tests run Then 0 failed |

## Manual verification plan
Not verifiable through the UI: this item is backend only (the footer that shows the commit is TEST-10). Every check below reads the HTTP response directly.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is running (`docker compose up -d --build` from the repo root), backend on `http://localhost:8010`.
1. Run `curl -s -i http://localhost:8010/api/version` → status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is a JSON object with a string `version` (the `[project].version` in `backend/pyproject.toml`, for example `0.1.0`) and a string `commit`.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters
Prerequisites: the stack is running as above.
1. Start the backend with no commit set: `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` not exported in your shell → `curl -s http://localhost:8010/api/version` shows `"commit":"unknown"`.
2. Recreate it with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --force-recreate backend` → `curl -s http://localhost:8010/api/version` shows `"commit":"0123456789ab"` (12 characters).
3. Recreate it with a blank value: `BUILD_COMMIT= docker compose up -d --force-recreate backend` → the response shows `"commit":"unknown"`.
4. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack is running as above.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with string fields `version` and `commit`.
2. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a Postgres reachable through `DATABASE_URL` for the integration tier (`docs/DEVELOPMENT.md`, Testing).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` with `DATABASE_URL` set → the summary reports 0 failed, and the run includes tests for a set `BUILD_COMMIT` and an unset one in both the unit and integration files.
