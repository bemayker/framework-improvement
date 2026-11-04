# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: no frontend consumes `GET /api/version` in this item, so every criterion is verified over HTTP with `curl`, or by reading code and test output.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- `.env` copied from `.env.example`.
- No other process bound to host port `8010`.
- A terminal with `curl`, and `uv` installed for criterion 4.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=1f1df4f723f8d8695ff74e774b2af1c086c9cf0e docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | The first response line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present | [ ] Pass [ ] Fail |
| 2 | Read the response body | `{"version":"0.1.0","commit":"1f1df4f723f8"}` (the version is whatever `backend/pyproject.toml` `[project].version` says); both values are strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With the container from setup running, run `curl -s http://localhost:8010/api/version` | `commit` is `1f1df4f723f8`, exactly the first 12 characters of the 40-character value passed in (the truncation edge case) | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=abc123 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc123` (shorter than 12, unchanged) | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT= docker compose up -d --build backend` (empty), then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no commit literal; the value comes from `get_build_commit()`, which reads `get_settings().build_commit`, which reads `BUILD_COMMIT` in `backend/app/core/config.py` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with two required string fields, `version` and `commit` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

Prerequisite: a PostgreSQL connection string in `DATABASE_URL` for the integration tier (see `docs/DEVELOPMENT.md`), or accept that the integration files skip locally without one.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` | `0 failed`; the output lists the `build_commit` set, unset and blank tests and the `get_build_commit` truncation and unset tests | [ ] Pass [ ] Fail |
| 10 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` with `DATABASE_URL` set | `0 failed`; the set-path test (40-character sha returns its first 12) and the unset-path test (`"unknown"`) are among those run | [ ] Pass [ ] Fail |
| 11 | Run `docker compose down` | The stack stops | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
