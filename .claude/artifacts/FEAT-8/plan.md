# Implementation Plan, FEAT-8: VERIFY MDF-484: GET /api/version returns a JSON version

## Feature
> Loop: staged by loop verify cycle 20261024T011205Z for rows 232 (MDF-484) and 233 (MDF-486). Backend only. Add GET /api/version returning {"version": "1.0"} with one pytest test. Acceptance: the endpoint answers 200 with that JSON; the test passes.

## Acceptance Criteria
- [ ] GET /api/version answers 200 with the JSON version "1.0" (body member `version` equals `"1.0"`; see assumption A1 for the existing `commit` member)
- [ ] One pytest test exercises GET /api/version and asserts the 200 status and the "1.0" version, and it passes

## Re-Plan Feedback
- Comment (tracker): none. The item carried 0 tracker comments (main session read, this run).
- Merged since the last plan: n/a (fresh plan, no prior plan for FEAT-8, plan base e27776799ccaa469c859bc3cb6a21f151d18f5b0).
- Map shared-risk note (feature_map.md line 190, "GET /api/version already exists ... resolve the contradiction before building") → Addressed by: resolved in this plan through assumptions A1 to A3 below, recorded rather than blocked (autonomous mode, `user_story_alignment.md` Section 4).

## Plan Overview
The route the item asks to "add" already exists and is Done work: `backend/app/routers/version.py` (TEST-05, TEST-09) serves GET /api/version and returns `{"version": <[project].version from backend/pyproject.toml via package metadata>, "commit": <BUILD_COMMIT prefix or "unknown">}`, registered in `backend/app/main.py`. It is consumed by the footer (`frontend/src/api/version.ts`, `frontend/src/components/AppFooter.tsx`, TEST-04, TEST-08, TEST-10) and by two E2E specs that read the expected version from `backend/pyproject.toml` (`e2e/helpers/backendVersion.ts`). The response today is `{"version": "0.1.0", "commit": "unknown"}`.

So the work is not a new endpoint. It is: make the existing endpoint report version "1.0", through the single source that already owns the value, and add the one pytest test the item asks for.

