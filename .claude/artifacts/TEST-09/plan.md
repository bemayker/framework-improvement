# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A client can ask the API which build it is talking to.
>
> Acceptance criteria:
> 1. `GET /api/version` returns 200 with JSON fields `version` (string) and `commit` (string).
> 2. `commit` comes from one declared source (an environment variable set at build time, default "unknown"), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> Notes: Backend only. TEST-05 already ships a `/api/version` router registered in backend/app/main.py (verify in the code; extend rather than duplicate).

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with JSON fields `version` (string) and `commit` (string).
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default "unknown"), never a string typed into the router. Amended by the tracker comment below: a value longer than 12 characters is returned as its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the name the comment uses, so it is the declared source of criterion 2), and the service returns `build_commit[:12]`. A value of 12 characters or fewer is returned unchanged. Unit and integration tests cover a 40-character sha (truncated to 12), a short value (unchanged) and the unset path (`unknown`). The comment overrides the description where they differ: the description says nothing about length, so this is an amendment rather than a contradiction.
- Comment (tracker): four bot notices of earlier, unmerged PRs → not acted on because they carry no requirement. Verified against the code instead: on main at 183fb15 `VersionResponse` has only `version` and nothing reads `BUILD_COMMIT`, so this plan starts from the TEST-05 endpoint as it stands.
- Assumption (no comment covers it): a `BUILD_COMMIT` that is empty or whitespace only is treated as unset and yields `unknown`, matching how `CORS_ORIGINS` treats a blank value in the same settings module. Surrounding whitespace is stripped before truncation.
- Assumption: "set at build time" is implemented as a Docker build argument `BUILD_COMMIT` (default `unknown`) baked into the image as an environment variable, with docker-compose.yml forwarding the caller environment value to that build argument. Wiring CI or a deploy pipeline to pass the real sha is out of scope: `.github/workflows/pr-tests.yml` is a plugin-generated workflow, and the item asks only for the declared source. Any caller that runs `docker compose build` with `BUILD_COMMIT` exported gets it baked in.
- Merged since the last plan: n/a (fresh plan, branched from current main at 183fb15; no merged-since lines were passed in).

## Plan Overview
Backend only, and an extension of the existing TEST-05 endpoint rather than a new one: `backend/app/routers/version.py` is already registered in `backend/app/main.py`, so `main.py` is not touched. Four small changes:

1. `backend/app/core/config.py`: `Settings` gains `build_commit`, read per call from the `BUILD_COMMIT` environment variable with the documented default `unknown` (blank treated as unset). This is the one declared source (criterion 2), and it follows the module's existing invariant that every deployment-dependent value reads the environment (`coding_standards.md` Section 5).
2. `backend/app/services/version_service.py`: `get_build_commit()` returns `get_settings().build_commit` cut to its first 12 characters (tracker comment).
3. `backend/app/schemas/version.py`: `VersionResponse` gains `commit: str` (criteria 1 and 3).
4. `backend/app/routers/version.py`: builds the response from both service calls; no literal commit string in the router.

