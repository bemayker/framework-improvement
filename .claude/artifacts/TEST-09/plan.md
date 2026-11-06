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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router; when `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 characters (tracker comment, below).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the comment overrides the description where it is silent, so criterion 2 above now carries the 12-character cut. It also names the variable (`BUILD_COMMIT`), which the description left open. The cut lives in the service layer (`get_build_commit()`), not the router and not the settings module, so the settings value stays the raw declared source and the truncation is unit-testable. A value of 12 characters or fewer, and the `"unknown"` default, pass through unchanged. Assumption recorded: "A full 40-character sha is what CI passes in" describes the deployment's input, not a request to edit `.github/workflows/pr-tests.yml`; no criterion asks for CI to set it, the workflow is plugin-owned, and the tests set the variable themselves, so no CI file is in this manifest. Assumption recorded: leading and trailing whitespace is stripped and a blank value counts as unset (falls back to `"unknown"`), matching how `CORS_ORIGINS` already treats a blank value in the same settings module.
- History (not a merged-since notice): an earlier implementation of this item merged as #622 (dfc21f7) and was reverted wholesale by #625 (bb5fc2a, the plan base). This plan is written against the tree at bb5fc2a, where none of the TEST-09 code exists: `VersionResponse` has only `version`, `Settings` has no `build_commit`, and `docker-compose.yml` passes no `BUILD_COMMIT`. `docs/DEVELOPMENT.md` (the `BUILD_COMMIT` paragraph) and `README.md` (the `.env.example` line mentioning `optional BUILD_COMMIT`) survived the revert and already describe the behaviour this plan builds, so they are not re-edited; `.env.example` itself lacks the variable the README says it carries, so it is added here.
- Dispatch note: the tracker Notes say the item "registers a router in `backend/app/main.py`". At bb5fc2a the version router is already registered there (`app.include_router(version_router)`, from TEST-05), so this plan does not touch `main.py`. That removes the main.py overlap with BUG-01 that `feature_map.md` flags.

## Plan Overview
Extend the existing `GET /api/version` endpoint (TEST-05) so its response carries a `commit` field next to `version`. One declared source: a `build_commit` field on `Settings` in `backend/app/core/config.py`, read per call from the `BUILD_COMMIT` environment variable with the documented default `"unknown"` (same shape as `cors_origins`, per `coding_standards.md` Section 5's invariant). The service layer (`version_service.get_build_commit()`) returns that value cut to its first 12 characters. The router builds `VersionResponse(version=..., commit=...)`, and the schema gains `commit: str`. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container, and `.env.example` documents it. Backend only, no database, no new dependency, no change to `backend/app/main.py`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response now `{"version": str, "commit": str}`. Router stays thin: it calls `get_app_version()` and `get_build_commit()` and builds the schema. No literal commit string in the router.
- Service layer: `backend/app/services/version_service.py` gains `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:COMMIT_LENGTH]`. The default `"unknown"` is shorter than 12 and passes through unchanged. `get_app_version()` is unchanged.
- Settings: `backend/app/core/config.py` gains `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT")` stripped, or the default when unset or blank, and a `build_commit: str = field(default_factory=_read_build_commit)` field on `Settings`, read per call like `cors_origins` and `database_url`.
- Schema: `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`.
- Container wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` so a value set at build or deploy time reaches the process; blank falls back to `"unknown"` in settings. `.env.example` gains a commented `BUILD_COMMIT=` entry.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response 200, `application/json`, shape `{"version": string, "commit": string}`.
  - With `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `{"version": "0.1.0", "commit": "0123456789ab"}`
  - With `BUILD_COMMIT=abc1234`: `{"version": "0.1.0", "commit": "abc1234"}`
  - With `BUILD_COMMIT` unset or blank: `{"version": "0.1.0", "commit": "unknown"}`
  - (`version` is whatever `backend/pyproject.toml` `[project].version` holds, or `"unknown"` when the distribution is not installed, unchanged from TEST-05.)
- Response 405 on `POST /api/version` (unchanged).

