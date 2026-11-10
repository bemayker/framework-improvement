# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion is verifiable through the UI: no frontend consumes `GET /api/version`, so the observable check is the HTTP response itself, read with `curl`, plus the test suite.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database); both mappings come from `docker-compose.yml`.
- A terminal with `curl`; for criterion 4, `uv` installed on the host.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
   This passes no `BUILD_COMMIT`.
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | Status line reads `HTTP/1.1 200 OK` and `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | Exactly two keys, `version` (the `[project].version` of `backend/pyproject.toml`, e.g. `"0.1.0"`) and `commit`, both JSON strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT` set at build time, default `"unknown"`, first 12 characters when longer

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/version` on the image built without the argument | Body reads `{"version":"0.1.0","commit":"unknown"}` (version as in `backend/pyproject.toml`) | [ ] Pass [ ] Fail |
| 4 | Run `docker compose build --build-arg BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 backend`, then `docker compose up -d backend` | The build completes and the backend container restarts | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | `commit` reads `"0123456789ab"` (the first 12 characters), not the full 40 | [ ] Pass [ ] Fail |
| 6 | Run `docker compose build --build-arg BUILD_COMMIT=abc1234 backend`, then `docker compose up -d backend`, then the same curl | `commit` reads `"abc1234"` unchanged | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | It contains no commit literal; `commit` comes from `get_build_commit()` | [ ] Pass [ ] Fail |
| 8 | Restore the default: `docker compose build backend`, then `docker compose up -d backend`, then curl again | `commit` reads `"unknown"` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with properties `version` (string) and `commit` (string), both required | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

Prerequisite: a PostgreSQL instance reachable at the `DATABASE_URL` below (the compose `db` service on host port 5442 serves).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` | Summary line reads `0 failed`; the run includes tests for `BUILD_COMMIT` set (including the 40-character truncation) and unset | [ ] Pass [ ] Fail |
| 12 | Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` | Summary line reads `0 failed`; the file contains a set-path test (commit equals the 12-character prefix) and an unset-path test (commit equals `unknown`) | [ ] Pass [ ] Fail |

### Edge case: a blank `BUILD_COMMIT` reads unknown

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Run `docker compose build --build-arg BUILD_COMMIT=" " backend`, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` reads `"unknown"`: a blank value is treated as unset | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
