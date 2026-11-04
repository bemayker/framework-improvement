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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router; when `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 (tracker clarification, see Re-Plan Feedback).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: folded into criterion 2. The truncation lives in the service (`get_build_commit()` returns `settings.build_commit[:12]`), not in the router and not in config, so `Settings.build_commit` stays the raw declared value and the 12-character rule is one tested line of business logic. A value of 12 characters or fewer is returned unchanged, and the `"unknown"` default (7 characters) is unaffected by the slice. Unit tests cover a 40-character sha (returns its first 12), an exactly-12 value (unchanged) and a short value (unchanged); the integration test sets a 40-character sha and asserts the 12-character prefix.
- Assumption (no comment covers it): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `"unknown"`, and surrounding whitespace is stripped. This matches how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`, and it matters because `docker-compose.yml` passes `${BUILD_COMMIT:-}`, i.e. an empty string, when the host has none set. `docs/DEVELOPMENT.md` already documents exactly this ("When the variable is unset or blank the backend reports `unknown`").
- Assumption: the dispatch's scheduler note and the feature's Notes both say this item "registers a router in `backend/app/main.py`". It does not need to: `backend/app/main.py` on this base (3e00ad2) already imports and registers `version_router` (from TEST-05). This plan extends that existing router and does **not** list `backend/app/main.py`, so it is disjoint from BUG-01 on that file.

