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
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. Amended by the tracker comment below: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the comment names it, so the plan adopts that name), and `get_build_commit()` in the version service returns the first 12 characters of a longer value and a value of 12 characters or fewer unchanged. Criterion 2's coverage row carries both truncation tests. This comment amends criterion 2 and does not contradict the description.
- Assumption (no comment covers it): a blank or whitespace-only `BUILD_COMMIT` is treated as unset and yields `"unknown"`, mirroring how `CORS_ORIGINS` treats a blank value in `backend/app/core/config.py`; surrounding whitespace is stripped. A Docker build that does not pass the build arg leaves the variable empty, so this is what makes the default hold in the container.
- Assumption (the item's Notes are stale): the Notes say this item "registers a router in `backend/app/main.py`". It does not need to: TEST-05 already created `backend/app/routers/version.py` and `main.py` line 56 already calls `app.include_router(version_router)`. This feature extends the existing `GET /api/version` route in place, so **`backend/app/main.py` is not touched** (see the File Manifest and the BUG-01 shared risk).

## Plan Overview
Backend only. The existing TEST-05 endpoint `GET /api/version` (router, service, schema already present) gains a `commit` field. The value has one declared source: the `BUILD_COMMIT` environment variable, read in the settings module `backend/app/core/config.py` per call like every other environment value there, defaulting to `"unknown"` when unset or blank. The version service applies the 12-character truncation (business rule, from the tracker comment); the router only assembles the schema from service calls and holds no literal. `backend/Dockerfile` declares `BUILD_COMMIT` as a build arg promoted to an environment variable so CI can set it at image build time, `docker-compose.yml` passes it through from the host environment, and `.env.example` documents it (README line 70 already claims `.env.example` carries an optional `BUILD_COMMIT`; today it does not). No router registration, no database, no frontend change.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response extended from `{"version"}` to `{"version", "commit"}`. No new route, no change to `backend/app/main.py`.
- Settings (`backend/app/core/config.py`): add `UNKNOWN_BUILD_COMMIT = "unknown"`, a helper `_read_build_commit()` returning `os.environ.get("BUILD_COMMIT")` stripped, or `UNKNOWN_BUILD_COMMIT` when unset or blank, and a field `build_commit: str = field(default_factory=_read_build_commit)` on `Settings`. Read per call through `default_factory`, the same way `database_url` and `cors_origins` are, so the module stays consistent per `coding_standards.md` Section 5 (one value, one source: the `"unknown"` default lives here and nowhere else; the Dockerfile and compose file carry no default of their own).
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_DISPLAY_LENGTH = 12` and `get_build_commit() -> str` returning `get_settings().build_commit[:COMMIT_DISPLAY_LENGTH]`. Docstring names TEST-09 and the reason for the truncation (CI passes a 40-character sha; the API reports the 12-character short form). Module docstring updated to mention TEST-09.
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`; docstrings updated. No string literal for the commit.
- Schema (`backend/app/schemas/version.py`): add `commit: str` to `VersionResponse`; docstring updated.
- Build-time source: `backend/Dockerfile` adds `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=${BUILD_COMMIT}` after the final `uv sync` layer (placed late so a new sha does not invalidate the dependency layers). `docker-compose.yml` adds `args: BUILD_COMMIT: ${BUILD_COMMIT:-}` under `services.backend.build`. `.env.example` gains a commented `BUILD_COMMIT=` entry explaining that CI passes the full sha and the API reports its first 12 characters.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `application/json`, shape defined by `VersionResponse` in `backend/app/schemas/version.py`:

```json
{"version": "0.1.0", "commit": "3f9c2a7b1d4e"}
```

  With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

  `version` keeps TEST-05's behaviour (installed distribution metadata, `"unknown"` fallback). `commit` is at most 12 characters.

## Technology Selection
- Reading the build commit: chose the standard library `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` or `python-dotenv`, because the settings module already reads every environment value this way and a new dependency is not warranted for one variable.
- Truncation to 12 characters: chose plain string slicing (`value[:12]`) over any helper or library; nothing else is needed.
- Setting the value at build time: chose the native Docker `ARG` plus `ENV` pair and a compose `build.args` entry over a generated version file or a build script, because Docker already provides build-time variables and the app already reads the environment.
- No net-new dependency is introduced; `backend/pyproject.toml` and `backend/uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/tests/unit/test_version_schema_unit.py: unit test that `VersionResponse` declares `version` and `commit` as required string fields (criterion 3).
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus a truncation edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` field read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: add `COMMIT_DISPLAY_LENGTH` and `get_build_commit()` applying the 12-character truncation.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`.
- [B] backend/Dockerfile: declare `ARG BUILD_COMMIT` and promote it to `ENV BUILD_COMMIT` after the dependency layers.
- [B] docker-compose.yml: pass `BUILD_COMMIT` from the host environment as a backend build arg, with no default of its own.
- [B] .env.example: document the optional `BUILD_COMMIT` variable.
- [B] backend/tests/unit/test_config_unit.py: tests for `build_commit` set, unset and blank.
- [B] backend/tests/unit/test_version_service_unit.py: tests for `get_build_commit()` truncation, short value and unset paths.
- [B] backend/tests/integration/test_version_integration.py: update the two existing exact-body assertions to include `commit`, and add set and unset commit request/response tests.

`backend/app/main.py` is NOT modified: the version router is already registered there by TEST-05 (line 56), and this feature changes only the route's response. `backend/tests/unit/test_main_unit.py` is not modified either.

No dependency change, so no lockfile entry: `backend/pyproject.toml`, `backend/uv.lock` and `package-lock.json` are untouched.

Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: README line 70 already describes `.env.example` as carrying an optional `BUILD_COMMIT`, which this feature makes true, and `docs/DEVELOPMENT.md` has no environment-variable or build-arg section the change would make stale; project structure, dependencies and test infrastructure are unchanged.

No E2E spec is listed: no criterion needs navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: settings resolution of `BUILD_COMMIT` (set, unset, blank); version service `get_build_commit()` (40-character sha truncated to 12, value of 12 characters or fewer unchanged, unset yields `"unknown"`); `VersionResponse` schema fields.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_config_unit.py`, `test_version_service_unit.py`, `test_version_schema_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` through `TestClient` with `BUILD_COMMIT` set via `monkeypatch.setenv` (settings are read per call, so the existing `client` fixture sees it) and unset via `monkeypatch.delenv`; existing TEST-05 tests updated for the new body. The existing 405 test stays as the router's error case.
  - Directory: backend/tests/integration/
- E2E tests: no spec for this feature. Every criterion is an API, configuration or test-suite behaviour with no UI navigation or interaction (the frontend does not render `commit`; that is TEST-10).
  - Directory: e2e/tests/
  - File: none for TEST-09
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, verified against the running backend at `http://localhost:8010/api/version`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}` | Integration | `test_get_version_returns_200_with_version_and_commit_strings`, `test_get_version_returns_200_with_version_from_pyproject` | verifying it needs no navigation or interaction: it is a router request/response behaviour |
| 2 | `commit` comes from one declared source (`BUILD_COMMIT`, default `"unknown"`, first 12 characters of a longer value), never a router literal | Unit | `test_settings_build_commit_reads_build_commit_env`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_keeps_value_of_12_characters_or_fewer`, `test_get_version_reports_commit_from_build_commit_env` | verifying it needs no navigation or interaction: it is settings resolution and a service rule, plus one router test asserting the env value (not a literal) reaches the body |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_version_response_declares_version_and_commit_as_required_strings` | verifying it needs no navigation or interaction: it is a schema declaration |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_reports_commit_from_build_commit_env`, `test_get_version_reports_unknown_commit_when_build_commit_unset`, `test_get_build_commit_returns_unknown_when_build_commit_unset`, `test_get_build_commit_truncates_full_sha_to_first_12_characters` | verifying it needs no navigation or interaction: it is a property of the test suite, met by these unit and integration tests passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` strings | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, truncated to 12 | covered at Unit, see Criterion coverage | Given the backend was started with BUILD_COMMIT set to a 40-character sha, When a client requests GET /api/version, Then commit equals the sha's first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When a reader opens the OpenAPI docs at /docs, Then GET /api/version's response schema is VersionResponse with version and commit |
| 4 | Unit and integration tests cover set and unset paths | covered at Integration, see Criterion coverage | Given the repository, When the version unit and integration test files are run, Then the run passes |

## Manual verification plan
No criterion of this feature is visible in the app's UI (the frontend does not show `commit`; that is TEST-10), so each block verifies through the running backend's HTTP response, the OpenAPI page, or a test run. Commands run from the repository root.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is up with `docker compose up --build` (no `BUILD_COMMIT` set in the shell or `.env`).
1. Open `http://localhost:8010/api/version` in a browser → the page shows a JSON object with exactly two keys, `version` (for example `"0.1.0"`) and `commit`, both strings.
2. Run `curl -i http://localhost:8010/api/version` → the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters of a longer value), never a router literal
Prerequisites: the stack can be rebuilt; stop it first with `docker compose down`.
1. Run `docker compose up --build -d` with no `BUILD_COMMIT` in the shell or `.env`, then open `http://localhost:8010/api/version` → `commit` is `"unknown"`.
2. Run `docker compose down`, then `BUILD_COMMIT=3f9c2a7b1d4e8f6a0c5b9e2d7a1f4c8b6e3d0a9f docker compose up --build -d`, then open `http://localhost:8010/api/version` → `commit` is `"3f9c2a7b1d4e"` (the first 12 of the 40 characters).
3. Run `docker compose down`, then `BUILD_COMMIT=abc1234 docker compose up --build -d`, then open `http://localhost:8010/api/version` → `commit` is `"abc1234"` (a value of 12 characters or fewer is returned unchanged).
4. Open `backend/app/routers/version.py` → the `commit` value comes from `get_build_commit()`; no quoted commit string appears in the file.
5. Run `docker compose down`, then `docker compose up --build -d` again with no `BUILD_COMMIT` → `commit` is back to `"unknown"`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack is up (any `BUILD_COMMIT`).
1. Open `http://localhost:8010/docs` → the Swagger page lists `GET /api/version`.
2. Expand `GET /api/version` and its 200 response → the schema is named `VersionResponse` and lists `version` (string, required) and `commit` (string, required).
3. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL instance is reachable for the integration tier (for example the compose `db` service on host port 5442).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_schema_unit.py` → the run passes: the summary line reports no failed or errored test and the command exits 0.
2. Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the run passes: the summary line reports no failed, errored or skipped test and the command exits 0.
3. Read the test names in those files → `test_get_version_reports_commit_from_build_commit_env` and `test_get_version_reports_unknown_commit_when_build_commit_unset` (integration) and `test_get_build_commit_truncates_full_sha_to_first_12_characters` and `test_get_build_commit_returns_unknown_when_build_commit_unset` (unit) are present.
