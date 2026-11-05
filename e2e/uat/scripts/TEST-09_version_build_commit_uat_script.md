# UAT Script: TEST-09 Version endpoint reports the build commit

Backend only: no frontend consumes `GET /api/version` yet (the footer is TEST-10), so the observable check is the HTTP response read with `curl`. Criterion 4 is a statement about the test suite and is checked by running it.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`), repository root as the working directory.
- `.env` copied from `.env.example`, with no `BUILD_COMMIT` line in it at the start.
- No other process bound to host port `8010` (backend).
- A terminal with `curl`; `uv` installed for Criterion 4.

## Test Environment Setup

1. Run `docker compose up -d --build backend`.
2. Run `docker compose ps` until the `db` and `backend` services are up.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -o /dev/null -w '%{http_code}' http://localhost:8010/api/version` | Prints `200` | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | A JSON object with exactly two keys, `version` (`"0.1.0"`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` unset, run `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 4 | Add `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` (40 characters) to `.env`, run `docker compose up -d --force-recreate backend`, then call the endpoint | `{"version":"0.1.0","commit":"0123456789ab"}`: only the first 12 characters | [ ] Pass [ ] Fail |
| 5 | Change the line to `BUILD_COMMIT=abc1234`, recreate the backend as in step 4, call the endpoint | `commit` is `"abc1234"`, unchanged | [ ] Pass [ ] Fail |
| 6 | Change the line to `BUILD_COMMIT=` (blank), recreate the backend, call the endpoint (edge case) | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py`, then remove the `BUILD_COMMIT` line from `.env` | The router calls `get_build_commit()` and contains no commit string literal | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with properties `version` and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

Not verifiable through the UI; the observable check is the test run.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Start a Postgres for the integration suite (the conftest fixtures need `DATABASE_URL`), then run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The run reports `0 failed` | [ ] Pass [ ] Fail |
| 11 | Read the test names in those three files | Each file has at least one test with `BUILD_COMMIT` set and at least one with it unset | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
