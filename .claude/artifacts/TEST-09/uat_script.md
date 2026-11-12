# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion has a UI: the feature is a JSON endpoint, so the observable check is the HTTP response read with `curl`, plus the test run for criterion 4.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- `.env` copied from `.env.example`, with no `BUILD_COMMIT` value set in it.
- No other process bound to host port `8010` (backend).
- A terminal with `curl`; `uv` installed for step 8.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build backend db
   ```
2. Run `docker compose ps` until `db` reports healthy and `backend` reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK`, header `content-type: application/json`, body is a JSON object with exactly two keys, `version` (for example `"0.1.0"`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2 | Run `BUILD_COMMIT=3f9c2a71b0de4c5e8a9f00112233445566778899 docker compose build backend`, then `docker compose up -d backend` | Build completes and the backend restarts | [ ] Pass [ ] Fail |
| 3 | Run `curl -s http://localhost:8010/api/version` | Body contains `"commit":"3f9c2a71b0de"`, exactly the first 12 characters of the sha | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=abc1234 docker compose build backend`, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | Body contains `"commit":"abc1234"`, unchanged and not padded | [ ] Pass [ ] Fail |
| 5 | Open `backend/app/routers/version.py` | No commit literal appears in it; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s http://localhost:8010/openapi.json` and find `components.schemas.VersionResponse` | `properties` lists `version` and `commit`, both `"type": "string"`, and `required` lists both | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/schemas/version.py` | Class `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/unit/test_version_schema_unit.py tests/integration/test_version_integration.py` | Summary line shows `0 failed`; no database is needed for these files | [ ] Pass [ ] Fail |
| 9 | Run `docker compose build backend` with `BUILD_COMMIT` unset in the shell and absent from `.env`, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | Body contains `"commit":"unknown"` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
