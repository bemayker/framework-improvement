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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router; when the value is longer than 12 characters only its first 12 are returned (tracker clarification, below).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service function `get_build_commit()` truncates to its first 12 characters (constant `COMMIT_DISPLAY_LENGTH = 12`); a value of 12 characters or fewer, and the `"unknown"` default, are returned unchanged. Folded into criterion 2 above, and covered by a unit test (40-char sha in, 12 out; short value unchanged) and an integration test (40-char sha in the environment, 12-char `commit` in the response). Assumption recorded: the second sentence describes the input shape, not a request to edit `.github/workflows/pr-tests.yml` (a `/sync-project`-owned workflow). This plan makes the wiring ready for it: `docker-compose.yml` forwards a `BUILD_COMMIT` from the caller's environment as a build arg, so a CI step that exports the sha gets it into the image without further code change.
- Assumption (no comment, recorded per item 4): the router registration the Notes mention already exists. `backend/app/main.py` on main @ 81e1e8f includes `version_router` (TEST-05 built `GET /api/version` returning `{"version"}`), so this item extends that endpoint and does **not** modify `main.py`. That removes the `main.py` overlap with BUG-01 the feature map flags.
- Assumption: a `BUILD_COMMIT` that is set but blank (empty or whitespace, which is what the image gets when the build arg is not supplied) is treated as unset and yields `"unknown"`, the same rule `CORS_ORIGINS` already follows in `backend/app/core/config.py`. Surrounding whitespace on a set value is stripped.

## Plan Overview
Extend the existing `GET /api/version` endpoint (TEST-05) with a `commit` field. The value has one declared source: a new `build_commit` field on `Settings` in `backend/app/core/config.py`, read per call from the `BUILD_COMMIT` environment variable with the documented default `"unknown"` (the same per-call `default_factory` shape `database_url` and `cors_origins` use, so the settings module stays consistent per `coding_standards.md` Section 5). The service layer (`version_service.get_build_commit()`) reads it through `get_settings()` and applies the 12-character truncation. The router only composes `VersionResponse(version=..., commit=...)`; it contains no commit literal. The Pydantic schema gains `commit: str`. Build-time wiring: `backend/Dockerfile` declares `ARG BUILD_COMMIT` and promotes it to `ENV BUILD_COMMIT`, and `docker-compose.yml` passes the caller's `BUILD_COMMIT` as a build arg; neither carries a default of its own, so `"unknown"` is defined in exactly one place. `.env.example` documents the variable. Backend only; no database, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. Router body becomes `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No new route, no `main.py` change.
- Configuration: `backend/app/core/config.py` adds `DEFAULT_BUILD_COMMIT = "unknown"`, a helper `_read_build_commit()` returning `os.environ.get("BUILD_COMMIT", "").strip() or DEFAULT_BUILD_COMMIT`, and the field `build_commit: str = field(default_factory=_read_build_commit)` on `Settings`. Update the module docstring's list of what it reads.
- Service layer: `backend/app/services/version_service.py` adds `COMMIT_DISPLAY_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_DISPLAY_LENGTH]`. Docstring says why it truncates (tracker clarification: CI passes a full 40-char sha, the API reports the short form). The `"unknown"` default is 7 characters, so it passes through unchanged.
- Schema: `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`; docstring mentions TEST-09.
- Build wiring: `backend/Dockerfile` adds `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=$BUILD_COMMIT` (before the final `CMD`, after the dependency layers so a new sha does not bust the `uv sync` cache). `docker-compose.yml` `backend.build` gains `args: BUILD_COMMIT: ${BUILD_COMMIT:-}` (empty when the caller sets nothing, which `Settings` maps to `"unknown"`; no second default).
- `.env.example`: add a `# --- Build ---` block with a commented `BUILD_COMMIT=` line explaining it is set at build time (CI passes the full sha; the API reports its first 12 characters; unset means `"unknown"`).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters
- Response: 200, `application/json`, schema `VersionResponse`

```json
{"version": "0.1.0", "commit": "81e1e8fa4bd7"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` keeps its TEST-05 semantics (package metadata, `"unknown"` sentinel when not installed). Other methods keep returning 405.

## Technology Selection
- `BUILD_COMMIT` read in `Settings.build_commit`: chose the standard library's `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` (not installed) or a separate config module, because the project already reads every deployment-dependent value this way and one extra field covers the need.
- Commit truncation in `get_build_commit()`: chose plain string slicing (`[:12]`) over any helper or dependency; the standard library covers it in one expression.
- Build-time injection: chose Docker's native `ARG` plus `ENV` and Compose's native `build.args` over a generated version file or a build script, because both tools already in use cover passing a value into the image.
- No net-new dependency is introduced; `backend/pyproject.toml` and `backend/uv.lock` are unchanged.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (40-char sha truncated to 12; blank value yields `"unknown"`)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit` read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: `COMMIT_DISPLAY_LENGTH = 12` and `get_build_commit()`
- [B] backend/app/schemas/version.py: `VersionResponse.commit: str`
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response
- [B] backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=$BUILD_COMMIT`
- [B] docker-compose.yml: `backend.build.args.BUILD_COMMIT: ${BUILD_COMMIT:-}`
- [B] .env.example: document `BUILD_COMMIT`
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set, unset, truncation and short-value cases
- [B] backend/tests/unit/test_config_unit.py: `Settings.build_commit` set, unset and blank cases
- [B] backend/tests/integration/test_version_integration.py: existing exact-body assertions updated for `commit`; new set-path (40-char sha in env, 12-char `commit` out) and unset-path (`"unknown"`) HTTP tests

