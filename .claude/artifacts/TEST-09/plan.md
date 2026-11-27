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
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the comment names the variable, so the declared source is `BUILD_COMMIT`. The service truncates to the first 12 characters (`COMMIT_LENGTH = 12`), a value of 12 characters or fewer is returned unchanged, and both cases have their own unit test plus an integration test that sets a 40-character sha and expects its first 12 characters. Assumption recorded: "what CI passes in" describes the deploy pipeline that builds the image. This plan does not edit `.github/workflows/pr-tests.yml`, which `/sync-project` owns and regenerates, and which builds no image. The build-time wiring is the Dockerfile `ARG`/`ENV` and the compose build arg.
- Assumption (no comment, recorded so it is not a silent choice): a `BUILD_COMMIT` that is blank or whitespace-only counts as unset and yields `"unknown"`. This matches how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`, and it lets the Dockerfile pass an empty build arg through without a second copy of the default.
- Context, not feedback: `GET /api/version` already exists on main at ad2cb5cf (TEST-05: `routers/version.py`, `services/version_service.py`, `schemas/version.py`, already registered in `backend/app/main.py`). So this item extends the existing slice instead of adding a router, and `backend/app/main.py` is **not** modified. The map's note about registering a router in `main.py` no longer applies.

## Plan Overview
Backend only. Add a `commit` field to the existing version response:
- `backend/app/core/config.py`: `Settings.build_commit` reads `BUILD_COMMIT` from the environment per call (`default_factory`, the same as `database_url` and `cors_origins`), stripped, falling back to `DEFAULT_BUILD_COMMIT = "unknown"` when it is unset or blank. That is the single declared source and the only place the default lives.
- `backend/app/services/version_service.py`: `get_build_commit()` returns `get_settings().build_commit[:COMMIT_LENGTH]` with `COMMIT_LENGTH = 12`.
- `backend/app/schemas/version.py`: `VersionResponse` gains `commit: str`.
- `backend/app/routers/version.py`: builds `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal value in the router.
- Build-time wiring: `backend/Dockerfile` declares `ARG BUILD_COMMIT` (no default) and `ENV BUILD_COMMIT=${BUILD_COMMIT}`. `docker-compose.yml` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` as a backend build arg. An unset arg becomes an empty variable, which config resolves to `"unknown"`, so the default is not repeated in either file.
- `.env.example` and `docs/DEVELOPMENT.md` document the variable.

No database, migration, frontend or external API work.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing). The response gains `commit`. Status codes are unchanged: 200, and 405 for other methods.
- Service layer: `get_build_commit() -> str` in `version_service.py`. It reads `get_settings().build_commit` and returns the first `COMMIT_LENGTH` (12) characters. Slicing returns shorter values (including `"unknown"`) unchanged, so no branch is needed. It never raises. It gets a module docstring update naming TEST-09 and a one-line function docstring (project-standards docstring rule).
- Settings: `DEFAULT_BUILD_COMMIT = "unknown"` plus `_read_build_commit()` (`(os.environ.get("BUILD_COMMIT") or "").strip() or DEFAULT_BUILD_COMMIT`) as the `default_factory` of `build_commit: str`. This keeps the settings module's invariant: every deployment-dependent value reads the environment, with a documented default.
- Repository layer: none.
- Migrations: none.
- Build configuration: Dockerfile `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=${BUILD_COMMIT}`, placed before the final `COPY . .` so the layer cache for dependency sync is untouched. Compose `build.args.BUILD_COMMIT: ${BUILD_COMMIT:-}`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: none
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "3f9a1c2b7d4e"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` behaviour is unchanged from TEST-05. `commit` is always a string of at most 12 characters.

