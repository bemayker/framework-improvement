# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI: every criterion is verified by an HTTP call (`curl`), a source read, or a test run, which is the observable check.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- Host port `8010` (backend) free.
- No `BUILD_COMMIT` exported in the shell and none in a root `.env` file (step 5 relies on it being unset).
- A terminal with `curl`.
- Steps 9 to 10: `uv` installed on the host. No database is needed for those test files.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend
   ```
   The `backend` container starts (and `db` with it).

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK` and header `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | `{"version":"0.1.0","commit":"0123456789ab"}`. The version is whatever `[project].version` in `backend/pyproject.toml` says; both values are strings in quotes | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

Prerequisites: the stack from Test Environment Setup is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/version` against the stack started in setup | `commit` is `0123456789ab`, the first 12 of the 40-character value passed in, not the full sha | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` (a value of 12 characters or fewer is returned unchanged) | [ ] Pass [ ] Fail |
| 5 | Run `docker compose up -d backend` with no `BUILD_COMMIT` in the shell or `.env`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT="   " docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` (blank counts as unset; edge case) | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | It calls `get_build_commit()` and contains no quoted commit value | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the stack is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `backend/app/schemas/version.py`, then open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`; the 200 response schema in the docs is `VersionResponse` with those two string fields | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | `0 failed` | [ ] Pass [ ] Fail |
| 10 | Read the test names in those three files | At least one test with `BUILD_COMMIT` set (including a 40-character sha truncated to 12) and one with it unset, in both the unit files and the integration file | [ ] Pass [ ] Fail |

### Cleanup

Run `docker compose down`. The stack stops.

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
