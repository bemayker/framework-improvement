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
- [ ] AC1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] AC2: `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification, a value longer than 12 characters is returned as its first 12 characters.
- [ ] AC3: The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] AC4: Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the description left the name open), and `version_service.get_build_commit()` returns `value[:12]`; a value of 12 characters or fewer is returned unchanged. Unit and integration tests assert the truncation with a 40-character sha. Folded into AC2 above.
- Assumption (no comment): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` treats a blank value in `backend/app/core/config.py`. Surrounding whitespace is stripped before truncation.
- Assumption (no comment): the feature Notes say the item "registers a router in `backend/app/main.py`", but on the plan base (b95ad3e) `main.py` already imports and registers `version_router` (TEST-05 delivered `GET /api/version`). This plan extends that existing route and does **not** modify `main.py`. Recorded so the scheduler does not serialize this build against BUG-01 on `main.py`.

## Plan Overview
Extend the existing TEST-05 version slice so `GET /api/version` also reports the build commit. One new settings field (`Settings.build_commit`, read per call from `BUILD_COMMIT`) is the single declared source; the service layer normalizes it (blank to `"unknown"`, truncate to 12 characters); the Pydantic `VersionResponse` gains a `commit: str` field; the router passes the service value through. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container and `.env.example` documents it. Backend only; no database, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. Router stays a thin pass-through: `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string in the router.
- Configuration (`backend/app/core/config.py`): add `build_commit: str | None = field(default_factory=lambda: os.environ.get("BUILD_COMMIT"))` to `Settings`, read per call exactly like `database_url` and `cors_origins` (`coding_standards.md` Section 5: within one settings module every deployment-dependent value reads the environment the same way). The field is the one declared source.
- Service layer (`backend/app/services/version_service.py`): add `UNKNOWN_COMMIT = "unknown"`, `COMMIT_LENGTH = 12`, and `get_build_commit() -> str`, which reads `get_settings().build_commit` on every call, strips it, returns `UNKNOWN_COMMIT` when the result is `None` or empty, and otherwise returns `value[:COMMIT_LENGTH]`. Reading per call (no caching) is what lets the integration tests set and unset the variable against the session-scoped `client` fixture.
- Repository layer: none (no data access).
- Migrations: none.
- Runtime wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`. The empty compose default is deliberate: the `"unknown"` default lives in one place only (the service), and a blank value resolves to it, so compose and code never carry two copies of the default.
- `backend/app/main.py`: unchanged (the version router is already registered).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: none
- Response: 200, `application/json`, body defined by `app.schemas.version.VersionResponse`:
  - With `BUILD_COMMIT=3f9a1c2b7d4e5f60718293a4b5c6d7e8f9012345`: `{"version": "0.1.0", "commit": "3f9a1c2b7d4e"}`
  - With `BUILD_COMMIT=abc1234`: `{"version": "0.1.0", "commit": "abc1234"}`
  - With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`
  - (`version` is the installed `task-notes-backend` distribution version, unchanged from TEST-05; `0.1.0` is illustrative.)
- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- Build-commit source: chose `os.environ.get` inside the existing `Settings` dataclass (standard library, the pattern `config.py` already uses) over adding `pydantic-settings` or a build-time generated module, because the stdlib read already covers a single string variable.
- Truncation and blank handling: chose `str.strip()` and slicing (standard library) over any helper dependency; no alternative needed.
- Response field: chose the existing `pydantic` `BaseModel` (already installed via FastAPI) by adding a field to `VersionResponse`; no new schema module.
- No net-new dependency, component or module is introduced; every change extends an existing file.

## File Manifest
### New files
No new files are created by the backend phase; the only new files are the mandated UAT artifacts below.
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/core/config.py: add `Settings.build_commit`, read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `UNKNOWN_COMMIT`, `COMMIT_LENGTH` and `get_build_commit()` (strip, blank to unknown, truncate to 12)
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` (set short, set 40-char truncated, exactly 12, unset, blank, whitespace-padded)
- [B] backend/tests/unit/test_config_unit.py: unit tests that `Settings.build_commit` reads `BUILD_COMMIT` per call and is `None` when unset
- [B] backend/tests/integration/test_version_integration.py: update the exact-body assertions to include `commit`, add set (40-char sha returns first 12) and unset (returns `"unknown"`) HTTP cases
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service
- [B] .env.example: document the optional `BUILD_COMMIT` variable (empty by default, resolves to `"unknown"`)
No dependency manifest changes, so no lockfile is regenerated. No `README.md` or `docs/DEVELOPMENT.md` edit is needed: `README.md` already describes `.env.example` as carrying an optional `BUILD_COMMIT`, which this change makes true, and project structure, dependencies and test infrastructure are unchanged.
No E2E spec is planned: every criterion is covered at unit or integration tier (see Criterion coverage).

