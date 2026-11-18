# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion is visible in the app's UI (the frontend does not show `commit`; that is TEST-10), so each block verifies through the running backend's HTTP response, the OpenAPI page, or a test run. Commands run from the repository root.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database).
- No `BUILD_COMMIT` set in the shell or in a root `.env` file, unless a step says otherwise.
- A terminal with `curl`, and `uv` installed for criterion 4.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build -d
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser | A JSON object with exactly two keys, `version` (for example `"0.1.0"`) and `commit`, both strings | [ ] Pass [ ] Fail |
| 2 | Run `curl -i http://localhost:8010/api/version` | The first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters of a longer value), never a router literal

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `docker compose up --build -d` with no `BUILD_COMMIT` in the shell or `.env`, then open `http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 4 | Run `docker compose down`, then `BUILD_COMMIT=3f9c2a7b1d4e8f6a0c5b9e2d7a1f4c8b6e3d0a9f docker compose up --build -d`, then open `http://localhost:8010/api/version` | `commit` is `"3f9c2a7b1d4e"` (the first 12 of the 40 characters) | [ ] Pass [ ] Fail |
| 5 | Run `docker compose down`, then `BUILD_COMMIT=abc1234 docker compose up --build -d`, then open `http://localhost:8010/api/version` | `commit` is `"abc1234"` (12 characters or fewer is returned unchanged) | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | The `commit` value comes from `get_build_commit()`; no quoted commit string appears in the file | [ ] Pass [ ] Fail |
| 7 | Run `docker compose down`, then `docker compose up --build -d` again with no `BUILD_COMMIT` | `commit` is back to `"unknown"` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the stack is up (any `BUILD_COMMIT`).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` | The Swagger page lists `GET /api/version` | [ ] Pass [ ] Fail |
| 9 | Expand `GET /api/version` and its 200 response | The schema is named `VersionResponse` and lists `version` (string, required) and `commit` (string, required) | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

Prerequisites: a PostgreSQL instance is reachable for the integration tier (for example the compose `db` service on host port 5442).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_schema_unit.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 12 | Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` | The summary line reports no failed, errored or skipped test and the command exits 0 | [ ] Pass [ ] Fail |
| 13 | Read the test names in those files | `test_get_version_reports_commit_from_build_commit_env` and `test_get_version_reports_unknown_commit_when_build_commit_unset` (integration) and `test_get_build_commit_truncates_full_sha_to_first_12_characters` and `test_get_build_commit_returns_unknown_when_build_commit_unset` (unit) are present | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
