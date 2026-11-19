# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion is verifiable through the UI: the feature is backend only, so each check is made against the running API with `curl` (or by opening the URL in a browser address bar).

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database).
- `BUILD_COMMIT` not exported in the shell you start the stack from.
- A terminal with `curl`.
- Criterion 4 only: `uv` installed on the host and the backend dependencies synced.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | Status line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | A JSON object with exactly two keys, `version` and `commit`, both string values; `version` equals the `version =` value under `[project]` in `backend/pyproject.toml` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from one declared source, default `"unknown"`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` | The body shows `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend` | The backend container is recreated | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | The body shows `"commit":"abc1234"` | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no commit literal; the value comes from `get_build_commit()`, which reads `BUILD_COMMIT` through `backend/app/core/config.py` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with `version` (string) and `commit` (string), both required | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

Requires a Postgres reachable at the `DATABASE_URL` in `.env.example` (`docker compose up -d db`).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_schema_unit.py tests/integration/test_version_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 10 | Read the test names in those files | Both `..._when_build_commit_is_set` and `..._when_build_commit_is_unset` integration tests are present, and the unit file has set and unset `get_build_commit` tests | [ ] Pass [ ] Fail |

### Criterion 5: A `BUILD_COMMIT` longer than 12 characters yields its first 12

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` | The backend container is recreated | [ ] Pass [ ] Fail |
| 12 | Run `curl -s http://localhost:8010/api/version` | The body shows `"commit":"0123456789ab"` (12 characters, not the full 40) | [ ] Pass [ ] Fail |
| 13 | Run `BUILD_COMMIT=0123456789ab docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | The body shows `"commit":"0123456789ab"` unchanged | [ ] Pass [ ] Fail |
| 14 | Clean up: run `docker compose up -d backend` with `BUILD_COMMIT` unset, then `curl -s http://localhost:8010/api/version` | The body shows `"commit":"unknown"` again | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
