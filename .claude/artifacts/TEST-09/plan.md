# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A client can ask the API which build it is talking to.
>
> Acceptance criteria (ClickUp task 123k99cwybk, fetched via clickup_get_task, workspace 30307190):
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> Notes: Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete. Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router; when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12 (tracker comment, below).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: folded into criterion 2 above; truncation to the first 12 characters is done in `backend/app/services/version_service.py` (`get_build_commit`), with unit cases for a 40-character sha (12 returned), exactly 12 characters (unchanged) and a shorter value (unchanged), and an integration case setting a 40-character sha and asserting the 12-character prefix.
- Assumption (no comment covers it): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and reports `"unknown"`. Reason: `docker-compose.yml` passes the variable through as `${BUILD_COMMIT:-}`, which yields an empty string on a local run where nothing is set, and an empty `commit` would be a less useful answer than the declared default. Surrounding whitespace is stripped before truncation.
- Assumption: the router registration the feature notes mention already exists. `backend/app/main.py` has included `version_router` since TEST-05, so this item extends the existing `GET /api/version` slice and does NOT edit `main.py`. This keeps it disjoint from BUG-01 (which recreates `server_time.py` and registers it in `main.py`).
- Merged since the last plan: n/a (fresh plan, branched from current main 379b0a5).

## Plan Overview
Extend the existing version endpoint (TEST-05) so its response carries a `commit` field next to `version`. The commit is read from one declared source: a `build_commit` field on `Settings` in `backend/app/core/config.py`, populated per call from the `BUILD_COMMIT` environment variable, defaulting to `"unknown"` when unset or blank. The service layer returns that value truncated to its first 12 characters; the router only assembles the schema. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container and `.env.example` documents it. Backend only; no frontend changes (showing the commit in the footer is TEST-10).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`) now returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No new router, no registration change in `backend/app/main.py`.
- Configuration: `backend/app/core/config.py` gains `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (reads `os.environ.get("BUILD_COMMIT")`, strips it, returns the default when the result is empty), and a `Settings.build_commit: str = field(default_factory=_read_build_commit)`, following the existing per-call `default_factory` pattern used for `database_url` and `cors_origins` so a test that sets the variable after import sees it. This is the one declared source (criterion 2).
- Service layer: `backend/app/services/version_service.py` gains `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which returns `get_settings().build_commit[:COMMIT_LENGTH]`. Truncation lives here, not in config, so config stays the raw declared value and the business rule from the tracker comment is unit-testable in one place.
- Schema: `backend/app/schemas/version.py` `VersionResponse` gains `commit: str` (criterion 3).
- Deployment wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` so a value exported at build or run time reaches the container; `.env.example` gains a commented `BUILD_COMMIT=` entry explaining it is optional and defaults to `unknown`.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}
```

  With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

  `version` keeps TEST-05's behaviour (installed package metadata, `"unknown"` when not installed). `commit` is at most 12 characters.

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ` inside the existing dataclass `Settings` over adding `pydantic-settings` or `python-dotenv`, because the project's settings module already reads every deployment-dependent value this way and a new dependency is not warranted for one variable.
- Truncation to 12 characters: chose a plain string slice over any helper or library; nothing else is needed.
- Response field: chose to extend the existing Pydantic `VersionResponse` (Pydantic is already installed via FastAPI) over a new schema.
- No net-new module or dependency is introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per acceptance criterion plus the truncation edge case.
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and `Settings.build_commit` read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()` returning the first 12 characters of `Settings.build_commit`.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`.
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service.
- [B] .env.example: document the optional `BUILD_COMMIT` variable and its `unknown` default.
- [B] backend/tests/unit/test_config_unit.py: cases for `Settings.build_commit` set, unset and blank.
- [B] backend/tests/unit/test_version_service_unit.py: cases for `get_build_commit()` with a 40-character sha, exactly 12 characters, a short value, and the unset default.
- [B] backend/tests/integration/test_version_integration.py: update the existing exact-body assertions to include `commit`, and add set (40-character sha, 12-character prefix returned) and unset (`unknown`) request cycles.

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` edit is expected: both already describe `BUILD_COMMIT` (README's `.env.example` line and DEVELOPMENT.md's `BUILD_COMMIT` paragraph, including the 12-character rule and the compose passthrough this plan adds), so the build's Section 15 check should find them accurate. `backend/app/main.py` is not edited (the version router is already registered).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank or whitespace-only falls back to `unknown`, surrounding whitespace stripped) in `test_config_unit.py`; `get_build_commit()` truncation and default in `test_version_service_unit.py`, using `monkeypatch.setenv` and `monkeypatch.delenv` (no mocking of the settings module needed, since it reads per call).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle through `create_app()` and `TestClient` with `BUILD_COMMIT` set to a 40-character sha (asserts 200 and `commit` equal to the first 12 characters) and unset (asserts `commit` equal to `unknown`); existing TEST-05 tests updated to the two-field body. Assert the resolution from the environment, not the literal default alone.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No acceptance criterion involves navigation or interaction through the UI; the feature is backend only and changes no screen.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, validated for well-formedness only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router request/response cycle |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`), first 12 characters only | Unit and Integration | verifying it needs no navigation or interaction: it is configuration resolution and a truncation rule, checked in the service and through the router |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the router's `response_model` and the exact JSON body are asserted in the request cycle |
| 4 | Unit and integration tests cover set and unset commit paths | Unit and Integration | it is a statement about the tests themselves, satisfied by the unit and integration cases above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the API is running When a client requests GET /api/version Then the response is 200 with string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, 12 characters max | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When GET /api/version is requested Then commit is its first 12 characters; Given BUILD_COMMIT is unset Then commit is unknown |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the API is running When GET /api/version is requested Then the body has exactly the keys version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite When the version and config tests run Then 0 failed |

## Manual verification plan
This feature has no UI: every criterion is verified against the API with `curl` (or a browser tab on the URL) and the test suite. The backend listens on http://localhost:8010 under `docker compose up`.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
Prerequisites: stack running with `docker compose up -d --build` from the repo root, no `BUILD_COMMIT` exported in the shell.
1. Run `curl -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK`, `content-type: application/json`.
2. Read the body → it is `{"version":"0.1.0","commit":"unknown"}` (the version is whatever `backend/pyproject.toml` `[project].version` says), with both values as quoted strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters only
Prerequisites: stack from Criterion 1 running.
1. Run `curl -s http://localhost:8010/api/version` with `BUILD_COMMIT` unset → `commit` is `unknown`.
2. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` from the repo root → the backend container is recreated.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `0123456789ab` (the first 12 of the 40 characters, nothing more).
4. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (a value shorter than 12 characters is returned unchanged).
5. Open `backend/app/routers/version.py` → no commit string literal appears in it; the value comes from `get_build_commit()`.
6. Run `docker compose up -d backend` with `BUILD_COMMIT` unset again, then curl → `commit` is back to `unknown`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: stack running.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open http://localhost:8010/docs, expand `GET /api/version` → the 200 response schema is `VersionResponse` with the two string properties `version` and `commit`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: a test database recorded for the run, or one started per `CLAUDE.md` Backing Services (the version tests do not need it, the shared fixtures may).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → summary line shows `0 failed`.
2. Read the test names in those files → there is at least one case with `BUILD_COMMIT` set (including a 40-character sha) and one with it unset, at both the unit and integration tier.
