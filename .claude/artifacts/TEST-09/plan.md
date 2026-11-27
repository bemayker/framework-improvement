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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification: when `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 characters.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service function `get_build_commit()` truncates the configured value to its first 12 characters (a value of 12 characters or fewer is returned unchanged, so the `"unknown"` default is unaffected). Folded into criterion 2 above and covered by unit test `test_get_build_commit_truncates_full_sha_to_first_12_characters` and integration test `test_get_version_returns_first_12_characters_of_full_sha_commit`. The comment overrides the description, which named no length rule. Assumption: truncation is applied to the raw environment value after surrounding whitespace is stripped; the settings object keeps the full value and the service owns the 12-character rule (a response-shaping rule, not configuration).
- Assumption (no comment, recorded per `user_story_alignment.md` Section 4): a blank or whitespace-only `BUILD_COMMIT` is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`. This also lets `docker-compose.yml` pass `${BUILD_COMMIT:-}` through without restating the default, so `"unknown"` lives in exactly one place.
- Assumption: "set at build time" is satisfied by the deploy/CI process setting the `BUILD_COMMIT` environment variable on the backend process (passed through by `docker-compose.yml`); no Dockerfile `ARG` is added, because nothing in the repository builds images with a commit argument today and adding a build-arg pipeline is beyond the criteria.
- Scheduling note (from dispatch): BUG-01 is planned concurrently and may register a router in `backend/app/main.py`. The version router is already registered there by TEST-05 (`app.include_router(version_router)`), so this plan does not edit `backend/app/main.py` and it is absent from the File Manifest. The feature's note "Registers a router in backend/app/main.py" is stale against the current code and is not acted on.

## Plan Overview
Extend the existing TEST-05 endpoint `GET /api/version` (already routed and registered) with a `commit` field. The value has one declared source: a new `build_commit` field on `Settings` in `backend/app/core/config.py`, read per call from the `BUILD_COMMIT` environment variable with the documented default `"unknown"`. A new service function `get_build_commit()` in `backend/app/services/version_service.py` reads it through `get_settings()` and returns at most its first 12 characters. `VersionResponse` in `backend/app/schemas/version.py` gains `commit: str`, and the router fills it from the service. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container and `.env.example` documents it. Backend only; no database, no frontend.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response now `{"version": str, "commit": str}`. No new route; `backend/app/main.py` is unchanged (router already included).
- Service layer: `backend/app/services/version_service.py` gains `BUILD_COMMIT_MAX_LENGTH = 12` and `get_build_commit() -> str`, which returns `get_settings().build_commit[:BUILD_COMMIT_MAX_LENGTH]`. Settings are read per call (no caching), so a test that sets `BUILD_COMMIT` with `monkeypatch.setenv` sees it through the shared session-scoped `client` fixture.
- Settings: `backend/app/core/config.py` gains `DEFAULT_BUILD_COMMIT = "unknown"`, a helper `_read_build_commit()` returning `os.environ.get("BUILD_COMMIT", "").strip() or DEFAULT_BUILD_COMMIT`, and the field `build_commit: str = field(default_factory=_read_build_commit)`. This follows the module's existing per-call `default_factory` pattern, which `coding_standards.md` Section 5's invariant asks for (every environment-varying value in the module read the same way, with a documented default). Update the module docstring to mention BUILD_COMMIT.
- Router: `backend/app/routers/version.py` returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`; no literal commit string in the router. Update the module docstring to name TEST-09.
- Schema: `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`.
- Repository layer: none (no data access).
- Migrations: none.
- Runtime configuration: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (empty when unset, so the default stays in `config.py` only); `.env.example` gains a commented `BUILD_COMMIT=` entry under a new `# --- Backend build ---` heading explaining CI sets the full sha and the API reports its first 12 characters.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version
- Request: none (no query, no body)
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`. `version` is unchanged from TEST-05 (the installed distribution's version, `"unknown"` if not installed). `commit` is at most 12 characters. Other methods (e.g. POST) remain 405.

## Technology Selection
- Commit source (`Settings.build_commit`): chose the standard library `os.environ` read through the module's existing dataclass `default_factory` over adding `pydantic-settings` or `python-dotenv`, because the stdlib covers reading one variable and the module already uses this pattern.
- Truncation (`get_build_commit()`): chose a plain string slice over any git or hashing library, because the value is already a sha string and only needs shortening.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/tests/unit/test_version_schema_unit.py: unit tests proving `VersionResponse` is a Pydantic model in `app.schemas.version` declaring `version` and `commit` as required strings (criterion 3)
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (full 40-character sha truncated to 12)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` settings field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `BUILD_COMMIT_MAX_LENGTH` and `get_build_commit()` returning the first 12 characters of the configured commit
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`
- [B] backend/tests/unit/test_config_unit.py: tests for `build_commit` set, unset and blank
- [B] backend/tests/unit/test_version_service_unit.py: tests for `get_build_commit()` set, unset, short value and full-sha truncation
- [B] backend/tests/integration/test_version_integration.py: update the two existing exact-body assertions to include `commit`, and add set, unset and full-sha request/response tests
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service
- [B] .env.example: document the optional `BUILD_COMMIT` variable

No dependency is added or changed, so no lockfile is produced. `README.md` already describes `.env.example` as carrying an optional `BUILD_COMMIT`, and `docs/DEVELOPMENT.md` defers environment variables to `.env.example`, so neither needs an edit. `backend/app/main.py` is not modified: the version router is already registered there.

## Testing Strategy
- Unit tests: settings resolution of `BUILD_COMMIT` (`backend/app/core/config.py`), the service rule `get_build_commit()` (unset, blank, short value, full 40-character sha truncated to 12), and the schema's declared fields. All isolated with `monkeypatch` on the environment; no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_config_unit.py`, `test_version_service_unit.py`, `test_version_schema_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` through the `client` fixture with `BUILD_COMMIT` set, unset and a full sha; the two existing TEST-05 tests updated so their exact-body assertions include `commit` (with `BUILD_COMMIT` deleted via monkeypatch so the expected value is `"unknown"` deterministically). No database is needed.
  - Directory: backend/tests/integration/
