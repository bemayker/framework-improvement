# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: every criterion is verified against the running API with `curl`, through the API docs page, or by running the tests.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- Port `8010` free.
- A terminal with `curl`; `uv` installed for criterion 4 (those tests need no database).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend
   ```
2. Run `docker compose ps backend` until it shows running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the body | Exactly `{"version":"0.1.0","commit":"0123456789ab"}` (the version is `[project].version` in `backend/pyproject.toml`); both values are strings in quotes | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters of a longer value

Prerequisites: the backend from setup still running with the 40-character `BUILD_COMMIT`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/version` | `commit` is `0123456789ab`, the first 12 of the 40 characters passed in, not the full sha | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` (7 characters, returned unchanged) | [ ] Pass [ ] Fail |
| 5 | Run `unset BUILD_COMMIT`, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no commit string literal; `commit` comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: backend running (any `BUILD_COMMIT`).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser | The Swagger UI lists `GET /api/version` | [ ] Pass [ ] Fail |
| 8 | Expand `GET /api/version` and open its 200 response schema | It is named `VersionResponse` and lists two required string fields, `version` and `commit` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |
| 11 | Read the test names in those three files | Each file has at least one test that sets `BUILD_COMMIT` and one that unsets it | [ ] Pass [ ] Fail |

## Cleanup

Run `docker compose down`.

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
