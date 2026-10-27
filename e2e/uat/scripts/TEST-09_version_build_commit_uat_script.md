# UAT Script: TEST-09 Version endpoint reports the build commit

This item is backend only; the observable check is the HTTP response, read with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010`.
- A terminal with `curl`; `uv` installed for criterion 4.
- No `BUILD_COMMIT` in the shell or a root `.env` file at the start.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK`, `content-type` is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | `{"version":"0.1.0","commit":"unknown"}` (version is whatever `backend/pyproject.toml` holds) | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/version` in a browser tab | Same JSON, `version` and `commit` both quoted strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `a1b2c3d4e5f6`; `version` unchanged | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` | [ ] Pass [ ] Fail |
| 7 | Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/version.py` | No commit string literal; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema

Not verifiable through the UI. Observable checks instead:

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 10 | Open `http://localhost:8010/docs` and expand `GET /api/version` | The 200 response schema is `VersionResponse` with string properties `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 4: tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` | `0 failed`; test names include a set (truncated) and an unset (`unknown`) commit case | [ ] Pass [ ] Fail |
| 12 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | `0 failed`; test names include a set-commit and an unset-commit case | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
