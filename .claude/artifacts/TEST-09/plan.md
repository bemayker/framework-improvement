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
> **Notes:** Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete. Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable set at build time, default `"unknown"`), never a string typed into the router; when the value is longer than 12 characters only its first 12 are returned (tracker comment, below).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the variable name `BUILD_COMMIT` is adopted as the one declared source for criterion 2; the service truncates to the first 12 characters (`COMMIT_LENGTH = 12`), a value of 12 characters or fewer is returned unchanged, and both the unit and the integration tier assert a 40-character sha comes back as its first 12. Criterion 2 above carries the amendment so the coverage table maps it.
- Assumption (no comment, recorded instead of a question): a value that is blank or whitespace-only is treated as unset and reports `unknown`, mirroring how `CORS_ORIGINS` already treats a blank value in `backend/app/core/config.py`, and matching what `docs/DEVELOPMENT.md` already documents for `BUILD_COMMIT`. The value is stripped of surrounding whitespace before truncation.
- Assumption: "set at build time" is satisfied by CI or the image build exporting `BUILD_COMMIT` into the backend's environment; `docker-compose.yml` passes it through as `${BUILD_COMMIT:-}`. No Dockerfile `ARG` is added: the criterion names an environment variable, and the docs already describe the compose passthrough as the route, so baking it into the image would be a second source.
- Observation: `docs/DEVELOPMENT.md` (the `BUILD_COMMIT` paragraph) and `README.md` (the `.env.example` line) already describe this feature from an earlier run, while the code, `docker-compose.yml` and `.env.example` do not yet carry it (sandbox reset). This plan makes the code match those docs and changes neither doc.

