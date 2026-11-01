# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion is verifiable through the UI: the endpoint has no frontend in this item, so the observable check is the HTTP response, read with `curl`, plus the source and the test run.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- A terminal with `curl`, and `uv` for criterion 4.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` and `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | Exactly two keys, `version` (for example `"0.1.0"`, the value in `backend/pyproject.toml`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from one declared source (environment variable, default `"unknown"`)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `docker compose up -d --force-recreate backend` with no `BUILD_COMMIT` set | The container is running | [ ] Pass [ ] Fail |
| 4 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --force-recreate backend` | The container is recreated | [ ] Pass [ ] Fail |
| 6 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"0123456789ab"` (the first 12 characters) | [ ] Pass [ ] Fail |
| 7 | Run `BUILD_COMMIT=abc123 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"abc123"` | [ ] Pass [ ] Fail |
| 8 | Run `BUILD_COMMIT= docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` (a blank value counts as unset) | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/routers/version.py` | `commit` is passed as `get_build_commit()`; no quoted commit value appears in the router | [ ] Pass [ ] Fail |
| 10 | Restore the default: `docker compose up -d --force-recreate backend` | The container is running with no `BUILD_COMMIT` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 12 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with the fields `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` | `0 failed`; the tests cover the `build_commit` set, unset and blank cases and the `get_build_commit` truncation, short-value and default cases | [ ] Pass [ ] Fail |
| 14 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | `0 failed`, including the commit-set (40-character sha returned as its first 12) and commit-unset (`unknown`) tests. These tests need no database | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