## Testing Strategy
- Unit tests: `version_service.get_build_commit()` with `get_settings` monkeypatched or `BUILD_COMMIT` set via `monkeypatch.setenv`: short value returned verbatim, 40-character sha truncated to its first 12, exactly-12 value unchanged, unset returns `"unknown"`, blank and whitespace-only return `"unknown"`, surrounding whitespace stripped. `Settings.build_commit` reads the environment per call and is `None` when unset.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_version_service_unit.py`, `test_config_unit.py`)
- Integration tests: real HTTP cycle through `TestClient`: `BUILD_COMMIT` set to a 40-character sha returns 200 with `commit` equal to its first 12 characters; `BUILD_COMMIT` unset returns 200 with `commit == "unknown"`; existing TEST-05 tests updated to assert the full two-field body; 405 on POST unchanged. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. No criterion requires navigation or interaction through the UI; the frontend does not consume `commit` (that is TEST-10).
  - Directory: e2e/tests/
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (blank `BUILD_COMMIT`), API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router request/response behaviour, and no UI renders `commit` yet |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, truncated to 12), never a router literal | Unit | Verifying it needs no navigation or interaction: it is a configuration and service rule, asserted on `get_build_commit()` and `Settings.build_commit` (integration also asserts the set and unset bodies) |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a structural fact, asserted by `VersionResponse.model_fields` containing `version` and `commit` (and the router's `response_model`) |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | Verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests above existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default unknown, first 12 chars | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit is its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API's OpenAPI document, When the VersionResponse schema is read, Then it lists version and commit as required strings |
| 4 | Tests cover set and unset paths | covered at Integration, see Criterion coverage | Given the backend test suite, When the version tests run, Then 0 failed |

## Manual verification plan
None of these criteria can be verified through the web UI: the frontend does not display `commit` (TEST-10 adds that). Each block below gives the observable check instead, run from the repository root.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: Docker running; `.env` copied from `.env.example`; stack started with `docker compose up -d --build`.
1. Open `http://localhost:8010/api/version` in a browser → the page shows a JSON object with exactly two keys, `version` (for example `0.1.0`) and `commit`, both strings.
2. Run `curl -s -o /dev/null -w '%{http_code}' http://localhost:8010/api/version` → prints `200`.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters
Prerequisites: stack from Criterion 1 is running.
1. With `BUILD_COMMIT` absent from `.env`, run `docker compose up -d backend`, then open `http://localhost:8010/api/version` → `commit` reads `unknown`.
2. Run `BUILD_COMMIT=3f9a1c2b7d4e5f60718293a4b5c6d7e8f9012345 docker compose up -d backend`, then reload `http://localhost:8010/api/version` → `commit` reads `3f9a1c2b7d4e` (12 characters).
3. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then reload → `commit` reads `abc1234`.
4. Run `BUILD_COMMIT=' ' docker compose up -d backend`, then reload → `commit` reads `unknown`.
5. Open `backend/app/routers/version.py` → it contains no quoted commit value; `commit` is populated only from `get_build_commit()`.

### Criterion 3: Response body defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: stack from Criterion 1 is running.
1. Open `http://localhost:8010/docs`, expand `GET /api/version` → the 200 response schema is `VersionResponse` with required string fields `version` and `commit`.
2. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: a backing Postgres per `CLAUDE.md` Backing Services is not required for these files (the version tests need no database).
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` → the summary line reports `0 failed`.
2. Read `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` → each has at least one test with `BUILD_COMMIT` set (including a 40-character sha) and one with it unset.
