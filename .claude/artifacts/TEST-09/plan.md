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
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service function `get_build_commit()` returns `settings.build_commit[:12]`; folded into criterion 2 above; covered by `test_get_build_commit_truncates_full_sha_to_first_12_characters` (unit) and `test_get_version_returns_first_12_characters_of_build_commit` (integration, with a 40-character sha), plus an exactly-12-character edge case. The comment overrides the description where they differ (the description implied the raw value).
- Description note (tracker, item text): "Registers a router in `backend/app/main.py`" → not acted on because the version router already exists (`backend/app/routers/version.py`, TEST-05) and is already registered in `backend/app/main.py` (`app.include_router(version_router)`). This feature extends that endpoint and **does not touch `backend/app/main.py`**. Registering a second router for the same path would shadow or duplicate the existing one.
- Assumption (ambiguity, recorded rather than blocking): a `BUILD_COMMIT` that is empty or whitespace-only is treated as unset and yields `"unknown"`, and surrounding whitespace is stripped before truncation. This mirrors how `CORS_ORIGINS` treats a blank value in the same settings module, and it is what lets `docker-compose.yml` pass the variable through as `${BUILD_COMMIT:-}` without restating the default in a second place.
- Assumption: the environment variable is named `BUILD_COMMIT` (the name the tracker comment uses, and the name `README.md` line 70 already documents as an optional `.env.example` key).

## Plan Overview
Backend-only extension of the existing `GET /api/version` endpoint (TEST-05). The settings module gains one field, `build_commit`, read per call from the `BUILD_COMMIT` environment variable with the declared default `"unknown"`. The version service gains `get_build_commit()`, which applies the 12-character cap. The `VersionResponse` schema gains a `commit: str` field, and the router fills it from the service. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container and `.env.example` documents it. No new router, no change to `backend/app/main.py`, no frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. Returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string anywhere in the router.
- Settings (`backend/app/core/config.py`): add module constant `UNKNOWN_BUILD_COMMIT = "unknown"`, a helper `_read_build_commit() -> str` that returns `os.environ.get("BUILD_COMMIT", "").strip()` or `UNKNOWN_BUILD_COMMIT` when that is empty, and a `Settings` field `build_commit: str = field(default_factory=_read_build_commit)`. Read per call, the same shape as `cors_origins`, so the module's invariant (every environment-varying value reads the environment, with a documented default) holds. Update the module docstring to name TEST-09.
- Service layer (`backend/app/services/version_service.py`): add `BUILD_COMMIT_MAX_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:BUILD_COMMIT_MAX_LENGTH]`. One-line docstring explaining why the cap exists (CI passes a full 40-character sha; clients get the short form). Module docstring names TEST-09.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`. Module docstring names TEST-09.
- Repository layer: none (no data access).
- Migrations: none.
- Run configuration: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (empty when unset, so the default lives only in `config.py`); `.env.example` gains a commented `# BUILD_COMMIT=` entry under a new `# --- Build ---` heading explaining that CI sets it to the full sha and the API reports the first 12 characters.
- `backend/app/main.py`: **not modified.** The version router is already registered there.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `application/json`, shape `{"version": string, "commit": string}`.
  - With `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `{"version": "<backend/pyproject.toml [project].version>", "commit": "0123456789ab"}`
  - With `BUILD_COMMIT=abc1234`: `{"version": "...", "commit": "abc1234"}`
  - With `BUILD_COMMIT` unset, empty or whitespace-only: `{"version": "...", "commit": "unknown"}`
- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- Build commit source: chose the standard library's `os.environ` read through the existing `Settings` dataclass `default_factory` over adding `pydantic-settings` or `python-dotenv`, because the module already reads `DATABASE_URL` and `CORS_ORIGINS` this way and a new dependency would buy nothing.
- 12-character cap: chose plain string slicing over any helper or library, because it is a one-expression rule.
- Response field: chose the already-installed Pydantic `BaseModel` (the existing `VersionResponse`) over a new schema class, because criterion 3 is satisfied by extending the schema that already defines this body.
- No net-new dependency; no lockfile changes.

## File Manifest
### New files
- [B] backend/tests/unit/test_version_schema_unit.py: unit tests that `VersionResponse` requires both `version` and `commit` as strings (criterion 3)
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus the truncation edge case
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `BUILD_COMMIT_MAX_LENGTH` and `get_build_commit()` applying the 12-character cap
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` (set, unset, truncation, exactly 12)
- [B] backend/tests/unit/test_config_unit.py: unit tests for `Settings.build_commit` (env value, default, blank treated as unset)
- [B] backend/tests/integration/test_version_integration.py: rename `test_get_version_returns_200_with_version_from_pyproject` to `test_get_version_returns_200_with_version_and_commit` and update it and `test_get_version_answers_when_database_url_is_unset` to the two-field body; add set, unset and truncation request/response tests
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service
- [B] .env.example: document the optional `BUILD_COMMIT` key

