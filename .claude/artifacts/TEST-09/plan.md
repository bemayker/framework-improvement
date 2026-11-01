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
- [ ] `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the declared source is named `BUILD_COMMIT`; the service truncates the value to its first 12 characters (a value of 12 characters or fewer is returned verbatim, and the `unknown` default is 7 characters so it is unaffected). The comment does not contradict the description, it narrows criterion 2's value, so it is applied as an amendment. Unit and integration tests assert the truncation with a 40-character sha.
- Assumption (no comment): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and reports `unknown`, matching the existing `CORS_ORIGINS` blank-as-unset convention in `backend/app/core/config.py` and the paragraph already present in `docs/DEVELOPMENT.md` ("When the variable is unset or blank the backend reports `unknown`"). Surrounding whitespace on a set value is stripped before truncation.
- Merged since the last plan: n/a (fresh plan, plan base 77b48c2 is current main; no `[merged-since]` lines were carried in the dispatch).

## Plan Overview
Backend-only change to the existing `GET /api/version` endpoint (TEST-05). The router, its registration in `backend/app/main.py`, the `VersionResponse` schema and the version service already exist; this item adds a `commit` field end to end:

1. `backend/app/core/config.py` gains one setting, `build_commit`, read per call from the `BUILD_COMMIT` environment variable, with blank-or-unset falling back to a module constant `DEFAULT_BUILD_COMMIT = "unknown"`. This is the one declared source (criterion 2), configured the same way as the module's other environment-read values (`database_url`, `cors_origins`).
2. `backend/app/services/version_service.py` gains `get_build_commit()`, which reads `get_settings().build_commit` and returns its first 12 characters (`COMMIT_LENGTH = 12`, per the tracker comment).
3. `backend/app/schemas/version.py`'s `VersionResponse` gains `commit: str` (criterion 3).
4. `backend/app/routers/version.py` passes `commit=get_build_commit()`; no literal in the router.
5. `docker-compose.yml` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service, and `.env.example` documents the variable, so CI or an image build can set it.

`backend/app/main.py` is **not** modified: the version router is already registered (line 54), so this item adds no router registration despite the feature note. That keeps it off the `main.py` conflict flagged against BUG-01 and TEST-13 in `feature_map.md`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05): response gains `commit`. No new endpoint.
- Service layer: `version_service.get_build_commit() -> str` returns `get_settings().build_commit[:COMMIT_LENGTH]`, with `COMMIT_LENGTH = 12`. `get_app_version()` is unchanged.
- Configuration: `Settings.build_commit: str = field(default_factory=_read_build_commit)`, where `_read_build_commit()` returns `os.environ.get("BUILD_COMMIT", "").strip() or DEFAULT_BUILD_COMMIT`. Read per call, like `cors_origins`, so a test that sets or deletes the variable after import is honoured (the existing module docstring explains why a plain field default is wrong).
- Schema: `VersionResponse` gets `commit: str` beside `version: str`.
- Router: `return VersionResponse(version=get_app_version(), commit=get_build_commit())`.
- Repository layer: none (no database access; the endpoint must keep answering with `DATABASE_URL` unset).
- Migrations: none.
- Runtime wiring: `docker-compose.yml` backend `environment:` gets `BUILD_COMMIT: ${BUILD_COMMIT:-}` (blank passes through and resolves to `unknown` in config). `.env.example` gets a commented `BUILD_COMMIT=` entry explaining that CI passes the full sha and the endpoint reports its first 12 characters.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: none
- Response: 200, `application/json`, body defined by `VersionResponse`:

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` keeps its existing behaviour (installed `task-notes-backend` metadata, `unknown` when not installed). `commit` is always a string, at most 12 characters. `POST /api/version` stays 405.