## Technology Selection
- Commit source: chose a plain environment variable read through the existing `Settings` dataclass and `os.environ` (stdlib) over `pydantic-settings` or reading `.git` or `git rev-parse` at runtime. The image holds no `.git` and no git binary, and the settings module already reads every value with `os.environ`.
- Truncation: chose a stdlib string slice over any helper or dependency.
- Build-time injection: chose Docker's native `ARG`/`ENV` and the Compose `build.args` key (rung 2, a native platform feature) over a generated version file written by a build script.
- No new dependency and no new module. Every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios for the commit set, unset and truncated paths (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and `Settings.build_commit` read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`
- [B] backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=${BUILD_COMMIT}`
- [B] docker-compose.yml: backend `build.args.BUILD_COMMIT: ${BUILD_COMMIT:-}`
- [B] .env.example: document `BUILD_COMMIT` (commented, unset by default, so local runs report `unknown`)
- [B] backend/tests/unit/test_config_unit.py: tests for `build_commit` set, unset and blank
- [B] backend/tests/unit/test_version_service_unit.py: tests for `get_build_commit()` set, unset, exactly 12 and longer than 12
- [B] backend/tests/integration/test_version_integration.py: update the existing equality assertions to include `commit`, and add set, unset and schema tests
- [Docs] docs/DEVELOPMENT.md: document the `BUILD_COMMIT` build arg and environment variable (run configuration changes, build-feature Section 15's condition)

No dependency is added or changed, so no lockfile changes. `README.md` needs no edit: it links to `docs/DEVELOPMENT.md` for environment setup and lists no environment variables itself. No E2E spec is listed: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank) and `get_build_commit()` (set and shorter than 12, exactly 12, longer than 12 is truncated, unset gives `"unknown"`). Settings are monkeypatched through the environment (`monkeypatch.setenv`/`delenv("BUILD_COMMIT")`), so the tests check how the value resolves, not just the literal fallback.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: the real HTTP cycle through `create_app()` with `BUILD_COMMIT` set to a 40-character sha (expect its first 12), unset (expect `"unknown"`), and the OpenAPI schema for `VersionResponse` declaring `version` and `commit`. The two existing equality assertions are updated to include `commit` (with `BUILD_COMMIT` cleared so they are deterministic). The 405 test stays as it is.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI, and the endpoint has no UI consumer in this item.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus the truncation edge case, run against the API.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_reports_unknown_commit_when_build_commit_unset` | Checking it needs no navigation or interaction. It is the router's request and response cycle. |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters when longer), never a router literal | Unit | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_build_commit_truncates_value_longer_than_twelve_characters`, `test_get_build_commit_returns_twelve_character_value_unchanged`, `test_get_build_commit_returns_configured_value_when_set` | Checking it needs no navigation or interaction. It is how settings resolve plus a service rule. The integration set test below also proves the router passes the environment value through. |
| 3 | The response body is a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_version_response_declares_version_and_commit` | Checking it needs no navigation or interaction. It is the API schema FastAPI generates from the Pydantic model. |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_reports_build_commit_when_set`, `test_get_version_reports_unknown_commit_when_build_commit_unset`, `test_get_build_commit_returns_unknown_when_unset` | Checking it needs no navigation or interaction. It is the set and unset paths through the HTTP cycle (integration) and the service (unit). |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/version, Then the status is 200 and the body has string fields `version` and `commit` |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit, see Criterion coverage | Given the backend was built with BUILD_COMMIT set to a 40-character sha, When I request GET /api/version, Then `commit` equals the sha's first 12 characters |
| 3 | Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When I open /openapi.json, Then the VersionResponse schema lists `version` and `commit` as required strings |
| 4 | Set and unset paths tested | covered at Integration, see Criterion coverage | Given the backend was built without BUILD_COMMIT, When I request GET /api/version, Then `commit` is "unknown" |

## Manual verification plan
This item has no UI. Every check is an HTTP request against the running backend, read with `curl` in a terminal, or in a browser tab at the same URL.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is running with `docker compose up -d --build` from the repository root, and the backend answers on `http://localhost:8010`.
1. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body → it is a JSON object with exactly two keys, `version` (for example `"0.1.0"`, matching `[project].version` in `backend/pyproject.toml`) and `commit`, and both values are strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters when longer)
Prerequisites: Docker Compose available at the repository root.
1. Run `BUILD_COMMIT=3f9a1c2b7d4e5f60718293a4b5c6d7e8f9012345 docker compose up -d --build backend` → the backend image rebuilds and the container starts.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `"3f9a1c2b7d4e"`, the first 12 characters of the 40-character value.
3. Run `BUILD_COMMIT=abc1234 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"abc1234"`, unchanged because it is shorter than 12 characters.
4. Open `backend/app/routers/version.py` → the router passes `commit=get_build_commit()` and contains no string literal for the commit.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend is running as in Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response shows the `VersionResponse` schema with `version` and `commit`, both strings.
2. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL instance for the integration tier, reachable through `DATABASE_URL` (the compose `db` service on port 5442 works).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the run passes: its summary line reports no failed or errored test, none of the version tests is reported skipped, and the command exits 0.
3. Run `BUILD_COMMIT= docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`, the unset path on the real stack.
