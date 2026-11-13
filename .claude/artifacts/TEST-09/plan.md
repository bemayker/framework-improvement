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
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service truncates the configured value to its first 12 characters (`COMMIT_LENGTH = 12` in `version_service.py`); a value of 12 characters or fewer is returned unchanged; the default `"unknown"` (7 characters) is unaffected. Added to criterion 2 above and covered by unit and integration tests (Criterion coverage rows 2 and 4). Assumption recorded: the comment says CI passes a full sha in, but does not ask this item to change the CI workflow; `.github/workflows/pr-tests.yml` is plugin-owned and is not touched. The build-time path this item wires is the backend image (`ARG BUILD_COMMIT` in `backend/Dockerfile`, forwarded by `docker-compose.yml`), which is what a CI or release build passes the sha into.
- Dispatch map note: "TEST-09 may edit backend/app/main.py, which BUG-01 also edits; list main.py only if you actually need it." → Addressed by: not listed. `backend/app/main.py` already includes `version_router` (TEST-05, line 54), so the feature note's "registers a router in main.py" is already satisfied on main at 62be9fd and this item extends the existing router instead. No overlap with BUG-01 on `main.py`.
- Assumption (no comment, recorded per `user_story_alignment.md` Section 4): a blank or whitespace-only `BUILD_COMMIT` is treated as unset and yields `"unknown"`, mirroring how `CORS_ORIGINS` treats a blank value in the same settings module; surrounding whitespace on a set value is stripped before truncation.

