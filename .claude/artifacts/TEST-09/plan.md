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

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. Amended by the tracker comment below: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT`; `get_build_commit()` in `backend/app/services/version_service.py` returns the first 12 characters of a longer value and a value of 12 characters or fewer verbatim; unit and integration tests assert a 40-character sha comes back as its first 12 characters. The comment overrides the description where they differ (the description named no variable and no length limit). Assumption recorded: the default `unknown` (7 characters) is returned verbatim, and a blank or whitespace-only `BUILD_COMMIT` counts as unset and yields `unknown`, so the endpoint never answers an empty commit.
- Dispatch note (feature_map shared risk): "there may already be a version endpoint from TEST-05" → Addressed by: confirmed. `GET /api/version` exists (TEST-05: `backend/app/routers/version.py`, `backend/app/schemas/version.py`, `backend/app/services/version_service.py`) and its router is already registered in `backend/app/main.py`. This plan extends those files and does not touch `backend/app/main.py` at all, so the item description note "Registers a router in backend/app/main.py" is satisfied by the existing registration and is not acted on as a new edit.
- Merged since the last plan: n/a (fresh plan on current main 68540ed; the earlier TEST-09 merge 3dd809b was undone by the sandbox reset c21ade6, and `docs/DEVELOPMENT.md` still carries its `BUILD_COMMIT` paragraph, which this plan makes true again rather than rewriting).

## Plan Overview
Backend only. Extend the existing TEST-05 version endpoint so `GET /api/version` also returns `commit`, the build commit read from one declared source: the `BUILD_COMMIT` environment variable, resolved in the settings module `backend/app/core/config.py` (default `unknown` when unset or blank, the same per-call `default_factory` pattern `database_url` and `cors_origins` already use, per `coding_standards.md` Section 5). The version service shortens a value longer than 12 characters to its first 12 (tracker comment). The Pydantic `VersionResponse` schema gains `commit: str`; the router passes the service result in and holds no literal. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container with the default `unknown`, and `.env.example` documents it. No frontend, no database, no new dependency, no `main.py` change.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), now returning `version` and `commit`. No new endpoint, no new router, no change to the router registration in `backend/app/main.py`.
- Settings (`backend/app/core/config.py`): add `build_commit: str` to the frozen `Settings` dataclass with a `default_factory` that reads `BUILD_COMMIT` from the environment per call, strips surrounding whitespace, and falls back to the module constant `DEFAULT_BUILD_COMMIT = "unknown"` when the variable is unset or blank. This is the one declared source for the commit (criterion 2) and matches how `database_url` and `cors_origins` are already read (`coding_standards.md` Section 5: within one settings module, environment-dependent values are configured the same way, with a documented default).
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`, so a full 40-character sha is reported as its first 12 characters and a value of 12 characters or fewer (including `unknown`) is returned unchanged. `get_app_version()` is unchanged.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str` beside `version: str` (criterion 3).
- Router (`backend/app/routers/version.py`): return `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No string literal for the commit in the router (criterion 2).
- Runtime configuration: `docker-compose.yml` backend `environment:` gains a `BUILD_COMMIT` entry passed through from the host with the Compose default `unknown` (the same dollar-brace default form the `CORS_ORIGINS` line beside it uses), so CI or an image build that exports the full sha reaches the container; `.env.example` gains a commented `BUILD_COMMIT` entry explaining it is optional and set by CI. CI workflow files are not changed: the item asks for the endpoint to read the variable, not for a pipeline to set it.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, body defined by `VersionResponse` in `backend/app/schemas/version.py`: `version` (string, the installed `task-notes-backend` distribution version, unchanged from TEST-05) and `commit` (string, the first 12 characters of `BUILD_COMMIT`, or `unknown` when it is unset or blank). Example with `BUILD_COMMIT` set to a 40-character sha:
```json
{"version": "0.1.0", "commit": "0123456789ab"}
```
Example with BUILD_COMMIT unset:
```json
{"version": "0.1.0", "commit": "unknown"}
```

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ.get` inside the existing `Settings` dataclass `default_factory` over adding `pydantic-settings` or `python-dotenv`, because the settings module already reads every environment value this way and a new dependency for one variable is what a few lines cover.
- Shortening to 12 characters: chose a standard string slice (`value[:12]`) over any hashing or git library, because the value is already the sha and only needs truncating.
- Response shape: chose the existing Pydantic `VersionResponse` model (installed through FastAPI) over a new schema module, because criterion 3 is met by adding one field to the schema that already defines this body.
- No other net-new component, module or dependency is introduced; no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the 40-character truncation and blank-value edge cases (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT = "unknown"` and `Settings.build_commit`, read per call from `BUILD_COMMIT`, stripped, blank or unset falling back to the default
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()` returning the first 12 characters of the configured commit
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` beside `version`
- [B] docker-compose.yml: pass `BUILD_COMMIT` through to the backend service environment with the default `unknown`
- [B] .env.example: document the optional `BUILD_COMMIT` variable (commented out; set by CI to the full sha)
- [B] backend/tests/unit/test_config_unit.py: `build_commit` read from `BUILD_COMMIT`, defaults to `unknown` when unset, blank treated as unset, whitespace stripped
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set path (12-character value verbatim), 40-character sha shortened to its first 12, unset path returns `unknown`
- [B] backend/tests/integration/test_version_integration.py: update the existing assertions to the two-field body; add set path (40-character `BUILD_COMMIT` answers its first 12) and unset path (answers `unknown`) through the real HTTP cycle
- [Docs] README.md: the project-structure comment on the `.env.example` line names its contents (DB connection plus frontend API base URL) and gains the optional build commit, since this feature changes run configuration