## Plan Overview
Extend the existing TEST-05 version slice; no new router, no new module. `GET /api/version` is already registered in `backend/app/main.py` and returns `{"version": ...}`, so `main.py` is NOT touched (keeps this item disjoint from BUG-01's concurrent `main.py` edit). Changes:
1. `backend/app/core/config.py`: `Settings` gains `build_commit: str`, read per call from `BUILD_COMMIT` through a `default_factory` (same shape as `database_url` and `cors_origins`, keeping every deployment-dependent value in the settings module read the same way, per `coding_standards.md`'s configuration invariant); unset, empty or whitespace-only yields the module constant `UNKNOWN_BUILD_COMMIT = "unknown"`.
2. `backend/app/services/version_service.py`: new `get_build_commit() -> str` returns `get_settings().build_commit[:COMMIT_LENGTH]` with `COMMIT_LENGTH = 12`.
3. `backend/app/schemas/version.py`: `VersionResponse` gains `commit: str`.
4. `backend/app/routers/version.py`: returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`; no literal commit in the router.
5. `docker-compose.yml` passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` to the backend service; `.env.example` documents the optional variable (commented out, so a copied `.env` keeps the `unknown` default).
6. Tests: unit (config resolution, service truncation) and integration (HTTP cycle with the variable set and unset); the two existing integration assertions on the exact body are updated to include `commit`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05): response body gains `commit`. No new endpoint, no new router registration.
- Service layer: `version_service.get_build_commit()` reads `get_settings().build_commit` at call time (so a changed environment is seen per request, as the existing integration tests rely on for `DATABASE_URL`) and returns at most its first 12 characters. `UNKNOWN_BUILD_COMMIT` (`"unknown"`, 7 characters) passes through the slice unchanged.
- Settings: `config.py` adds `_read_build_commit()` (strip; empty after strip returns `UNKNOWN_BUILD_COMMIT`) and the `build_commit` field with `default_factory=_read_build_commit`. Truncation is NOT done here: settings resolve the declared value, the service applies the display rule.
- Repository layer: none, no data access.
- Migrations: none.
- Runtime wiring: `docker-compose.yml` backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`; `.env.example` gains a commented `# BUILD_COMMIT=` entry with a one-line explanation.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters.
- Response: 200, `application/json`, schema `VersionResponse` (`version: str`, `commit: str`), both fields always present.

```json
{"version": "0.1.0", "commit": "3f9c2a1b7d4e"}
```

With `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

- `POST /api/version` stays 405 (unchanged).
- Change is additive: TEST-08's footer, which reads `version`, is unaffected by the extra field.

## Technology Selection
- `BUILD_COMMIT` resolution in `Settings.build_commit`: chose the standard library's `os.environ.get` in a dataclass `default_factory` over adding `pydantic-settings` (not installed) or any new dependency, because the settings module already reads every environment value this way and one more field is three lines.
- 12-character truncation in `get_build_commit()`: chose a plain string slice over any helper or library, because a slice covers the need exactly and is safe on shorter values.
- `commit` field on `VersionResponse`: chose the already-installed Pydantic `BaseModel` field (the existing schema) over a new schema class; no net-new dependency, module or component is introduced by this feature.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (a short value is returned unchanged).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: add `COMMIT_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into the response.
- [B] docker-compose.yml: backend service passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` through.
- [B] .env.example: document the optional, commented-out `BUILD_COMMIT`.
- [B] backend/tests/unit/test_config_unit.py: `build_commit` resolution (set, unset, blank).
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` truncation and passthrough cases.
- [B] backend/tests/integration/test_version_integration.py: existing body assertions include `commit`; new set-path and unset-path HTTP tests.

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` edit: both already describe `BUILD_COMMIT`, the 12-character rule and the `unknown` default exactly as this plan builds them, so the build's documentation check should find them current. `backend/app/main.py` is deliberately absent: the version router is already registered there.

## Testing Strategy
- Unit tests:
  - `test_config_unit.py`: `BUILD_COMMIT` set to a 40-character sha resolves to that exact value in `get_settings().build_commit` (settings do not truncate); unset resolves to `"unknown"`; parametrized blank values (`""`, `"   "`) resolve to `"unknown"`; surrounding whitespace is stripped.
  - `test_version_service_unit.py`: with `get_settings` patched, a 40-character value returns its first 12 characters; a value of exactly 12 characters and a shorter one (`"abc1234"`) return unchanged; `"unknown"` returns `"unknown"`. Patch the service's settings accessor via `monkeypatch`, never the environment, so the tier stays isolated.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing files extended)
- Integration tests: real HTTP request/response cycle through the session `client` fixture. `monkeypatch.setenv("BUILD_COMMIT", "<40-char sha>")` → 200 and `commit == sha[:12]`, `version` equal to pyproject's; `monkeypatch.delenv("BUILD_COMMIT")` → 200 and `commit == "unknown"`; the response's key set is exactly `{"version", "commit"}`. Update the two existing tests that assert `== {"version": ...}`: delete `BUILD_COMMIT` in them and assert the full body including `"commit": "unknown"`. These tests need no database (the lifespan skips schema setup when `DATABASE_URL` is unset).
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. E2E is ENABLED, but no criterion involves UI navigation or interaction: the backend change is visible only through the API (see Criterion coverage). No `[D]` spec file.
- UAT scenarios: one Gherkin scenario per criterion plus the short-value edge case, phrased at the API level (UAT Generation ENABLED).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape, checked over a real HTTP cycle. |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`), first 12 characters only | Unit and Integration | Verifying it needs no navigation or interaction: resolution and truncation are settings and service rules (unit), and the end-to-end wiring from environment to response body is a router behaviour (integration). |
| 3 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: the exact key set and types of the response body are asserted over HTTP, and the schema is the router's `response_model`. |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | It is a statement about the test suite itself, satisfied by the set and unset tests in both tiers listed above. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends `GET /api/version`, Then the status is 200 and the body has string fields `version` and `commit` |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, first 12 chars | covered at Unit and Integration, see Criterion coverage | Given `BUILD_COMMIT` is a 40-character sha, When the client requests the version, Then `commit` is its first 12 characters; Given `BUILD_COMMIT` is unset, Then `commit` is `unknown` |
| 3 | Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When the client requests the version, Then the body has exactly the keys `version` and `commit` |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the repository, When the version test files are run, Then 0 failed |

## Manual verification plan
This feature has no UI: every check below is made against the API with `curl` from a terminal at the repository root. The backend listens on `http://localhost:8010` under Docker Compose.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings
Prerequisites: Docker running; no `BUILD_COMMIT` exported in the shell and none set in `.env`.
1. Run `docker compose up -d --build backend` → the `backend` and `db` containers report as running.
2. Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` → prints `200`.
3. Run `curl -s http://localhost:8010/api/version` → the body is a JSON object whose `version` is `0.1.0` (the value in `backend/pyproject.toml`) and whose `commit` is a string.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters only
Prerequisites: the stack from Criterion 1 is up.
1. With no `BUILD_COMMIT` set, run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
2. Run `BUILD_COMMIT=3f9c2a1b7d4e8f6a5c0b9d2e1f4a7c3b6d8e0f12 docker compose up -d backend` (a full 40-character sha, as CI passes) → the backend container is recreated.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `3f9c2a1b7d4e` (the first 12 characters), not the full 40.
4. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (a value shorter than 12 is unchanged).
5. Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown` (blank counts as unset).
6. Open `backend/app/routers/version.py` → no commit string literal; the value comes from `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack is up.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with two required string fields, `version` and `commit`.
2. Open `backend/app/schemas/version.py` → `VersionResponse` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` → the summary reports `0 failed`.
2. Read the test names in those three files → each tier has at least one test for `BUILD_COMMIT` set (including the 40-to-12 truncation) and one for it unset returning `unknown`.
