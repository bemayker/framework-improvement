# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A client can ask the API which build it is talking to.
>
> Acceptance criteria (tracker, ClickUp task 123k99cwybk):
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> Notes: Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete. Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.
- [ ] 5. (Tracker comment, amends criterion 2) When `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12; a full 40-character sha is what CI passes in.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the comment overrides the description, so it is planned as acceptance criterion 5. It also fixes the variable's name, `BUILD_COMMIT`, which the description left unnamed. Truncation lives in the service layer (`get_build_commit()`), not in the settings module and not in the router, so `Settings.build_commit` holds the declared value verbatim and the 12-character rule is one tested function. A value of 12 characters or fewer, including the `"unknown"` default, is returned unchanged.
- Assumption (no comment covers it): a `BUILD_COMMIT` that is set but empty or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` treats a blank value in the same settings module. Surrounding whitespace is stripped before truncation.
- Assumption: "set at build time" is made real for the container by a `ARG BUILD_COMMIT=unknown` plus `ENV BUILD_COMMIT=...` pair in `backend/Dockerfile`, so `docker build --build-arg BUILD_COMMIT=<sha>` bakes the commit into the image. No CI workflow builds an image today, so no workflow is edited; wiring a CI build is out of scope (`user_story_alignment.md` Section 3). `docker-compose.yml` is not edited either: its build falls back to the Dockerfile default `unknown`.
- Assumption: the endpoint itself already exists (TEST-05: `backend/app/routers/version.py`, `schemas/version.py`, `services/version_service.py`) and is already registered in `backend/app/main.py`. This item extends it with `commit`; `main.py` is NOT edited, so it is not in the File Manifest, and the shared-risk flag against BUG-01 on `main.py` does not apply to this plan.
- Existing tests that assert the exact body `{"version": ...}` in `backend/tests/integration/test_version_integration.py` will fail once `commit` is added; they are updated, not deleted.

