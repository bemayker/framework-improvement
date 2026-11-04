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
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT`; the service truncates to the first 12 characters (constant `COMMIT_LENGTH = 12`); a value of 12 characters or fewer is returned unchanged; unit and integration tests cover a 40-character sha returning its 12-character prefix. Folded into criterion 2 above, since the comment overrides the description where they differ.
- Comment (tracker): 24 earlier "PR opened" notices from previous runs → not acted on because those PRs were never merged or were reverted by main 1f1df4f; the repository at 1f1df4f is treated as ground truth (dispatch note).
- Assumption (no comment covers it): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `"unknown"`, matching how `backend/app/core/config.py` already treats a blank `CORS_ORIGINS`. Surrounding whitespace on a set value is stripped before truncation.
- Repository finding: `GET /api/version` already exists on main (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`), returning `{"version": ...}` only, and the router is already registered in `backend/app/main.py`. This plan therefore extends the existing endpoint with `commit` and does NOT modify `backend/app/main.py` (the feature note's "registers a router" is already satisfied on main). This removes the main.py overlap with BUG-01.
- Repository finding: `README.md` line 70 already describes `.env.example` as carrying an "optional BUILD_COMMIT", but `.env.example` does not; adding the entry makes the README true rather than requiring a README edit.

## Plan Overview
Backend only. Extend the existing `GET /api/version` endpoint so its response carries `commit` next to `version`. The single declared source is the `BUILD_COMMIT` environment variable, read through the existing settings module (`backend/app/core/config.py`, field `build_commit`, read per call like `database_url` and `cors_origins`). The version service exposes `get_build_commit()`, which returns `"unknown"` when the variable is unset or blank and otherwise the first 12 characters. The schema gains a `commit: str` field; the router passes the service value through. Build-time wiring: `backend/Dockerfile` declares `ARG BUILD_COMMIT` and promotes it to `ENV`, `docker-compose.yml` forwards `${BUILD_COMMIT:-}` as a build arg, and `.env.example` documents it. The `"unknown"` default lives in exactly one place (`backend/app/core/config.py`); the Dockerfile and compose pass an empty value when nothing is supplied, which the settings module resolves to the default.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response extended with `commit`. No new endpoint, no new router registration.
- Settings (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank; add `build_commit: str = field(default_factory=_read_build_commit)` on `Settings`. Same per-call pattern as `cors_origins`, so the module's invariant (every environment-varying value reads the environment with a documented default) holds.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str` returning `get_settings().build_commit[:COMMIT_LENGTH]`. The sentinel `"unknown"` is shorter than 12, so it passes through unchanged. Docstring states why it truncates (the tracker clarification: CI passes a full 40-character sha).
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`.
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit value in the router.
- Repository layer: none (no data access).
- Migrations: none.
- Build-time wiring: `backend/Dockerfile` adds `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=${BUILD_COMMIT}` (no default in the Dockerfile); `docker-compose.yml` backend `build:` gains `args:` with `BUILD_COMMIT: ${BUILD_COMMIT:-}`; `.env.example` gains a commented `# BUILD_COMMIT=` entry under a `--- Backend ---` heading explaining it is optional, set at build time (CI passes the full sha), and that unset means `"unknown"`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "1f1df4f723f8"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` keeps its TEST-05 behaviour (package metadata of `task-notes-backend`, `"unknown"` when not installed). `commit` is at most 12 characters. Non-GET methods keep returning 405.

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` or a new config module, because the project's settings module already reads every environment value this way and a new dependency is not needed for one string.
- Truncation to 12 characters: chose a plain string slice over any git library or `subprocess` call to `git rev-parse --short`, because the value arrives as an environment variable and the container has no `.git`.
- Response field: chose to extend the existing Pydantic `VersionResponse` (pydantic already installed via FastAPI) over a new schema; no alternative needed.
- Build-time injection: chose Docker's native `ARG`/`ENV` and Compose `build.args` over a generated version file, because both are native platform features already in use in this stack.
- No new dependency is introduced, so no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (40-character sha truncated to 12).
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` settings field (one declared source, per-call read, blank treated as unset).
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()` truncating the settings value to 12 characters.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`.
- [B] backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=${BUILD_COMMIT}` so the value is set at image build time.
- [B] docker-compose.yml: backend `build.args` forwarding `BUILD_COMMIT: ${BUILD_COMMIT:-}`.
- [B] .env.example: document the optional `BUILD_COMMIT` variable (commented out; unset means `"unknown"`).
- [B] backend/tests/unit/test_config_unit.py: `build_commit` resolves from `BUILD_COMMIT` when set, defaults to `"unknown"` when unset, and treats blank as unset.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set (short value unchanged), 40-character value truncated to 12, unset returns `"unknown"`.
- [B] backend/tests/integration/test_version_integration.py: existing equality assertions extended with `commit` (each test pins `BUILD_COMMIT` explicitly via monkeypatch so an ambient CI value cannot break it); new tests for the set path (40-character sha returns its first 12) and the unset path (`"unknown"`).

No dependency is added, so no lockfile changes. `backend/app/main.py` is not modified: the version router is already registered there. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: README line 70 already lists the optional `BUILD_COMMIT` in `.env.example`, and the project structure, dependencies and test infrastructure are unchanged.

## Testing Strategy
- Unit tests: settings resolution of `build_commit` (set, unset, blank, whitespace stripped) and `version_service.get_build_commit()` (short value unchanged, exactly-12 value unchanged, 40-character value truncated to its first 12, unset gives `"unknown"`), with the environment controlled through `monkeypatch.setenv`/`delenv`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: full HTTP cycle through `TestClient` on `GET /api/version`: set path (`BUILD_COMMIT` = a 40-character sha, response `commit` equals its first 12 characters, `version` equals pyproject's version), unset path (`commit` is `"unknown"`), response keys are exactly `version` and `commit`; keep the existing 405 and no-DATABASE_URL tests, updated for the new field.
  - Directory: backend/tests/integration/
- E2E tests: none. No acceptance criterion involves navigation or interaction through a UI; the endpoint has no frontend surface in this item (the footer is TEST-08's).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus the truncation edge case, exercising the endpoint over HTTP.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router response shape over HTTP |
| 2 | `commit` comes from the `BUILD_COMMIT` env var, default `"unknown"`, first 12 characters when longer | Unit and Integration | verifying it needs no navigation or interaction: it is settings resolution and a service rule, plus the router round-trip with the variable set and unset |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the router declares `response_model=VersionResponse` and the integration test asserts the exact key set |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | it is a statement about the test suite itself, satisfied by the unit and integration tests listed above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string `version` and `commit` |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, truncated to 12 | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then `commit` is its first 12 characters; Given BUILD_COMMIT is unset, Then `commit` is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When GET /api/version, Then the body has exactly the keys `version` and `commit` |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the repository, When the backend unit and integration version tests run, Then 0 failed |

## Manual verification plan
This feature has no UI: every criterion is verified over HTTP or by reading code and test output. Run from the repository root with Docker running.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: `.env` copied from `.env.example`; no other service on port 8010.
1. Run `BUILD_COMMIT=1f1df4f723f8d8695ff74e774b2af1c086c9cf0e docker compose up -d --build backend` → the backend container starts (`docker compose ps` shows it running).
2. Run `curl -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK`, header `content-type: application/json`.
3. Read the body → it is `{"version":"0.1.0","commit":"1f1df4f723f8"}` (the version is whatever `backend/pyproject.toml` `[project].version` says); both values are strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer
Prerequisites: as for Criterion 1.
1. With the container from Criterion 1 step 1 running, `curl -s http://localhost:8010/api/version` → `commit` is `1f1df4f723f8`, exactly the first 12 characters of the 40-character value passed in.
2. Run `BUILD_COMMIT=abc123 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc123` (shorter than 12, unchanged).
3. Run `BUILD_COMMIT= docker compose up -d --build backend` (empty), then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
4. Open `backend/app/routers/version.py` → it contains no commit literal; the value comes from `get_build_commit()`, which reads `get_settings().build_commit`, which reads `BUILD_COMMIT` in `backend/app/core/config.py`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend running from Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with two required string fields, `version` and `commit`.
2. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL connection string in `DATABASE_URL` for the integration tier (see `docs/DEVELOPMENT.md`), or accept that the integration files skip locally without one.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → `0 failed`; the output lists the `build_commit` set, unset and blank tests and the `get_build_commit` truncation and unset tests.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` with `DATABASE_URL` set → `0 failed`; the set-path test (40-character sha returns its first 12) and the unset-path test (`"unknown"`) are among those run.
3. Run `docker compose down` → the stack stops.
