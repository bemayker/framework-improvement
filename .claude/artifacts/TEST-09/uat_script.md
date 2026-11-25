# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: every criterion is verified against the HTTP endpoint with `curl` and against the test suite.

## Prerequisites

- Docker and Docker Compose installed and running.
- `uv` installed on the host.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`), repository root as the working directory.
- No `BUILD_COMMIT` exported in the shell.
- The backend is published at `http://localhost:8010` under `docker compose`.
- A terminal with `curl` and a browser (criterion 3).

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `docker compose up -d --build backend db` | Both containers report as started | [ ] Pass [ ] Fail |
| 2 | Run `curl -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK`, header `content-type: application/json`, body `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from one declared source (`BUILD_COMMIT`, default `"unknown"`)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` | The backend container is recreated | [ ] Pass [ ] Fail |
| 4 | Run `curl -s http://localhost:8010/api/version` | Body `{"version":"0.1.0","commit":"0123456789ab"}` (the first 12 characters of the 40-character sha) | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | Body `{"version":"0.1.0","commit":"abc1234"}` (7 characters, unchanged) | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | Body `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py`, then `backend/app/core/config.py` | The router contains no string literal for the commit and calls `get_build_commit()`; the string literal `"unknown"` appears once in `config.py`, as the value of `UNKNOWN_BUILD_COMMIT` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response shows schema `VersionResponse` with `version` (string) and `commit` (string), both required | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 11 | Re-run step 10 with `-v` added | `test_get_version_returns_commit_from_build_commit_env` and `test_get_version_returns_unknown_commit_when_build_commit_unset` are present and pass | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
