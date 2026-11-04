# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: no page consumes `GET /api/version` yet, so every criterion is verified through the HTTP response and the test files, read with `curl` and a terminal.

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- `uv` installed and the backend dependencies synced (`uv sync --directory backend`).
- Host port `8010` free.
- A terminal with `curl`.
- No database is needed: `GET /api/version` does not touch it. A `DATABASE_URL is not set` warning at startup is expected and harmless.

## Test Environment Setup

1. From the repository root, start the backend with a full 40-character sha:
   ```bash
   BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:app --port 8010
   ```
2. Confirm the log shows `Uvicorn running on http://127.0.0.1:8010`. Leave it running and use a second terminal for the `curl` steps.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | The first line reads `HTTP/1.1 200 OK` and the content type is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | `{"version":"0.1.0","commit":"0123456789ab"}`. Both values are strings; `version` is `[project].version` in `backend/pyproject.toml` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters

Prerequisites: the server from Test Environment Setup is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Compare the `commit` from step 2 with the value you passed (`0123456789abcdef0123456789abcdef01234567`) | `commit` is `0123456789ab`, exactly the first 12 characters (edge case: a 40-character sha is truncated) | [ ] Pass [ ] Fail |
| 4 | Stop the server (Ctrl+C) and restart it with no variable: `uv run --directory backend uvicorn app.main:app --port 8010`, then run `curl http://localhost:8010/api/version` | Body is `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 5 | Stop the server and restart it with a blank value: `BUILD_COMMIT= uv run --directory backend uvicorn app.main:app --port 8010`, then run `curl http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 6 | Stop the server and restart it with a short value: `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:app --port 8010`, then run `curl http://localhost:8010/api/version` | `commit` is `abc1234`, unchanged | [ ] Pass [ ] Fail |
| 7 | Run `grep -n "unknown\|BUILD_COMMIT" backend/app/routers/version.py` | No match: the router holds no commit literal and no variable name | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: a server is running (any `BUILD_COMMIT`).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/routers/version.py` | The route is declared with `response_model=VersionResponse` and returns a `VersionResponse` | [ ] Pass [ ] Fail |
| 10 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with the two string fields `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

Prerequisites: none beyond the synced backend dependencies.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 12 | Open `backend/tests/unit/test_version_service_unit.py` | It contains `test_get_build_commit_truncates_full_sha_to_twelve_characters` (set path) and `test_get_build_commit_returns_unknown_when_unset` (unset path) | [ ] Pass [ ] Fail |
| 13 | Open `backend/tests/integration/test_version_integration.py` | It contains `test_get_version_reports_first_twelve_characters_of_build_commit` (set path) and a case asserting `"commit": "unknown"` with `BUILD_COMMIT` removed (unset path) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
