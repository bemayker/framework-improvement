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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. When `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 (tracker comment, see Re-Plan Feedback).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service layer truncates the configured value to its first 12 characters (`BUILD_COMMIT_LENGTH = 12` in `backend/app/services/version_service.py`); a value of 12 characters or fewer, and the `"unknown"` default, pass through unchanged. Criterion 2 above carries the amendment, and a dedicated unit test plus an integration test send a full 40-character sha. Assumption recorded: the comment names the variable `BUILD_COMMIT`, which the description leaves unnamed, so that is the variable name; `docs/DEVELOPMENT.md` already documents exactly this name and the 12-character rule.
- Comment (tracker), second half: "A full 40-character sha is what CI passes in." → Not acted on as a CI change: no workflow in `.github/workflows/` passes `BUILD_COMMIT` today (searched), and no criterion asks for one, so adding a CI build-arg step would be gold plating (`user_story_alignment.md` Section 3). The plan declares the build-time source (Dockerfile `ARG`, compose build arg, `.env.example` key) so whatever CI or a developer later passes reaches the app; the 40-character case is covered by tests.
- Plan note, the item text versus the tree: the description says this item "registers a router in `backend/app/main.py`". The version router already exists and is already registered there (TEST-05: `app.include_router(version_router)`), so this plan extends the existing slice and does not touch `main.py`. Recorded so the shared-risk entry for `main.py` can be cleared.
- Merged since the last plan: n/a (fresh plan, branched from current main at cfa85c3953dc086c6b05c27c3937660e30237eed; no `[merged-since]` lines in the dispatch).

## Plan Overview
Extend the existing `GET /api/version` slice (TEST-05) with a `commit` field. One declared source: `BUILD_COMMIT`, read from the environment by `backend/app/core/config.py` (`Settings.build_commit`, read per call like `cors_origins`, blank or unset resolving to `"unknown"`). The version service exposes `get_build_commit()`, which returns that value cut to its first 12 characters. The router passes it into the extended `VersionResponse` schema; it types no commit string itself. The build-time path is declared in `backend/Dockerfile` (`ARG BUILD_COMMIT` copied to `ENV BUILD_COMMIT`), passed as a compose build arg, and documented in `.env.example`. Backend only, no frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. No new route, no change to `backend/app/main.py` (the router is already registered).
- Service layer: `backend/app/services/version_service.py` gains `BUILD_COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:BUILD_COMMIT_LENGTH]`. Settings are read per call, so a changed environment is seen without restarting the process (same contract as `get_settings()` today). `get_app_version()` is unchanged.
- Configuration: `backend/app/core/config.py` gains `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (env value stripped of surrounding whitespace, blank or unset returns the default) and a `build_commit: str` field with `default_factory=_read_build_commit`. This keeps the settings module's invariant: every deployment-dependent value reads the environment, with a documented default (`coding_standards.md` Section 5). The default lives here only: the Dockerfile `ARG` and compose arg carry no default of their own, so an absent value arrives as blank and resolves to `"unknown"` in one place.
- Router: `get_version()` returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string in the router.
- Schema: `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`.
- Build-time source: `backend/Dockerfile` adds `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=${BUILD_COMMIT}` after the dependency layers (so a new sha does not bust the `uv sync` cache); `docker-compose.yml` backend `build:` gains `args: BUILD_COMMIT: ${BUILD_COMMIT:-}`; `.env.example` gains a commented, blank `BUILD_COMMIT=` key.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `VersionResponse`. With `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`:

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

  With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

  (`version` is whatever `backend/pyproject.toml` declares; `0.1.0` is illustrative.) `POST /api/version` stays 405.

## Technology Selection
- `BUILD_COMMIT` reading: chose `os.environ.get` in the existing `Settings` dataclass (standard library, the pattern `cors_origins` and `database_url` already use) over adding `pydantic-settings`, because the existing settings module covers it in a few lines and one module must configure its values one way.
- 12-character truncation: chose a plain string slice (standard library) over any sha-parsing helper; no validation of hex content is asked for.
- Build-time injection: chose Docker's native `ARG` plus `ENV` and the compose `build.args` key (native platform features) over a generated version file or a build script.
- No net-new module, component or dependency otherwise: every file touched already exists.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the 40-character truncation edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` settings field.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`; docstring names TEST-09.
- [B] backend/app/services/version_service.py: add `BUILD_COMMIT_LENGTH` and `get_build_commit()`.
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response.
- [B] backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=${BUILD_COMMIT}` after the dependency layers.
- [B] docker-compose.yml: backend `build.args` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}`.
- [B] .env.example: document the optional, blank-by-default `BUILD_COMMIT` key.
- [B] backend/tests/unit/test_config_unit.py: set, unset and blank `BUILD_COMMIT` resolution.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set, truncated and unset paths.
- [B] backend/tests/integration/test_version_integration.py: assert `commit` on the set and unset paths, the OpenAPI response schema, and update the existing equality assertions to the two-field body.

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) changes.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: `docs/DEVELOPMENT.md` already documents `BUILD_COMMIT` as an optional build argument and runtime variable reported as its first 12 characters or `"unknown"`, and `README.md` already lists `.env.example` as carrying the optional `BUILD_COMMIT`; this item makes both true rather than changing them.
No E2E spec: no criterion involves navigation or interaction through a UI (see Criterion coverage).

