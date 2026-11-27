# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: no frontend consumes `GET /api/version`, so every criterion is verified against the running API with `curl` and against the test suite. Run all commands from the repository root.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010`.
- A terminal with `curl`.
- Criterion 4 only: `uv` installed on the host. No database is needed for those test files.

## Test Environment Setup

1. Run:
   ```bash
   BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` | Prints `200` | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | A JSON object with exactly two keys, `version` and `commit`, both strings, with `version` equal to `0.1.0` (the value in `backend/pyproject.toml`) | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters

Prerequisites: the stack from Test Environment Setup is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With the container started as in Test Environment Setup, run `curl -s http://localhost:8010/api/version` | `commit` is `0123456789ab`, the first 12 characters of the 40-character value | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, wait for the container to be running, then run `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` (a short value is returned unchanged) | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT= docker compose up -d backend`, wait for the container to be running, then run `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` in `backend/app/services/version_service.py`, which reads `get_settings().build_commit` from `backend/app/core/config.py` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is a Pydantic schema in `backend/app/schemas/`

Prerequisites: the stack is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 8 | Run `curl -s http://localhost:8010/openapi.json` and find `components.schemas.VersionResponse` | Its `required` list is `version` and `commit`, and the 200 response of `/api/version` references `VersionResponse` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 10 | Read the three test files | Each set path (a `BUILD_COMMIT` value, including a 40-character sha) and each unset path (variable deleted, and blank) has a named test | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
