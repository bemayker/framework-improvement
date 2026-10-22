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

Source: ClickUp task [TEST-09: Version endpoint reports the build commit](https://app.clickup.com/t/123k99cwybk). Plan base: `775ade54b713c5663b70f1d2ba3017075807676b`.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification below, a value longer than 12 characters is returned as its first 12 only.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the environment variable is named `BUILD_COMMIT` (the comment fixes the name the description left open); the service layer returns `commit[:12]` for a value longer than 12 characters and a shorter value verbatim; unit and integration tests assert a 40-character sha yields its first 12 characters. The comment's second sentence ("A full 40-character sha is what CI passes in") is read as describing the input shape, not as a request to edit `.github/workflows/pr-tests.yml`: no criterion asks for a CI change, and the tests set the variable themselves, so CI is left untouched (assumption, recorded per `user_story_alignment.md` Section 4).
- Assumption (feature Notes): the Notes say the item "registers a router in `backend/app/main.py`", but `GET /api/version` already exists on main and its router is already registered there (TEST-05). This plan extends the existing router, schema and service and does not modify `backend/app/main.py`; no second router is created.
- Assumption (blank value): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and reports `unknown`, matching the existing `CORS_ORIGINS` convention in `backend/app/core/config.py` and the behaviour `docs/DEVELOPMENT.md` already documents. Surrounding whitespace is stripped before truncation.

## Plan Overview
Backend only. Add one deployment-provided value, the build commit, to the settings module (`backend/app/core/config.py`) as `build_commit`, read from the `BUILD_COMMIT` environment variable per call with the documented default `unknown`, the same way `database_url` and `cors_origins` are read (`coding_standards.md` Section 5's invariant: one settings module, every environment-varying value read the same way, with a documented default). The version service gains `get_build_commit()`, which reads that setting and truncates it to 12 characters. The existing `VersionResponse` schema gains a `commit: str` field and the existing router populates it from the service. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container (`${BUILD_COMMIT:-unknown}`) and `.env.example` documents it. No frontend, no database, no migration, no new router, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response extended with `commit`. No new endpoint; `backend/app/main.py` is unchanged because the version router is already registered.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank. Add the field `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`, so it is read per call like `database_url` and `cors_origins`. This is the one declared source of criterion 2.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. Slicing leaves a value of 12 characters or fewer (including `unknown`) unchanged, so no branch is needed. It never raises: the settings read cannot fail, keeping the endpoint's "always 200" property from TEST-05.
- Router (`backend/app/routers/version.py`): return `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal commit string anywhere in the router.
- Schema (`backend/app/schemas/version.py`): add `commit: str` to `VersionResponse`, with a docstring note naming its source.
- Deployment wiring: `docker-compose.yml` backend service `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}` (the variable is set at build or deploy time by whoever builds the image; locally it defaults to `unknown`). `.env.example` gains a commented `BUILD_COMMIT=` entry under a new `--- Build ---` heading, left blank so a local run reports `unknown`.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, body defined by `VersionResponse` in `backend/app/schemas/version.py`:

```json
{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}
```

  With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

  `version` is unchanged from TEST-05 (installed distribution metadata, sentinel `unknown`). `commit` is `BUILD_COMMIT` stripped and truncated to its first 12 characters; a value of 12 characters or fewer is returned as is. Other methods on the path keep returning 405.

## Technology Selection
- Build commit source: chose the standard library's `os.environ` read inside the existing `Settings` dataclass (a `default_factory`, the pattern `cors_origins` already uses) over adding `pydantic-settings` or reading `git rev-parse` at runtime, because the container has no `.git` directory and a new dependency is unwarranted for one variable.
- Truncation to 12 characters: chose a plain string slice over any helper or library, because the standard language feature covers it completely.
- No other net-new component, module or dependency: the schema, router and service already exist and are extended in place.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per acceptance criterion plus the over-12-characters edge case (UAT Generation is ENABLED).
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read from `BUILD_COMMIT` per call.
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: populate `commit` from `get_build_commit()`.
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}` to the backend service.
- [B] .env.example: document `BUILD_COMMIT` (blank by default, reports `unknown`).
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset and blank cases.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set (40-character sha truncated to 12), short value verbatim, and unset (`unknown`) cases.
- [B] backend/tests/integration/test_version_integration.py: update the two existing exact-body assertions to include `commit`, and add set (40-character sha returns its first 12) and unset (`unknown`) request/response tests.

No dependency is added or changed, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: `docs/DEVELOPMENT.md` already documents `BUILD_COMMIT` exactly as this plan implements it (the paragraph beginning "`BUILD_COMMIT` sets the commit `GET /api/version` reports"), and the project structure and test infrastructure are unchanged. `backend/app/main.py` is not modified (the version router is already registered).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution in the settings module (set, unset, blank, surrounding whitespace) and `get_build_commit()` in the service layer (40-character sha truncated to 12, exactly-12 and shorter values verbatim, unset yields `unknown`). Environment manipulated with `monkeypatch.setenv` / `monkeypatch.delenv`, asserting the resolution rather than the literal fallback alone (`coding_standards.md` Section 5).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend test_config_unit.py and test_version_service_unit.py)
- Integration tests: full HTTP cycle through `TestClient` against `GET /api/version`: with `BUILD_COMMIT` set to a 40-character sha the body's `commit` is its first 12 characters; with it unset the body's `commit` is `unknown`; the response carries exactly the keys `version` and `commit`; existing 405 test kept. The session `client` fixture works because settings are read per request.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No acceptance criterion involves navigation or interaction through the UI (backend only; the footer display is TEST-10), so no spec is written (`testing_standards.md` Section 6, fourth question asked per criterion).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus the over-12-characters edge case, validated for well-formedness in CI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape over a real HTTP cycle |
| 2 | `commit` comes from one declared source (`BUILD_COMMIT`, default `unknown`, first 12 characters), never a router literal | Unit | Verifying it needs no navigation or interaction: it is a settings resolution and service truncation rule; the set path is also asserted at integration |
| 3 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the exact-keys body assertion proves `VersionResponse` shapes the response |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | Verifying it needs no navigation or interaction: the criterion is itself about these two tiers |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version is requested, Then commit equals its first 12 characters; Given BUILD_COMMIT is unset, Then commit is unknown |
| 3 | Body defined by a Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When GET /api/version is requested, Then the body carries exactly the keys version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the version unit and integration tests run, Then they report 0 failed |

