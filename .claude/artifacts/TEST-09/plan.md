# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A client can ask the API which build it is talking to.
>
> Acceptance criteria
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> Notes: Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete. Depends on: TEST-01.
>
> (ClickUp task 123k99cwybk.)

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.
- [ ] 5. When `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12 (from the tracker comment below; CI passes a full 40-character sha).

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the comment names it, so the plan uses exactly that name), and criterion 5 is added. Truncation to the first 12 characters lives in the service layer (`get_build_commit()` in `backend/app/services/version_service.py`), the settings module keeps the raw value, and a value of 12 characters or fewer is returned unchanged. Covered by unit and integration tests (Criterion coverage row 5).
- Assumption (no comment, recorded per `user_story_alignment.md` Section 4): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `"unknown"`, matching how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`. Surrounding whitespace is stripped before truncation.
- Note on the item's Notes line: `/api/version` and its router registration already exist on main (TEST-05). This item extends that endpoint and does NOT edit `backend/app/main.py`; the router is already included there. This keeps it disjoint from BUG-01, which registers a server_time router in main.py concurrently.

## Plan Overview
Backend only. Extend the existing TEST-05 version slice so `GET /api/version` also reports the build commit:
- `backend/app/core/config.py`: `Settings` gains `build_commit`, read per call from the `BUILD_COMMIT` environment variable, default `"unknown"` (constant `DEFAULT_BUILD_COMMIT`), blank treated as unset. This is the one declared source, in the same settings module and the same way as `DATABASE_URL` and `CORS_ORIGINS` (`coding_standards.md` Section 5 invariant).
- `backend/app/services/version_service.py`: new `get_build_commit()` returns `get_settings().build_commit[:12]` (constant `COMMIT_DISPLAY_LENGTH = 12`).
- `backend/app/schemas/version.py`: `VersionResponse` gains `commit: str`.
- `backend/app/routers/version.py`: returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit value in the router.
- `docker-compose.yml`: backend service passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` through from the build environment; the empty compose default defers to `config.py`'s `"unknown"`, so the default has one owner.
- `.env.example`: documents `BUILD_COMMIT`.
No database, no migration, no frontend change, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05): response body extended with `commit`. No new route, no change to `backend/app/main.py`.
- Service layer: `get_build_commit() -> str` in `backend/app/services/version_service.py`: reads `get_settings().build_commit` and returns its first `COMMIT_DISPLAY_LENGTH` (12) characters. `get_app_version()` unchanged.
- Settings: `Settings.build_commit: str` via `field(default_factory=_read_build_commit)`, where `_read_build_commit()` returns `os.environ.get("BUILD_COMMIT", "").strip() or DEFAULT_BUILD_COMMIT`, and `DEFAULT_BUILD_COMMIT = "unknown"`. Read per call, like `database_url`, so tests can monkeypatch the variable after import.
- Schema: `VersionResponse` in `backend/app/schemas/version.py` gets `commit: str` next to `version: str`.
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

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

(`version` is whatever `[project].version` in `backend/pyproject.toml` holds; `0.1.0` is illustrative.) Other methods keep returning 405.

## Technology Selection
- Commit source: chose the standard library's `os.environ` read inside the existing `Settings` dataclass over a new settings library (pydantic-settings) or reading git at runtime (`subprocess` on `git rev-parse`), because the container has no `.git` at runtime and the criterion asks for an environment variable set at build time; the existing settings module already reads its other values this way.
- Truncation: chose a plain string slice (`[:12]`) in the service; no stdlib helper or dependency is warranted for it.
- No net-new component, module or dependency otherwise: every file touched already exists.

## File Manifest
### New files
- [B] backend/tests/unit/test_version_schema_unit.py: VersionResponse declares and requires `version` and `commit`
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (40-character sha truncated)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and `Settings.build_commit` read from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_DISPLAY_LENGTH` and `get_build_commit()`; update the module docstring to name TEST-09
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`
- [B] docker-compose.yml: backend `environment` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` through
- [B] .env.example: document `BUILD_COMMIT` (commented, empty), stating CI sets it to the full sha and the API reports its first 12 characters
- [B] backend/tests/unit/test_config_unit.py: build_commit set, unset and blank cases
- [B] backend/tests/unit/test_version_service_unit.py: get_build_commit set, unset, truncation and short-value cases
- [B] backend/tests/integration/test_version_integration.py: existing equality assertions extended with `commit`; set, unset and truncation request cycles added

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` edit: neither lists the backend's environment variables (they are documented in `.env.example`, which is in this manifest), and project structure, dependencies and test infrastructure are unchanged.
No E2E spec: no criterion needs navigation or interaction through the UI (Criterion coverage below).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (env set, unset, blank) in `backend/app/core/config.py`; `get_build_commit()` (configured value, default, truncation of a 40-character sha, 12-or-fewer characters returned unchanged) with `get_settings` monkeypatched or `BUILD_COMMIT` set via `monkeypatch.setenv`; `VersionResponse` field declaration.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle on `GET /api/version` through the `client` fixture with `BUILD_COMMIT` set via `monkeypatch.setenv` / removed via `monkeypatch.delenv` (settings are read per request, so no app rebuild is needed). Asserts the resolution, not the literal fallback alone: a set value must come back (`coding_standards.md` Section 5).
  - Directory: backend/tests/integration/
- E2E tests: none for this item. Toggle is ENABLED, but no criterion requires UI navigation or interaction; every criterion is covered at unit or integration level (rows below).
  - Directory: e2e/tests/
  - File: none
- UAT scenarios: one scenario per criterion plus the 40-character sha edge case, API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | `test_get_version_returns_200_with_version_and_commit` | verifying it needs no navigation or interaction: it is a router request/response behaviour |
| 2 | `commit` comes from one declared env source, default `"unknown"`, never typed into the router | Unit | `test_settings_build_commit_reads_build_commit_env`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_as_unset`, `test_get_build_commit_returns_configured_settings_value` | verifying it needs no navigation or interaction: it is configuration resolution and service logic |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_version_response_declares_version_and_commit_fields`, `test_version_response_rejects_missing_commit` | verifying it needs no navigation or interaction: it is a schema definition |
| 4 | Unit and integration tests cover the set and unset commit paths | Integration | `test_get_version_reports_commit_when_build_commit_is_set`, `test_get_version_reports_unknown_commit_when_build_commit_is_unset`, `test_get_build_commit_returns_unknown_when_build_commit_unset` | verifying it needs no navigation or interaction: it is a test-coverage requirement met by the unit and integration tests named here |
| 5 | `BUILD_COMMIT` longer than 12 characters yields its first 12 | Unit | `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_build_commit_returns_short_value_unchanged`, `test_get_version_returns_first_12_characters_of_a_full_sha` | verifying it needs no navigation or interaction: it is a service-layer string rule, also asserted through the HTTP cycle |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/version, Then the response is 200 with string fields version and commit |
| 2 | commit from `BUILD_COMMIT`, default `"unknown"` | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is unset, When GET /api/version, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the API is running, When the OpenAPI document is read, Then /api/version's 200 response references VersionResponse with version and commit |
| 4 | set and unset paths tested | covered at Integration, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then the run passes |
| 5 | first 12 characters of a longer value | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit is that sha's first 12 characters |

## Manual verification plan
This feature has no UI; every check is made against the running API at `http://localhost:8010` from a terminal (or by opening the URL in a browser address bar).

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: from the repo root, the stack is started with `docker compose up -d --build backend` (BUILD_COMMIT not exported in the shell).
1. Run `curl -i http://localhost:8010/api/version` → status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is a JSON object with exactly two keys, `version` and `commit`, both string values; `version` equals the `version =` value under `[project]` in `backend/pyproject.toml`.

