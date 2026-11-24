# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion is verifiable through the UI: the frontend does not call `/api/version`. Each check below uses a terminal and the HTTP response instead.

## Prerequisites

- A terminal at the repository root, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- `uv` installed and the backend dependencies synced (`uv sync --directory backend`).
- `curl` available.
- Host port `8010` free. No database is needed: the endpoint does not touch it.
- Step 7 only (optional): Docker and Docker Compose installed and running.

## Test Environment Setup

Each step that starts a server runs it in its own terminal and stops it with Ctrl+C before the next one. A warning that `DATABASE_URL` is not set is expected and harmless.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then in a second terminal run `curl -i http://localhost:8010/api/version` | The log ends with `Uvicorn running on http://127.0.0.1:8010`. The status line reads `HTTP/1.1 200 OK` and the body is a JSON object with exactly two keys, `version` (for example `0.1.0`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters

Prerequisites: the server from step 1 stopped (Ctrl+C).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2 | Start the server with no `BUILD_COMMIT` in the environment: `uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then run `curl -s http://localhost:8010/api/version`. Stop the server | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 3 | Start it with a full sha: `BUILD_COMMIT=4e631128d7285ec47eb354795bf120878553505b uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then run the same curl. Stop the server | `commit` is `4e631128d728` (12 characters) | [ ] Pass [ ] Fail |
| 4 | Start it with a short value: `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then curl. Stop the server | `commit` is `abc1234` | [ ] Pass [ ] Fail |
| 5 | Start it with a blank value: `BUILD_COMMIT=" " uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then curl. Stop the server | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no literal commit string; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |
| 7 | Optional container check: run `BUILD_COMMIT=4e631128d7285ec47eb354795bf120878553505b docker compose build backend`, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `4e631128d728` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: a server running as in step 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `backend/app/schemas/version.py` | Class `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 9 | Run `curl -s http://localhost:8010/openapi.json` and find the path `/api/version` | Its 200 response references `#/components/schemas/VersionResponse`, whose properties are `version` and `commit`, both of type `string` and both required | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

Prerequisites: a terminal at the repository root.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 11 | Re-run the command from step 10 with `-v` added | `test_get_version_reports_commit_from_build_commit_env` and `test_get_version_reports_unknown_commit_when_build_commit_unset` both appear as passed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 (10 required, 1 optional container check) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
