# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI. Every check reads the HTTP response of the backend with `curl`, reads source, or runs the tests.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- No `BUILD_COMMIT` in your shell environment or in a root `.env` file.
- A terminal with `curl`.
- Criterion 4 only: `uv` installed, and the backing PostgreSQL from `CLAUDE.md` Backing Services running with `DATABASE_URL` pointing at it (the shared test conftest needs it).

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
| 1 | Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/version` | Prints `200` | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | A JSON object with exactly two keys, `version` (the `[project].version` value in `backend/pyproject.toml`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT` set at build time, default `"unknown"`, first 12 characters when longer

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` | The backend image is rebuilt and the container restarts | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"0123456789ab"`, the first 12 characters of the 40-character value (edge case: truncation) | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT=abc123 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"abc123"`, unchanged because it is shorter than 12 characters | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | It contains no commit string literal; `commit` is filled from `get_build_commit()` | [ ] Pass [ ] Fail |
| 8 | Run `docker compose up -d --build backend` with `BUILD_COMMIT` unset again, then `curl -s http://localhost:8010/api/version` | `commit` is back to `"unknown"` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/routers/version.py` | The route declares `response_model=VersionResponse` | [ ] Pass [ ] Fail |
| 11 | With the backend running, open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema shows `VersionResponse` with the fields `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` | `0 failed`; the tests include the set, unset, exactly-12 and longer-than-12 commit cases | [ ] Pass [ ] Fail |
| 13 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | `0 failed`, including the unset (`"unknown"`) and 40-character sha (first 12) HTTP cases | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