## Testing Strategy
- Unit tests: `backend/app/core/config.py` (`build_commit` resolution from the environment: set, unset, blank) and `backend/app/services/version_service.py` (`get_build_commit()`: short value passes through, 40-character sha cut to 12, unset yields `"unknown"`), with the environment set through `monkeypatch.setenv` and `monkeypatch.delenv`, no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: the full HTTP cycle of `GET /api/version` through `TestClient` with `BUILD_COMMIT` set (40-character sha) and unset, asserting the exact two-field body; the OpenAPI document's response schema for the route; the existing 200, no-database and 405 tests updated to the two-field body. No database fixture is needed (the endpoint reads none), so these never skip on a missing `DATABASE_URL`.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. Enabled per CLAUDE.md, but no criterion is user-facing UI navigation or interaction; this is an API-only change (`testing_standards.md` Section 6, fourth question asked per criterion, all four answered no).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, phrased as API checks (request `GET /api/version`, read the body) without duplicating test assertions line for line.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version", "commit"}` strings | Integration | `test_get_version_returns_200_with_version_and_commit_when_build_commit_set`, `test_get_version_returns_200_with_unknown_commit_when_build_commit_unset` | Verifying it needs no navigation or interaction: it is a router response shape, checked through the real HTTP cycle |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters), never a router literal | Unit | `test_settings_build_commit_reads_environment_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_build_commit_returns_configured_value_unchanged_when_short`, `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_returns_unknown_when_unset` | Verifying it needs no navigation or interaction: it is configuration resolution and a string rule; the integration rows of criterion 1 prove the wiring end to end with two different environments, which a router literal could not satisfy |
| 3 | The response body is a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_version_response_schema_declares_version_and_commit` | Verifying it needs no navigation or interaction: it is the route's declared response model, read from the app's OpenAPI document |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_200_with_version_and_commit_when_build_commit_set`, `test_get_version_returns_200_with_unknown_commit_when_build_commit_unset` | Verifying it needs no navigation or interaction: the criterion is the existence and passing of these unit and integration tests themselves |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the status is 200 and the body has a string `version` and a string `commit` |
| 2 | `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters | covered at Unit, see Criterion coverage | Given the backend runs with BUILD_COMMIT set to a 40-character sha When a client requests GET /api/version Then `commit` is that sha's first 12 characters; Given BUILD_COMMIT is unset Then `commit` is "unknown" |
| 3 | Response defined by a Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running When a reader opens /docs Then the GET /api/version 200 response is `VersionResponse` with `version` and `commit` |
| 4 | Tests cover set and unset commit paths | covered at Unit, see Criterion coverage | Given the backend test suite When it runs Then the named version and config tests pass |

## Manual verification plan
This item has no UI. Every criterion is verified by an HTTP request or a test run, and the observable check is named in each step.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: on the feature branch, in the repository root, `.env` copied from `.env.example`, `BUILD_COMMIT` not set in your shell.
1. Run `docker compose up -d --build backend` → the backend container reports running and `http://localhost:8010` answers.
2. Run `curl -i http://localhost:8010/api/version` → the status line is `HTTP/1.1 200 OK` and the body is exactly two keys, `version` (the value in `backend/pyproject.toml` `[project].version`) and `commit`, both strings.
3. Run `curl -i -X POST http://localhost:8010/api/version` → `405 Method Not Allowed`.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters
Prerequisites: as for Criterion 1.
1. With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
2. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"0123456789ab"` (the first 12 characters, not all 40).
3. Run `BUILD_COMMIT=abc1234 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"abc1234"` (shorter values are not padded or cut).
4. Run `grep -n "commit" backend/app/routers/version.py` → the only match is `commit=get_build_commit()`, no quoted sha or `"unknown"` literal in the router.
5. Restore: run `docker compose up -d --build backend` with `BUILD_COMMIT` unset again → `commit` is back to `"unknown"`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend is running as in Criterion 1.
1. Open `http://localhost:8010/docs` in a browser → the Swagger page lists `GET /api/version`.
2. Expand `GET /api/version` and open the 200 response's Schema tab → it is `VersionResponse` with `version` (string, required) and `commit` (string, required).
3. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: on the feature branch, `uv` installed; no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → the summary line reports no failed or errored test and the command exits 0.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the summary line reports no failed or errored test, none of its tests is skipped, and the command exits 0.
3. Run `uv run --directory backend pytest -q -k "build_commit"` → the selected tests include both the set (`..._when_build_commit_set`, `..._truncates_full_sha...`) and unset (`..._when_build_commit_unset`, `..._returns_unknown_when_unset`) paths, and the run passes with exit 0.