## Technology Selection
- `build_commit` settings field: chose the standard library's `os.environ` inside the existing frozen `Settings` dataclass over `pydantic-settings` (not installed) or a new config module, because the module already reads `CORS_ORIGINS` and `DATABASE_URL` this way and one settings module must configure environment values the same way.
- 12-character cut: chose plain string slicing over any sha-parsing or validation library, because no criterion asks to validate the value, only to shorten it.
- `commit` response field: chose the already-installed Pydantic `BaseModel` (`VersionResponse`) over a hand-built dict, because criterion 3 requires a Pydantic schema.
- No net-new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge-case scenario (exactly-12 and shorter-than-12 values pass through).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-09/uat_script.md: the artifact copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, and the `build_commit` field on `Settings`, read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: `COMMIT_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: `commit: str` on `VersionResponse`.
- [B] backend/app/routers/version.py: build the response with `commit=get_build_commit()`.
- [B] backend/tests/unit/test_config_unit.py: `build_commit` resolves `BUILD_COMMIT` when set (stripped), and falls back to `"unknown"` when unset or blank.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` cuts a 40-character value to 12, passes a 12-character and a shorter value through, returns `"unknown"` when unset.
- [B] backend/tests/integration/test_version_integration.py: existing exact-body assertions updated for the new field; new set-path test (40-character sha in, first 12 out) and unset-path test (`"unknown"`).
- [B] docker-compose.yml: backend `environment:` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` through.
- [B] .env.example: documents the optional `BUILD_COMMIT` (full sha; the endpoint reports its first 12 characters; unset means `unknown`).

No dependency change, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: both already describe `BUILD_COMMIT` exactly as planned here (they survived the #625 revert), and the `.env.example` entry above is what makes the README's existing line true again.

## Testing Strategy
- Unit tests: settings resolution of `BUILD_COMMIT` (set, stripped, unset, blank) and the service's 12-character cut (40 characters in, exactly 12, shorter, unset default). Environment set with `monkeypatch.setenv` / `monkeypatch.delenv`, so the tests assert the resolution and not only the literal default (`coding_standards.md` Section 5).
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` (existing `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` through a fresh `create_app()` + `TestClient` per test (the session-scoped `client` fixture is fine for paths that do not change the environment): 200 with both keys, set path returns the first 12 characters of a 40-character sha, unset path returns `"unknown"`; existing database-free test and 405 test kept.
  - Directory: `backend/tests/integration/`
- E2E tests: no spec for this item. No criterion involves navigation or interaction through the UI (backend only; the footer that displays the commit is TEST-08's).
  - Directory: `e2e/tests/` (none written)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a value of exactly 12 characters and one shorter pass through unchanged), and the manual script.
  - Directory: `e2e/uat/scenarios/`, `e2e/uat/scripts/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router response shape |
| 2 | `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters), never a router literal | Unit and Integration | verifying it needs no navigation or interaction: it is settings resolution and a service rule, checked end to end through the HTTP cycle |
| 3 | Response body is a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a schema definition (`VersionResponse` fields) and the router's `response_model` |
| 4 | Unit and integration tests cover set and unset commit paths | Unit and Integration | it is a statement about the test suite itself, satisfied by the set and unset tests in both tiers |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string `version` and `commit` |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When a client requests GET /api/version, Then `commit` is its first 12 characters; Given BUILD_COMMIT is unset, Then `commit` is `unknown` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend source, When a reviewer opens `backend/app/schemas/version.py`, Then `VersionResponse` declares `version: str` and `commit: str` |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When it runs, Then the set and unset commit tests pass with 0 failed |

## Manual verification plan
This item has no UI: every criterion is verified against the HTTP endpoint or the source and test suite, with the backend reached at `http://localhost:8010` (docker compose) from a terminal at the repository root.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: Docker running; the stack started from the repository root with `docker compose up -d --build backend` and the backend container healthy.
1. Run `curl -s -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → it is a JSON object with exactly two keys, `version` (for example `"0.1.0"`, the value in `backend/pyproject.toml`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters), never a router literal
Prerequisites: the same stack as Criterion 1.
1. Start the backend with no commit set: `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` absent from the shell and from `.env` → container healthy.
2. Run `curl -s http://localhost:8010/api/version` → the body's `commit` is `"unknown"`.
3. Recreate it with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --force-recreate backend` → container healthy.
4. Run `curl -s http://localhost:8010/api/version` → `commit` is `"0123456789ab"` (the first 12 characters), and `version` is unchanged.
5. Recreate it with a short value: `BUILD_COMMIT=abc1234 docker compose up -d --force-recreate backend`, then run the same curl → `commit` is `"abc1234"`, unchanged.
6. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()` in `backend/app/services/version_service.py`, which reads `get_settings().build_commit` from `backend/app/core/config.py`.
7. Recreate the backend without the variable again (step 1) to leave the stack in its default state.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the repository checked out on the feature branch.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `backend/app/routers/version.py` → the route is declared with `response_model=VersionResponse` and returns a `VersionResponse`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; for the integration tier a database is not needed by these tests.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the run ends with `0 failed`.
2. Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` → each has a test that sets `BUILD_COMMIT` (a 40-character sha, expecting its first 12 characters) and one that unsets it (expecting `"unknown"`).
