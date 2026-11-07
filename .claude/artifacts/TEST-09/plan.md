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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. When `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12 (tracker comment, see Re-Plan Feedback).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: folded into criterion 2 above. The truncation lives in the service (`get_build_commit()` returns `settings.build_commit[:12]`), never in the router or the settings module, so `Settings.build_commit` keeps the raw declared value and the response contract is the service's. Unit tests cover a 40-character sha (returns its first 12), a value of exactly 12 characters (unchanged), a value shorter than 12 (unchanged) and the unset default; the integration tests assert a 40-character `BUILD_COMMIT` reaches the HTTP response as its first 12 characters.
- Assumption (tracker comment, "what CI passes in"): this plan does not add a `BUILD_COMMIT` step to `.github/workflows/pr-tests.yml`. No criterion asks for it and the tests set the variable themselves via `monkeypatch`; the deploying pipeline exports it into the backend's environment, and `docker-compose.yml` forwards it from the host shell. Recorded for the PR description rather than gold-plated in.
- Assumption (criterion 2, "set at build time"): the value is read from the process environment at request time (per call, like `CORS_ORIGINS` and `DATABASE_URL` in `backend/app/core/config.py`), not baked into the image with a Docker `ARG`. The build/deploy step sets it; the code has exactly one declared source, the `BUILD_COMMIT` variable. A blank or whitespace-only value is treated as unset (returns `"unknown"`), matching the existing `CORS_ORIGINS` blank-means-unset convention, so a compose file forwarding an empty `${BUILD_COMMIT:-}` yields `"unknown"` rather than `""`.
- Feature note "Registers a router in `backend/app/main.py`" → not acted on because the version router is already registered there (`app.include_router(version_router)`, from TEST-05). This plan extends the existing router and does **not** modify `backend/app/main.py`, which keeps it disjoint from BUG-01 (which registers `server_time` there this round).
- Merged since the last plan: n/a (fresh plan on main at e8c6bac; the earlier TEST-09 code was reset off main by 873e0f3 and no TEST-09 artifacts exist on main).

## Plan Overview
Backend only. Extend the existing `GET /api/version` (TEST-05) so its response carries a `commit` field alongside `version`. Add one deployment-dependent setting, `build_commit`, to `backend/app/core/config.py`, read per call from the `BUILD_COMMIT` environment variable with the documented default `"unknown"`. Add `get_build_commit()` to `backend/app/services/version_service.py`, which reads that setting and returns at most its first 12 characters. Add `commit: str` to `VersionResponse`. The router passes both service values into the schema. Forward `BUILD_COMMIT` to the backend container in `docker-compose.yml` and document it in `.env.example`. No database, frontend, or new dependency.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item)

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`). Response gains `commit`. No new route; `backend/app/main.py` is untouched.
- Settings (`backend/app/core/config.py`):
  - Add `UNKNOWN_BUILD_COMMIT = "unknown"` as the module's documented default.
  - Add `_read_build_commit() -> str`: `(os.environ.get("BUILD_COMMIT") or "").strip() or UNKNOWN_BUILD_COMMIT`.
  - Add field `build_commit: str = field(default_factory=_read_build_commit)` to the frozen `Settings` dataclass, with a comment saying it is the build's commit sha, set by the build/deploy step, read per call. This keeps the invariant of `coding_standards.md` Section 5 (one value, one source: the `"unknown"` default lives only in `config.py`): every deployment-dependent value in this settings module reads the environment with a documented default.
- Service layer (`backend/app/services/version_service.py`):
  - Add `COMMIT_LENGTH = 12`.
  - Add `get_build_commit() -> str`: returns `get_settings().build_commit[:COMMIT_LENGTH]`. `get_settings()` is called inside the function (not at import), so a changed environment is seen on the next request. The default `"unknown"` is 7 characters and passes through unchanged.
  - Update the module docstring to mention the commit; `get_app_version()` is unchanged.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str`, with the class docstring naming both fields.
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string anywhere in the router.
- Run configuration:
  - `docker-compose.yml` → `backend.environment`: add `BUILD_COMMIT: ${BUILD_COMMIT:-}` with a one-line comment. The empty fallback is deliberate: the default `"unknown"` lives in exactly one place (`config.py`), and a blank value is read as unset.
  - `.env.example`: add a `# --- Build ---` block with a comment and a commented-out `# BUILD_COMMIT=` line. The README's tree already describes `.env.example` as carrying an optional `BUILD_COMMIT`, so this makes that line true.
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, body defined by `VersionResponse`:
  - With `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `{"version": "0.1.0", "commit": "0123456789ab"}`
  - With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`
  - With `BUILD_COMMIT=abc1234` (12 characters or fewer): `{"version": "0.1.0", "commit": "abc1234"}`
- `version` is unchanged from TEST-05 (package metadata of `task-notes-backend`, `"unknown"` when not installed). The `commit` field is additive: an existing consumer reading only `version` is unaffected.
- Errors: none reachable beyond the existing 405 on non-GET methods.

