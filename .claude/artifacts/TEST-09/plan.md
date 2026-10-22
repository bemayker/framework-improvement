# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A client can ask the API which build it is talking to.
>
> Notes: Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete. Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.
- [ ] 5. (from the tracker comment, which amends criterion 2) When `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the comment names it; the description did not), the service truncates to its first 12 characters (`BUILD_COMMIT_LENGTH = 12` in `version_service.py`), a value of 12 characters or fewer is returned unchanged, and the truncation is listed as acceptance criterion 5 with its own unit and integration tests. The second sentence is read as context for why truncation exists, not as a request to change CI: no workflow in this repository sets `BUILD_COMMIT` today, and `.github/workflows/pr-tests.yml` is plugin-owned (`/sync-project` regenerates it), so this plan does not edit it. Assumption recorded: whoever builds the deployable image sets `BUILD_COMMIT`; `docker-compose.yml` passes it through with the `unknown` default.
- Main-branch check (requested by the dispatch, not a `[merged-since]` notice): `GET /api/version` already exists on main from TEST-05 (`backend/app/routers/version.py`, `backend/app/schemas/version.py`, `backend/app/services/version_service.py`, registered in `backend/app/main.py`), returning `{"version": ...}` only. → Re-scoped: this plan extends those files with `commit` rather than creating a router, and `backend/app/main.py` is NOT modified (the router is already registered; the description's "Registers a router" note and the `feature_map.md` shared-risk note predate that). No entry repeats work main already delivered.

## Plan Overview
Extend the existing TEST-05 version endpoint with a `commit` field. One declared source: `Settings.build_commit` in `backend/app/core/config.py`, read per call from the `BUILD_COMMIT` environment variable, stripped, with a blank or unset value falling back to the documented default `"unknown"` (the same shape `cors_origins` already uses in that module, satisfying `coding_standards.md` Section 5's one-way-per-settings-module invariant). The service layer (`version_service.get_build_commit()`) reads the settings and truncates to the first 12 characters. The schema gains `commit: str`; the router passes the service value through and holds no literal. `docker-compose.yml` passes `BUILD_COMMIT` to the backend as `${BUILD_COMMIT:-unknown}` and `.env.example` documents it. Backend only: no frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05) now returns `version` and `commit`. No new route; no change to `backend/app/main.py`.
- Service layer: `backend/app/services/version_service.py` gains `BUILD_COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which calls `get_settings()` per invocation (so a changed environment is seen without restarting, as `database_url` already is) and returns `settings.build_commit[:BUILD_COMMIT_LENGTH]`. `get_app_version()` is unchanged.
- Configuration: `backend/app/core/config.py` gains `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (`os.environ.get("BUILD_COMMIT")`, stripped, blank or unset gives the default), and a `build_commit: str = field(default_factory=_read_build_commit)` field on `Settings`, with a comment naming the variable and its default. Truncation lives in the service, not here, so `Settings` reports what was configured and the endpoint's 12-character rule lives in one place.
- Schema: `backend/app/schemas/version.py` `VersionResponse` gains `commit: str` (with a `Field(description=...)` naming the 12-character truncation and the `unknown` default).
- Router: `backend/app/routers/version.py` returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`; docstrings updated to name TEST-09.
- Runtime wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`; `.env.example` gains a commented optional `BUILD_COMMIT=` entry.
- Repository layer: none. Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `VersionResponse`:
  - `version`: string, from installed package metadata (unchanged, TEST-05).
  - `commit`: string, the first 12 characters of `BUILD_COMMIT`; the whole value when it is 12 characters or fewer; `"unknown"` when the variable is unset or blank.
  - Example with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `{"version": "0.1.0", "commit": "0123456789ab"}`
  - Example with `BUILD_COMMIT` unset: `{"version": "0.1.0", "commit": "unknown"}`
- Errors: `POST /api/version` stays 405 (existing behaviour).

## Technology Selection
- No net-new component, module or dependency: every change extends an existing file. Reading the variable uses the standard library (`os.environ`) inside the existing `Settings` dataclass, chosen over adding `pydantic-settings`, which the project does not install and which a single string field does not justify; truncation is a stdlib string slice; the schema uses the already-installed `pydantic`.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit` field; module docstring notes TEST-09.
- [B] backend/app/services/version_service.py: `BUILD_COMMIT_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: `commit: str` on `VersionResponse`.
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response.
- [B] docker-compose.yml: backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`.
- [B] .env.example: documented optional `BUILD_COMMIT` entry (commented out, default `unknown` stated).
- [B] backend/tests/unit/test_config_unit.py: `build_commit` reads the env value, defaults to `unknown` when unset, treats a blank value as unset.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` truncates a 40-character value to 12, returns a 12-character value unchanged, returns a shorter value unchanged, returns `unknown` when unset.
- [B] backend/tests/integration/test_version_integration.py: the two existing body assertions include `commit` (with `BUILD_COMMIT` deleted so they are deterministic); new tests for the set (40-character, truncated) and unset paths through the HTTP cycle.
- [Docs] docs/DEVELOPMENT.md: the existing `BUILD_COMMIT` paragraph under Running tests locally is corrected to what this feature delivers: drop the claim that the app footer shows the commit (that is TEST-10, not built) and the claim that CI passes it (no workflow does); keep the compose pass-through, the 12-character rule and the `unknown` default.

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `package-lock.json`) is touched. `README.md` needs no edit: its `.env.example` line already names the optional `BUILD_COMMIT`, which this feature makes true. No E2E spec is produced, because no criterion's covering tier is E2E (Criterion coverage below).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank) in `test_config_unit.py`; `get_build_commit()` truncation and fallback in `test_version_service_unit.py`, with the environment set through `monkeypatch.setenv` / `monkeypatch.delenv` so the test asserts the resolution from the variable, not the literal default alone (`coding_standards.md` Section 5). Naming per `testing_standards.md` Section 3, e.g. `test_get_build_commit_truncates_full_sha_to_twelve_characters`, `test_get_build_commit_returns_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/version` through the shared `client` fixture (settings are read per request, so `monkeypatch` on `BUILD_COMMIT` takes effect on the session client): 200 with exactly `{"version", "commit"}` keys; `BUILD_COMMIT` set to a 40-character sha returns its first 12; unset returns `unknown`; existing DATABASE_URL-unset and 405 tests kept, the former updated for the new key. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: none. E2E is enabled, but no criterion requires navigation or interaction through the UI (no UI consumes `commit` until TEST-10).
  - Directory: e2e/tests/
  - File: none produced
- UAT scenarios: one scenario per criterion plus one edge case (a value of exactly 12 characters returned unchanged), verified against the running backend.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour |
| 2 | `commit` comes from one declared source, default `unknown` | Unit | verifying it needs no navigation or interaction: it is configuration resolution in `Settings` and the service, asserted from the environment variable |
| 3 | Response body is a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the router's `response_model` shapes the HTTP body, asserted as an exact key set |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | verifying it needs no navigation or interaction: it is met by the unit and integration tests themselves, run by the test gate |
| 5 | Longer than 12 characters returns only the first 12 | Unit | verifying it needs no navigation or interaction: it is a string rule in the service, also asserted end to end by one integration test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the status is 200 and the body has `version` and `commit` strings |
| 2 | One declared source, default `unknown` | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is unset When a client requests GET /api/version Then `commit` is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running When a client reads the OpenAPI document Then GET /api/version responds with the VersionResponse schema carrying `version` and `commit` |
| 4 | Tests cover set and unset paths | covered at Unit, see Criterion coverage | Given the repository When the backend unit and integration version tests run Then 0 failed |
| 5 | Truncation to 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When a client requests GET /api/version Then `commit` is its first 12 characters |

## Manual verification plan
No UI consumes this endpoint yet (TEST-10 will), so every criterion is verified against the running backend with curl, the OpenAPI document and the test suite, as TEST-06's, TEST-07's and FEAT-1's scripts were.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is running from the repository root with `docker compose up -d --build` and the backend answers on http://localhost:8010.
1. In a terminal, run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/version` → prints `200`.
2. Run `curl -s http://localhost:8010/api/version` → prints a JSON object with exactly two keys, `version` (`"0.1.0"`, the value in `backend/pyproject.toml`) and `commit` (a string).

