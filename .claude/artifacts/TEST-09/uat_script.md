# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI: every criterion is verified against the HTTP response with `curl` from a terminal at the repository root, or by reading code and test files.

## Prerequisites

- `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- Host port `8010` is free.
- No `BUILD_COMMIT` exported in the shell.
- A terminal with `curl` and `grep`.

## Test Environment Setup

No database is needed. A `DATABASE_URL is not set` warning at server start is expected and harmless. Each server start below runs in its own terminal and is stopped with Ctrl+C before the next one.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:app --port 8010` | The log shows `Uvicorn running on http://127.0.0.1:8010` | [ ] Pass [ ] Fail |
| 2 | In a second terminal run `curl -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK` and body `{"version":"0.1.0","commit":"0123456789ab"}` (the version is whatever `backend/pyproject.toml` `[project].version` holds) | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

Prerequisites: the server from Criterion 1 is stopped (Ctrl+C).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Start the server as in step 1 with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`, then run `curl http://localhost:8010/api/version` | `"commit":"0123456789ab"` (12 characters, not 40) | [ ] Pass [ ] Fail |
| 4 | Stop it, start it with `BUILD_COMMIT=abc1234` instead, and repeat the curl | `"commit":"abc1234"` (shorter values are unchanged) | [ ] Pass [ ] Fail |
| 5 | Stop it, start it with no `BUILD_COMMIT` at all (`uv run --directory backend uvicorn app.main:app --port 8010`), and repeat the curl | `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 6 | Stop it, start it with `BUILD_COMMIT=` (empty), and repeat the curl (edge case) | `"commit":"unknown"` (a blank value counts as unset) | [ ] Pass [ ] Fail |
| 7 | Run `grep -n "commit" backend/app/routers/version.py` | The only match is the call `commit=get_build_commit()`; no quoted sha or `"unknown"` literal appears in the router | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/routers/version.py` | The route is declared with `response_model=VersionResponse` and returns a `VersionResponse` | [ ] Pass [ ] Fail |
| 10 | With a server running, run `curl http://localhost:8010/openapi.json` and look under `components.schemas.VersionResponse` | `required` lists `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | `0 failed` | [ ] Pass [ ] Fail |
| 12 | Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` | Each contains a test that sets `BUILD_COMMIT` (to a 40-character sha, asserting the 12-character prefix) and one that deletes it (asserting `unknown`) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
