# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: every check is made against the API with `curl` from a terminal at the repository root. The backend listens on `http://localhost:8010` under Docker Compose.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No `BUILD_COMMIT` exported in the shell and none set in `.env`.
- No other process bound to host port `8010`.
- A terminal with `curl`; a browser for step 9.
- Step 11 only: `uv` installed on the host.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `backend` and `db` containers report as running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` | Prints `200` | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | A JSON object whose `version` is `0.1.0` (the value in `backend/pyproject.toml`) and whose `commit` is a string | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters only

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With no `BUILD_COMMIT` set, run `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=3f9c2a1b7d4e8f6a5c0b9d2e1f4a7c3b6d8e0f12 docker compose up -d backend` (a full 40-character sha, as CI passes) | The backend container is recreated | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | `commit` is `3f9c2a1b7d4e` (the first 12 characters), not the full 40 | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` (a value shorter than 12 is unchanged) | [ ] Pass [ ] Fail |
| 7 | Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` (blank counts as unset) | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/version.py` | No commit string literal; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with two required string fields, `version` and `commit` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 12 | Read the test names in those three files | Each tier has at least one test for `BUILD_COMMIT` set (including the 40-to-12 truncation) and one for it unset returning `unknown` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
