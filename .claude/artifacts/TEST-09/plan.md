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
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. Per the tracker clarification: when `BUILD_COMMIT` is longer than 12 characters, `commit` is its first 12 characters.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: criterion 2 now carries the 12-character rule; `version_service.get_build_commit()` truncates to `COMMIT_LENGTH = 12`; unit and integration tests assert a 40-character sha yields its first 12 characters and a value of 12 or fewer characters is returned unchanged.
- Comment (tracker): the 25 `mayker-dev: PR opened for TEST-09 ...` notes from earlier autonomous runs (PRs #172 to #582) → not acted on as requirements: they are the framework's own status notes, not stakeholder feedback, and none of those PRs' code is on the plan base a7ddb99 (the sandbox was reset). Their one behavioural statement, "whitespace stripped first; a blank value counts as unset and gives unknown", matches what `docs/DEVELOPMENT.md` already documents for `BUILD_COMMIT`, so this plan adopts it as the stated assumption below rather than as new scope.
- Assumption (ambiguity, recorded rather than asked): `BUILD_COMMIT` is stripped of surrounding whitespace before use, and an empty or whitespace-only value counts as unset and yields `"unknown"`. Reason: `docker-compose.yml` passes the variable through as `${BUILD_COMMIT:-}`, so an unset host variable reaches the container as an empty string, which must not be reported as an empty commit.

## Plan Overview
Backend only. The version endpoint (`GET /api/version`, delivered by TEST-05) already exists with its router, service, schema and registration in `backend/app/main.py`. This item extends it with a `commit` field:

1. `backend/app/core/config.py` declares the single source: a `build_commit` setting read per call from the `BUILD_COMMIT` environment variable, whitespace-stripped, falling back to `DEFAULT_BUILD_COMMIT = "unknown"` when unset or blank, in the same `default_factory` shape the module already uses for `DATABASE_URL` and `CORS_ORIGINS`.
2. `backend/app/services/version_service.py` gains `get_build_commit()`, which reads `get_settings().build_commit` at call time and returns its first 12 characters.
3. `backend/app/schemas/version.py` `VersionResponse` gains `commit: str`.
4. `backend/app/routers/version.py` passes `commit=get_build_commit()`; no literal commit string in the router.
5. `docker-compose.yml` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service, which `docs/DEVELOPMENT.md` already documents.

**`backend/app/main.py` is not edited:** the version router is already registered there (TEST-05), so the ticket's note "Registers a router in backend/app/main.py" describes state already on main. This keeps the item disjoint from BUG-01, which may register its own router in `main.py` concurrently.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, extended): returns `{"version": ..., "commit": ...}`. No new route, no new router registration.
- Configuration (`backend/app/core/config.py`): add `DEFAULT_BUILD_COMMIT = "unknown"` and a module function `_read_build_commit() -> str` returning `(os.environ.get("BUILD_COMMIT") or "").strip() or DEFAULT_BUILD_COMMIT`; add `build_commit: str = field(default_factory=_read_build_commit)` to `Settings` with a one-line comment naming the variable and its default. This is the one declared source; nothing else reads `BUILD_COMMIT`.
- Service layer (`backend/app/services/version_service.py`): add `COMMIT_LENGTH = 12` and `get_build_commit() -> str` returning `get_settings().build_commit[:COMMIT_LENGTH]`. Settings are read at call time, never at import, so a value changed after import (and the tests' `monkeypatch.setenv`) is honoured by the session-scoped test client. `"unknown"` is shorter than 12 characters and passes through unchanged. Update the module docstring to cover the commit.
- Schema (`backend/app/schemas/version.py`): `VersionResponse` gets `commit: str` after `version: str`; docstring updated.
- Router (`backend/app/routers/version.py`): `return VersionResponse(version=get_app_version(), commit=get_build_commit())`.
- Deployment (`docker-compose.yml`): under `backend.environment`, add `BUILD_COMMIT: ${BUILD_COMMIT:-}` with a comment that the default lives in `backend/app/core/config.py`. Empty passthrough on purpose, so the `"unknown"` default exists in one place only.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `application/json`, body defined by `VersionResponse` in `backend/app/schemas/version.py`:

```json
{"version": "0.1.0", "commit": "3f2a9c1d4e5b"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

`version` behaviour is unchanged from TEST-05. `commit` is the stripped `BUILD_COMMIT` value cut to its first 12 characters, or `"unknown"`. Downstream consumer: TEST-10 (footer shows the build commit) reads this field.

## Technology Selection
- `BUILD_COMMIT` setting: chose the standard library's `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` or a dotenv loader, because the module already resolves every other environment value this way and the invariant of one configuration style per settings module requires it.
- `get_build_commit()` truncation: chose plain string slicing over any helper or dependency; no rung offers anything simpler.
- No new dependency, module or component is introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus the blank-value edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/core/config.py: declare `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and `Settings.build_commit` from `BUILD_COMMIT`
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()`
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response
- [B] docker-compose.yml: pass `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service
- [B] backend/tests/unit/test_config_unit.py: unit tests for `build_commit` set, stripped, blank and unset
- [B] backend/tests/unit/test_version_service_unit.py: unit tests for `get_build_commit()` truncation, short value and unknown
- [B] backend/tests/integration/test_version_integration.py: assert the new `commit` field with `BUILD_COMMIT` set and unset; update the existing exact-body assertions to include `commit`

No lockfile changes: no dependency is added or changed.
No `README.md` or `docs/DEVELOPMENT.md` edit is expected: `docs/DEVELOPMENT.md` already documents `BUILD_COMMIT` exactly as planned here (compose passthrough as `${BUILD_COMMIT:-}`, first 12 characters, `unknown` default in `backend/app/core/config.py`), so the Section 15 check should find it current.
No E2E spec file: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: configuration resolution and the service's truncation rule, with the environment set via `monkeypatch`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extend `test_config_unit.py` and `test_version_service_unit.py`)
  - `test_config_unit.py`: `test_build_commit_reads_build_commit_env_var` (set `abc1234` gives `abc1234`), `test_build_commit_strips_surrounding_whitespace`, `test_build_commit_defaults_to_unknown_when_unset` (asserts `DEFAULT_BUILD_COMMIT == "unknown"`), parametrised `test_build_commit_defaults_to_unknown_when_blank` (`""`, `"   "`).
  - `test_version_service_unit.py`: `test_get_build_commit_returns_first_12_characters_of_full_sha` (40-character sha), `test_get_build_commit_returns_short_value_unchanged` (exactly 12 characters, and 7), `test_get_build_commit_returns_unknown_when_unset`. Patch the environment, not `get_settings`, so the wiring from variable to service is what is asserted, not a literal fallback.
- Integration tests: full HTTP cycle through `TestClient`.
  - Directory: backend/tests/integration/
  - `test_version_integration.py`: `test_get_version_returns_commit_from_build_commit_env_var` (40-character sha set, body `commit` equals its first 12 characters), `test_get_version_returns_unknown_commit_when_build_commit_unset` (`monkeypatch.delenv("BUILD_COMMIT", raising=False)`), `test_get_version_returns_unknown_commit_when_build_commit_blank`; the two existing exact-body assertions gain `"commit"` (delete `BUILD_COMMIT` in those tests so the expected body is deterministic); the existing 405 case stays.
- E2E tests: none for this item. E2E is ENABLED in CLAUDE.md, but no criterion requires navigation or interaction through the UI (backend-only endpoint).
  - Directory: e2e/tests/
  - File: not created (no E2E-tier criterion)
- UAT scenarios: one scenario per criterion plus the blank-value edge case, expressed as API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked through the real HTTP cycle |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | Unit and Integration | Verifying it needs no navigation or interaction: it is configuration resolution and a service rule (unit), plus its wiring to the response (integration) |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the response body produced through `VersionResponse` is asserted exactly; the schema's location is checked at review |
| 4 | Unit and integration tests cover set and unset commit paths | Unit and Integration | It is a statement about the test suite itself; the named tests above are its coverage |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 | covered at Unit and Integration, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha, When GET /api/version, Then commit is its first 12 characters; Given BUILD_COMMIT is unset or blank, Then commit is unknown |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When GET /api/version, Then the body has exactly the fields version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite, When the version and config tests run, Then 0 failed |

## Manual verification plan
This feature has no UI: every criterion is verified against the HTTP endpoint with `curl` and against the test suite. Commands run from the repository root.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: Docker running; the stack started with `docker compose up -d --build backend` (no `BUILD_COMMIT` exported in the shell).
1. Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` → prints `200`.
2. Run `curl -s http://localhost:8010/api/version` → prints a JSON object with exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`, e.g. `0.1.0`) and `commit`, both strings.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: as Criterion 1.
1. With the stack started without `BUILD_COMMIT`, run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
2. Restart the backend with a full sha: `BUILD_COMMIT=3f2a9c1d4e5b6a7f8091a2b3c4d5e6f708192a3b docker compose up -d --force-recreate backend` → container recreated.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `3f2a9c1d4e5b` (12 characters).
4. Restart with a short value: `BUILD_COMMIT=abc1234 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234`.
5. Restart with a blank value: `BUILD_COMMIT="   " docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
6. Run `grep -n "commit" backend/app/routers/version.py` → the only match is the call `commit=get_build_commit()`; no quoted commit value appears in the router.
7. Restore: `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` unset.

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: none.
1. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `backend/app/routers/version.py` → the route declares `response_model=VersionResponse` and returns a `VersionResponse`.
3. With the stack running, open `http://localhost:8010/docs` in a browser, expand `GET /api/version` → the 200 response schema is `VersionResponse` with the `version` and `commit` string fields.

### Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: the database from the Backing Services recipe running, `DATABASE_URL` pointing at it (the integration conftest needs it).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → `0 failed`; the output includes the `build_commit` and `get_build_commit` tests named in the Testing Strategy.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`; the set, unset and blank `BUILD_COMMIT` tests are among those run.