Build-time wiring: `backend/Dockerfile` declares `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT` from it, `docker-compose.yml` forwards `BUILD_COMMIT` as a build arg defaulting to `unknown`, and `.env.example` documents the variable. Tests: unit (config and service, set, short, blank and unset) and integration (HTTP cycle with the variable set and unset); existing version integration assertions are updated for the new field.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item)

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), extended to return `commit` beside `version`. No new endpoint, no new router, no change to router registration in `backend/app/main.py`.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank. Add the field `build_commit: str = field(default_factory=_read_build_commit)` to the frozen `Settings` dataclass, so it is read per `get_settings()` call like `database_url` and `cors_origins`, never bound at import.
- Service layer (`backend/app/services/version_service.py`): add `BUILD_COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:BUILD_COMMIT_LENGTH]`. Slicing leaves `unknown` (7 characters) and any value of 12 characters or fewer unchanged. Docstring states why 12 (the tracker clarification) and that the value comes from `BUILD_COMMIT` only. `get_app_version()` is untouched.
- Router (`backend/app/routers/version.py`): return `VersionResponse(version=get_app_version(), commit=get_build_commit())`. Update the module docstring to name TEST-09.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str` after `version: str`, with a field docstring or comment naming its source.
- Build wiring: `backend/Dockerfile` adds `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT=$BUILD_COMMIT`, placed after the second `uv sync` and before `EXPOSE`, so changing the commit does not invalidate the dependency layers. `docker-compose.yml` adds an `args:` block under `backend.build` with `BUILD_COMMIT` set by compose variable substitution to the caller environment value, defaulting to `unknown`. The `backend.environment` block is NOT given a `BUILD_COMMIT` entry: the value is a build-time fact baked into the image, and a runtime entry would be a second source.
- `.env.example`: a `# --- Build ---` block documenting `BUILD_COMMIT` (commented out, default `unknown`; CI passes the full 40-character sha, the API reports its first 12).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, body defined by `VersionResponse` in `backend/app/schemas/version.py`. `version` is the installed distribution version (unchanged from TEST-05). `commit` is the first 12 characters of `BUILD_COMMIT`, or `unknown` when it is unset or blank. Examples, set and unset:

```json
{"version": "0.1.0", "commit": "0123456789ab"}
{"version": "0.1.0", "commit": "unknown"}
```

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ.get` inside the existing `Settings` dataclass over `pydantic-settings` (not installed) or a new config module, because the settings module already reads every deployment-dependent value this way and a second mechanism would break its invariant.
- Truncating to 12 characters: chose a plain string slice over any helper or validator, because slicing already leaves shorter values unchanged.
- Setting the value at build time: chose the native Docker `ARG` plus `ENV` pair and a compose `build.args` entry over a generated version file or a build script, because both are built into the tools the project already uses.
- No new dependency, component or module is introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the 40-character truncation edge case
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: `BUILD_COMMIT_LENGTH` and `get_build_commit()` returning the first 12 characters
- [B] backend/app/schemas/version.py: `VersionResponse.commit: str`
- [B] backend/app/routers/version.py: response built from `get_app_version()` and `get_build_commit()`
- [B] backend/Dockerfile: `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT` after the dependency layers
- [B] docker-compose.yml: `backend.build.args.BUILD_COMMIT` forwarded from the caller environment, default `unknown`
- [B] .env.example: documented `BUILD_COMMIT` entry
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset and blank cases
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` 40-character, exactly-12, short and unset cases
- [B] backend/tests/integration/test_version_integration.py: HTTP cycle with `BUILD_COMMIT` set and unset; existing equality assertions updated to include `commit`
- [Docs] README.md: the `.env.example` line in the project tree also names the build commit, since run configuration gains a build argument

No dependency manifest changes, so no lockfile is regenerated (`backend/uv.lock` and `package-lock.json` untouched). `docs/DEVELOPMENT.md` needs no edit: it documents the framework workflow, not application environment variables. `backend/app/main.py` is not modified: the version router is already registered there. No E2E spec is produced, because no acceptance criterion requires UI interaction (see Criterion coverage).

## Testing Strategy
- Unit tests: configuration and service layer, environment controlled with `monkeypatch.setenv` / `monkeypatch.delenv`, no database.
  - `test_config_unit.py`: `build_commit` equals the env value when `BUILD_COMMIT` is set (stripped of surrounding whitespace); equals `DEFAULT_BUILD_COMMIT == "unknown"` when unset; equals `unknown` for a blank value (parametrized `""`, `"   "`); and the field is a `default_factory`, so no commit literal is baked into the class.
  - `test_version_service_unit.py`: `get_build_commit()` returns the first 12 characters of a 40-character sha (happy path, the CI case); returns an exactly-12-character value unchanged and a 7-character value unchanged (edge cases); returns `unknown` when `BUILD_COMMIT` is unset (the unset path).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files extended)
