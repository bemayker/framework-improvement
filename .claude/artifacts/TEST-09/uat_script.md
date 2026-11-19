# UAT Script: TEST-09 Version endpoint reports the build commit

No acceptance criterion is verifiable through the UI: this is a backend-only change, so every check is an HTTP request, a file read or a test run from a terminal at the repository root.

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- `uv` installed and backend dependencies synced (`uv sync --directory backend`).
- No database is needed for this endpoint.
- Host port `8010` free.
- A terminal with `curl`, and a second terminal for the requests.

## Test Environment Setup

None beyond the prerequisites. Each criterion starts and stops its own server. A warning that `DATABASE_URL` is not set is expected and harmless.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In terminal 1 run `uv run --directory backend uvicorn app.main:app --port 8010` | The log shows `Uvicorn running on http://127.0.0.1:8010` | [ ] Pass [ ] Fail |
| 2 | In terminal 2 run `curl -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` and the body is `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 3 | Stop the server with Ctrl+C | The server exits | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT` (first 12 characters, default `"unknown"`), never a router literal

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `BUILD_COMMIT=49c5d32dbdfb9ac66826decc406cf33bdfe68f13 uv run --directory backend uvicorn app.main:app --port 8010` | The server starts | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | Body is `{"version":"0.1.0","commit":"49c5d32dbdfb"}`, exactly the first 12 characters | [ ] Pass [ ] Fail |
| 6 | Stop the server, restart it with `BUILD_COMMIT=abc1234` in front of the same command, and repeat the curl | `commit` is `abc1234` (a short value is returned unchanged) | [ ] Pass [ ] Fail |
| 7 | Stop the server, restart it with `BUILD_COMMIT=` (blank) in front of the same command, and repeat the curl | `commit` is `unknown` (blank counts as unset) | [ ] Pass [ ] Fail |
| 8 | Stop the server. Open `backend/app/routers/version.py` | The handler passes `get_build_commit()` and contains no quoted commit or `"unknown"` literal | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 10 | Start the server (any `BUILD_COMMIT`), open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with `version` and `commit` as strings. Stop the server afterwards | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_schema_unit.py tests/integration/test_version_integration.py` | The run passes: no failed or errored test, exit code 0 | [ ] Pass [ ] Fail |
| 12 | Re-run the same command with `-v` and find `test_get_version_reports_first_12_characters_of_build_commit_when_set` and `test_get_version_reports_unknown_commit_when_build_commit_unset` | Both are listed as PASSED | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
