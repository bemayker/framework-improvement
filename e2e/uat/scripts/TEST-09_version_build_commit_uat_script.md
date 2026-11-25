# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: no frontend consumes `GET /api/version`, so every criterion is verified over HTTP with `curl` against the backend, plus the test suites. Run every command from the repository root.

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- `uv` installed and the backend dependencies synced (`uv sync --directory backend`).
- A terminal with `curl`, two terminals for steps that start a server.
- No `BUILD_COMMIT` exported in the shell, and host port `8010` free. The endpoint needs no database.
- Steps 8 and 9 only (build-time path): Docker and Docker Compose installed and running, and no `BUILD_COMMIT` variable or root `.env` entry setting it.

## Test Environment Setup

No setup beyond the prerequisites. Each step that needs a server starts it and stops it with Ctrl+C before the next step.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In terminal 1 run `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` | The log ends with `Uvicorn running on http://127.0.0.1:8010` | [ ] Pass [ ] Fail |
| 2 | In terminal 2 run `curl -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` and the body is `{"version":"<the version in backend/pyproject.toml>","commit":"unknown"}`; both values are strings. Stop the backend with Ctrl+C | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Start the backend with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then in terminal 2 run `curl -s http://localhost:8010/api/version` | `commit` is `0123456789ab`, exactly 12 characters. Stop the backend | [ ] Pass [ ] Fail |
| 4 | Edge case: start the backend with `BUILD_COMMIT=abc123 uv run --directory backend uvicorn app.main:create_app --factory --port 8010` and repeat the curl | `commit` is `abc123`, unchanged (12 characters or fewer is never altered). Stop the backend | [ ] Pass [ ] Fail |
| 5 | Start the backend with an empty value: `BUILD_COMMIT= uv run --directory backend uvicorn app.main:create_app --factory --port 8010` and repeat the curl | `commit` is `unknown` (a blank value counts as unset). Stop the backend | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | No commit string literal appears; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |
| 7 | Search for where the default is defined: `grep -rn "unknown" backend/app/core/config.py backend/Dockerfile docker-compose.yml` | `backend/app/core/config.py` defines `DEFAULT_BUILD_COMMIT = "unknown"`. The Dockerfile (`ARG BUILD_COMMIT=""`) and `docker-compose.yml` (`${BUILD_COMMIT:-}`) pass an empty value and name no `unknown` default of their own | [ ] Pass [ ] Fail |
| 8 | Build-time default path: run `docker compose build backend`, then `docker compose up -d backend` and `curl -s http://localhost:8010/api/version`. Run `docker compose down` afterwards | `commit` is `unknown`: the build passed an empty `BUILD_COMMIT` and the application supplied the default | [ ] Pass [ ] Fail |
| 9 | Build-time set path: run `docker compose build --build-arg BUILD_COMMIT=fedcba9876543210fedcba9876543210fedcba98 backend`, then `docker compose up -d backend` and `curl -s http://localhost:8010/api/version`. Run `docker compose down` afterwards | `commit` is `fedcba987654` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: backend running as in step 1 (start it again if stopped).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -s http://localhost:8010/openapi.json` and look under `components.schemas.VersionResponse` | It lists `version` and `commit`, both of type `string`, both required. Stop the backend | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` | The run passes: the summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 13 | Re-run the same command with `-v` | The output includes `test_get_version_returns_truncated_commit_when_build_commit_is_set` and `test_get_version_returns_unknown_commit_when_build_commit_is_unset`, both PASSED | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
