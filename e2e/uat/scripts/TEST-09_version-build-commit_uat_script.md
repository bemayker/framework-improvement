# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI. Criteria 1, 2 and 5 are verified against the running API with `curl`; criteria 3 and 4 are verified by reading source and running the tests.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- No `BUILD_COMMIT` exported in your shell and none in a root `.env`.
- A terminal with `curl`, run from the repository root.
- Criterion 4 only: `uv` installed on the host.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -i http://localhost:8010/api/version` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response body | JSON with exactly two keys, `version` (for example `"0.1.0"`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=abc1234 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"abc1234"` | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT= docker compose up -d --force-recreate backend` (blank value), then the same curl | `commit` is `"unknown"` (a blank value counts as unset) | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/version.py` | The route declares `response_model=VersionResponse` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 10 | Read the three test files | Each covers `BUILD_COMMIT` set and `BUILD_COMMIT` unset at least once | [ ] Pass [ ] Fail |

### Criterion 5: a value longer than 12 characters returns only its first 12

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --force-recreate backend` | The backend restarts | [ ] Pass [ ] Fail |
| 12 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"0123456789ab"` (12 characters) | [ ] Pass [ ] Fail |
| 13 | Run `BUILD_COMMIT=0123456789ab docker compose up -d --force-recreate backend`, then the same curl | `commit` is `"0123456789ab"`, unchanged | [ ] Pass [ ] Fail |
| 14 | Clean up: run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` unset, then the same curl | `commit` is back to `"unknown"` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
