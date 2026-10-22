# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A small backend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, wave 1). Independent of TEST-08, so the first wave has two items that can run in parallel.
>
> ## What
>
> A client can ask the API which build it is talking to.
>
> ## Acceptance criteria
>
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> ## Notes
>
> Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete.
>
> Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. Amended by the tracker comment below: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: `version_service.get_build_commit()` returns the first 12 characters of the configured value (`COMMIT_LENGTH = 12`); a value of 12 characters or fewer, and the `unknown` default, are returned unchanged. Unit tests cover a 40-character sha, an exactly-12-character value and a shorter value; the integration test sets a 40-character sha and asserts the 12-character prefix. The comment's second sentence describes the input shape only: it does not ask this item to add a `BUILD_COMMIT` step to `.github/workflows/pr-tests.yml`, and no acceptance criterion does, so no CI workflow is changed (assumption recorded per `user_story_alignment.md` Section 4).
- Merged since the last plan: n/a. The dispatch states this is a fresh plan on base bb7416043dd481128848954f188f1466d06e4b36; an earlier run's merge of this item was reverted by #283, and the files read at plan time confirm none of it is on main (`VersionResponse` has only `version`, `config.py` has no `BUILD_COMMIT`).

## Plan Overview
Extend the existing `GET /api/version` endpoint (added by TEST-05) with a `commit` field. The value is read from one declared source, the `BUILD_COMMIT` environment variable, through the existing settings module `backend/app/core/config.py`, which already reads every deployment-dependent value from the environment per call (`database_url`, `cors_origins`). Unset or blank resolves to `"unknown"`. The version service exposes `get_build_commit()`, which applies the 12-character cut from the tracker comment. The router composes `VersionResponse(version=..., commit=...)` and holds no literal. The value is set at build time: `backend/Dockerfile` declares `ARG BUILD_COMMIT=unknown` and promotes it to `ENV BUILD_COMMIT`, and `docker-compose.yml` passes `${BUILD_COMMIT:-unknown}` as a build arg.

Layers: schema, settings, service, router (Router to Service, no repository: no data access). No frontend, no database, no external API.

