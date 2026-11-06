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

(Source: ClickUp task 123k99cwybk, read via the tracker MCP at plan time, workspace 30307190.)

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. As amended by the tracker comment: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the comment names it; the description only says "an environment variable"), and the service truncates the resolved value to its first 12 characters (`COMMIT_LENGTH = 12`). A value of 12 characters or fewer, including the 7-character default `unknown`, is returned unchanged. Unit and integration tests assert a 40-character sha comes back as its first 12 characters. Criterion 2 above carries the amendment.
- Assumption (description vs code, recorded rather than blocked): the description's Notes say the feature "Registers a router in `backend/app/main.py`". On the plan base (64dae87) the version router already exists (`backend/app/routers/version.py`, TEST-05) and is already registered in `create_app()` (`app.include_router(version_router)`), so this item extends that router and does **not** modify `backend/app/main.py`. Registering it a second time would duplicate the route.
- Assumption: "an environment variable set at build time" is read as the deployment setting `BUILD_COMMIT`, resolved at runtime in the settings module (`backend/app/core/config.py`) with the documented default `unknown`, and passed through to the backend container by `docker-compose.yml`. No Dockerfile `ARG` is added: whoever builds or deploys the image (CI) sets the variable, and nothing in the criteria asks for it to be baked into the image layer. A blank value is treated as unset (reports `unknown`), so compose's `${BUILD_COMMIT:-}` pass-through of an unset host variable yields the default rather than an empty `commit`.
- Merged since the last plan: n/a (fresh plan on plan base 64dae872f765e6a62b6dd6388ddf3e1e76326829; no `[merged-since]` lines in the dispatch).