## Manual verification plan
This feature has no UI; every check is an HTTP request to the backend or a test run. The footer display of the commit is TEST-10.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: repository checked out at the feature branch; `docker compose up -d --build` run from the repository root with no `BUILD_COMMIT` in the shell or `.env`.
1. Run `curl -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK` and header `content-type: application/json`.
2. Read the body → `{"version":"0.1.0","commit":"unknown"}` (the `version` value is whatever `backend/pyproject.toml` `[project].version` says; both values are strings).

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters), never a router literal
Prerequisites: the stack from Criterion 1 is running.
1. Run `curl -s http://localhost:8010/api/version` with `BUILD_COMMIT` unset → `commit` is `unknown`.
2. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` from the repository root, then `curl -s http://localhost:8010/api/version` → `commit` is `0123456789ab` (the first 12 of the 40 characters).
3. Run `BUILD_COMMIT=abc123 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc123` (shorter than 12, returned as is).
4. Run `BUILD_COMMIT=" " docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown` (blank counts as unset).
5. Open `backend/app/routers/version.py` → the router calls `get_build_commit()` and contains no commit string literal; `grep -n BUILD_COMMIT backend/app` finds it only in `backend/app/core/config.py`.
6. Run `docker compose up -d backend` with no `BUILD_COMMIT` to restore the default.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack from Criterion 1 is running.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the two string fields `version` and `commit`.
3. Run `curl -s http://localhost:8010/api/version` → the body carries exactly the keys `version` and `commit`, nothing else.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL instance reachable through `DATABASE_URL` (e.g. `docker compose up -d db` and `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`) for the integration file.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → `0 failed`; the output lists the new `build_commit` set, unset and blank tests and the `get_build_commit` truncation and unknown tests.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` with `DATABASE_URL` set → `0 failed`, with the set-commit (first 12 characters) and unset-commit (`unknown`) request tests among those run.
