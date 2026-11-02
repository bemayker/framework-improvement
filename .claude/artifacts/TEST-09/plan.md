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
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. Amended by the tracker comment below: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the comment names it, so the plan adopts it rather than inventing one), and the service layer returns its first 12 characters when it is longer; a value of 12 characters or fewer is returned unchanged. Unit tests cover a 40-character sha (truncated to 12), an exactly-12-character value (unchanged) and a shorter value (unchanged); the integration test sets a 40-character sha and asserts the 12-character prefix. The comment overrides the description where they disagree: the description says nothing about length, so this is an addition, not a contradiction.
- Assumption (no comment, recorded instead of a question): a `BUILD_COMMIT` that is set but empty or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` treats a blank value in `backend/app/core/config.py`. Surrounding whitespace is stripped before truncation.
- Assumption: "set at build time" is honoured by a `BUILD_COMMIT` build argument in `backend/Dockerfile` promoted to an `ENV`, fed from `docker-compose.yml` → `backend.build.args`. The Dockerfile ARG carries no default of its own, so `"unknown"` lives in exactly one place (`app/core/config.py`, coding_standards.md Section 5's one-value-one-source rule). No CI workflow is changed: the comment says CI passes the sha in, and wiring CI to do so is not in the criteria.
- Scheduling note from the dispatch (BUG-01 may also edit `backend/app/main.py`): the version router is already registered in `backend/app/main.py` (TEST-05), so this plan does not touch `main.py`. The tracker note "Registers a router in backend/app/main.py" is stale against the code as it stands.

## Plan Overview
Extend the existing TEST-05 version endpoint rather than create a new one. `backend/app/routers/version.py`, `backend/app/schemas/version.py` and `backend/app/services/version_service.py` already exist and `version_router` is already registered in `backend/app/main.py`. The work is: add a `build_commit` setting read per call from `BUILD_COMMIT` with default `"unknown"`; add `get_build_commit()` to the version service (truncates to 12 characters); add `commit: str` to `VersionResponse`; have the router fill it from the service; and make `BUILD_COMMIT` settable at image build time. Backend only, no database, no frontend.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, modified): response gains a `commit` field. No new route; `main.py` already includes the router.
- Settings (`backend/app/core/config.py`): new field `build_commit: str` on the frozen `Settings` dataclass, `default_factory` reading `BUILD_COMMIT` per call (same per-call pattern as `database_url` and `cors_origins`), stripped, falling back to a module constant `DEFAULT_BUILD_COMMIT = "unknown"` when unset or blank. Docstring/comment names `BUILD_COMMIT` and the default.
- Service layer (`backend/app/services/version_service.py`): new constant `COMMIT_LENGTH = 12` and function `get_build_commit() -> str` returning `get_settings().build_commit[:COMMIT_LENGTH]`. Truncation is business logic, so it lives here and not in settings or the router. `"unknown"` is 7 characters and passes through unchanged.
- Router (`backend/app/routers/version.py`): `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string in the router.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`.
- Build-time wiring: `backend/Dockerfile` adds `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT=$BUILD_COMMIT` (no ARG default; an unset arg becomes an empty value, which settings treats as unset). `docker-compose.yml` → `backend.build.args: BUILD_COMMIT: ${BUILD_COMMIT:-}`. `.env.example` documents `BUILD_COMMIT` as an optional, commented entry.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version
- Request: no body, no query parameters
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

  `version` is unchanged (installed `task-notes-backend` distribution version, `"unknown"` when not installed). `commit` is the first 12 characters of `BUILD_COMMIT`, the whole value when it is 12 characters or fewer, or `"unknown"` when `BUILD_COMMIT` is unset or blank.
- Errors: `POST /api/version` → 405 (unchanged).

## Technology Selection
- Commit source: chose a plain environment variable read with `os.environ` (stdlib) in the existing `Settings` dataclass over adding `pydantic-settings` or reading git metadata at runtime (`git rev-parse` / `.git/HEAD`), because the container has no `.git` and the existing settings module already reads every environment value this way.
- Truncation: chose a string slice (language built-in) over any helper, because nothing more is needed.
- Build-time injection: chose the native Dockerfile `ARG`/`ENV` and Compose `build.args` (platform features already in use) over a generated version file, because they need no new tooling.
- No new dependency is added; no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per criterion plus one edge case (40-character sha truncated to 12)
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT` and the `build_commit` field read per call from `BUILD_COMMIT`, blank treated as unset
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()` (first 12 characters)
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`
- [B] backend/Dockerfile: `ARG BUILD_COMMIT` plus `ENV BUILD_COMMIT=$BUILD_COMMIT` so the value is set at build time
- [B] docker-compose.yml: pass `BUILD_COMMIT` to the backend build as a build arg (empty when unset)
- [B] .env.example: document the optional `BUILD_COMMIT` variable
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset and blank cases
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set (short), exactly 12, longer than 12 (truncated), unset (`"unknown"`)
- [B] backend/tests/integration/test_version_integration.py: update the existing body assertions to include `commit`; add set (40-character sha returns first 12) and unset (`"unknown"`) HTTP cases

