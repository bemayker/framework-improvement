# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: every check below is read from the API response, the OpenAPI document, the source or the test run.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- `.env` copied from `.env.example` (optional; `docker-compose.yml` carries defaults). The version endpoint needs no database.
- A terminal with `curl`.
- Criterion 4 only: `uv` installed on the host.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=8df9812ed349fa26e4e14c316bc61757340b04ef docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response body | A JSON object with exactly two keys, `version` (for example `"0.1.0"`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, truncated to 12 characters

Prerequisites: the stack from Test Environment Setup (built with the 40-character sha).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"8df9812ed349"`, the first 12 characters of the sha passed in, not the full 40 (truncation edge case) | [ ] Pass [ ] Fail |
| 4 | Rebuild without the variable: `BUILD_COMMIT= docker compose up -d --build backend`, then run `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 5 | Rebuild with a short value: `BUILD_COMMIT=abc1234 docker compose up -d --build backend`, then run `curl -s http://localhost:8010/api/version` | `commit` is `"abc1234"`, unchanged | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with fields `version` (string) and `commit` (string), both required | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/schemas/version.py` | `VersionResponse` is a `BaseModel` declaring `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

No database is needed: with `DATABASE_URL` unset the app's startup skips the notes schema and the version endpoint still answers.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` | No failed or errored test on the summary line; exit code 0 | [ ] Pass [ ] Fail |
| 10 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | No failed or errored test on the summary line; exit code 0 | [ ] Pass [ ] Fail |
| 11 | Run `uv run --directory backend pytest -q -k build_commit` | The selected tests include both set and unset cases (names containing `when_set` / `from_build_commit_env` and `when_build_commit_unset`); the run passes with exit code 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
