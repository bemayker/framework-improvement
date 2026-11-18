# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: no frontend consumes `GET /api/version`, so the observable check is the JSON body, read with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- No `BUILD_COMMIT` exported in the shell.
- A terminal at the repository root with `curl`.
- Criterion 4 only: `uv` installed on the host.

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
| 1 | Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/version` | Prints `200` | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | A JSON object with exactly two keys, `version` (the `[project].version` value in `backend/pyproject.toml`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters only

Prerequisites: as for criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With no `BUILD_COMMIT` set, run `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` (compose recreates the container because its environment changed), then `curl -s http://localhost:8010/api/version` | `commit` is `"0123456789ab"`, the first 12 characters | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"abc1234"`, shorter than 12 and returned whole | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"`, an empty value is treated as unset | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | It contains no literal commit string; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the backend running as in criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with string fields `version` and `commit` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

Prerequisites: `uv` installed; a terminal at the repository root.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/unit/test_version_schema_unit.py tests/integration/test_version_integration.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 11 | Rerun the same command with `-v` | `test_get_build_commit_returns_configured_commit_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_configured_build_commit` and `test_get_version_returns_unknown_commit_when_build_commit_unset` each appear as passed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
