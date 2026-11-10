# UAT Script: TEST-09 Version endpoint reports the build commit

TEST-09 has no UI: no frontend consumes `GET /api/version`, so every check is made against the running backend with `curl` (or a browser address bar) on http://localhost:8010.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database).
- No `BUILD_COMMIT` in your shell or in a root `.env` file at the start.
- A terminal with `curl`.
- Criterion 4 only: `uv` installed on the host, and a PostgreSQL instance reachable through `DATABASE_URL` (the compose `db` on port 5442 works).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | A JSON object with exactly two keys, `version` (for example `"0.1.0"`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With no `BUILD_COMMIT` set, run `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=3f9a2c1b7d4e5f60718293a4b5c6d7e8f9a0b1c2 docker compose up -d backend` | The backend container is recreated | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"3f9a2c1b7d4e"`, exactly the first 12 characters | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then the same `curl` | `commit` is `"abc1234"`, unchanged | [ ] Pass [ ] Fail |
| 7 | Run `BUILD_COMMIT= docker compose up -d backend`, then the same `curl` | `commit` is `"unknown"` (blank is treated as unset) | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/version.py` | It contains no commit literal; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 10 | Open http://localhost:8010/docs and expand `GET /api/version` | The 200 response schema is `VersionResponse` with the two string fields `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 12 | In those files, find `test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_version_returns_first_12_characters_of_build_commit_when_set`, `test_get_build_commit_returns_unknown_when_unset` and `test_get_version_returns_unknown_commit_when_build_commit_unset` | All four are present and were part of the run in step 11 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