### Criterion 2: `commit` comes from one declared source, default `"unknown"`
Prerequisites: same stack as Criterion 1, BUILD_COMMIT unset.
1. Run `curl -s http://localhost:8010/api/version` → body shows `"commit":"unknown"`.
2. Run `BUILD_COMMIT=abc1234 docker compose up -d backend` → the backend container is recreated.
3. Run `curl -s http://localhost:8010/api/version` → body shows `"commit":"abc1234"`.
4. Open `backend/app/routers/version.py` → it contains no commit literal; the value comes from `get_build_commit()`, which reads `BUILD_COMMIT` through `backend/app/core/config.py`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: stack running.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with `version` (string) and `commit` (string), both required.
2. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: a Postgres reachable at the `DATABASE_URL` in `.env.example` (`docker compose up -d db`).
1. Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_schema_unit.py tests/integration/test_version_integration.py` → the summary line reports no failed or errored test and the command exits 0.
2. Read the test names in those files → both `..._when_build_commit_is_set` and `..._when_build_commit_is_unset` integration tests are present, and the unit file has set and unset `get_build_commit` tests.

### Criterion 5: A `BUILD_COMMIT` longer than 12 characters yields its first 12
Prerequisites: from the repo root.
1. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` → the backend container is recreated.
2. Run `curl -s http://localhost:8010/api/version` → body shows `"commit":"0123456789ab"` (12 characters, not the full 40).
3. Run `BUILD_COMMIT=0123456789ab docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → body shows `"commit":"0123456789ab"` unchanged.
4. Clean up: `docker compose up -d backend` with BUILD_COMMIT unset → `curl` shows `"commit":"unknown"` again.