Assumptions:
- The ticket's note says the feature "registers a router in `backend/app/main.py`". On main the version router already exists and is registered (`app.include_router(version_router)`, TEST-05), so this plan extends that router and does **not** modify `main.py`. Registering a second `/api/version` route would shadow or duplicate the first.
- "Set at build time" is implemented as a Docker build arg promoted to an environment variable. The ARG and ENV lines sit after both `uv sync` layers so a changing sha never invalidates the dependency cache layers. The compose `volumes` mount of `./backend` replaces the code at runtime, not the image environment, so the ENV value survives. Changing the value requires a rebuild (`docker compose up -d --build backend`), which is what "build time" means.
- A blank or whitespace-only `BUILD_COMMIT` is treated as unset (`"unknown"`), matching how `CORS_ORIGINS` treats a blank value in the same module. Surrounding whitespace is stripped before the 12-character cut.
- The `version` field keeps its TEST-05 behaviour unchanged.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`), response gains `commit`. No new route; `backend/app/main.py` is unchanged.
- Settings (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank, and a `build_commit: str = field(default_factory=_read_build_commit)` field on the frozen `Settings` dataclass, so it is read per call like `cors_origins` (`coding_standards.md` Section 5's invariant: every deployment-dependent value in this module reads the environment, with a documented default). Update the module docstring's list of env-read values.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. Docstring says why 12 (the tracker clarification) and that the default `unknown` passes through unchanged. `get_app_version()` is untouched.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`, documented as the first 12 characters of the build commit or `unknown`. Docstring header names TEST-09 alongside TEST-05.
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`. No string literal for the commit anywhere in the router.
- Build wiring: `backend/Dockerfile` adds `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT=${BUILD_COMMIT}` after the second `uv sync` and before `EXPOSE`. `docker-compose.yml` adds `args: BUILD_COMMIT: ${BUILD_COMMIT:-unknown}` under `backend.build` (beside the existing `x-bake` block). `.env.example` gains a commented, optional `BUILD_COMMIT=` entry explaining it is set by CI or the image build and defaults to `unknown` (README line 70 already describes `.env.example` as carrying an optional `BUILD_COMMIT`).
- Repository layer: none (no data access).
- Migrations: none.
- Self-check the builder may run: `bash ~/.mayker/mayker-dev/hooks/lib/config-consistency.sh settings backend/app/core/config.py` (exit 0 consistent, 1 violation, 2 cannot check, never a pass).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` is the installed `task-notes-backend` version (TEST-05, unchanged; the example value is illustrative). `commit` is at most 12 characters. Other methods keep returning 405.

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ.get` inside the existing `Settings` dataclass over a settings library, because the module already reads every other value this way and stdlib covers the need.
- 12-character cut: chose a stdlib string slice over any helper, because a slice covers it.
- Build-time injection: chose the native Docker `ARG` plus `ENV` and the native Compose `build.args` over a generated version file or a build script, because the platform covers it.
- No new dependency is added.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (a value exactly 12 characters long, and a blank value)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit` read per call
- [B] backend/app/services/version_service.py: `COMMIT_LENGTH = 12` and `get_build_commit()`
- [B] backend/app/schemas/version.py: `VersionResponse.commit: str`
- [B] backend/app/routers/version.py: compose the response from both service calls
- [B] backend/Dockerfile: `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT` after the dependency layers
- [B] docker-compose.yml: `backend.build.args.BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`
- [B] .env.example: optional, commented `BUILD_COMMIT` entry with its default
- [B] backend/tests/unit/test_config_unit.py: set, unset, blank and whitespace-stripped `BUILD_COMMIT` cases
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` cases (40-char sha cut to 12, exactly 12 unchanged, shorter unchanged, unset gives `unknown`)
- [B] backend/tests/integration/test_version_integration.py: existing exact-body assertions gain `commit`; new set-path and unset-path tests; OpenAPI schema check for `VersionResponse`

No dependency changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is regenerated.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: README line 70 already lists the optional `BUILD_COMMIT` in `.env.example`, and `docs/DEVELOPMENT.md` line 663 already describes this exact wiring (full sha in, first 12 characters out, `unknown` when unset); this plan makes the code match them. That paragraph's footer sentence describes TEST-10 (which depends on this item) and is TEST-10's to keep true, not this item's.

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution in `config.py` (set, unset, blank, surrounding whitespace) and `version_service.get_build_commit()` (40-character sha returns its first 12, a 12-character value unchanged, a 7-character value unchanged, unset returns `unknown`). Environment changed with `monkeypatch.setenv` / `monkeypatch.delenv`; no mocks of the settings module needed because it reads per call.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: real HTTP cycle through the session `client` fixture (settings are read per request, so `monkeypatch` on the environment takes effect without a new app). Set path: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` gives `{"version": <pyproject version>, "commit": "0123456789ab"}`. Unset path: `BUILD_COMMIT` deleted gives `"commit": "unknown"`. The two existing exact-body tests are updated to include `commit` with `BUILD_COMMIT` deleted first, so they do not depend on the runner's environment. The 405 test stays. A schema test reads `/openapi.json` and asserts `components.schemas.VersionResponse` has `version` and `commit`, both `string`, both required.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI; the feature is backend only (`testing_standards.md` Section 6, fourth question, answered no for every criterion below).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus an edge-case scenario (exactly 12 characters, and blank), validated for well-formedness in CI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, cut to 12 characters | Unit and Integration | verifying it needs no navigation or interaction: it is settings resolution and service logic, plus the env-to-response wiring through the router |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the OpenAPI document exposes the registered response model |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests named above existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 | covered at Unit and Integration, see Criterion coverage | Given the image was built with BUILD_COMMIT set to a 40-character sha, When GET /api/version, Then commit is the sha's first 12 characters; Given it was built without BUILD_COMMIT, Then commit is unknown |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads /openapi.json, Then VersionResponse lists version and commit as required strings |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the repository, When the version unit and integration tests run, Then 0 fail |

## Manual verification plan
This feature has no UI. Every criterion is verified against the running API with `curl`, and through the test suite. Run every command from the repository root.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: Docker running; no `BUILD_COMMIT` exported in your shell.
1. Run `docker compose up -d --build backend` → the `backend` container is up (`docker compose ps` shows it running).
2. Run `curl -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK`, header `content-type: application/json`, body with exactly two keys, `version` (the `[project].version` value in `backend/pyproject.toml`) and `commit`, both strings.
3. Run `curl -i -X POST http://localhost:8010/api/version` → `405 Method Not Allowed`.

### Criterion 2: `commit` comes from `BUILD_COMMIT` set at build time, default `unknown`, first 12 characters only
Prerequisites: as for Criterion 1.
1. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` → the backend is rebuilt and running.
2. Run `curl -s http://localhost:8010/api/version` → `"commit":"0123456789ab"` (12 characters, the sha's prefix).
3. Run `BUILD_COMMIT=abc1234 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `"commit":"abc1234"` (shorter than 12, unchanged).
4. Run `docker compose up -d --build backend` with no `BUILD_COMMIT` set, then `curl -s http://localhost:8010/api/version` → `"commit":"unknown"`.
5. Open `backend/app/routers/version.py` → the commit comes from `get_build_commit()`; the file contains no commit string literal.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend running as in Criterion 1.
1. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with `version` and `commit`, both `string`, both required.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary reads `0 failed`.
2. Read the test names in those files → at least one test sets `BUILD_COMMIT` (a 40-character sha) and at least one unsets it, in both the unit and the integration file.
