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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification, a value longer than 12 characters is reported as its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the service truncates the configured value to its first 12 characters (`COMMIT_LENGTH = 12` in `backend/app/services/version_service.py`); a value of 12 characters or fewer, including the `unknown` default, is returned unchanged. Unit tests cover a 40-character sha, an exactly-12 value and a shorter value; the integration test sets a 40-character sha and asserts the 12-character prefix. The second sentence is read as describing the input shape, not as a request to change CI: no criterion asks for CI wiring, `.github/workflows/pr-tests.yml` passes no `BUILD_COMMIT` today, and `docs/DEVELOPMENT.md` already states CI reports `unknown`, so CI is left untouched (scope containment, `user_story_alignment.md` Section 3).
- Assumption (no comment, recorded so the reviewer can see it): the environment variable is named `BUILD_COMMIT`. The feature text does not name it; `docs/DEVELOPMENT.md` and `README.md` on main already document `BUILD_COMMIT` for exactly this endpoint, so the plan matches the documentation rather than inventing a second name. A blank value (`BUILD_COMMIT=`) is treated as unset and yields `unknown`, which is also what `docs/DEVELOPMENT.md` documents and what makes the compose passthrough `${BUILD_COMMIT:-}` safe.
- Assumption: the feature's note that this item "registers a router in `backend/app/main.py`" is out of date for the code on main. The version router (`backend/app/routers/version.py`, TEST-05) is already registered in `create_app()`, so this item extends the existing endpoint and does not touch `main.py`. This removes the `main.py` overlap with BUG-01 that the map row flags.
- Merged since the last plan: n/a (fresh plan on plan base f7e2be6, branched from current main; earlier TEST-09 code was reset by f7e2be6 and is not on main).