Assumptions (autonomous mode, recorded instead of a question):
- A1. "returns {"version": "1.0"}" is read as "the `version` member is `"1.0"`", not as "the body is exactly that one-key object". Removing the `commit` member would regress TEST-09 (commit criterion) and TEST-10 (footer shows the commit), both Done, and break `VersionResponse`, its OpenAPI test and the footer. Keeping it is the conservative reading; the PR description must state this deviation from the literal text.
- A2. The value "1.0" is set by changing `[project].version` in `backend/pyproject.toml` from `0.1.0` to `1.0`, not by hardcoding `"1.0"` in the router. The version service reads installed package metadata (TEST-05's design: the endpoint always reflects pyproject), and the existing integration tests assert equality with pyproject, so a hardcoded literal would fail `test_get_version_returns_200_with_version_from_pyproject` and split the value into two sources. `1.0` is a valid PEP 440 version.
- A3. No router, schema, service or `main.py` change. The route is already registered; touching `main.py` is unnecessary, which also removes the shared-file risk the map row names.

Consequence the builder must expect: the footer will read `Task Notes v1.0` instead of `Task Notes v0.1.0`. The E2E specs TEST-08 and TEST-10 derive the expected version from pyproject and stay green. The committed TEST-04, TEST-08 and TEST-10 Gherkin scenarios and manual UAT scripts quote `0.1.0` as example text; they are other items' artifacts, validated for well-formedness only, and are deliberately not edited here (scope containment, `user_story_alignment.md` Section 3). The PR description lists them as known stale example values.

## Frontend Plan
No frontend changes required. (The footer picks up "1.0" from the endpoint with no code change.)

## Backend Plan
- Endpoints: GET /api/version (existing, `backend/app/routers/version.py`), unchanged in code; its `version` member becomes "1.0" through the package version.
- Service layer: no change. `get_app_version()` in `backend/app/services/version_service.py` already returns `importlib.metadata.version("task-notes-backend")`.
- Repository layer: none (the endpoint touches no database).
- Migrations: none.
- Package version: `backend/pyproject.toml` `[project].version = "1.0"`; regenerate `backend/uv.lock` with `uv lock --directory backend` (a following `uv run --directory backend ...` re-syncs the editable install) so the root package entry `task-notes-backend` reads `version = "1.0"` and the installed metadata reports it.
- Test: add one integration test to `backend/tests/integration/test_version_integration.py`, named `test_get_version_returns_200_with_version_1_0`, using the existing session `client` fixture (no database needed): GET `/api/version`, assert `status_code == 200` and `response.json()["version"] == "1.0"`. Assert the literal `"1.0"` here on purpose: this test is the item's own criterion, while the existing pyproject-equality test keeps covering the wiring.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version
- Request: none (no body, no query parameters)
- Response: 200, `application/json`, schema `VersionResponse` (unchanged)

```json
{"version": "1.0", "commit": "unknown"}
```

`commit` is the first 12 characters of `BUILD_COMMIT`, or `"unknown"` when unset (TEST-09, unchanged). POST still answers 405.

## Technology Selection
- No net-new component, module or dependency: the change is a version string in the existing `backend/pyproject.toml`, read by the existing stdlib `importlib.metadata` call, plus one test using the already installed pytest and FastAPI `TestClient`.

## File Manifest
### New files
- [G] e2e/uat/scenarios/FEAT-8_api_version_json_version.feature: Gherkin scenarios, one per criterion plus one edge case (POST answers 405)
- [G] e2e/uat/scripts/FEAT-8_api_version_json_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/FEAT-8/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/pyproject.toml: `[project].version` from `0.1.0` to `1.0`
- [B] backend/uv.lock: regenerated; root package `task-notes-backend` entry version `1.0`
- [B] backend/tests/integration/test_version_integration.py: add `test_get_version_returns_200_with_version_1_0`
README.md and docs/DEVELOPMENT.md need no edit: no project structure, run configuration, dependency or test-infrastructure change (the version string is not documented there).

## Testing Strategy
- Unit tests: none added. No service or utility logic changes; `version_service` is untouched and its existing unit tests use injected fake versions.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: one new router test in the existing version integration module (HTTP request/response cycle through `TestClient`, no database). Existing tests in that file must stay green, in particular the pyproject-equality test.
  - Directory: backend/tests/integration/
- E2E tests: none added. No criterion requires navigation or interaction through the UI. Existing specs `e2e/tests/TEST-08_footer_app_version.spec.ts` and `e2e/tests/TEST-10_footer_build_commit.spec.ts` read the version from pyproject and must stay green.
  - Directory: e2e/tests/
  - File: none for FEAT-8
- UAT scenarios: one scenario per criterion plus the POST 405 edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/version answers 200 with version "1.0" | Integration | verifying it needs no navigation or interaction: it is a router response, checked through the HTTP cycle |
| 2 | One pytest test for the endpoint passes | Integration | verifying it needs no navigation or interaction: it is the integration test run itself |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/version answers 200 with version "1.0" | covered at Integration, see Criterion coverage | Given the backend is running When a client sends GET /api/version Then the status is 200 And the JSON member "version" is "1.0" |
| 2 | One pytest test for the endpoint passes | covered at Integration, see Criterion coverage | Given the backend test suite When the version integration tests run Then test_get_version_returns_200_with_version_1_0 passes with 0 failed |

## Manual verification plan
### Criterion 1: GET /api/version answers 200 with version "1.0"
Prerequisites: the stack is up with `docker compose up -d --build` from the repository root (backend on port 8010, frontend on port 5183); no environment variables set.
1. In a terminal, run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK`, the `content-type` header is `application/json`, and the body is `{"version":"1.0","commit":"unknown"}` (the `commit` value is whatever `BUILD_COMMIT` the image was built with, or `unknown`).
2. Run `curl -i -X POST http://localhost:8010/api/version` → the status line reads `405 Method Not Allowed`.
3. Open `http://localhost:5183/` in a browser and look at the page footer (`data-testid="app-footer"`) → it reads `Task Notes v1.0`, followed by a short commit in parentheses only when `BUILD_COMMIT` was set.

### Criterion 2: One pytest test for the endpoint passes
Prerequisites: backend dependencies installed through uv (`uv sync --directory backend`).
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the run reports `0 failed`, and `test_get_version_returns_200_with_version_1_0` is among the tests collected (add `-v` to see it listed as PASSED).
2. Run the configured gate, `uv run --directory backend pytest -q && npm --prefix frontend test` → both suites report `0 failed`.
