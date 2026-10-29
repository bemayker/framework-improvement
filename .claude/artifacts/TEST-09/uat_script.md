# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: every criterion is verified against the API with `curl` (or a browser tab on the URL) and the test suite.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- No `BUILD_COMMIT` exported in the shell unless a step says so.
- A terminal with `curl`; `uv` installed for criterion 4.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK` and `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | `{"version":"0.1.0","commit":"unknown"}` (the version is whatever `backend/pyproject.toml` `[project].version` says), both values quoted strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters only

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` | The backend container is recreated | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | `commit` is `0123456789ab` (first 12 of the 40 characters, nothing more) | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` (a value shorter than 12 characters is returned unchanged) | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | No commit string literal appears; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |
| 8 | Run `docker compose up -d backend` with `BUILD_COMMIT` unset again, then curl | `commit` is back to `unknown` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 10 | Open http://localhost:8010/docs and expand `GET /api/version` | The 200 response schema is `VersionResponse` with the two string properties `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | Summary line shows `0 failed` | [ ] Pass [ ] Fail |
| 12 | Read the test names in those files | At least one case with `BUILD_COMMIT` set (including a 40-character sha) and one with it unset, at both the unit and integration tier | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
