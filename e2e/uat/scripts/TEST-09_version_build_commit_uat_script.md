# UAT Script: TEST-09 Version endpoint reports the build commit

This feature is backend only: no frontend consumes `GET /api/version`, so the observable check is the HTTP response itself, read with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- A terminal with `curl`.
- Criterion 4 only: `uv` installed, and a PostgreSQL connection string in `DATABASE_URL` for the integration tier (see `.env.example`).

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
| 2 | Run `curl -s http://localhost:8010/api/version` | A JSON object with exactly two keys, `version` (for example `"0.1.0"`, matching `[project].version` in `backend/pyproject.toml`) and `commit`, both strings | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response example shows both `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT` set at build time, default `"unknown"`, first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `BUILD_COMMIT=3f9c2a1b7d4e5f60718293a4b5c6d7e8f9012345 docker compose build backend`, then `docker compose up -d backend` | The backend container starts | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"3f9c2a1b7d4e"`, the first 12 of the 40 characters passed in | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT=abc123 docker compose build backend`, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"abc123"`, unchanged because it is 12 characters or fewer | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | The response's `commit` value is `get_build_commit()`, not a quoted string | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 9 | Run `curl -s http://localhost:8010/openapi.json` and find `components.schemas.VersionResponse` | Its `required` list contains `version` and `commit`, and both properties have `type` `string` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_schema_unit.py` | `0 failed`. The run includes `test_get_build_commit_truncates_full_sha_to_first_12_characters` and `test_get_build_commit_returns_unknown_when_unset` | [ ] Pass [ ] Fail |
| 11 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | `0 failed`. The run includes `test_get_version_returns_truncated_commit_when_build_commit_set` and `test_get_version_returns_unknown_commit_when_build_commit_unset` | [ ] Pass [ ] Fail |
| 12 | Run `docker compose build backend` with `BUILD_COMMIT` not exported, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
