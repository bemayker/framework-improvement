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

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router. Amended by the tracker comment: a value longer than 12 characters is returned as its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the declared variable is named `BUILD_COMMIT` (the comment names it, the description did not); `version_service.get_build_commit()` returns the first 12 characters of the configured value, and a value of 12 characters or fewer (including the `unknown` default) is returned unchanged. Unit and integration tests assert a 40-character sha comes back as its first 12 characters. Recorded as an amendment on criterion 2.
- Assumption (no comment covers it): a `BUILD_COMMIT` that is set but blank or whitespace-only is treated as unset and yields `unknown`, mirroring how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`; surrounding whitespace is stripped before truncation.
- Assumption (description note): the Notes say this item registers a router in `backend/app/main.py`. The router already exists and is registered (TEST-05, `backend/app/routers/version.py`), so this plan extends that router and its schema and does not touch `main.py`. No duplicate endpoint is created.
- Merged since the last plan: n/a (fresh plan, branched from current main at eed558f, which reverted the earlier run).

## Plan Overview
Backend only. Extend the existing `GET /api/version` endpoint (TEST-05) so its response also carries `commit`. The single declared source is a new `build_commit` field on `Settings` in `backend/app/core/config.py`, read per call from the `BUILD_COMMIT` environment variable with the documented default `unknown`, following the same per-call `default_factory` shape `database_url` and `cors_origins` already use (coding_standards.md Section 5: one settings module, every deployment-dependent value read from the environment with a documented default). The service layer (`version_service.get_build_commit()`) applies the 12-character rule; the router only composes the response; the `VersionResponse` schema gains a required `commit: str`. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend service so a build can set it. No frontend, database, migration or new dependency. The frontend consumer of `commit` is TEST-10, out of scope here.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, `backend/app/routers/version.py`): response now `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No new route, no change to `backend/app/main.py`, which already registers the router.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper that returns the stripped `BUILD_COMMIT` value or the default when the variable is unset or blank, and a `build_commit: str` field on `Settings` using `field(default_factory=_read_build_commit)` so it is read per call like `cors_origins`. Extend the module docstring by one clause naming BUILD_COMMIT.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str`, which returns `get_settings().build_commit[:COMMIT_LENGTH]`. Reading settings per call is what lets an integration test set the variable after app creation. The router never holds a commit literal.
- Schema (`backend/app/schemas/version.py`): add a required `commit: str` field to `VersionResponse`, docstring updated to name TEST-09.
- Deployment wiring (`docker-compose.yml`): add a BUILD_COMMIT entry to the backend service environment that passes the host variable through with the compose default-value syntax and defaults to unknown, in the same shape as the existing CORS_ORIGINS line, with a one-line comment that CI or the build sets it to the full sha.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version
- Request: no body, no query parameters.
- Response: 200, `application/json`, `VersionResponse` with two required string fields, `version` (unchanged, from package metadata) and `commit` (first 12 characters of BUILD_COMMIT, or `unknown` when unset or blank). Example with BUILD_COMMIT set to a 40-character sha starting `1a2b3c4d5e6f`:
```json
{"version": "0.1.0", "commit": "1a2b3c4d5e6f"}
```

With BUILD_COMMIT unset: `{"version": "0.1.0", "commit": "unknown"}`. Errors: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- Reading BUILD_COMMIT: chose the standard library (`os.environ.get` inside a dataclass `default_factory` on the existing `Settings`) over adding `pydantic-settings`, because the project does not install it and the existing settings module already reads every environment value this way.
- 12-character truncation: chose a plain string slice (stdlib) over any helper or dependency; no alternative is smaller or clearer.
- `commit` field on the response: chose the already-installed Pydantic `BaseModel` (`VersionResponse`) over a new schema module, because criterion 3 asks for a Pydantic schema and one already exists for this endpoint.
- No net-new module, component or dependency is introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the blank-value edge case.
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and the per-call `Settings.build_commit` field.
- [B] backend/app/services/version_service.py: `COMMIT_LENGTH = 12` and `get_build_commit()` returning the first 12 characters of `Settings.build_commit`.
- [B] backend/app/schemas/version.py: required `commit: str` on `VersionResponse`.
- [B] backend/app/routers/version.py: build the response with `commit=get_build_commit()`; docstring names TEST-09.
- [B] docker-compose.yml: pass BUILD_COMMIT through to the backend service environment, default unknown.
- [B] backend/tests/unit/test_config_unit.py: `build_commit` read from BUILD_COMMIT, default when unset, default when blank, surrounding whitespace stripped.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` with a 40-character value (first 12 returned), a short value (unchanged), and unset (unknown).
- [B] backend/tests/integration/test_version_integration.py: existing assertions updated for the two-field body; new tests for BUILD_COMMIT set to a 40-character sha, unset, and the published OpenAPI schema of `VersionResponse` (both fields required strings).
- [Docs] docs/DEVELOPMENT.md: document BUILD_COMMIT (what sets it, its default, the 12-character response) beside the existing environment notes, because the run configuration gains a variable.

