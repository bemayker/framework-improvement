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

(Source: ClickUp task 123k99cwybk, read via `clickup_get_task` in workspace 30307190 at plan time.)

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router; when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12 (tracker comment, see Re-Plan Feedback).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the comment fixes the variable name (`BUILD_COMMIT`) and adds a truncation rule the description lacks. Criterion 2 above carries it; the service layer truncates to 12 characters (`BUILD_COMMIT_LENGTH = 12`); unit and integration tests assert a 40-character sha comes back as its first 12, and a value of 12 or fewer comes back unchanged. Assumption recorded: a blank or whitespace-only `BUILD_COMMIT` counts as unset and yields `"unknown"` (matching how `CORS_ORIGINS` treats a blank value in the same settings module, and what `docs/DEVELOPMENT.md` already documents), and surrounding whitespace is stripped before truncation.
- Description note "Registers a router in `backend/app/main.py`" → not acted on because on the plan base (main @ 64dae87) the version router already exists (`backend/app/routers/version.py`, TEST-05) and `create_app()` already calls `app.include_router(version_router)`. TEST-09 extends that router, its schema and its service; **TEST-09 does not touch `backend/app/main.py`.**
- Merged since the last plan: n/a (fresh plan, no `[merged-since]` lines in the dispatch; plan base is main @ 64dae872f765e6a62b6dd6388ddf3e1e76326829).

