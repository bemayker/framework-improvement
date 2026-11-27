# UAT Script: TEST-09 Version endpoint reports the build commit

None of the acceptance criteria is verifiable through the UI: no frontend consumes `GET /api/version`, so the observable check is the HTTP response, read with `curl`, plus the OpenAPI page and the test runs.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database).
- No `BUILD_COMMIT` exported in the shell at the start.
- A terminal with `curl`; `uv` installed on the host for criterion 4.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until `db` reports healthy and `backend` reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | The first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | A JSON object with exactly two keys, `version` (the `[project].version` in `backend/pyproject.toml`, e.g. `0.1.0`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=abc123 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc123`, unchanged | [ ] Pass [ ] Fail |
| 5 | Edge case: run `BUILD_COMMIT=91e19ee37652a14621403c9bfdd0263de8767a5f docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `91e19ee37652`, the first 12 characters of the 40-character sha | [ ] Pass [ ] Fail |
| 6 | Edge case: run `BUILD_COMMIT="   " docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | No commit string literal appears; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: Response body defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response shows the schema `VersionResponse` with `version` (string) and `commit` (string) | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` | No failed or errored test on the summary line, exit code 0 | [ ] Pass [ ] Fail |
| 11 | Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` | No failed or errored test on the summary line, exit code 0 | [ ] Pass [ ] Fail |
| 12 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py -k "build_commit_env or build_commit_unset"` | Both the set and the unset tests are collected and pass, exit code 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 (all required) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