### Criterion 2: `commit` comes from one declared source, default `"unknown"`
Prerequisites: the stack is running as above, started with no `BUILD_COMMIT` in the shell and none in `.env`.
1. Run `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
2. Restart the backend with a short value: `BUILD_COMMIT=abc1234 docker compose up -d backend` → the container is recreated.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `"abc1234"`, proving the value comes from the environment.
4. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()`.
5. Restore: `docker compose up -d backend` with `BUILD_COMMIT` unset → `commit` is `"unknown"` again.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack is running as above.
1. Open http://localhost:8010/docs in a browser → the `GET /api/version` operation is listed.
2. Expand it and look at the 200 response schema → it is `VersionResponse` with `version` (string) and `commit` (string).
3. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL instance is reachable for the integration tier (`docker compose up -d db`), per docs/DEVELOPMENT.md → Running tests locally.
1. From the repository root run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the run ends with `0 failed`.
2. Read the test names in those three files → there is at least one test for `BUILD_COMMIT` set and one for it unset in both the unit and the integration file.

### Criterion 5: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12
Prerequisites: the stack is running as above.
1. Restart the backend with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` → the container is recreated.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `"0123456789ab"` (12 characters).
3. Edge case: restart with exactly 12 characters, `BUILD_COMMIT=0123456789ab docker compose up -d backend`, and repeat the curl → `commit` is `"0123456789ab"`, unchanged.
4. Restore: `docker compose up -d backend` with `BUILD_COMMIT` unset → `commit` is `"unknown"`.
