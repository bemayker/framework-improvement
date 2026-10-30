# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI. Every criterion is verified by an HTTP request with `curl` (or a browser address bar) against a backend started on the host, plus one test run. The endpoint needs no database.

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).
- Host port `8010` free (backend). Host port `8011` free for the container check in Criterion 2 step 7 (optional, needs Docker).
- A terminal with `curl`, and a second terminal for the server.
- `BUILD_COMMIT` is not exported in either terminal unless a step says so.

## Test Environment Setup

No database or Docker stack is needed. Each criterion starts the backend itself, from the repo root, with:

```bash
uv run --directory backend uvicorn app.main:create_app --factory --port 8010
```

Stop it with Ctrl+C before starting the next variant.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

Prerequisites: `BUILD_COMMIT` not exported. Backend started with the command above and left running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a second terminal run `curl -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | Exactly `{"version":"0.1.0","commit":"unknown"}`: two keys, both string values | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`

Prerequisites: the backend from Criterion 1 is stopped (Ctrl+C).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Start the backend with the variable set: `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:create_app --factory --port 8010` | uvicorn logs `Application startup complete` | [ ] Pass [ ] Fail |
| 4 | Run `curl -s http://localhost:8010/api/version` | `{"version":"0.1.0","commit":"abc1234"}` | [ ] Pass [ ] Fail |
| 5 | Stop the backend, start it again with `BUILD_COMMIT=   ` (three spaces) in front of the same command, and repeat the curl | `"commit":"unknown"`: a blank value counts as unset | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no commit string literal; `commit` is filled from `get_build_commit()` | [ ] Pass [ ] Fail |
| 7 | Optional, needs Docker: run `docker build --build-arg BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 -t tasknotes-backend-test09 backend`, then `docker run --rm -p 8011:8010 tasknotes-backend-test09`, then `curl -s http://localhost:8011/api/version`. Stop the container with Ctrl+C | The body contains `"commit":"0123456789ab"` | [ ] Pass [ ] Fail |

### Criterion 3: Response body defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: start the backend again with no `BUILD_COMMIT` and leave it running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser | The Swagger UI lists `GET /api/version` | [ ] Pass [ ] Fail |
| 9 | Expand it and open the 200 response schema | It is named `VersionResponse`, with `version` (string, required) and `commit` (string, required) | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

Prerequisites: none (these tests need no database). The backend may be stopped.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 12 | Open `backend/tests/integration/test_version_integration.py` | One test has `BUILD_COMMIT` set and one has it deleted, each asserting the `commit` value | [ ] Pass [ ] Fail |

### Criterion 5: `BUILD_COMMIT` longer than 12 characters returns its first 12

Prerequisites: no backend running on port 8010.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Start the backend with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:create_app --factory --port 8010` | uvicorn logs `Application startup complete` | [ ] Pass [ ] Fail |
| 14 | Run `curl -s http://localhost:8010/api/version` | `{"version":"0.1.0","commit":"0123456789ab"}`: exactly 12 characters | [ ] Pass [ ] Fail |
| 15 | Stop it, start it again with `BUILD_COMMIT=0123456789ab` (exactly 12), and repeat the curl | `"commit":"0123456789ab"`, unchanged | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 (14 required, 1 optional Docker check) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
