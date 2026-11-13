# UAT Script: TEST-09 Version endpoint reports the build commit

No frontend consumes the `commit` field, so the observable check is the JSON the API returns, read in a browser or with `curl`. Criterion 4 is about the test suites and is checked by running them.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- No `BUILD_COMMIT` set in the shell or in a root `.env` file, unless a step says otherwise.
- A browser with developer tools, or a terminal with `curl`.
- `uv` installed on the host with the backend dependencies synced (criterion 4 only).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser | The page shows JSON with exactly two keys: `version` (the value of `[project].version` in `backend/pyproject.toml`, for example `0.1.0`) and `commit` | [ ] Pass [ ] Fail |
| 2 | Open the browser developer tools, Network tab, and reload | The request to `/api/version` shows status 200 and content type `application/json` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from one declared source, default `"unknown"`

Prerequisites: as above, with no `BUILD_COMMIT` anywhere.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Open `http://localhost:8010/api/version` | `commit` reads `unknown` | [ ] Pass [ ] Fail |
| 4 | From the repository root run `BUILD_COMMIT=abc123 docker compose up -d --build backend` | The backend is rebuilt and restarts | [ ] Pass [ ] Fail |
| 5 | Reload `http://localhost:8010/api/version` | `commit` reads `abc123`, proving the value comes from the build-time variable and not from the router | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the stack is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` | Swagger UI lists `GET /api/version` | [ ] Pass [ ] Fail |
| 8 | Expand `GET /api/version` and look at the 200 response schema | It is `VersionResponse` with required string fields `version` and `commit` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

Not verifiable through the UI; the observable check is the test run.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports `0 failed`. The run includes the set-path tests (`test_get_build_commit_truncates_full_sha_to_first_12_characters`, `test_get_version_returns_first_12_characters_of_build_commit_when_set`) and the unset-path tests (`test_get_build_commit_returns_unknown_when_build_commit_unset`, `test_get_version_returns_unknown_commit_when_build_commit_unset`) | [ ] Pass [ ] Fail |

### Criterion 5: A `BUILD_COMMIT` longer than 12 characters returns only its first 12

Prerequisites: the stack is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | From the repository root run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` (a 40-character sha) | The backend is rebuilt and restarts | [ ] Pass [ ] Fail |
| 12 | Open `http://localhost:8010/api/version` | `commit` reads `0123456789ab` (12 characters) | [ ] Pass [ ] Fail |
| 13 | Repeat step 11 with `BUILD_COMMIT=0123456789ab` (exactly 12 characters) and reload | `commit` reads `0123456789ab`, unchanged (edge case) | [ ] Pass [ ] Fail |
| 14 | Repeat step 11 with no `BUILD_COMMIT` and reload | `commit` reads `unknown` again | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
