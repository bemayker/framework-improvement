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
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`; per the tracker clarification, a `BUILD_COMMIT` longer than 12 characters is returned as its first 12 characters only.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: folded into criterion 1. The service layer truncates to the first 12 characters (`version_service.get_build_commit`, `COMMIT_LENGTH = 12`). A value of 12 characters or fewer is returned unchanged. Assumptions, since the comment does not settle them: surrounding whitespace is stripped before truncating, and a value that is blank after stripping counts as unset and yields `"unknown"`. Both truncation boundaries (40 characters and exactly 12) get unit tests, and the 40-character case also gets an integration test.
- Comment (tracker), the other 11 comments on the item: the dispatch identifies them as framework notes from earlier reverted runs, not requirements → not acted on, because they carry no requirement for this item.
- Description note "Registers a router in `backend/app/main.py` ... all three are complete" → not acted on as written, because it is stale against main at ef356f946f502e44bc16385c72d2a742625e60df. On main, `backend/app/main.py` registers only `version_router`, `notes_router` and `health_router`: no echo (TEST-06), uptime (TEST-07) or time (FEAT-1) router. `GET /api/version` already exists from TEST-05 (`backend/app/routers/version.py`, returning `{"version": ...}` only), and its router is already registered. This plan therefore **extends the existing endpoint and does not touch `backend/app/main.py` at all**. No second router and no duplicate route. The plan has no dependency on FEAT-1's concurrent `main.py` lines, and FEAT-1 merging first cannot conflict with it.
- Docs drift on main: `docs/DEVELOPMENT.md` line 665 already describes `BUILD_COMMIT`, and `README.md` line 70 says `.env.example` carries an optional `BUILD_COMMIT`. Neither is true of the code: no settings field, no compose passthrough, no `.env.example` line. This plan makes the README line true by adding the `.env.example` entry. The DEVELOPMENT.md paragraph is corrected to what this item ships: compose passes `${BUILD_COMMIT:-}` so the `"unknown"` default lives only in `backend/app/core/config.py`. The paragraph's claim that the footer shows 7 characters is dropped, because the footer is TEST-10's and is not built.

## Plan Overview
This is a backend-only extension of the TEST-05 version endpoint. A new `build_commit` field on the existing `Settings` dataclass reads `BUILD_COMMIT` from the environment per call. Unset or blank values become the default `"unknown"`. This is the one declared source (criterion 2), configured the same way as the module's other deployment-dependent values (`coding_standards.md` Section 5's invariant). The version service gains `get_build_commit()`, which reads that setting and keeps the first 12 characters (tracker clarification). The router builds `VersionResponse(version=..., commit=...)` from the two service calls and contains no literal. `VersionResponse` in `backend/app/schemas/version.py` gains `commit: str` (criterion 3). `docker-compose.yml` passes the host's `BUILD_COMMIT` through to the backend container, and `.env.example` documents it. Layering follows Router, Service, Settings (`coding_standards.md` Section 2.2): the router has no business logic, and the truncation rule lives in the service. There is no database work, no migration, no frontend change, and no change to `backend/app/main.py`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05). The response gains a `commit` field. Method, path, status code and the `version` field are unchanged. Route registration in `backend/app/main.py` is unchanged.
- Settings: in `backend/app/core/config.py`, add `DEFAULT_BUILD_COMMIT = "unknown"` and a `_read_build_commit()` helper. The helper returns `os.environ.get("BUILD_COMMIT")` stripped, or `DEFAULT_BUILD_COMMIT` when unset or blank. Add the field `build_commit: str = field(default_factory=_read_build_commit)` to `Settings`. It is read per call, like `database_url` and `cors_origins`, so the session-scoped test client sees a monkeypatched value.
- Service layer: in `backend/app/services/version_service.py`, add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which returns `get_settings().build_commit[:COMMIT_LENGTH]`. `get_app_version()` is unchanged.
- Router: in `backend/app/routers/version.py`, return `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No string literal for `commit`.
- Schema: in `backend/app/schemas/version.py`, add `commit: str` to `VersionResponse`.
- Run configuration: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`. It passes the host or CI value through, and blank falls back to the default in `config.py` so `"unknown"` is written once. `.env.example` gains a commented `BUILD_COMMIT` entry explaining that CI sets the full sha and that unset means `unknown`.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters
- Response: 200, `application/json`, schema `VersionResponse`, both fields required strings:
  - `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` gives `{"version": "0.1.0", "commit": "0123456789ab"}`
  - `BUILD_COMMIT=abc1234` gives `{"version": "0.1.0", "commit": "abc1234"}`
  - `BUILD_COMMIT` unset or blank gives `{"version": "0.1.0", "commit": "unknown"}`
  - `version` is the installed `backend/pyproject.toml` version (`0.1.0` at plan time), unchanged from TEST-05.
- Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- `BUILD_COMMIT` setting: chose a `default_factory` field on the existing `Settings` dataclass reading `os.environ` (standard library) over adding `pydantic-settings`, because the module already reads every deployment-dependent value this way and a new dependency for one variable is unwarranted.
- 12-character truncation: chose a plain string slice (standard library) over any helper or library, because a slice covers it completely.
- Response schema: chose the existing Pydantic `BaseModel` (`VersionResponse`, already installed through FastAPI) over a new model, extending it by one field.
- No other net-new component, module or dependency: no new files under `backend/app/`, and no dependency change.

## File Manifest
### New files
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus the edge cases (UAT Generation ENABLED)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()` (setting truncated to its first 12 characters)
- [B] backend/app/routers/version.py: return `commit` from `get_build_commit()` alongside `version`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] docker-compose.yml: backend `environment:` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` through
- [B] .env.example: document the optional `BUILD_COMMIT` variable (commented, unset means `unknown`)
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset, blank and whitespace-stripped cases
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit` cases for 40 characters (first 12), exactly 12 (unchanged), shorter (unchanged) and unset (`unknown`)
- [B] backend/tests/integration/test_version_integration.py: existing exact-body assertions gain `commit`, plus set (40-character sha gives the first 12) and unset (`unknown`) request/response tests
- [Docs] docs/DEVELOPMENT.md: correct the existing `BUILD_COMMIT` paragraph (around line 665) to the shipped wiring: compose passes `${BUILD_COMMIT:-}`, the default `unknown` lives in `backend/app/core/config.py`, and the footer claim is dropped (TEST-10's)

No dependency is added or changed, so no lockfile changes. `README.md` needs no edit: its line 70 already says `.env.example` carries an optional `BUILD_COMMIT`, which this item makes true. `backend/app/main.py` and `backend/tests/unit/test_main_unit.py` are deliberately untouched (see Re-Plan Feedback).

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank, whitespace stripped) and `version_service.get_build_commit` (40 characters gives the first 12, exactly 12 unchanged, shorter unchanged, unset gives `unknown`). Each covers the happy path, an edge case and the fallback case (`testing_standards.md` Section 1.1). Environment variables are set through `monkeypatch`, and `get_settings` is monkeypatched in the service test so it stays isolated.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: the full HTTP cycle on `GET /api/version` through the `client` fixture (`testing_standards.md` Section 1.2). A test with `BUILD_COMMIT` set to a 40-character sha asserts a 200 response with `commit` equal to its first 12 characters. A test with `BUILD_COMMIT` deleted asserts `commit == "unknown"`. The existing three tests are updated: the two exact-body assertions now expect `{"version": ..., "commit": "unknown"}` with `BUILD_COMMIT` deleted for determinism, and the 405 test is unchanged. Settings are read per call, so `monkeypatch.setenv` reaches the session-scoped client.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion involves navigation or interaction through the UI, because this item is backend only and no frontend reads `commit` yet (`testing_standards.md` Section 6, asked per criterion below). E2E is ENABLED in CLAUDE.md, but no criterion is assigned to it.
  - Directory: e2e/tests/ (no spec for this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the edge cases (exactly 12 characters, blank value), written against the API response.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings, `commit` cut to 12 characters | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour (TestClient asserts status and body) |
| 2 | `commit` comes from the declared `BUILD_COMMIT` source, default `unknown`, never a router literal | Unit | verifying it needs no navigation or interaction: it is settings resolution and service logic (env set, unset or blank), backed by the integration set and unset tests |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the router's `response_model=VersionResponse` shapes the body the integration test asserts exactly, and a schema missing `commit` fails it |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | verifying it needs no navigation or interaction: the criterion is the unit and integration tests themselves, executed by the test gate |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit`, `commit` cut to 12 | covered at Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When a client GETs /api/version, Then the status is 200 and `commit` is the sha's first 12 characters |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown` | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is unset, When a client GETs /api/version, Then `commit` is "unknown" |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the API is running, When a client reads /openapi.json, Then the VersionResponse schema has the required string properties `version` and `commit` |
| 4 | Unit and integration tests cover set and unset | covered at Unit, see Criterion coverage | Given the backend test suite, When the version and config tests run, Then 0 tests fail |

## Manual verification plan
This item has no UI: every criterion is checked against the API from a terminal at the repository root. Each block starts the backend directly on port 8010. Stop any `docker compose` backend first, or use another port and adjust the URLs.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`, `commit` cut to its first 12 characters
Prerequisites: backend dependencies installed (`uv sync --directory backend`); no database needed (the version endpoint answers without `DATABASE_URL`).
1. In terminal A, run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:create_app --factory --port 8010` → uvicorn logs `Uvicorn running on http://127.0.0.1:8010` (a warning that DATABASE_URL is unset is expected).
2. In terminal B, run `curl -s -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is `{"version":"0.1.0","commit":"0123456789ab"}` (12 characters; `version` matches `backend/pyproject.toml`, `0.1.0` at plan time).
3. Stop terminal A, restart it with `BUILD_COMMIT=0123456789ab` (exactly 12 characters), and repeat step 2 → `commit` is `0123456789ab`, unchanged.
4. Stop terminal A, restart it with `BUILD_COMMIT=abc1234`, and repeat step 2 → `commit` is `abc1234`.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, never a router literal
Prerequisites: as for criterion 1.
1. In terminal A, run `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` with `BUILD_COMMIT` not set (run `unset BUILD_COMMIT` first if your shell has it) → the server starts.
2. In terminal B, run `curl -s http://localhost:8010/api/version` → `{"version":"0.1.0","commit":"unknown"}`.
3. Stop terminal A, restart it with `BUILD_COMMIT="   "` (blank), and repeat step 2 → `commit` is `unknown`.
4. Open `backend/app/routers/version.py` → `commit` is assigned from `get_build_commit()` and no quoted commit value appears in the file. Open `backend/app/core/config.py` → `BUILD_COMMIT` is read in one place and `DEFAULT_BUILD_COMMIT = "unknown"` is declared there.
5. Optional, through Docker: run `BUILD_COMMIT=feedfacecafebeef00112233445566778899aabb docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `feedfacecafe`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the server from criterion 2 step 1 running.
1. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. In terminal B, run `curl -s http://localhost:8010/openapi.json`, and find `components` → `schemas` → `VersionResponse` in the output → it lists properties `version` and `commit`, both `"type": "string"`, and both appear in `required`.
3. In the same output, under `paths` → `/api/version` → `get` → `responses` → `200`, the schema reference is `#/components/schemas/VersionResponse`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: the backing database running for the integration tier (`docker compose up -d db`, host port 5442).
1. Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line reports `0 failed`, and no test in `test_version_integration.py` is skipped.
2. Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` → each file has a test that sets `BUILD_COMMIT` (expecting the first 12 characters) and a test that deletes it (expecting `unknown`).