`docs/DEVELOPMENT.md` needs no edit: its `BUILD_COMMIT` paragraph (Running tests locally) already describes exactly this behaviour, including the compose pass-through, the 12-character shortening and the `unknown` default, and this feature makes it true again. No lockfile changes: no dependency is added or removed. No E2E spec file: no criterion is assigned to E2E (see Criterion coverage). `backend/app/main.py` is not modified: the version router is already registered there by TEST-05.

## Testing Strategy
- Unit tests: the settings resolution of `build_commit` (set, unset, blank, whitespace-padded) and the service `get_build_commit()` (12-character value verbatim, 40-character sha shortened to 12, unset gives `unknown`), with the environment controlled by `monkeypatch`; no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extending `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: the real HTTP request and response cycle of `GET /api/version` through `create_app()` and `TestClient`: 200 with both fields and exactly those two keys, the set path (`BUILD_COMMIT` set to a 40-character sha answers its first 12), the unset path (answers `unknown`), and the existing 405 error case. Each test builds its own app after `monkeypatch` sets or deletes `BUILD_COMMIT`, because settings are read per call; no database is needed (the existing `DATABASE_URL`-unset test stays).
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (extending `test_version_integration.py`)
- E2E tests: none for this feature. E2E is ENABLED, but no acceptance criterion requires navigation or interaction through the UI (the item is backend only and no screen shows the commit), so no spec is generated (`testing_standards.md` Section 6, fourth question asked per criterion).
  - Directory: e2e/tests/
  - File: none (would be TEST-09_version_build_commit.spec.ts)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus the truncation and blank-value edge cases, validated for well-formedness in CI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/version returns 200 with a string `version` and a string `commit` | Integration | Verifying it needs no navigation or interaction: it is a router response shape, asserted through the real HTTP cycle |
| 2 | `commit` comes from one declared source (`BUILD_COMMIT`, default `unknown`, first 12 characters of a longer value), never a router literal | Unit and Integration | Verifying it needs no navigation or interaction: it is settings resolution and a service rule (unit), plus the set and unset values reaching the response (integration) |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit and Integration | Verifying it needs no navigation or interaction: the router declares `response_model=VersionResponse` and the integration test asserts the body has exactly the schema fields |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | It is a statement about the test suite itself, met by the named unit and integration tests; no UI exists for it |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/version returns 200 with string `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the status is 200 and the body holds a string version and a string commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When a client requests GET /api/version Then commit equals the first 12 characters of that sha; Given BUILD_COMMIT is unset Then commit is unknown |
| 3 | Body defined by a Pydantic schema | covered at Unit and Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the body has exactly the fields version and commit |
| 4 | Tests cover set and unset commit paths | covered at Unit and Integration, see Criterion coverage | Given the repository When the backend unit and integration version tests run Then 0 failed |

## Manual verification plan
This feature has no UI: no screen shows the commit, so every criterion is verified by reading the HTTP response of `GET /api/version` in a terminal, plus the backend test files for criterion 4. Port 8011 is used so the check does not collide with a compose stack already on 8010.

### Criterion 1: GET /api/version returns 200 with a string version and a string commit
Prerequisites: a terminal at the repository root, uv installed, nothing listening on port 8011, `BUILD_COMMIT` not set in the shell (`unset BUILD_COMMIT`).
1. Run `uv run --directory backend uvicorn app.main:create_app --factory --port 8011` → the log ends with `Uvicorn running on http://127.0.0.1:8011` (a warning that DATABASE_URL is not set is expected and harmless).
2. In a second terminal run `curl -i http://localhost:8011/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is a JSON object with exactly two keys, `version` with the value `0.1.0` (the `[project].version` of backend/pyproject.toml) and `commit` with a string value.
3. Stop the server with Ctrl+C.

### Criterion 2: commit comes from BUILD_COMMIT, default unknown, first 12 characters of a longer value
Prerequisites: as for criterion 1.
1. Start the server as in criterion 1 step 1 with `BUILD_COMMIT` unset, and run `curl -s http://localhost:8011/api/version` → `commit` is `unknown`. Stop the server.
2. Run `export BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` (40 characters, the shape CI passes in), start the server again as in criterion 1 step 1, and run the same curl → `commit` is `0123456789ab` (its first 12 characters), not the full sha. Stop the server.
3. Run `export BUILD_COMMIT=abc1234` (7 characters), start the server again, and run the same curl → `commit` is `abc1234`, unchanged. Stop the server.
4. Run `export BUILD_COMMIT="   "` (blank), start the server again, and run the same curl → `commit` is `unknown`. Stop the server and run `unset BUILD_COMMIT`.
5. Open `backend/app/routers/version.py` → the commit value is passed in from `get_build_commit()`; no commit string is typed into the router.
6. Open `docker-compose.yml` → the backend service `environment:` lists `BUILD_COMMIT` with the default `unknown`.

### Criterion 3: The response body is defined by a Pydantic schema in backend/app/schemas/
Prerequisites: none beyond the repository.
1. Open `backend/app/schemas/version.py` → `VersionResponse` is a Pydantic `BaseModel` with exactly two fields, `version: str` and `commit: str`.
2. Open `backend/app/routers/version.py` → the route is declared with `response_model=VersionResponse` and returns a `VersionResponse`.
3. With the server running as in criterion 1 step 1, open `http://localhost:8011/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with `version` and `commit`, both strings.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: a terminal at the repository root; `BUILD_COMMIT` not set in the shell.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports `0 failed`.
2. Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` → each has a test that sets `BUILD_COMMIT` (including a 40-character sha that comes back as its first 12 characters) and a test that deletes it and expects `unknown`.