## Technology Selection
- `BUILD_COMMIT` setting: chose the standard library's `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` (an installed-dependency check found it is not installed) or a new config module, because the existing settings module already reads every deployment-dependent value this way.
- 12-character truncation: chose a standard slice (`value[:12]`) over any helper or dependency; no alternative is needed.
- `commit` response field: chose the already-installed Pydantic `BaseModel` (existing `VersionResponse`) over a new schema class.
- No net-new dependency, component or module: every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the 40-character truncation edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-09/uat_script.md: the artifact copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()` returning the first 12 characters of the setting
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response
- [B] backend/tests/unit/test_config_unit.py: cover `build_commit` set, unset and blank
- [B] backend/tests/unit/test_version_service_unit.py: cover `get_build_commit()` for a 40-character sha, an exactly-12 value, a short value and the unset default
- [B] backend/tests/integration/test_version_integration.py: update the two exact-body assertions to include `commit`, add set (40 characters, truncated) and unset (`"unknown"`) HTTP cases
- [B] docker-compose.yml: forward `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service
- [B] .env.example: document the optional `BUILD_COMMIT` variable

No lockfile changes: no dependency is added or changed. `README.md` needs no edit: its tree already lists `.env.example` as carrying an optional `BUILD_COMMIT`, which this item makes true. `docs/DEVELOPMENT.md` needs no edit: it documents the framework's lifecycle, not the app's environment variables. No E2E spec: no criterion requires navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: settings parsing and the service's truncation rule, with the environment controlled by `monkeypatch` (no network, no database).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend `test_config_unit.py` and `test_version_service_unit.py`)
  - `test_config_unit.py`: `test_settings_build_commit_reads_env_value` (set → returned verbatim, untruncated, stripped), `test_settings_build_commit_defaults_to_unknown_when_unset` (delenv → `"unknown"`), parametrized `test_settings_build_commit_treats_blank_value_as_unset` (`""`, `"   "` → `"unknown"`).
  - `test_version_service_unit.py`: `test_get_build_commit_truncates_full_sha_to_first_12_characters` (40-character sha → first 12), `test_get_build_commit_returns_value_of_exactly_12_characters_unchanged`, `test_get_build_commit_returns_short_value_unchanged` (`"abc1234"`), `test_get_build_commit_returns_unknown_when_env_unset` (delenv → `"unknown"`).
- Integration tests: the real HTTP request/response cycle through `TestClient`, `BUILD_COMMIT` set and unset per test with `monkeypatch` (the setting is read per call, so the session-scoped `client` fixture sees the change).
  - Directory: backend/tests/integration/
  - File: `test_version_integration.py`. Update `test_get_version_returns_200_with_version_from_pyproject` and `test_get_version_answers_when_database_url_is_unset` to delete `BUILD_COMMIT` and assert the exact body `{"version": <pyproject version>, "commit": "unknown"}`. Add `test_get_version_returns_first_12_characters_of_build_commit_when_set` (40-character sha → `commit` equals its first 12) and `test_get_version_returns_unknown_commit_when_build_commit_unset`. Keep the existing 405 case.
- E2E tests: none for this item. E2E is ENABLED in CLAUDE.md, but no acceptance criterion requires navigation or interaction through the UI (backend-only endpoint, no frontend consumer in scope).
  - Directory: e2e/tests/ (no file added)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, in API-level Given/When/Then wording.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked through the real HTTP cycle |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters when longer), never a router literal | Unit and Integration | Verifying it needs no navigation or interaction: it is a settings and service rule (unit), and its effect on the response (integration) |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the exact-body assertions pin the schema's fields; the reviewer checks the schema file's location |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | It is a statement about the tests themselves: satisfied by the named set and unset cases in both tiers |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, first 12 characters | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit is its first 12 characters; Given BUILD_COMMIT is unset, Then commit is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When GET /api/version, Then the body has exactly the keys version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the repository, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
This item has no UI: every criterion is verified through the HTTP endpoint and the test suite, from a terminal at the repository root, with `curl` against the backend on port 8010.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the repository root is the working directory, `uv` is installed, and nothing else listens on port 8010.
1. Run `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` in one terminal → the log shows `Uvicorn running on http://127.0.0.1:8010` (a `DATABASE_URL is not set` warning is expected and harmless).
2. In a second terminal run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is a JSON object with the two string keys `version` (`"0.1.0"`) and `commit`.
3. Stop the server with Ctrl+C.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer
Prerequisites: as Criterion 1, server stopped.
1. Start the server with the variable set to a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:create_app --factory --port 8010`.
2. Run `curl -s http://localhost:8010/api/version` → the body is `{"version":"0.1.0","commit":"0123456789ab"}` (exactly the first 12 characters).
3. Stop the server, start it again with `BUILD_COMMIT=abc1234` in front of the same command, and repeat the curl → `"commit":"abc1234"` (a value of 12 characters or fewer is returned unchanged).
4. Stop the server, start it with no `BUILD_COMMIT` (plain command from Criterion 1 step 1, in a shell where `echo $BUILD_COMMIT` prints an empty line), and repeat the curl → `"commit":"unknown"`.
5. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()` in `backend/app/services/version_service.py`, which reads `BUILD_COMMIT` through `backend/app/core/config.py`.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: none.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `backend/app/routers/version.py` → the route declares `response_model=VersionResponse` and returns a `VersionResponse`.
3. With the server running (Criterion 1 step 1), open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema shows `VersionResponse` with the fields `version` and `commit`, both strings.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: the run's PostgreSQL is reachable and `DATABASE_URL` points at it (the integration fixtures need it), per CLAUDE.md Backing Services.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports `0 failed`.
2. Read the test names in those three files → each of `test_config_unit.py`, `test_version_service_unit.py` and `test_version_integration.py` has at least one case with `BUILD_COMMIT` set and one with it unset.
