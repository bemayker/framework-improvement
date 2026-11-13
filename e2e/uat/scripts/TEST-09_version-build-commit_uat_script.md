# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI. Every check is made against the running backend's HTTP API with `curl`, and the observable result is the response body.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010`.
- A terminal with `curl`.
- `BUILD_COMMIT` absent from any root `.env` file (it is an optional build-time value).
- Criterion 4 only: `uv` installed; no database is needed for those test files.

## Test Environment Setup

1. From the repository root, run `docker compose build backend`.
2. Run `docker compose up -d db backend`, then `docker compose ps` until `backend` reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` and the body is a JSON object with exactly two keys, `version` (for example `0.1.0`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters when longer), never a router literal

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2 | Run `docker compose down`, then `docker compose build --build-arg BUILD_COMMIT=62be9fd76e4beeb5ec93d5fd3e9da1a35242d049 backend` and `docker compose up -d db backend` | The backend starts | [ ] Pass [ ] Fail |
| 3 | Run `curl http://localhost:8010/api/version` | `commit` is `62be9fd76e4b` (the first 12 of the 40 characters passed in) | [ ] Pass [ ] Fail |
| 4 | Run `docker compose down`, then `docker compose build --build-arg BUILD_COMMIT=abc1234 backend`, `docker compose up -d db backend`, then `curl http://localhost:8010/api/version` | `commit` is `abc1234` (a value of 12 characters or fewer is returned whole) | [ ] Pass [ ] Fail |
| 5 | Run `docker compose down`, then `docker compose build backend` with no build arg, `docker compose up -d db backend`, then `curl http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | The handler contains no commit string literal; it calls `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the backend from any step above is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser | The `GET /api/version` operation lists its 200 response schema as `VersionResponse` | [ ] Pass [ ] Fail |
| 8 | Expand `VersionResponse` under Schemas | It has two required string properties, `version` and `commit` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -v tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports `0 failed`, and the run includes `test_get_build_commit_returns_configured_commit_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_reports_build_commit_when_set` and `test_get_version_reports_unknown_commit_when_build_commit_unset` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
