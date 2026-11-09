# UAT Script: TEST-09 Version endpoint reports the build commit

None of the criteria can be verified through the web UI: the frontend does not display `commit` (TEST-10 adds that). Each check below is therefore an HTTP response, a file, or a test run, executed from the repository root.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- `.env` copied from `.env.example` (`BUILD_COMMIT` is optional and empty by default).
- No other process bound to host port `8010`.
- A terminal with `curl`, and a browser.
- Criterion 4 only: `uv` installed and the backend dependencies synced (`uv sync --directory backend`). The version tests need no database.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser | The page shows a JSON object with exactly two keys, `version` (for example `0.1.0`) and `commit`, both strings | [ ] Pass [ ] Fail |
| 2 | Run `curl -s -o /dev/null -w '%{http_code}' http://localhost:8010/api/version` | Prints `200` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters

Prerequisites: the stack from the setup is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` absent or empty in `.env`, run `docker compose up -d backend`, then open `http://localhost:8010/api/version` | `commit` reads `unknown` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=3f9a1c2b7d4e5f60718293a4b5c6d7e8f9012345 docker compose up -d backend`, then reload `http://localhost:8010/api/version` | `commit` reads `3f9a1c2b7d4e` (12 characters) | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then reload | `commit` reads `abc1234` | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT=' ' docker compose up -d backend`, then reload (edge case: blank value) | `commit` reads `unknown` | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | It contains no quoted commit value; `commit` is populated only from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the stack from the setup is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` and expand `GET /api/version` | The 200 response schema is `VersionResponse` with required string fields `version` and `commit` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |
| 11 | Read `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` | Each has at least one test with `BUILD_COMMIT` set (including a 40-character sha) and one with it unset | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
