# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI: every criterion is verified against the running backend with `curl`, the interactive API docs, and the test suites.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- No `BUILD_COMMIT` in the shell or in a root `.env` file.
- A terminal with `curl`, and a browser for Criterion 3.
- `uv` installed on the host (Criterion 4 only).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | Exactly two keys: `version` holds the `[project].version` string from `backend/pyproject.toml`, and `commit` holds `unknown` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters of a longer value

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` | The backend container is recreated | [ ] Pass [ ] Fail |
| 4 | Run `curl -s http://localhost:8010/api/version` | `commit` is `0123456789ab` (the first 12 characters of the 40-character sha) | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234`, unchanged | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with string properties `version` and `commit` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 11 | Read the test names in those files | `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_get_version_returns_truncated_commit_when_build_commit_is_set` and `test_get_version_returns_unknown_commit_when_build_commit_is_unset` are present | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
