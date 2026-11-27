# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI: every check is an HTTP request against the running backend, read with `curl` in a terminal (or in a browser tab at the same URL).

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database).
- A terminal with `curl`.
- Steps 9 and 10 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | A JSON object with exactly two keys, `version` (for example `"0.1.0"`, matching `[project].version` in `backend/pyproject.toml`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters when longer)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `BUILD_COMMIT=3f9a1c2b7d4e5f60718293a4b5c6d7e8f9012345 docker compose up -d --build backend` | The backend image rebuilds and the container starts | [ ] Pass [ ] Fail |
| 4 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"3f9a1c2b7d4e"`, the first 12 characters of the 40-character value | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=abc1234 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"abc1234"`, unchanged because it is shorter than 12 characters | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | The router passes `commit=get_build_commit()` and contains no string literal for the commit | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response shows the `VersionResponse` schema with `version` and `commit`, both strings | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 10 | Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` | The summary line reports no failed or errored test, none of the version tests is reported skipped, and the command exits 0 | [ ] Pass [ ] Fail |
| 11 | Run `BUILD_COMMIT= docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"`, the unset path on the real stack | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
