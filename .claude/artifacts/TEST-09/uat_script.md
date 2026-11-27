# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion is verifiable through the UI: no frontend consumes `GET /api/version` in this item, so every check is made over HTTP with `curl`, plus reading code and the API docs.

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- `uv` installed and backend dependencies available.
- Host port `8010` free.
- A terminal with `curl`, and a browser for step 8.

## Test Environment Setup

1. In a terminal at the repository root, run:
   ```bash
   BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:app --port 8010
   ```
   The log shows `Uvicorn running on http://127.0.0.1:8010`. A warning that DATABASE_URL is not set is expected and harmless.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a second terminal run `curl -i http://localhost:8010/api/version` | The status line is `HTTP/1.1 200 OK` and the body is a JSON object with exactly two keys, `version` (equal to `[project].version` in `backend/pyproject.toml`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2 | With the server from setup still running, run `curl -s http://localhost:8010/api/version` | `commit` is `0123456789ab`, the first 12 characters of the value set, not the full 40-character sha (edge case) | [ ] Pass [ ] Fail |
| 3 | Stop the server (Ctrl+C) and restart it with `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:app --port 8010` | The server starts | [ ] Pass [ ] Fail |
| 4 | Run `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` (12 characters or fewer is returned unchanged) | [ ] Pass [ ] Fail |
| 5 | Stop the server and restart it with no BUILD_COMMIT: `uv run --directory backend uvicorn app.main:app --port 8010` | The server starts | [ ] Pass [ ] Fail |
| 6 | Run `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | The `commit` value is taken from `get_build_commit()`, and no commit string literal appears in the file | [ ] Pass [ ] Fail |

### Criterion 3: response body defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the server from step 5 is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response shows the schema `VersionResponse` with fields `version` (string) and `commit` (string) | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

Stop the server first. No database is needed for these files.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_schema_unit.py tests/integration/test_version_integration.py` | No failed or errored test in the summary line, and the command exits 0 | [ ] Pass [ ] Fail |
| 11 | Read the test names in `tests/unit/test_version_service_unit.py` and `tests/integration/test_version_integration.py` | Each file has at least one test for BUILD_COMMIT set and one for BUILD_COMMIT unset | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
