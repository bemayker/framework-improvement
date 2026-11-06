# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion is verifiable through the UI: no frontend consumes `GET /api/version`, so the observable check is the HTTP response, the OpenAPI document or the test run.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database).
- No root `.env` file overriding `BUILD_COMMIT`.
- A terminal with `curl`. Criterion 4 needs `uv` installed on the host.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `db` and `backend` services are running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8010/api/version` | Prints `200` | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | A JSON object with exactly two keys: `version` with value `0.1.0` (the `[project].version` in `backend/pyproject.toml`) and `commit` with a string value | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters), never a router literal

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` unset in your shell, run `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `0123456789ab` (the first 12 characters) and `version` is still `0.1.0` | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=abc1234 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` (unchanged, it is shorter than 12) | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no commit string literal; `commit` comes from `get_build_commit()`, which reads `get_settings().build_commit` from `backend/app/core/config.py` | [ ] Pass [ ] Fail |
| 7 | Run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` unset to restore the default, then `curl -s http://localhost:8010/api/version` | `commit` is back to `unknown` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with required string fields `version` and `commit` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 11 | Read the test names in those three files | Each file has at least one test for a set `BUILD_COMMIT` (a 40-character sha yielding its first 12 characters) and one for an unset `BUILD_COMMIT` (yielding `unknown`) | [ ] Pass [ ] Fail |

### Edge case: a blank `BUILD_COMMIT` reports `unknown`

Covers the corresponding Gherkin scenario.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `BUILD_COMMIT= docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | Status 200 and `commit` is `unknown`, not an empty string | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