- Integration tests: real HTTP request/response cycle through `create_app()` with FastAPI `TestClient`. The setting is read per request, so `monkeypatch` on the environment is enough with the shared `client` fixture.
  - With `BUILD_COMMIT` set to a 40-character sha: 200, body has exactly the keys `version` and `commit`, `commit` is the sha first 12 characters, both values are strings.
  - With `BUILD_COMMIT` unset: 200, `commit` is `unknown`.
  - Existing tests `test_get_version_returns_200_with_version_from_pyproject` and `test_get_version_answers_when_database_url_is_unset` compare the whole body to a version-only dict; update them to `delenv("BUILD_COMMIT")` and expect `commit: unknown` as well. The 405 test is unchanged.
  - Directory: backend/tests/integration/ (`test_version_integration.py`, extended)
- E2E tests: enabled per CLAUDE.md, but no acceptance criterion of this item needs navigation or interaction through the UI (backend only, no frontend change), so no spec is written. The per-feature edge-case spec obligation applies only when E2E is warranted at all.
  - Directory: e2e/tests/ (no file for this item)
- UAT scenarios: one scenario per criterion plus the truncation edge case, validated for well-formedness by CI.
  - Directory: e2e/uat/scenarios/ (`TEST-09_version_build_commit.feature`), manual script in e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with string fields `version` and `commit` | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked over a real HTTP cycle |
| 2 | `commit` comes from one declared source (`BUILD_COMMIT`, default `unknown`, first 12 characters) | Unit and Integration | Verifying it needs no navigation or interaction: it is configuration resolution and a string rule, checked by setting and unsetting the variable |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the router declares `response_model=VersionResponse`, and the exact-keys assertion fails if the body drifts from the schema |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | Verifying it needs no navigation or interaction: the criterion is the existence and passing of those tests themselves |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` strings | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown` | covered at Unit and Integration, see Criterion coverage | Given the backend was built with BUILD_COMMIT set to a 40-character sha, When a client requests GET /api/version, Then commit is that sha first 12 characters; Given it was built without BUILD_COMMIT, Then commit is unknown |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the API is running, When a client reads the OpenAPI document, Then GET /api/version responds with the VersionResponse schema holding version and commit |
| 4 | Unit and integration tests cover set and unset | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
This item has no UI: every criterion is verified against the API from a terminal, and the observable check is the HTTP status and the JSON body (or the test runner summary for criterion 4). Run from the repository root.

### Criterion 1: `GET /api/version` returns 200 with JSON fields `version` and `commit`
Prerequisites: Docker running; the stack built from this branch with `docker compose build backend` and started with `docker compose up -d backend` (no `BUILD_COMMIT` exported).
1. Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` → prints `200`.
2. Run `curl -s http://localhost:8010/api/version` → the body is a JSON object with exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`, quoted as a string) and `commit` (a quoted string).

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, cut to 12 characters
Prerequisites: same stack as Criterion 1.
1. With no `BUILD_COMMIT` exported, run `docker compose build backend` then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
2. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose build backend` then `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `0123456789ab` (the first 12 of the 40 characters); `version` is unchanged.
3. Run `BUILD_COMMIT=abc1234 docker compose build backend` then `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (shorter than 12, returned whole).
4. Open `backend/app/routers/version.py` → it contains no commit literal; the value arrives through `get_build_commit()` in `backend/app/services/version_service.py`, which reads `get_settings().build_commit`.
5. Rebuild without `BUILD_COMMIT` (step 1 again) so the local stack is back to `unknown`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: stack running as in Criterion 1.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the string properties `version` and `commit`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports `0 failed`.
2. Read the test names in those three files → at least one test sets `BUILD_COMMIT` (including a 40-character value) and at least one unsets it, in both the unit files and the integration file.