## Plan Overview
Backend only. Add a `commit` field to the existing `GET /api/version` response. The value is declared once, as `Settings.build_commit` in `backend/app/core/config.py`, read per call from the `BUILD_COMMIT` environment variable with the documented default `"unknown"` (same shape as `database_url` and `cors_origins`, per `coding_standards.md` Section 5's one-way-per-settings-module invariant). `version_service.get_build_commit()` reads it and truncates to 12 characters. The router composes `VersionResponse(version=..., commit=...)`. The Dockerfile gains a build argument so the image carries the commit it was built from. No database, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response gains `commit`. No new endpoint, no router registration change.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT", "").strip() or DEFAULT_BUILD_COMMIT`, and a frozen-dataclass field `build_commit: str = field(default_factory=_read_build_commit)`. Read per call, like the other two environment-backed fields.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. Keep `get_app_version()` unchanged.
- Router (`backend/app/routers/version.py`): return `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string anywhere in the router (criterion 2). Update the module and function docstrings to mention TEST-09.
- Schema (`backend/app/schemas/version.py`): add `commit: str` to `VersionResponse` (criterion 3).
- Container (`backend/Dockerfile`): add `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT=${BUILD_COMMIT}` after the dependency layers (just before `EXPOSE`), so changing the commit does not bust the `uv sync` cache layers.
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters
- Response: 200, `application/json`

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

- Other methods: `POST /api/version` stays 405 (existing behaviour, unchanged).

## Technology Selection
- `commit` source: chose `os.environ` read in the existing `Settings` dataclass (standard library) over adding `pydantic-settings` or reading `git rev-parse` at runtime, because the settings module already reads every environment value this way and a container has no `.git` to read.
- Truncation: chose a string slice in `version_service` (standard library) over any helper or dependency, because a slice covers it fully.
- Build-time injection: chose the Dockerfile's native `ARG` plus `ENV` (native platform feature) over a generated version file or a build script, because Docker passes `--build-arg` straight into the environment the app already reads.
- No net-new module or dependency is introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (blank `BUILD_COMMIT`)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` field
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit` from `get_build_commit()`
- [B] backend/Dockerfile: `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT=${BUILD_COMMIT}`
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset and blank cases
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set, unset, longer-than-12, exactly-12 and shorter cases
- [B] backend/tests/integration/test_version_integration.py: update the exact-body assertions to include `commit`; add set (40-character sha, truncated) and unset cases over HTTP
- [Docs] docs/DEVELOPMENT.md: under `## Testing` or `## Test environments`, document `BUILD_COMMIT` (build argument and environment variable, default `unknown`, truncated to 12 characters in the response), because the feature changes run configuration

No dependency changes, so no lockfile entry. `README.md` needs no edit: it does not document run-time environment variables.

## Testing Strategy
- Unit tests: `get_build_commit()` in the service layer and `Settings.build_commit` in the settings module, with `monkeypatch` on `BUILD_COMMIT` (happy path, edge cases for blank, exactly 12 and shorter values, the 40-character truncation, and the unset default).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_version_service_unit.py`, `test_config_unit.py`)
- Integration tests: real HTTP request/response cycle through `TestClient` on `GET /api/version` with `BUILD_COMMIT` set to a 40-character sha (expects its first 12) and unset (expects `"unknown"`); every test sets or deletes `BUILD_COMMIT` explicitly so a CI environment variable cannot leak in. The endpoint needs no database, so these run without `DATABASE_URL`.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. E2E is ENABLED, but no criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, asked per criterion); this is a backend-only JSON endpoint with no frontend consumer.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus the blank-value edge case, validated for well-formedness, not executed.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked over HTTP |
| 2 | `commit` comes from `BUILD_COMMIT`, default `"unknown"`, never a router literal | Integration | Verifying it needs no navigation or interaction: set and unset environment over the HTTP cycle, plus unit tests on `Settings.build_commit` |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: asserting `VersionResponse` declares `version` and `commit` as `str` fields, and the router's `response_model` is it |
| 4 | Unit and integration tests cover set and unset commit paths | Integration | Verifying it needs no navigation or interaction: met by the unit and integration tests themselves, both tiers named here |
| 5 | `BUILD_COMMIT` longer than 12 characters returns its first 12 | Unit | Verifying it needs no navigation or interaction: it is a string rule in the service layer; the integration set-path test also asserts it over HTTP |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"` | covered at Integration, see Criterion coverage | Given BUILD_COMMIT is not set When a client requests GET /api/version Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the OpenAPI document When a reader opens /docs Then GET /api/version names the VersionResponse schema with version and commit |
| 4 | Tests cover set and unset paths | covered at Integration, see Criterion coverage | Given the backend test suite When it runs Then the set and unset commit tests report 0 failed |
| 5 | Longer than 12 characters truncated to 12 | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When a client requests GET /api/version Then commit is its first 12 characters |

## Manual verification plan
This feature has no UI. Every criterion is verified by an HTTP request with curl (or a browser address bar) against a backend started on the host, plus one test run. The backend runs from the repo root with uv; the endpoint needs no database.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: in a terminal at the repo root, `BUILD_COMMIT` not exported. Start the backend with `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` and leave it running.
1. In a second terminal run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is exactly `{"version":"0.1.0","commit":"unknown"}`: two keys, both string values.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`
Prerequisites: the backend from Criterion 1 is stopped (Ctrl+C).
1. Start it with the variable set: `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:create_app --factory --port 8010` → uvicorn logs `Application startup complete`.
2. Run `curl -s http://localhost:8010/api/version` → `{"version":"0.1.0","commit":"abc1234"}`.
3. Stop it, start it again with `BUILD_COMMIT=   ` (three spaces) in front of the same command, and repeat the curl → `"commit":"unknown"` (a blank value counts as unset).
4. Open `backend/app/routers/version.py` → it contains no commit string literal; `commit` is filled from `get_build_commit()`.
5. Build the image with the commit baked in: `docker build --build-arg BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 -t tasknotes-backend-test09 backend`, then `docker run --rm -p 8011:8010 tasknotes-backend-test09` and `curl -s http://localhost:8011/api/version` → `"commit":"0123456789ab"`. Stop the container with Ctrl+C.

### Criterion 3: Response body defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend from Criterion 1 is running.
1. Open `http://localhost:8010/docs` in a browser → the Swagger UI lists `GET /api/version`.
2. Expand it and open the 200 response schema → it is named `VersionResponse` with `version` (string, required) and `commit` (string, required).
3. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: none (these tests need no database).
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` → the summary reports `0 failed`.
2. Open `backend/tests/integration/test_version_integration.py` → there is one test with `BUILD_COMMIT` set and one with it deleted, each asserting the `commit` value.

### Criterion 5: `BUILD_COMMIT` longer than 12 characters returns its first 12
Prerequisites: no backend running on port 8010.
1. Start it with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:create_app --factory --port 8010`.
2. Run `curl -s http://localhost:8010/api/version` → `{"version":"0.1.0","commit":"0123456789ab"}` (exactly 12 characters).
3. Stop it, start it again with `BUILD_COMMIT=0123456789ab` (exactly 12), repeat the curl → `"commit":"0123456789ab"`, unchanged.