## Plan Overview
Extend the existing `GET /api/version` slice (router, service, schema from TEST-05) with a `commit` field. The value is declared once, as `Settings.build_commit` in `backend/app/core/config.py`, read per call from the `BUILD_COMMIT` environment variable with the default `"unknown"` (unset or blank). A new service function `get_build_commit()` in `backend/app/services/version_service.py` returns its first 12 characters. The router stays thin and builds `VersionResponse(version=..., commit=...)`; the schema gains `commit: str`. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container and `.env.example` documents it, so the variable "set at build time" actually reaches the app on the composed stack. Backend only, no database, no new dependency, no frontend change (the footer showing the commit is TEST-10's).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`), now returning `{"version": str, "commit": str}`. The router calls `get_app_version()` and `get_build_commit()` and holds no literal. No new route, no change to `backend/app/main.py` (the router is already registered).
- Service layer: `backend/app/services/version_service.py` gains `BUILD_COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which reads `get_settings().build_commit` and returns `[:BUILD_COMMIT_LENGTH]`. Settings are read per call (as everywhere else in this codebase), so a changed environment is seen without restarting the process, which is what lets the integration test set and unset the variable against the session `client`.
- Configuration: `backend/app/core/config.py` gains `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (strip, blank or unset becomes the default) and a `build_commit: str = field(default_factory=_read_build_commit)` field on the frozen `Settings` dataclass, following the `cors_origins` pattern exactly. This is the one declared source criterion 2 asks for (`coding_standards.md` Section 5: within one settings module, environment-dependent values are read from the environment with a documented default).
- Wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` beside `CORS_ORIGINS`, so a host or CI value reaches the container and an absent one arrives blank (which config maps to `"unknown"`). `.env.example` gains a commented `BUILD_COMMIT=` entry under a `--- Build ---` heading explaining that CI passes the full sha and the API reports its first 12 characters.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: `200 OK`, `application/json`, schema `VersionResponse` (`backend/app/schemas/version.py`):

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

  With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

  `version` is unchanged from TEST-05 (package metadata, `"unknown"` when the distribution is not installed). `commit` is always a string of at most 12 characters. `POST /api/version` stays `405`.

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library's `os.environ.get` inside the existing `Settings` dataclass over adding `pydantic-settings` (not installed) or a new config module, because the project already reads `DATABASE_URL` and `CORS_ORIGINS` this way and a second mechanism would split the one settings module's convention.
- Truncation to 12 characters: chose a plain string slice in the service over any helper or dependency; no alternative is needed.
- Response field: chose the installed `pydantic` `BaseModel` already used by `VersionResponse` (a new `commit: str` field) over a new schema class.
- No net-new component, module or dependency is introduced: every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan` (build-feature Section 14).
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (40-character sha truncated to 12); UAT Generation is ENABLED.

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT = "unknown"`, `_read_build_commit()` (strip, blank or unset becomes the default) and the `build_commit` field on `Settings`, read per call; extend the module docstring by one line.
- [B] backend/app/services/version_service.py: add `BUILD_COMMIT_LENGTH = 12` and `get_build_commit() -> str` returning the first 12 characters of `get_settings().build_commit`; update the module docstring to cover the commit.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: return `VersionResponse(version=get_app_version(), commit=get_build_commit())`; docstring names TEST-09.
- [B] docker-compose.yml: backend service `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`.
- [B] .env.example: add a `--- Build ---` block documenting the optional `BUILD_COMMIT` (full sha from CI, first 12 characters reported, `unknown` when unset).
- [B] backend/tests/unit/test_config_unit.py: add tests for `build_commit` (reads the env value, defaults to `unknown` when unset, treats blank or whitespace as unset, strips surrounding whitespace).
- [B] backend/tests/unit/test_version_service_unit.py: add tests for `get_build_commit()` (40-character sha returns its first 12, exactly-12 value unchanged, short value unchanged, unset returns `unknown`).
- [B] backend/tests/integration/test_version_integration.py: update the two existing exact-body assertions to include `commit`, and add set and unset commit cases through the HTTP cycle.

No dependency changes, so no lockfile entry (`backend/uv.lock` and `frontend/package-lock.json` are untouched).
README.md and docs/DEVELOPMENT.md need no edit: README.md line 70 already lists `.env.example` as carrying an optional `BUILD_COMMIT`, and docs/DEVELOPMENT.md already documents `BUILD_COMMIT` exactly as this plan builds it (pass-through in compose, first 12 characters, `unknown` default in `backend/app/core/config.py`); the Docs check confirms rather than edits them.
`backend/app/main.py` is deliberately not modified: `version_router` is already registered there.

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution in `backend/app/core/config.py` and `get_build_commit()` in `backend/app/services/version_service.py`, isolated with `monkeypatch` on the environment (no HTTP, no database).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend `test_config_unit.py` and `test_version_service_unit.py`)
  - Config cases: `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_settings_build_commit_treats_blank_value_as_unset` (parametrized over `""` and `"   "`), `test_settings_build_commit_strips_surrounding_whitespace`. These assert the resolution through `get_settings()` with the variable set, not the default literal alone (`coding_standards.md` Section 5).
  - Service cases: `test_get_build_commit_truncates_full_sha_to_twelve_characters` (40 characters in, the first 12 out), `test_get_build_commit_returns_value_of_exactly_twelve_unchanged`, `test_get_build_commit_returns_short_value_unchanged`, `test_get_build_commit_returns_unknown_when_unset`.
- Integration tests: the HTTP cycle of `GET /api/version` with the commit set and unset, via the existing session `client` fixture in `backend/tests/conftest.py` (not modified); no database needed.
  - Directory: backend/tests/integration/
  - Cases: `test_get_version_returns_200_with_version_from_pyproject` and `test_get_version_answers_when_database_url_is_unset` updated to `delenv("BUILD_COMMIT")` and assert `{"version": <pyproject version>, "commit": "unknown"}`; new `test_get_version_reports_first_twelve_characters_of_build_commit` (sets a 40-character sha, asserts `commit` is its first 12 and `version` unchanged); new `test_get_version_reports_unknown_commit_when_build_commit_blank`. `test_post_version_returns_405_method_not_allowed` unchanged.
- E2E tests: not warranted. E2E Tests is ENABLED, but no criterion involves navigation or interaction through the UI, and an E2E spec calling the API directly is a router integration test (`testing_standards.md` Section 5). No spec is added under `e2e/tests/`.
  - Directory: e2e/tests/
  - File: none (would have been `TEST-09_version_build_commit.spec.ts`)
- UAT scenarios: one API-level scenario per criterion plus the truncation edge case, written to the scenarios file in the manifest.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version", "commit"}` strings | Integration | verifying it needs no navigation or interaction: it is a router response shape, checked through the real HTTP cycle |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | Unit | verifying it needs no navigation or interaction: it is settings resolution and a slice in the service, set and unset paths isolated by monkeypatch (also asserted end to end at integration) |
| 3 | Response body is a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the router's `response_model=VersionResponse` is exercised by every integration case, and the exact-body assertions fail if the schema drops or adds a field |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit | verifying it needs no navigation or interaction: it is satisfied by the unit and integration cases listed above (set: 40-character sha; unset: absent and blank), and reviewed against the test files |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the API is running When a client requests GET /api/version Then the response is 200 with string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When GET /api/version Then commit is its first 12 characters; Given BUILD_COMMIT is unset Then commit is unknown |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the API is running When GET /api/version Then the body has exactly the fields version and commit |
| 4 | Tests cover set and unset paths | covered at Unit, see Criterion coverage | Given the backend test suite When it runs Then the set and unset commit cases pass with 0 failed |

## Manual verification plan
This feature has no UI: every criterion is verified through the API response and the test files, not by clicking through a page. The steps below use a terminal at the repository root.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: backend dependencies installed (`uv sync --directory backend`); port 8010 free.
1. In a terminal, run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:app --port 8010` → the log shows `Uvicorn running on http://127.0.0.1:8010` (a `DATABASE_URL is not set` warning is expected and harmless).
2. In a second terminal, run `curl -i http://localhost:8010/api/version` → the status line is `HTTP/1.1 200 OK`, the content type is `application/json`, and the body is `{"version":"0.1.0","commit":"0123456789ab"}` (the version is `[project].version` in `backend/pyproject.toml`).
3. Leave the server running for criterion 2.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters
Prerequisites: the server from criterion 1 step 1 is running.
1. Compare the body from criterion 1 step 2 with the value you passed → `commit` is `0123456789ab`, the first 12 of the 40-character `0123456789abcdef0123456789abcdef01234567`.
2. Stop the server (Ctrl+C) and restart it with no variable: `uv run --directory backend uvicorn app.main:app --port 8010` → server starts.
3. Run `curl http://localhost:8010/api/version` → body is `{"version":"0.1.0","commit":"unknown"}`.
4. Stop the server and restart it with a blank value: `BUILD_COMMIT= uv run --directory backend uvicorn app.main:app --port 8010`, then run `curl http://localhost:8010/api/version` → `commit` is `unknown`.
5. Stop the server and restart it with a short value: `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:app --port 8010`, then run `curl http://localhost:8010/api/version` → `commit` is `abc1234`.
6. Run `grep -n "unknown\|BUILD_COMMIT" backend/app/routers/version.py` → no match: the router holds no commit literal and no variable name.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: none.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `backend/app/routers/version.py` → the route is declared with `response_model=VersionResponse` and returns a `VersionResponse`.
3. With the server running (any `BUILD_COMMIT`), open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the two string fields `version` and `commit`.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: backend dependencies installed; no database needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary reports `0 failed`.
2. Open `backend/tests/unit/test_version_service_unit.py` → it contains `test_get_build_commit_truncates_full_sha_to_twelve_characters` (set path) and `test_get_build_commit_returns_unknown_when_unset` (unset path).
3. Open `backend/tests/integration/test_version_integration.py` → it contains `test_get_version_reports_first_twelve_characters_of_build_commit` (set path) and a case asserting `"commit": "unknown"` with `BUILD_COMMIT` removed (unset path).