## Plan Overview
Backend only. Extend the existing `GET /api/version` endpoint (TEST-05) so its response also carries `commit`. The value is declared once, in the settings module, as `Settings.build_commit`, read per call from the `BUILD_COMMIT` environment variable with default `unknown` (blank treated as unset), following the same per-call `default_factory` pattern `database_url` and `cors_origins` already use (`coding_standards.md` Section 5: within one settings module, every deployment-dependent value reads the environment, with a documented default). The version service gains `get_build_commit()`, which truncates to the first 12 characters per the tracker clarification. The `VersionResponse` Pydantic schema gains `commit: str`; the router passes both values through and holds no literal. `docker-compose.yml` passes `BUILD_COMMIT` into the backend container, and `.env.example` documents it. No database, no frontend, no new dependency, no change to `backend/app/main.py`.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. Method, path and status code unchanged. The router returns `VersionResponse(version=get_app_version(), commit=get_build_commit())` and contains no commit string literal.
- Settings (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"`, a helper `_read_build_commit()` returning `os.environ.get("BUILD_COMMIT", "").strip()` or the default when that is empty, and a field `build_commit: str = field(default_factory=_read_build_commit)` on `Settings`, so it is read per `get_settings()` call (same pattern as `cors_origins`). This is the one declared source of the value.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. Docstring states the tracker clarification (full 40-character sha from CI, first 12 returned). `get_app_version()` is unchanged.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str` alongside `version: str`.
- Configuration plumbing: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (blank when unset, which the settings read as `unknown`); `.env.example` gains a commented, optional `BUILD_COMMIT=` entry explaining that CI sets the full sha and the endpoint reports its first 12 characters.
- Repository layer: none (no data access).
- Migrations: none.
- `backend/app/main.py`: **not modified.** The version router is already imported and registered there (`app.include_router(version_router)`).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `VersionResponse`:
  - With `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `{"version": "0.1.0", "commit": "0123456789ab"}`
  - With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`
  - With `BUILD_COMMIT=abc1234` (12 characters or fewer): `{"version": "0.1.0", "commit": "abc1234"}`
  - `version` is unchanged from TEST-05 (installed distribution metadata, `unknown` fallback).
- Errors: none new; `POST /api/version` still returns 405.

## Technology Selection
- Commit source (`Settings.build_commit`): chose the standard library's `os.environ` read inside the existing dataclass settings module over adding `pydantic-settings` (not installed) or reading `git rev-parse` at runtime (no `.git` in the image, and the criterion names an environment variable), because the existing module already resolves every deployment-dependent value this way.
- Truncation (`get_build_commit()`): chose a plain string slice over any helper or dependency; no alternative is warranted for one slice.
- No net-new dependency, so no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (blank `BUILD_COMMIT` reports `unknown`).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-09/uat_script.md: the artifact copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`.
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` into the backend service environment.
- [B] .env.example: document the optional `BUILD_COMMIT` variable.
- [B] backend/tests/unit/test_config_unit.py: unit tests for `Settings.build_commit` set, unset, blank, and read per call.
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` (40-character sha truncated to 12, short value unchanged, default `unknown`).
- [B] backend/tests/integration/test_version_integration.py: update the existing exact-body assertions to include `commit`, and add set-path (40-character sha returns first 12) and unset/blank-path (`unknown`) request/response tests.

`backend/app/main.py` is NOT in this manifest: the version router is already registered there, and this item changes no router registration (relevant to BUG-01, which registers its `server_time` router in `main.py`).
No dependency changes, so no lockfile (`backend/uv.lock`, `package-lock.json`) is regenerated.
No `README.md` or `docs/DEVELOPMENT.md` edit is expected: `docs/DEVELOPMENT.md` already documents `BUILD_COMMIT` (full sha in, first 12 characters out, `unknown` default in `backend/app/core/config.py`, compose pass-through as `${BUILD_COMMIT:-}`), and `README.md` already lists `.env.example` as carrying the optional `BUILD_COMMIT`. This plan matches both; the build's Section 15 check confirms they still agree.
No E2E spec file: no criterion requires navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank, whitespace, read per call) and `get_build_commit()` (40-character sha to first 12, a value of 12 or fewer unchanged, default `unknown` passes through), with the environment controlled by `monkeypatch` and no I/O.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` through the FastAPI TestClient: with `BUILD_COMMIT` set to a 40-character sha the body is `{"version": <pyproject version>, "commit": <first 12>}`; with it unset, and with it blank, `commit` is `unknown`; the existing no-database and 405 tests keep passing with the new body. The settings are read per request, so `monkeypatch.setenv` and `delenv` on the session `client` fixture take effect without rebuilding the app. Needs no database (the version endpoint never connects).
  - Directory: backend/tests/integration/
- E2E tests: not warranted for this item. E2E is ENABLED in `CLAUDE.md`, but no acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion); every criterion is an API or configuration behaviour covered at integration or unit level.
  - Directory: e2e/tests/
  - File: none for this item.
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (blank `BUILD_COMMIT`), verified against the API response.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router request/response behaviour. |
| 2 | `commit` comes from one declared source (`BUILD_COMMIT`, default `unknown`, first 12 characters), never a router literal | Unit and Integration | Verifying it needs no navigation or interaction: it is settings resolution and service truncation (unit), plus the set and unset value reaching the response (integration). |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the endpoint's OpenAPI document (`/openapi.json`) names `VersionResponse` with required `version` and `commit` strings. |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | It is a criterion about the tests themselves; it is met by the unit and integration tests above and has no UI surface. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When GET /api/version Then commit is its first 12 characters; Given BUILD_COMMIT is unset When GET /api/version Then commit is "unknown" |
| 3 | Response defined by a Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running When a client reads /openapi.json Then GET /api/version's 200 response references VersionResponse with version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite When the version and config tests run Then 0 failed |

## Manual verification plan
This item has no UI: every criterion is verified by reading the API response, the OpenAPI document or the test run, which is the observable check in each block below. Run each command from the repository root.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: Docker running; ports 8010 and 5442 free; no `.env` overriding `BUILD_COMMIT`.
1. Run `docker compose up -d --build backend` → the `db` and `backend` containers start; `docker compose ps` shows `backend` running.
2. Run `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8010/api/version` → prints `200`.
3. Run `curl -s http://localhost:8010/api/version` → prints a JSON object with exactly two keys, `version` with value `0.1.0` (the `[project].version` in `backend/pyproject.toml`) and `commit` with a string value.

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters), never a router literal
Prerequisites: the stack from Criterion 1 can be restarted.
1. Run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` unset in your shell → backend restarts.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
3. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `0123456789ab` (the first 12 characters) and `version` is still `0.1.0`.
4. Run `BUILD_COMMIT=abc1234 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (unchanged, it is shorter than 12).
5. Open `backend/app/routers/version.py` → it contains no commit string literal; `commit` comes from `get_build_commit()`, which reads `get_settings().build_commit` from `backend/app/core/config.py`.
6. Run `docker compose up -d --force-recreate backend` again with `BUILD_COMMIT` unset to restore the default → `commit` is back to `unknown`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running as in Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with required string fields `version` and `commit`.
2. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the run ends with `0 failed`.
2. Read the test names in those three files → each file has at least one test for a set `BUILD_COMMIT` (a 40-character sha yielding its first 12 characters) and one for an unset `BUILD_COMMIT` (yielding `unknown`).
