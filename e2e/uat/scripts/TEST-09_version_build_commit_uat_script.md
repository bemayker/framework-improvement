# UAT Script: TEST-09 Version endpoint reports the build commit

Not verifiable through the UI: this item is backend only (the footer that shows the commit is TEST-10). Every check reads the HTTP response directly with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- A terminal with `curl`.
- Criterion 4 only: `uv` installed and a Postgres reachable through `DATABASE_URL` (`docs/DEVELOPMENT.md`, Testing).

## Test Environment Setup

1. From the repository root, with `BUILD_COMMIT` not exported in your shell, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and `backend` reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -i http://localhost:8010/api/version` | Status line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present | [ ] Pass [ ] Fail |
| 2 | Read the body | A JSON object with a string `version` (the `[project].version` in `backend/pyproject.toml`, for example `0.1.0`) and a string `commit` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` not exported, run `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | Body shows `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | Body shows `"commit":"0123456789ab"` (12 characters) | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT= docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | Body shows `"commit":"unknown"` (blank is treated as unset) | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with string fields `version` and `commit` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | With `DATABASE_URL` set, run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary reports 0 failed, and the unit and integration files each include tests for a set `BUILD_COMMIT` and an unset one | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
