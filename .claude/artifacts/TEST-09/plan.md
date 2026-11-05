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
- [ ] `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router; when that value is longer than 12 characters, `commit` is its first 12 characters (tracker clarification).
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT`, and the service layer returns `value[:12]`; a value of 12 characters or fewer is returned unchanged. Folded into criterion 2 above and covered by unit and integration tests (40-character sha in, 12 out; short value in, unchanged out). Assumption recorded: the value is stripped of surrounding whitespace first, and an unset or blank (empty or whitespace-only) `BUILD_COMMIT` yields `unknown`, matching the existing `docs/DEVELOPMENT.md` wording ("When the variable is unset or blank the backend reports `unknown`"). The sentinel `unknown` is 7 characters and is never truncated.
- Feature note: "Registers a router in `backend/app/main.py`" → not acted on: the version router is already registered in `backend/app/main.py` (`app.include_router(version_router)`, from TEST-05), so this item extends that router and does not touch `main.py`. This also removes the `main.py` overlap with BUG-01 that `feature_map.md` flags.
- Merged since the last plan: n/a (fresh plan, branched from current main 6094657).

## Plan Overview
Backend-only extension of the existing `GET /api/version` endpoint (TEST-05). `backend/app/core/config.py` declares one new setting, `build_commit`, read per call from the `BUILD_COMMIT` environment variable with the documented default `unknown` (unset or blank). `backend/app/services/version_service.py` gains `get_build_commit()`, which reads that setting through `get_settings()` and truncates it to its first 12 characters. `VersionResponse` in `backend/app/schemas/version.py` gains a `commit: str` field, and the router fills it from the service. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container so a value set by CI or the image build reaches the process, and `.env.example` documents it as optional. No frontend, no database, no new dependency, no `main.py` change.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`), response gains `commit`. The router passes `commit=get_build_commit()`; it contains no commit literal.
- Service layer: `backend/app/services/version_service.py` adds `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. Settings are read at call time (not at import), so a changed environment is reflected per request and the tests can monkeypatch `BUILD_COMMIT`. `get_app_version()` is unchanged.
- Configuration (the one declared source): `backend/app/core/config.py` adds `UNKNOWN_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT", "").strip() or UNKNOWN_BUILD_COMMIT`, and a `build_commit: str = field(default_factory=_read_build_commit)` field on `Settings`, following the existing `cors_origins` per-call pattern (`coding_standards.md` Section 5's invariant: every environment-read value in this settings module is configured the same way, with a documented default).
- Run configuration: `docker-compose.yml` backend `environment:` adds `BUILD_COMMIT: ${BUILD_COMMIT:-}` (blank passes through and resolves to `unknown` in config.py, so the default lives in one place only); `.env.example` adds a commented, optional `BUILD_COMMIT=` entry explaining that CI or the image build passes the full sha and the endpoint reports its first 12 characters.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters
- Response: 200, `application/json`, schema `VersionResponse` (`backend/app/schemas/version.py`)

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` keeps its TEST-05 behaviour (installed package metadata, `unknown` when not installed). Any other method returns 405, unchanged.

## Technology Selection
- Commit source (`BUILD_COMMIT` read in `Settings`): chose the standard library `os.environ` in the existing dataclass settings module over adding `pydantic-settings` or reading `git rev-parse` at runtime, because the existing `cors_origins` pattern already covers per-call environment reads and a container image carries no `.git` directory.
- Truncation (`get_build_commit()`): chose a plain string slice over any helper or library, because a slice covers the need in one expression.
- `commit` response field: extends the existing Pydantic `VersionResponse` (an installed dependency) rather than a new schema; no new component, module or dependency is introduced by this item.

## File Manifest
### New files
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()` truncating the configured value to 12 characters
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `VersionResponse(version=get_app_version(), commit=get_build_commit())`
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` through to the backend service environment
- [B] .env.example: document the optional `BUILD_COMMIT` variable
- [B] backend/tests/unit/test_config_unit.py: unit tests for `build_commit` set, unset, blank and whitespace-stripped
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` (40-char sha truncated to 12, short value unchanged, `unknown` when unset)
- [B] backend/tests/integration/test_version_integration.py: update the existing whole-body assertions to include `commit`, and add set (40-char sha in, first 12 out) and unset (`unknown`) request/response tests

No dependency changes, so no lockfile is regenerated. `README.md` and `docs/DEVELOPMENT.md` need no edit: `docs/DEVELOPMENT.md` already documents `BUILD_COMMIT`, the 12-character truncation, the compose pass-through as `${BUILD_COMMIT:-}` and the `unknown` default in `backend/app/core/config.py`, and `README.md` already lists `.env.example` as carrying the optional `BUILD_COMMIT`; this item makes the code match that text. `backend/app/main.py` is not modified (the version router is already registered).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution in `backend/app/core/config.py` (set to a value, unset, empty string, whitespace-only, surrounding whitespace stripped); `get_build_commit()` in `backend/app/services/version_service.py` (40-character sha returns its first 12, a value of 12 or fewer characters is returned unchanged, unset returns `unknown`). Tests set the variable with `monkeypatch.setenv` and assert the resolved value, not the literal default alone.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` with `BUILD_COMMIT` set to a 40-character sha (body is `{"version": <pyproject version>, "commit": <first 12>}`), with `BUILD_COMMIT` unset (`commit` is `unknown`), and the existing DATABASE_URL-unset and 405 tests kept, their body assertions extended with `commit`.
  - Directory: backend/tests/integration/
- E2E tests: no E2E spec for this item: no criterion involves navigation or interaction through the UI (backend only; the footer that displays the commit is TEST-10).
  - Directory: e2e/tests/
  - File: none for TEST-09
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (blank `BUILD_COMMIT` reports `unknown`).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`), truncated to 12, never a router literal | Unit and Integration | verifying it needs no navigation or interaction: it is configuration resolution and a service rule, checked by setting the variable and reading the resolved value |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the router's `response_model=VersionResponse` is exercised by the HTTP cycle, and the schema file is checked at review |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | it is a statement about the test suite itself, satisfied by the unit and integration tests above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client sends GET /api/version Then the response is 200 with string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When GET /api/version Then commit is its first 12 characters; Given BUILD_COMMIT is unset When GET /api/version Then commit is unknown |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the version endpoint When its OpenAPI schema is read at /openapi.json Then the response references VersionResponse with properties version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite When it runs Then the set and unset commit tests pass with 0 failed |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: Docker running, repository root as the working directory, `.env` copied from `.env.example`.
1. Run `docker compose up -d --build backend` → the `db` and `backend` containers are running (`docker compose ps` shows both up).
2. Run `curl -s -o /dev/null -w '%{http_code}' http://localhost:8010/api/version` → prints `200`.
3. Run `curl -s http://localhost:8010/api/version` → the body is a JSON object with exactly two keys, `version` (`"0.1.0"`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: as Criterion 1; `BUILD_COMMIT` not present in `.env`.
1. With `BUILD_COMMIT` unset, run `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `{"version":"0.1.0","commit":"unknown"}`.
2. Add the line `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` (40 characters) to `.env`, run `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `{"version":"0.1.0","commit":"0123456789ab"}` (the first 12 characters only).
3. Change that line to `BUILD_COMMIT=abc1234`, recreate the backend as in step 2, and call the endpoint again → `commit` is `"abc1234"`, unchanged.
4. Change that line to `BUILD_COMMIT=` (blank), recreate the backend, call the endpoint → `commit` is `"unknown"`.
5. Open `backend/app/routers/version.py` → it calls `get_build_commit()` and contains no commit string literal. Remove the `BUILD_COMMIT` line from `.env` afterwards.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running as in Criterion 1.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the properties `version` and `commit`, both strings.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Not verifiable through the UI; the observable check is the test run.
1. Start a Postgres for the integration suite (the conftest database fixtures need `DATABASE_URL`), then run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → `0 failed`.
2. Read the test names in those three files → each of them has at least one test with `BUILD_COMMIT` set and at least one with it unset.