## Plan Overview
Extend the existing TEST-05 version endpoint (`GET /api/version`) so its response also carries `commit`. The value has one declared source: a `build_commit` field on `Settings` in `backend/app/core/config.py`, read from the `BUILD_COMMIT` environment variable per call with the documented default `"unknown"` (same pattern as `database_url` and `cors_origins`, satisfying `coding_standards.md` Section 5's one-settings-module invariant). The version service gains `get_build_commit()`, which reads the setting and returns at most its first 12 characters. The `VersionResponse` Pydantic schema gains `commit: str`. The router passes both values into the schema and contains no literal. The variable is made a build-time value by an `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT=$BUILD_COMMIT` pair in `backend/Dockerfile`, forwarded from the compose build args, and documented in `.env.example`. Backend only: no frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. The handler becomes `return VersionResponse(version=get_app_version(), commit=get_build_commit())`. No new route; `backend/app/main.py` is unchanged (the router is already registered).
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which returns `get_settings().build_commit[:COMMIT_LENGTH]`. Reads settings per call (never cached at import) so a changed environment is reflected, as the existing `get_settings()` contract promises. Docstring states the 12-character rule and its source (the tracker clarification).
- Settings (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT", "").strip() or DEFAULT_BUILD_COMMIT`, and a `build_commit: str = field(default_factory=_read_build_commit)` field on `Settings`, with a one-line comment that it is set at image build time. The builder runs `bash ~/.mayker/mayker-dev/hooks/lib/config-consistency.sh settings backend/app/core/config.py` after the change.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`, with a field docstring/description naming the build commit; module docstring updated to mention TEST-09.
- Build-time wiring: `backend/Dockerfile` adds `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT=$BUILD_COMMIT` after the two `uv sync` layers (so a new sha does not invalidate the dependency cache). `docker-compose.yml` backend `build:` gains `args: BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`. `.env.example` gains a commented, optional `BUILD_COMMIT=` entry explaining it is a build-time value, truncated to 12 characters in the API (the README already describes `.env.example` as carrying an optional `BUILD_COMMIT`).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters
- Response: 200, `VersionResponse`

```json
{"version": "0.1.0", "commit": "62be9fd76e4b"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` is unchanged from TEST-05 (installed package metadata, `"unknown"` sentinel). `commit` is the first 12 characters of `BUILD_COMMIT`, or `"unknown"`. Other methods keep returning 405.

## Technology Selection
- Commit source (`BUILD_COMMIT` read in `Settings`): chose the standard library `os.environ` in the existing settings module over a new settings dependency (e.g. pydantic-settings) or reading `git rev-parse` at runtime, because the stdlib read is the pattern the module already uses and a runtime git call needs a `.git` directory the image does not have.
- Truncation (`get_build_commit()`): chose a standard-library string slice over any helper or dependency; no alternative is needed.
- Build-time injection: chose the native Docker `ARG` and `ENV` pair plus a compose build arg over a generated version file, because the platform feature covers it with two Dockerfile lines.
- No net-new dependency, component or module: every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per acceptance criterion plus the over-12-characters edge case
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit`
- [B] backend/app/schemas/version.py: `VersionResponse.commit: str`
- [B] backend/app/services/version_service.py: `COMMIT_LENGTH = 12` and `get_build_commit()`
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response
- [B] backend/Dockerfile: `ARG BUILD_COMMIT=unknown` and `ENV BUILD_COMMIT=$BUILD_COMMIT` after the dependency layers
- [B] docker-compose.yml: backend `build.args.BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`
- [B] .env.example: optional, commented `BUILD_COMMIT` entry with its build-time and 12-character note
- [B] backend/tests/unit/test_config_unit.py: settings tests for `build_commit` (set, unset, blank)
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests (set, unset, truncation, short value)
- [B] backend/tests/integration/test_version_integration.py: existing assertions updated to the two-field body; set, unset, truncation and schema tests added

No dependency changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is regenerated.
No `[Docs]` edit expected: `README.md` line 70 already describes `.env.example` as carrying an optional `BUILD_COMMIT`, `.env.example` itself documents the variable (listed above under [B]), and `docs/DEVELOPMENT.md` carries no per-variable environment list for this to extend.

## Testing Strategy
- Unit tests: settings resolution of `BUILD_COMMIT` (set, unset, blank, whitespace-stripped) and the service's `get_build_commit()` (set, unset, truncation to 12, value of 12 or fewer kept whole), with the environment set through `monkeypatch`, no network or database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: real HTTP request/response cycle through `TestClient` on `create_app()`: 200 with both fields, commit set via `BUILD_COMMIT`, unset gives `"unknown"`, a 40-character sha gives its first 12, the OpenAPI document references `VersionResponse` with `version` and `commit`; the existing 405 test stays. Settings are read per request, so `monkeypatch.setenv` and `delenv` are honoured by the session-scoped `client` fixture. No database is needed for these tests.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E is ENABLED in `CLAUDE.md`, but no criterion requires navigation or interaction through the UI (backend only, no UI surface), so every criterion is covered at a cheaper tier below.
  - Directory: e2e/tests/
  - File: no spec (would be `TEST-09_version-build-commit.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus the over-12-characters edge case, API-level (Given the backend is built with BUILD_COMMIT ..., When a client requests GET /api/version, Then ...).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_answers_when_database_url_is_unset` | Verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters when longer), never a router literal | Unit and Integration | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset`, `test_get_build_commit_truncates_a_40_character_sha_to_12`, `test_get_build_commit_keeps_a_value_of_12_characters_or_fewer`, `test_get_version_reports_first_12_characters_of_build_commit_when_set` | Verifying it needs no navigation or interaction: it is a configuration-resolution rule and an endpoint behaviour |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_version_response_schema_declares_version_and_commit` | Verifying it needs no navigation or interaction: the OpenAPI document generated from the response model is the observable proof |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | `test_get_build_commit_returns_configured_commit_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_reports_build_commit_when_set`, `test_get_version_reports_unknown_commit_when_build_commit_unset` | Verifying it needs no navigation or interaction: the criterion is itself about the unit and integration tiers |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, 12-character cap | covered at Unit and Integration, see Criterion coverage | Given the backend was built with BUILD_COMMIT set to a 40-character sha, When a client sends GET /api/version, Then commit equals the sha's first 12 characters |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads /openapi.json, Then the version endpoint's 200 response references VersionResponse with properties version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
This feature has no UI. Every check below is made against the running backend's HTTP API with `curl`, and the observable result is the response body.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: a shell at the repository root; Docker running; port 8010 free.
1. Run `docker compose build backend` and then `docker compose up -d db backend` → both containers report as started; `docker compose ps` shows `backend` running.
2. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is a JSON object with exactly two keys, `version` (for example `0.1.0`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters when longer), never a router literal
Prerequisites: the stack from Criterion 1 is stopped (`docker compose down`).
1. Run `docker compose build --build-arg BUILD_COMMIT=62be9fd76e4beeb5ec93d5fd3e9da1a35242d049 backend` and then `docker compose up -d db backend` → the backend starts.
2. Run `curl http://localhost:8010/api/version` → `commit` is `62be9fd76e4b` (the first 12 of the 40 characters passed in).
3. Run `docker compose down`, then `docker compose build --build-arg BUILD_COMMIT=abc1234 backend` and `docker compose up -d db backend`, then `curl http://localhost:8010/api/version` → `commit` is `abc1234` (a value of 12 characters or fewer is returned whole).
4. Run `docker compose down`, then `docker compose build backend` with no build arg and `BUILD_COMMIT` absent from `.env`, then `docker compose up -d db backend` and `curl http://localhost:8010/api/version` → `commit` is `unknown`.
5. Open `backend/app/routers/version.py` → the handler contains no commit string literal; it calls `get_build_commit()`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend from any step above is running.
1. Open `http://localhost:8010/docs` in a browser → the `GET /api/version` operation lists its 200 response schema as `VersionResponse`.
2. Expand `VersionResponse` under Schemas → it has two required string properties, `version` and `commit`.
3. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports `0 failed`, and the run includes `test_get_build_commit_returns_configured_commit_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_reports_build_commit_when_set` and `test_get_version_reports_unknown_commit_when_build_commit_unset` (visible with `-v`).