No dependency manifest changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: README already points to `.env.example` for environment configuration, and `docs/DEVELOPMENT.md` is the framework operating procedure with no application environment section; the new variable is documented in `.env.example`. No E2E spec: no criterion is assigned to E2E (see Criterion coverage). `backend/app/main.py` is not modified: the version router is already registered.

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank, whitespace stripped) and `version_service.get_build_commit()` (short value unchanged, exactly 12 unchanged, 40-character sha truncated to 12, unset gives `"unknown"`), with `monkeypatch.setenv` / `delenv`; no network or database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: real HTTP request/response through `TestClient` on `create_app()`: 200 with both keys and `commit == "unknown"` when `BUILD_COMMIT` is unset; 200 with `commit` equal to the first 12 characters when `BUILD_COMMIT` is a 40-character sha; existing 405 case kept; existing version assertions updated to the two-key body. Tests set the variable through `monkeypatch` so they assert the resolution, not the literal.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. E2E Tests is ENABLED, but no criterion involves navigation or interaction through the UI (backend only, no frontend change).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (40-character sha truncated to 12).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version", "commit"}` strings | Integration | Verifying it needs no navigation or interaction: it is a router request/response behaviour. |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters when longer), never a router literal | Unit | Verifying it needs no navigation or interaction: it is settings resolution plus a service-layer truncation rule; the integration set/unset cases confirm the wiring end to end. |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the router's `response_model=VersionResponse` shapes the body the integration test asserts key-for-key. |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | Verifying it needs no navigation or interaction: it is satisfied by the unit and integration tests themselves (set and unset cases in both tiers). |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with version and commit | covered at Integration, see Criterion coverage | Given the backend is running, When a client GETs /api/version, Then the status is 200 and the body has string keys version and commit |
| 2 | commit from BUILD_COMMIT, default unknown, max 12 | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is unset, When a client GETs /api/version, Then commit is "unknown"; Given BUILD_COMMIT is a 40-character sha, Then commit is its first 12 characters |
| 3 | Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When a client GETs /api/version, Then the body has exactly the keys version and commit |
| 4 | tests cover set and unset | covered at Unit, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
This item has no UI. Every check reads the HTTP response of the backend at http://localhost:8010 with curl, or runs the tests.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: repository root checked out on the feature branch, Docker running, no `BUILD_COMMIT` in your shell or `.env`.
1. Run `docker compose up -d --build backend` from the repository root → the backend container starts and listens on port 8010.
2. Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/version` → prints `200`.
3. Run `curl -s http://localhost:8010/api/version` → prints a JSON object with exactly two keys, `version` (the `[project].version` value in `backend/pyproject.toml`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT` set at build time, default `"unknown"`, first 12 characters when longer
Prerequisites: as for Criterion 1.
1. With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
2. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` → the backend image is rebuilt and the container restarts.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `"0123456789ab"` (the first 12 characters of the 40-character value).
4. Run `BUILD_COMMIT=abc123 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `"abc123"` (unchanged, shorter than 12).
5. Open `backend/app/routers/version.py` → it contains no commit string literal; `commit` is filled from `get_build_commit()`.
6. Run `docker compose up -d --build backend` with `BUILD_COMMIT` unset again → `curl -s http://localhost:8010/api/version` shows `commit` back to `"unknown"`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the feature branch checked out.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `backend/app/routers/version.py` → the route declares `response_model=VersionResponse`.
3. With the backend running, open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema shows `VersionResponse` with the fields `version` and `commit`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: the backing Postgres from `CLAUDE.md` Backing Services is running and `DATABASE_URL` points at it (the shared conftest needs it), uv installed.
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` → `0 failed`, and the output lists the set, unset, exactly-12 and longer-than-12 commit cases.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`, including the unset (`"unknown"`) and 40-character sha (first 12) HTTP cases.