## Plan Overview
Extend the existing `GET /api/version` endpoint (TEST-05) with a `commit` field. The value is declared once in the settings module (`backend/app/core/config.py`, field `build_commit`, read from `BUILD_COMMIT` per call, blank or unset falls back to `DEFAULT_BUILD_COMMIT = "unknown"`), shortened to its first 12 characters in the version service, and returned through the existing `VersionResponse` Pydantic schema, which gains `commit: str`. The router stays a thin pass-through with no literal. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container so a build-time value reaches the running service, and `.env.example` documents the optional variable. Backend only; no frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. The router builds `VersionResponse(version=get_app_version(), commit=get_build_commit())` and contains no string literal for the commit.
- Service layer: `backend/app/services/version_service.py` gains `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which reads `get_settings().build_commit` per call (never cached at import, so a test's environment change is seen by the session-scoped client) and returns `value[:COMMIT_LENGTH]`.
- Settings: `backend/app/core/config.py` gains `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper returning `os.environ.get("BUILD_COMMIT", "").strip() or DEFAULT_BUILD_COMMIT`, and the field `build_commit: str = field(default_factory=_read_build_commit)`, the same per-call env shape as `cors_origins` so the module keeps one configuration mechanism (`coding_standards.md` Section 5 invariant). This is the single declared source criterion 2 requires.
- Schema: `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`.
- Runtime wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}` (blank passes through and resolves to `unknown` in the settings module, so the default lives in exactly one place, not in compose). `.env.example` gains a commented optional `BUILD_COMMIT=` line.
- Repository layer: none (no data access).
- Migrations: none.
- `backend/app/main.py`: unchanged (router already registered).
- Check after the build: `bash ~/.mayker/mayker-dev/hooks/lib/config-consistency.sh settings backend/app/core/config.py` (exit 1 is a violation, 2 is could-not-check and never a pass).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `application/json`, schema `VersionResponse`:

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`commit` is the first 12 characters of `BUILD_COMMIT`, or the whole value when it is 12 characters or fewer. `version` behaviour is unchanged from TEST-05. `POST /api/version` stays 405.

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ` inside the existing dataclass `Settings` over adding `pydantic-settings`, because the settings module already reads every environment value this way and a new dependency would split it into two mechanisms.
- Truncating to 12 characters: chose a plain string slice (stdlib) over any helper or library; no alternative is needed.
- Response field: chose the existing Pydantic `VersionResponse` (installed via FastAPI) over a new schema class; no new module or dependency is introduced by this feature.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (40-character sha truncated to 12; blank value reports unknown)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the `build_commit` settings field
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: return `commit` from `get_build_commit()`
- [B] backend/tests/unit/test_config_unit.py: set, unset and blank `BUILD_COMMIT` cases for the settings field
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` truncation and default cases
- [B] backend/tests/integration/test_version_integration.py: set and unset commit through the HTTP cycle, the OpenAPI schema check for `VersionResponse`; existing assertions updated for the new field
- [B] docker-compose.yml: pass `BUILD_COMMIT` through to the backend service as `${BUILD_COMMIT:-}`
- [B] .env.example: document the optional `BUILD_COMMIT` variable

No dependency changes, so no lockfile (`backend/uv.lock`, `package-lock.json`) is regenerated.
No `README.md` or `docs/DEVELOPMENT.md` edit is expected: both already document `BUILD_COMMIT`, the 12-character response, the `unknown` default in `backend/app/core/config.py`, and the `.env.example` entry; the Section 15 docs check confirms they still match the built code.
No E2E spec is produced: no criterion is assigned to the E2E tier (see Criterion coverage).

## Testing Strategy
- Unit tests: settings field resolution and the service's truncation rule, with the environment controlled by `monkeypatch` (never relying on the ambient `BUILD_COMMIT`).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend the existing `test_config_unit.py` and `test_version_service_unit.py`)
  - Cases: `BUILD_COMMIT` set to a 7-char value is returned as-is by settings; unset gives `unknown`; blank and whitespace-only give `unknown`; `get_build_commit()` returns the first 12 of a 40-char sha, an exactly-12 value unchanged, a short value unchanged, and `unknown` when unset (reads settings per call: two calls across an env change return different values).
- Integration tests: full HTTP cycle on `GET /api/version` with `BUILD_COMMIT` set (40-char sha, asserts `commit` equals its first 12 and `version` equals pyproject's) and unset (`delenv`, asserts `commit == "unknown"`); the two existing tests' exact-body assertions gain the `commit` key with `BUILD_COMMIT` explicitly unset; `GET /openapi.json` shows the 200 response referencing `VersionResponse` with required string properties `version` and `commit`; `POST` stays 405. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. Every criterion is an API or code-structure property with no navigation or interaction (Criterion coverage below), so Phase D generates no spec.
  - Directory: e2e/tests/
  - File: none (would be TEST-09_version_build_commit.spec.ts)
- UAT scenarios: verify the response shape with the commit set and unset, and the 12-character truncation.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked through the real HTTP cycle |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters), never a router literal | Unit and Integration | Verifying it needs no navigation or interaction: settings resolution and truncation are unit-level rules, and the integration test proves the env value reaches the response |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: an integration test reads `GET /openapi.json` and asserts the 200 response of `/api/version` references `VersionResponse`, whose required properties are `version` and `commit`, both `string` |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | Verifying it needs no navigation or interaction: it is satisfied by the tests above existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 chars | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version is requested, Then commit is its first 12 characters; Given BUILD_COMMIT is unset, Then commit is unknown |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the API docs at /docs, When the VersionResponse schema is opened, Then it lists version and commit as strings |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the version tests run, Then 0 fail |

## Manual verification plan
This feature has no UI; every criterion is verified against the running API with curl and the browser's API docs page.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: the repository checked out on the feature branch, Docker running, ports 8010 free.
1. From the repository root run `docker compose up -d --build backend` (no `BUILD_COMMIT` set in the shell or `.env`) → the `backend` and `db` containers report running.
2. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the body is `{"version":"0.1.0","commit":"unknown"}`.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: as for Criterion 1.
1. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` → the backend container is recreated.
2. Run `curl -s http://localhost:8010/api/version` → body is `{"version":"0.1.0","commit":"0123456789ab"}` (the first 12 characters of the 40-character value).
3. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (shorter than 12, unchanged).
4. Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown` (blank counts as unset).
5. Open `backend/app/routers/version.py` → the router contains no commit string literal; it calls `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend running as in Criterion 1.
1. Open `http://localhost:8010/docs` in a browser → the Swagger UI lists `GET /api/version`.
2. Expand `GET /api/version` and its 200 response → the schema shown is `VersionResponse` with `version` (string) and `commit` (string), both required.
3. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary reports `0 failed`.
2. Open `backend/tests/integration/test_version_integration.py` → one test sets `BUILD_COMMIT` to a 40-character sha and asserts the 12-character `commit`, and one unsets it and asserts `unknown`.
