# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI: every criterion is verified against the HTTP endpoint, the source, or the test suite. The backend is reached at `http://localhost:8010` (docker compose) from a terminal at the repository root.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010`.
- A terminal with `curl`; `uv` installed for criterion 4.
- `BUILD_COMMIT` absent from the shell and from any root `.env` file at the start.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `backend` container is healthy.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK` and `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | A JSON object with exactly two keys, `version` (for example `"0.1.0"`, the value in `backend/pyproject.toml`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters), never a router literal

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` absent from the shell and `.env`; wait until healthy | Container healthy | [ ] Pass [ ] Fail |
| 4 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --force-recreate backend`; wait until healthy | Container healthy | [ ] Pass [ ] Fail |
| 6 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"0123456789ab"` (first 12 characters); `version` unchanged | [ ] Pass [ ] Fail |
| 7 | Run `BUILD_COMMIT=abc1234 docker compose up -d --force-recreate backend`, wait until healthy, then run the same curl | `commit` is `"abc1234"`, unchanged | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/version.py` | No commit string literal; the value comes from `get_build_commit()` in `backend/app/services/version_service.py`, which reads `get_settings().build_commit` from `backend/app/core/config.py` | [ ] Pass [ ] Fail |
| 9 | Recreate the backend without the variable again (as in step 3) | Stack back in its default state | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/routers/version.py` | The route is declared with `response_model=VersionResponse` and returns a `VersionResponse` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The run ends with `0 failed` (these tests need no database) | [ ] Pass [ ] Fail |
| 13 | Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` | Each has a test that sets `BUILD_COMMIT` (a 40-character sha, expecting its first 12 characters) and one that unsets it (expecting `"unknown"`) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
