# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI. Every criterion is verified against the running API with `curl`, the browser's API docs page, and the source files.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- Host port `8010` (backend) free.
- A terminal with `curl`.
- Criterion 4 only: `uv` installed on the host.
- `BUILD_COMMIT` set neither in your shell nor in a root `.env` file, unless a step says otherwise.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `backend` and `db` services report running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly `{"version":"0.1.0","commit":"unknown"}`: both fields are strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend`, wait for the backend to be running, then run `curl -s http://localhost:8010/api/version` | Body is `{"version":"0.1.0","commit":"0123456789ab"}`: the first 12 characters of the 40-character value | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234`: a value shorter than 12 characters is unchanged | [ ] Pass [ ] Fail |
| 5 | Edge case: run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown`: a blank value counts as unset | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | The router contains no commit string literal; it calls `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser | The Swagger UI lists `GET /api/version` | [ ] Pass [ ] Fail |
| 8 | Expand `GET /api/version` and its 200 response | The schema shown is `VersionResponse` with `version` (string) and `commit` (string), both required | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 11 | Open `backend/tests/integration/test_version_integration.py` | One test sets `BUILD_COMMIT` to a 40-character sha and asserts the 12-character `commit`; one unsets it and asserts `unknown` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 (10 required, 1 edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
