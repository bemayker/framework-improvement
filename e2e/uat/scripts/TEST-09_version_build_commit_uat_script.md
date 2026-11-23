# UAT Script: TEST-09 Version endpoint reports the build commit

No acceptance criterion is verifiable through the UI: no frontend consumes `GET /api/version`, so the observable check is the HTTP response, read in a browser or with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- No `.env` entry for `BUILD_COMMIT`. `docker-compose.yml` forwards `BUILD_COMMIT` from the host shell (`${BUILD_COMMIT:-}`, empty when unset).
- A browser and a terminal.
- Criterion 4 only: `uv` installed on the host. No database is needed for those test files.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`, a long value limited to 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Confirm the setup command above finished and `docker compose ps` shows the backend service running | The backend service is running | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:8010/api/version` in a browser | The page shows JSON with `"version": "0.1.0"` and `"commit": "0123456789ab"` (exactly the first 12 characters of the value from setup) | [ ] Pass [ ] Fail |
| 3 | Open the browser developer tools Network tab and reload the page | The `version` request shows status 200 and content type `application/json` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`

Prerequisites: the stack from criterion 1 can be restarted.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend` | The backend container is recreated | [ ] Pass [ ] Fail |
| 5 | Open `http://localhost:8010/api/version` | The JSON shows `"commit": "abc1234"` (a value of 12 characters or fewer is returned unchanged) | [ ] Pass [ ] Fail |
| 6 | In a new terminal with `BUILD_COMMIT` not set in the shell, run `docker compose up -d backend` | The backend container is recreated | [ ] Pass [ ] Fail |
| 7 | Reload `http://localhost:8010/api/version` | The JSON shows `"commit": "unknown"` | [ ] Pass [ ] Fail |
| 8 | Edge case: run `BUILD_COMMIT="   " docker compose up -d backend` | The backend container is recreated | [ ] Pass [ ] Fail |
| 9 | Reload `http://localhost:8010/api/version` | The JSON shows `"commit": "unknown"` (a blank value counts as unset) | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/routers/version.py` in an editor | It contains no commit string literal; `commit` is filled from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: backend running from criterion 2.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Open `http://localhost:8010/docs` | The Swagger UI lists `GET /api/version` | [ ] Pass [ ] Fail |
| 12 | Expand `GET /api/version` and look at the 200 response | The schema shown is `VersionResponse` with string properties `version` and `commit` | [ ] Pass [ ] Fail |
| 13 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

Prerequisites: `uv` installed; no database needed for these files.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 14 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 15 | Run the same command with `-v` added | Tests `test_get_build_commit_returns_configured_value_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_commit_from_build_commit_env` and `test_get_version_returns_unknown_commit_when_build_commit_unset` are listed as passed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