- E2E tests: none. No acceptance criterion involves UI navigation or interaction; the endpoint has no frontend consumer in this item (TEST-10 is the downstream consumer). Per `testing_standards.md` Section 5, an E2E spec that only calls the API is a router integration test.
  - Directory: e2e/tests/
  - File: not produced
- UAT scenarios: one Gherkin scenario per criterion plus the full-sha truncation edge case, phrased against the API response.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_and_commit_strings`, `test_get_version_returns_200_with_version_from_pyproject` | verifying it needs no navigation or interaction: it is a router request/response behaviour |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters), never a router literal | Unit | `test_get_build_commit_returns_configured_value_when_set`, `test_get_build_commit_returns_unknown_when_build_commit_unset`, `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_settings_build_commit_reads_environment_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset` | verifying it needs no navigation or interaction: it is a configuration and service rule |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_version_response_is_a_pydantic_model_in_schemas`, `test_version_response_requires_version_and_commit_strings` | verifying it needs no navigation or interaction: it is a schema declaration |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_returns_commit_from_build_commit_env`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_get_version_returns_first_12_characters_of_full_sha_commit` | verifying it needs no navigation or interaction: it is the router wiring of the set and unset paths (unit side listed in row 2) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When GET /api/version Then commit is its first 12 characters; Given BUILD_COMMIT is unset Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the OpenAPI document at /openapi.json When the VersionResponse schema is read Then it declares required string properties version and commit |
| 4 | Tests cover set and unset paths | covered at Integration, see Criterion coverage | Given the backend test suites When they run Then the BUILD_COMMIT set and unset tests pass |

## Manual verification plan
### Criterion 1: GET /api/version returns 200 with version and commit strings
Prerequisites: repository checked out, `uv` installed, port 8010 free. This criterion has no UI; it is verified over HTTP from a terminal.
1. In a terminal at the repository root run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:app --port 8010` → the log shows `Uvicorn running on http://127.0.0.1:8010` (a warning that DATABASE_URL is not set is expected and harmless).
2. In a second terminal run `curl -i http://localhost:8010/api/version` → the status line is `HTTP/1.1 200 OK` and the body is a JSON object with exactly two keys, `version` (equal to `[project].version` in `backend/pyproject.toml`) and `commit`, both strings.

### Criterion 2: commit comes from BUILD_COMMIT, default "unknown", first 12 characters
Prerequisites: the server from Criterion 1 step 1 is running with the 40-character `BUILD_COMMIT` shown there.
1. Run `curl -s http://localhost:8010/api/version` → `commit` is `0123456789ab` (the first 12 characters of the value set), not the full 40-character sha.
2. Stop the server (Ctrl+C) and restart it with `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:app --port 8010` → server starts.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (a value of 12 characters or fewer is returned unchanged).
4. Stop the server and restart it with no BUILD_COMMIT: `uv run --directory backend uvicorn app.main:app --port 8010` → server starts.
5. Run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
6. Open `backend/app/routers/version.py` → the `commit` value is taken from `get_build_commit()`, and no commit string literal appears in the file.

### Criterion 3: response body defined by a Pydantic schema in backend/app/schemas/
Prerequisites: the server from Criterion 2 step 4 is running.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response shows the schema `VersionResponse` with fields `version` (string) and `commit` (string).
2. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: repository checked out, `uv` installed. No database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_schema_unit.py tests/integration/test_version_integration.py` → the run passes: the summary line reports no failed or errored test, and the command exits 0.
2. Read the test names in `tests/unit/test_version_service_unit.py` and `tests/integration/test_version_integration.py` → each file has at least one test for BUILD_COMMIT set and one for BUILD_COMMIT unset.