## Plan Overview
Extend the existing `GET /api/version` endpoint (TEST-05) with a `commit` field. The value comes from one declared source: the `BUILD_COMMIT` environment variable, read in the settings module `backend/app/core/config.py` alongside the other environment-read values, with the documented default `"unknown"` when unset or blank. The version service exposes `get_build_commit()`, which applies the 12-character rule; the router builds the response from the service, and the Pydantic `VersionResponse` schema gains `commit: str`. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend container and `.env.example` declares it as optional. Backend only: no frontend, no database, no new dependency, no change to `backend/app/main.py`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response gains `commit`. The router contains no commit literal; it calls `get_build_commit()`.
- Service layer: `backend/app/services/version_service.py` adds `BUILD_COMMIT_LENGTH = 12` and `get_build_commit() -> str`, returning `get_settings().build_commit[:BUILD_COMMIT_LENGTH]`. Settings are read per call (no cache), so a changed environment is reflected without restarting, which is what the tests rely on.
- Settings: `backend/app/core/config.py` adds `UNKNOWN_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (strip `os.environ.get("BUILD_COMMIT")`; empty after strip returns `UNKNOWN_BUILD_COMMIT`), and a `build_commit: str = field(default_factory=_read_build_commit)` field on `Settings`, the same per-call pattern `database_url` and `cors_origins` use (coding_standards.md Section 5: within one settings module every deployment-dependent value reads the environment the same way, with a documented default).
- Schema: `backend/app/schemas/version.py` `VersionResponse` adds `commit: str`.
- Repository layer: none (no data access).
- Migrations: none.
- Wiring: `docker-compose.yml` backend service `environment:` adds `BUILD_COMMIT: ${BUILD_COMMIT:-}` (blank passes through and resolves to `"unknown"`); `.env.example` adds a commented optional `BUILD_COMMIT=` entry under a new `--- Backend build ---` heading. `backend/Dockerfile` is unchanged: the variable is supplied to the running container's environment, not baked into the image.
- `backend/app/main.py`: **not modified.** The version router is already registered there.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response: 200, `application/json`, shape `VersionResponse`:

```json
{"version": "0.1.0", "commit": "3f9c2a1b7d4e"}
```

  With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

  `version` keeps its TEST-05 behaviour (installed package metadata, `"unknown"` when not installed). `commit` is at most 12 characters. Other methods return 405 (unchanged).

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ.get` inside the existing `Settings` dataclass over adding `pydantic-settings`, because the settings module already reads every environment value this way and one variable does not justify a new dependency.
- Truncation to 12 characters: chose a plain string slice (standard library) in the service; no alternative needed.
- Response schema: chose the already-installed Pydantic `BaseModel` (existing `VersionResponse`), extended by one field; no new module.
- No net-new component, module or dependency beyond these field and function additions to existing files.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (40-character sha truncated to 12).
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: add `BUILD_COMMIT_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: return `VersionResponse(version=get_app_version(), commit=get_build_commit())`.
- [B] docker-compose.yml: backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`.
- [B] .env.example: declare optional `BUILD_COMMIT` with a comment (full sha from CI; unset means `unknown`).
- [B] backend/tests/unit/test_config_unit.py: `build_commit` read from the environment, default when unset, default when blank, whitespace stripped.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` set (short value unchanged), set (40-character sha truncated to 12), unset (`unknown`).
- [B] backend/tests/integration/test_version_integration.py: update the two exact-body assertions to include `commit`; add set-path (40-character sha returns first 12) and unset-path (`unknown`) request/response tests.

`backend/app/main.py` is NOT in this manifest: TEST-09 does not modify it (the version router is already registered by TEST-05). This is the answer to the scheduler's BUG-01 question.
No lockfile changes: this feature adds no dependency, so neither `backend/uv.lock` nor `package-lock.json` changes.
No E2E spec file: no criterion is verified through the UI (see Criterion coverage), so Phase D has no entry.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: both already describe `BUILD_COMMIT` exactly as this plan implements it (README's `.env.example` line names the optional `BUILD_COMMIT`; DEVELOPMENT.md's `BUILD_COMMIT` paragraph names the compose pass-through as `${BUILD_COMMIT:-}`, the 12-character rule and the `unknown` default in `backend/app/core/config.py`). The build's Section 15 check should confirm that and change nothing.

## Testing Strategy
- Unit tests: settings resolution of `BUILD_COMMIT` (`Settings.build_commit`) and the service rule `get_build_commit()` (set, truncated, unset, blank), with the environment controlled by `monkeypatch`; no database, no HTTP.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extending the existing `test_config_unit.py` and `test_version_service_unit.py`)
- Integration tests: real HTTP request/response cycle through `create_app()` and `TestClient` for `GET /api/version`: 200 with both keys, set path (`BUILD_COMMIT` = a 40-character sha returns its first 12), unset path (`unknown`), and the existing 405 case. Assert the resolved value from the environment, not the literal default alone (coding_standards.md Section 5). No database needed: the lifespan already skips schema setup when `DATABASE_URL` is unset.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. E2E is ENABLED, but no criterion involves navigation or interaction through the UI; the endpoint has no UI in this feature (the footer that displays the commit is TEST-10).
  - Directory: e2e/tests/
  - File: none (would be TEST-09_version-build-commit.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus the truncation edge case, phrased at the API level.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router request/response behaviour. |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters), never a router literal | Unit and Integration | Verifying it needs no navigation or interaction: it is a settings and service rule, checked by unit tests and end to end over HTTP by integration tests. |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the response model's exact keys are asserted on the HTTP body, and the schema file is checked at review. |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | It is a statement about the tests themselves; it is met by the named unit and integration tests existing and passing. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string `version` and `commit` |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then `commit` is its first 12 characters; Given BUILD_COMMIT is unset, Then `commit` is `unknown` |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When GET /api/version, Then the body has exactly the keys `version` and `commit` |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the repository, When the version unit and integration tests run, Then 0 failed |

## Manual verification plan
This feature has no UI: the endpoint is read with an HTTP client. Each block below is the observable check instead of a click path.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: repository checked out on the feature branch; `uv` installed; nothing listening on port 8010; `BUILD_COMMIT` not set in your shell.
1. In a terminal at the repository root, run `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` → the log shows `Uvicorn running on http://127.0.0.1:8010` (a warning that `DATABASE_URL` is not set is expected and harmless).
2. In a second terminal, run `curl -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK`, header `content-type: application/json`.
3. Read the body → exactly `{"version":"0.1.0","commit":"unknown"}` (the `version` value is `[project].version` in `backend/pyproject.toml`; both values are strings).

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: the server from Criterion 1 stopped (Ctrl+C).
1. Start the server with the variable set: `BUILD_COMMIT=3f9c2a1b7d4e8f60a1b2c3d4e5f60718293a4b5c uv run --directory backend uvicorn app.main:create_app --factory --port 8010` → the server starts.
2. Run `curl -s http://localhost:8010/api/version` → body `{"version":"0.1.0","commit":"3f9c2a1b7d4e"}`: the first 12 characters of the 40-character sha, not the whole value.
3. Stop the server, restart it with `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, run the same curl → `"commit":"abc1234"` (a value of 12 or fewer characters comes back unchanged).
4. Stop the server, restart it with `BUILD_COMMIT= uv run --directory backend uvicorn app.main:create_app --factory --port 8010` (blank), run the same curl → `"commit":"unknown"`.
5. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the server from Criterion 1 running.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the two string properties `version` and `commit`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: repository at the feature branch tip; `uv` installed.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary line shows `0 failed`.
2. Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` → each has a test that sets `BUILD_COMMIT` (asserting the first 12 characters of a 40-character sha) and a test with it unset (asserting `unknown`).