No dependency changes, so no lockfile entry. `README.md` needs no edit: project structure, dependencies and test infrastructure are unchanged.

## Testing Strategy
- Unit tests: `Settings.build_commit` (set, unset, blank, whitespace-padded) and `version_service.get_build_commit()` (40-character value truncated to 12, value of 12 or fewer unchanged, unset yields `unknown`), with BUILD_COMMIT controlled through `monkeypatch.setenv` and `monkeypatch.delenv`; existing version-service tests stay.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files `test_config_unit.py`, `test_version_service_unit.py`)
- Integration tests: full HTTP cycle on `GET /api/version` through the test client: BUILD_COMMIT set to a 40-character sha returns 200 with `commit` equal to its first 12 characters; BUILD_COMMIT unset returns 200 with `commit` equal to `unknown`; the existing DATABASE_URL-unset test asserts both fields; `POST` stays 405; the OpenAPI `VersionResponse` component lists `version` and `commit` as required strings.
  - Directory: backend/tests/integration/
- E2E tests: no spec for this item. E2E is ENABLED, but no criterion requires navigation or interaction through the UI (testing_standards.md Section 6, asked per criterion); the frontend does not render `commit` until TEST-10.
  - Directory: e2e/tests/
  - File: none (would be TEST-09_version_build_commit.spec.ts)
- UAT scenarios: one scenario per criterion plus the blank-BUILD_COMMIT edge case, phrased as API observations.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/version returns 200 with version and commit strings | Integration | verifying it needs no navigation or interaction: it is a router response shape |
| 2 | commit comes from BUILD_COMMIT, default unknown, first 12 characters when longer | Unit | verifying it needs no navigation or interaction: it is configuration and service logic, also exercised end to end at integration |
| 3 | Response body defined by a Pydantic schema in backend/app/schemas/ | Integration | verifying it needs no navigation or interaction: it is the published OpenAPI schema of the route |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | it is a statement about those two tiers, satisfied by the tests named above |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with version and commit | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | commit from BUILD_COMMIT, default unknown, truncated to 12 | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit is its first 12 characters; Given BUILD_COMMIT is unset, Then commit is unknown |
| 3 | Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads /openapi.json, Then VersionResponse requires string fields version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the version and config tests run, Then 0 failed |

## Manual verification plan
This feature has no UI of its own (the footer that shows the commit is TEST-10), so each block verifies through the browser address bar against the running backend on port 8010, which is a page a person can open and read.

### Criterion 1: GET /api/version returns 200 with version and commit strings
Prerequisites: Docker running; from the repository root, the stack started with BUILD_COMMIT unset: run `docker compose up -d --build --force-recreate backend`.
1. Open `http://localhost:8010/api/version` in a browser → the page shows a JSON object with exactly two fields, `version` and `commit`, both text values.
2. Open the browser developer tools Network tab and reload the page → the request to `/api/version` shows status 200.

### Criterion 2: commit comes from BUILD_COMMIT, default unknown, first 12 characters when longer
Prerequisites: the stack from Criterion 1.
1. With BUILD_COMMIT unset (as started above), open `http://localhost:8010/api/version` → `commit` reads `unknown`.
2. In a terminal at the repository root run `BUILD_COMMIT=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b docker compose up -d --force-recreate backend`, wait for the container to report healthy, then reload `http://localhost:8010/api/version` → `commit` reads `1a2b3c4d5e6f` (the first 12 of the 40 characters) and `version` is unchanged.
3. Run `BUILD_COMMIT=abc123 docker compose up -d --force-recreate backend` and reload the page → `commit` reads `abc123` (shorter than 12, returned unchanged).
4. Run `BUILD_COMMIT=" " docker compose up -d --force-recreate backend` and reload the page → `commit` reads `unknown` (blank is treated as unset).
5. Open `backend/app/routers/version.py` → it contains no commit string literal; the value comes from `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/
Prerequisites: the stack from Criterion 1.
1. Open `http://localhost:8010/docs`, expand `GET /api/version` → the 200 response schema is named `VersionResponse` and lists `version` and `commit`, both strings, both marked required.
2. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: the database from `docker compose up -d db` reachable on localhost port 5442.
1. From the repository root run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → `0 failed`, and the output lists tests for BUILD_COMMIT set, unset and blank.
2. Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`, including the tests for BUILD_COMMIT set to a 40-character sha and unset.