No dependency changes, so no lockfile is regenerated (`backend/uv.lock` and `frontend/package-lock.json` untouched).
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: `README.md` line 70 already describes `.env.example` as carrying an optional `BUILD_COMMIT`, which this item makes true, and `docs/DEVELOPMENT.md` documents no per-variable application configuration; project structure, dependencies and test infrastructure are unchanged.
No E2E spec is produced: no criterion is verified through the UI (see Criterion coverage), so there is no `[D]` entry.

## Testing Strategy
- Unit tests: `version_service.get_build_commit()` with `get_settings` monkeypatched or `BUILD_COMMIT` set via `monkeypatch.setenv`: happy path (short value returned verbatim, e.g. `abc1234`), edge (40-char sha returns its first 12; exactly 12 chars unchanged), unset path (`BUILD_COMMIT` deleted returns `"unknown"`). `Settings.build_commit`: set value read per call, unset gives `DEFAULT_BUILD_COMMIT`, blank or whitespace (`""`, `"   "`) gives the default, surrounding whitespace stripped. Asserts resolution from the environment, not only the fallback literal (`coding_standards.md` Section 5).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extending the existing `test_version_service_unit.py` and `test_config_unit.py`)
- Integration tests: real HTTP cycle through `TestClient(create_app())`: `BUILD_COMMIT` set to a 40-char sha returns 200 with `commit` equal to its first 12 characters and the pyproject version; `BUILD_COMMIT` unset returns 200 with `commit == "unknown"`; the existing exact-body assertions in `test_version_integration.py` become `{"version": ..., "commit": ...}` with the commit pinned by `monkeypatch` so they do not depend on the runner's environment; the existing 405 test stays. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E Tests is ENABLED, but no criterion requires navigation or interaction through the UI (backend-only endpoint, no screen reads it in this item).
  - Directory: e2e/tests/
  - File: none produced (would be `TEST-09_version_build_commit.spec.ts`)
- UAT scenarios: one scenario per criterion plus the truncation and blank-value edge cases, API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape, asserted over a real HTTP cycle |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 chars when longer), never a router literal | Unit and Integration | Verifying it needs no navigation or interaction: env resolution and truncation are config and service logic (unit), and the set and unset values reaching the response is a router behaviour (integration) |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the route's `response_model` is `VersionResponse` and the response matches its two fields exactly, a router behaviour |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | It is a criterion about the tests themselves: satisfied by the set and unset cases in both tier files listed above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client GETs /api/version Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, 12-char cap | covered at Unit and Integration, see Criterion coverage | Given the backend was built with BUILD_COMMIT set to a 40-char sha When a client GETs /api/version Then commit equals the sha's first 12 characters; Given no BUILD_COMMIT When GET Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running When a client GETs /api/version Then the body has exactly the fields version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the repository When the version unit and integration tests run Then 0 failed |

## Manual verification plan
No criterion is verifiable through the UI: this is a backend endpoint no screen reads yet (TEST-10 adds the footer). Each block below is a terminal walkthrough against the running backend on `http://localhost:8010`.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: Docker running; from the repo root, `BUILD_COMMIT` not exported in the shell.
1. Run `docker compose up -d --build backend` → the `db` and `backend` containers start; `docker compose ps` shows `backend` up on port 8010.
2. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
3. Read the body → it is `{"version":"0.1.0","commit":"unknown"}` (the `version` value is whatever `backend/pyproject.toml` `[project].version` says); both values are strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer
Prerequisites: as Criterion 1.
1. Run `export BUILD_COMMIT=81e1e8fa4bd74ad5b468f0d1aa5a2cd63e71b393` then `docker compose up -d --build backend` → the backend image rebuilds and the container restarts.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `81e1e8fa4bd7` (exactly 12 characters, the sha's first 12).
3. Run `export BUILD_COMMIT=abc1234` then `docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (unchanged, under 12 characters).
4. Run `unset BUILD_COMMIT` then `docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
5. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running as in Criterion 1.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the two string fields `version` and `commit`.
3. Run `curl -s http://localhost:8010/api/version` → the body has exactly those two keys and no others.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` → `0 failed`; the output includes the `get_build_commit` and `build_commit` tests for the set, unset, blank and truncation cases.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`; the set-path (40-char sha in, 12 out) and unset-path (`"unknown"`) tests are among those run.
