# UAT Script: TEST-09 Version endpoint reports the build commit

This item is backend only and has no screen. Criteria 1 to 3 are verified against the API with `curl` (or a browser tab on the URL); criterion 4 is verified by running the tests.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- A terminal with `curl`.
- `uv` installed on the host (criterion 4 only; no database needed for those tests).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=3f9c2a1b7d4e5f60718293a4b5c6d7e8f9012345 docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | `{"version":"0.1.0","commit":"3f9c2a1b7d4e"}` (the `version` value is whatever `[project].version` in `backend/pyproject.toml` says), with exactly the two keys `version` and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

Prerequisites: stack started as in Test Environment Setup.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With the stack started with the 40-character value, run `curl -s http://localhost:8010/api/version` | `commit` is `3f9c2a1b7d4e`, the first 12 characters of the value passed in, not all 40 | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=abc123 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc123`, unchanged | [ ] Pass [ ] Fail |
| 5 | From a shell where `BUILD_COMMIT` is not exported and `.env` does not set it, run `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | The router contains no commit string literal; the value comes from `get_build_commit()` in `backend/app/services/version_service.py`, which reads `build_commit` from `backend/app/core/config.py` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: a checkout of the branch; step 9 needs the stack running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/version.py` | The route is declared with `response_model=VersionResponse` and returns a `VersionResponse` | [ ] Pass [ ] Fail |
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema shows `VersionResponse` with the two string fields `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 11 | Read the test names in those three files | At least one test for a set `BUILD_COMMIT` (including the 40-character truncation) and one for an unset `BUILD_COMMIT` (`unknown`) at both the unit and the integration level | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