## Technology Selection
- `BUILD_COMMIT` read: chose the standard library's `os.environ.get` inside the existing `Settings` dataclass (`backend/app/core/config.py`) over adding `pydantic-settings` or a `.git`/`git rev-parse` lookup at runtime, because the module already reads its other environment values this way and a container has no `.git` directory.
- Truncation to 12 characters: chose a plain string slice in the service over any helper or dependency; no alternative is needed.
- `commit` response field: chose the already-installed Pydantic `BaseModel` (`VersionResponse`) over a hand-built dict; no net-new dependency.
- No net-new module or dependency is introduced; every change lands in an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (40-character sha truncated to 12).
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature writes alongside it.

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT = "unknown"`, `_read_build_commit()` and `Settings.build_commit` (per-call env read, blank as unset).
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response.
- [B] docker-compose.yml: backend `environment:` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}`.
- [B] .env.example: document `BUILD_COMMIT` (commented, empty by default).
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset and blank cases.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` for a 40-character sha (first 12), a short value (verbatim) and the unset default (`unknown`).
- [B] backend/tests/integration/test_version_integration.py: existing exact-body assertions updated to include `commit`; new tests for `BUILD_COMMIT` set (40-character sha, response carries the first 12) and unset (`unknown`).

No dependency changes, so no lockfile is regenerated (`backend/uv.lock`, `frontend/package-lock.json` untouched).
`docs/DEVELOPMENT.md` already carries the `BUILD_COMMIT` paragraph describing exactly this behaviour (pass-through as `${BUILD_COMMIT:-}`, first 12 characters, `unknown` default in `backend/app/core/config.py`), and `README.md` documents no environment variables for the version endpoint, so neither needs an edit; the build's documentation check only confirms the existing paragraph still matches.
`backend/app/main.py` is not in this manifest: the version router is already registered there.

## Testing Strategy
- Unit tests: config layer (`Settings.build_commit` with `BUILD_COMMIT` set, unset, blank and whitespace-only; surrounding whitespace stripped) and service layer (`get_build_commit()` truncates a 40-character sha to 12, returns a value of 12 or fewer characters verbatim, returns `unknown` when unset). Environment is controlled with `monkeypatch.setenv` and `monkeypatch.delenv`; no database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` through `TestClient`: commit set (a 40-character sha yields its first 12 characters and the body has exactly the keys `version` and `commit`), commit unset (`unknown`), and the existing 405 and no-`DATABASE_URL` cases updated to the two-field body.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E is ENABLED, but no criterion requires navigation or interaction through the UI (the endpoint has no UI in this item; the footer display is TEST-10's), so no spec is written.
  - Directory: e2e/tests/
  - File: none (would be `TEST-09_version-build-commit.spec.ts`)
- UAT scenarios: one Gherkin scenario per acceptance criterion plus the 40-character truncation edge case, validated for well-formedness by CI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}` | Integration | verifying it needs no navigation or interaction: it is a router response shape, asserted over a real HTTP cycle |
| 2 | `commit` comes from one declared source (env var, default `"unknown"`), never a string typed into the router | Unit and Integration | verifying it needs no navigation or interaction: it is configuration resolution (unit, set/unset/blank) plus the router reflecting the env value (integration) |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the exact-keys body assertion fails if the router bypasses `VersionResponse`; the schema's location is also checked at review |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | verifying it needs no navigation or interaction: the criterion is the tests themselves, run by the test gate command |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from one declared source, default `unknown` | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is unset, When GET /api/version is requested, Then commit is "unknown"; Given BUILD_COMMIT is a 40-character sha, Then commit is its first 12 characters |
| 3 | Body defined by a Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When GET /api/version is requested, Then the body has exactly the keys version and commit |
| 4 | Unit and integration tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the version and config tests run, Then 0 failed |

## Manual verification plan
### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is running with `docker compose up -d --build` from the repository root, backend reachable on `http://localhost:8010`. No UI exists for this criterion; it is verified on the HTTP response.
1. In a terminal, run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it has exactly two keys, `version` (for example `"0.1.0"`, the value in `backend/pyproject.toml`) and `commit`, both strings.

### Criterion 2: `commit` comes from one declared source (environment variable, default `"unknown"`)
Prerequisites: the repository root, Docker running. No UI exists for this criterion; it is verified on the HTTP response.
1. Start the backend with no `BUILD_COMMIT` set: `docker compose up -d --force-recreate backend` → the container is running.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
3. Restart it with a full 40-character sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --force-recreate backend` → the container is recreated.
4. Run `curl -s http://localhost:8010/api/version` → `commit` is `"0123456789ab"` (the first 12 characters, per the tracker clarification).
5. Restart it with a short value: `BUILD_COMMIT=abc123 docker compose up -d --force-recreate backend`, then run `curl -s http://localhost:8010/api/version` → `commit` is `"abc123"`.
6. Restart it with a blank value: `BUILD_COMMIT= docker compose up -d --force-recreate backend`, then run `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
7. Open `backend/app/routers/version.py` → `commit` is passed as `get_build_commit()`; no quoted commit value appears in the router.
8. Restore the default afterwards: `docker compose up -d --force-recreate backend`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: a checkout of the feature branch. No UI exists for this criterion; it is verified in the source and the OpenAPI document.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the fields `version` and `commit`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: the repository root; a test database for the integration tier per `CLAUDE.md` Backing Services (the version integration tests themselves need none).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → `0 failed`, and the output lists the `build_commit` set, unset and blank cases and the `get_build_commit` truncation, short-value and default cases.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`, including the commit-set (40-character sha returned as its first 12) and commit-unset (`unknown`) tests.
