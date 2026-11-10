# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion is verifiable through the UI: the feature is backend only, so the observable check is the HTTP response, read with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No `BUILD_COMMIT` exported in the shell.
- No other process bound to host port `8010` (backend).
- A terminal with `curl`, and `uv` installed (criterion 4).

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build backend`.
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK` and header `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | Exactly two keys, `version` (the `[project].version` in `backend/pyproject.toml`, e.g. `0.1.0`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` unset, run `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=ac6e44ce1a904f608a5ee6d69dcd1f04429c458e docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `"commit":"ac6e44ce1a90"`: the first 12 characters, not the full 40 | [ ] Pass [ ] Fail |
| 5 | Run `BUILD_COMMIT=abc123 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `"commit":"abc123"`: shorter values are returned unchanged | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/version.py` | No commit string literal appears; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |
| 7 | Run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` unset to restore the default | Backend running again with `commit` `unknown` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with `version` and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` | `0 failed` (no PostgreSQL needed for these files) | [ ] Pass [ ] Fail |
| 11 | Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` | Each has at least one test setting `BUILD_COMMIT` and one with it unset | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
