# UAT Script: TEST-09 Version endpoint reports the build commit

No acceptance criterion is verifiable through the UI: no frontend consumes `GET /api/version`, so the observable check is the HTTP response itself, read with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- A terminal with `curl`.
- Criterion 4 only: `uv` installed on the host with the backend dependencies synced, and a PostgreSQL instance reachable through `DATABASE_URL` for the integration tier (see `.env.example`), or `docker compose up -d db`.

## Test Environment Setup

1. From the repository root, with `BUILD_COMMIT` not set in the shell and not present in `.env`, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal at the repository root, run `curl -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present | [ ] Pass [ ] Fail |
| 2 | Read the body printed by step 1 | A JSON object with exactly two keys, `version` (for example `"0.1.0"`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` not set in the shell and not present in `.env` | The backend container restarts | [ ] Pass [ ] Fail |
| 4 | Run `curl -s http://localhost:8010/api/version` | The body shows `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=9a6bfd7c3e1f2a4b5c6d7e8f9a0b1c2d3e4f5a6b docker compose up -d --force-recreate backend` | The backend container restarts | [ ] Pass [ ] Fail |
| 6 | Run `curl -s http://localhost:8010/api/version` | The body shows `"commit":"9a6bfd7c3e1f"` (the first 12 characters of the 40-character sha), and `version` is unchanged from step 4 | [ ] Pass [ ] Fail |
| 7 | Run `BUILD_COMMIT=abc1234 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | The body shows `"commit":"abc1234"` (a value of 12 characters or fewer is returned as is) | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/version.py` | The router contains no commit string literal; it calls `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open http://localhost:8010/docs in a browser | The Swagger UI lists `GET /api/version` | [ ] Pass [ ] Fail |
| 10 | Expand `GET /api/version` and open its 200 response schema | It is `VersionResponse` with `version` (string, required) and `commit` (string, required) | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` | The run ends with `0 failed`, and the output includes the build-commit set, unset, blank and longer-than-12 tests | [ ] Pass [ ] Fail |
| 13 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | The run ends with `0 failed`, including the set-commit (first 12 characters) and unset-commit (`"unknown"`) tests | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