`backend/app/main.py` is deliberately absent from this manifest: the version router is already registered there by TEST-05, and this feature only changes the existing endpoint's body.

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: `README.md` line 70 already describes `.env.example` as carrying an optional `BUILD_COMMIT`, which this feature makes true, and `docs/DEVELOPMENT.md` defers environment keys to the README.

## Testing Strategy
- Unit tests: `get_build_commit()` in the service layer (set, unset, 40-character truncation, exactly 12 characters kept whole), `Settings.build_commit` resolution in `config.py` (env value, default when unset, blank and whitespace-only treated as unset), and `VersionResponse` field contract (both fields required strings; missing `commit` raises `ValidationError`). Settings tests use `monkeypatch.setenv` / `delenv`; service tests monkeypatch the environment and assert the resolution, not the literal default alone.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle on `GET /api/version` via `TestClient` with `BUILD_COMMIT` set to a short value, set to a 40-character sha, and unset; the two existing assertions updated to the two-field body; existing 405 test kept. Settings are read per call, so `monkeypatch` on the session `client` fixture takes effect per request. These tests need no database.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. The feature has no UI and no user-facing navigation or interaction (`testing_standards.md` Section 6, fourth question, answered per criterion below); an E2E spec calling the API directly would be a router integration test (Section 5 anti-pattern).
  - Directory: e2e/tests/ (no file for this feature)
  - File: none
- UAT scenarios: one scenario per criterion plus the truncation edge case, verifying the endpoint's response with the build commit set and unset.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_and_commit`, `test_get_version_answers_when_database_url_is_unset` | Verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters only | Unit | `test_get_build_commit_returns_configured_commit_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_keeps_exactly_12_character_value`, `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_version_returns_first_12_characters_of_build_commit` | Verifying it needs no navigation or interaction: it is configuration resolution and a string rule, proven at unit level and through the router by one integration test |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_version_response_requires_version_and_commit_strings`, `test_version_response_rejects_missing_commit` | Verifying it needs no navigation or interaction: it is a schema contract |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_returns_configured_build_commit`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_get_build_commit_returns_configured_commit_when_set`, `test_get_build_commit_returns_unknown_when_unset` | Verifying it needs no navigation or interaction: the criterion is about the unit and integration tiers themselves |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, max 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When a client requests GET /api/version, Then commit is its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When a client reads the OpenAPI document, Then the /api/version 200 response is the VersionResponse schema with version and commit |
| 4 | Tests cover set and unset paths | covered at Integration, see Criterion coverage | Given the repository, When the backend unit and integration suites run, Then the set and unset commit tests pass |

## Manual verification plan
This feature has no UI. Every criterion is verified by reading the API response from a terminal; the observable check is the JSON body.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: Docker running; a terminal at the repository root; no `BUILD_COMMIT` exported in the shell.
1. Run `docker compose up -d --build backend` → the backend container starts (and its `db` dependency becomes healthy).
2. Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/version` → prints `200`.
3. Run `curl -s http://localhost:8010/api/version` → prints a JSON object with exactly two keys, `version` (the `[project].version` value in `backend/pyproject.toml`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters only
Prerequisites: as for criterion 1.
1. With no `BUILD_COMMIT` set, run `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
2. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` (compose recreates the container because its environment changed), then `curl -s http://localhost:8010/api/version` → `commit` is `"0123456789ab"` (the first 12 characters).
3. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"abc1234"` (shorter than 12, returned whole).
4. Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"` (empty treated as unset).
5. Open `backend/app/routers/version.py` → it contains no literal commit string; the value comes from `get_build_commit()`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend running as in criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with string fields `version` and `commit`.
2. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; a terminal at the repository root.
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/unit/test_version_schema_unit.py tests/integration/test_version_integration.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. In that output's collected tests (rerun with `-v` to list them) → `test_get_build_commit_returns_configured_commit_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_configured_build_commit` and `test_get_version_returns_unknown_commit_when_build_commit_unset` each appear as passed.
