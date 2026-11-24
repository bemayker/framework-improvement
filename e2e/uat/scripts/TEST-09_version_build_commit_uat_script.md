# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI. Every step is an HTTP request, a file inspection or a test run.

## Prerequisites

- Docker and Docker Compose installed and running; `uv` installed for the test steps.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or later, on `main`), at the repository root.
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is).
- `BUILD_COMMIT` is not set in your shell.
- No other process bound to port `8010` (backend).
- The expected `version` is the `[project].version` field of `backend/pyproject.toml` (`0.1.0` at the time of writing).

## Steps

### Criterion 1: GET /api/version returns 200 with version and commit

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `docker compose up -d --build backend` | The backend container reports running and `http://localhost:8010` answers | [ ] Pass [ ] Fail |
| 2 | Run `curl -i http://localhost:8010/api/version` | Status line is `HTTP/1.1 200 OK`; the body has exactly two keys, `version` (matching `backend/pyproject.toml`) and `commit`, both strings | [ ] Pass [ ] Fail |
| 3 | Run `curl -i -X POST http://localhost:8010/api/version` | `405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: commit comes from BUILD_COMMIT, default "unknown", first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"0123456789ab"` (first 12 characters, not all 40) | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT=abc1234 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"abc1234"` (shorter values are not padded or cut) | [ ] Pass [ ] Fail |
| 7 | Run `grep -n "commit" backend/app/routers/version.py` | Docstring and import lines aside, the only `commit=` match is `commit=get_build_commit()`: the router holds no quoted sha and no `"unknown"` literal | [ ] Pass [ ] Fail |
| 8 | Restore: run `docker compose up -d --build backend` with `BUILD_COMMIT` unset, then `curl -s http://localhost:8010/api/version` | `commit` is back to `"unknown"` | [ ] Pass [ ] Fail |

### Criterion 3: response body is defined by a Pydantic schema in backend/app/schemas/

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `http://localhost:8010/docs` in a browser | The Swagger page lists `GET /api/version` | [ ] Pass [ ] Fail |
| 10 | Expand `GET /api/version` and open the 200 response's Schema tab | It is `VersionResponse` with `version` (string, required) and `commit` (string, required) | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` | No failed or errored test; exit code 0 | [ ] Pass [ ] Fail |
| 13 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | No failed or errored test, none skipped; exit code 0 | [ ] Pass [ ] Fail |
| 14 | Run `uv run --directory backend pytest -q -k "build_commit"` | The selected tests include the set (`..._when_build_commit_set`, `..._truncates_full_sha...`) and unset (`..._when_build_commit_unset`, `..._returns_unknown_when_unset`) paths; the run passes with exit code 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
