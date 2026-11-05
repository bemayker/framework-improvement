# UAT Script: TEST-09 Version endpoint reports the build commit

This feature has no UI: every criterion is verified against the HTTP endpoint with `curl` and against the test suite. Commands run from the repository root.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- No other process bound to host port `8010`.
- No `BUILD_COMMIT` exported in the shell, except where a step sets it.
- A terminal with `curl`, `grep` and `uv`.

## Test Environment Setup

1. Run `docker compose up -d --build backend`.
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` | Prints `200` | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | A JSON object with exactly two keys, `version` (the `[project].version` in `backend/pyproject.toml`, e.g. `0.1.0`) and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With the stack started without `BUILD_COMMIT`, run `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=3f2a9c1d4e5b6a7f8091a2b3c4d5e6f708192a3b docker compose up -d --force-recreate backend` | Container recreated | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | `commit` is `3f2a9c1d4e5b` (12 characters) | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT=abc1234 docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` | [ ] Pass [ ] Fail |
| 7 | Run `BUILD_COMMIT="   " docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` (blank counts as unset) | [ ] Pass [ ] Fail |
| 8 | Run `grep -n "commit" backend/app/routers/version.py` | The only match is the call `commit=get_build_commit()`; no quoted commit value appears in the router | [ ] Pass [ ] Fail |
| 9 | Restore: run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` unset | Container recreated | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/routers/version.py` | The route declares `response_model=VersionResponse` and returns a `VersionResponse` | [ ] Pass [ ] Fail |
| 12 | With the stack running, open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with string fields `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

Prerequisite: the database from the Backing Services recipe is running and `DATABASE_URL` points at it (the integration conftest needs it).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` | `0 failed`; the `build_commit` and `get_build_commit` tests are among those run | [ ] Pass [ ] Fail |
| 14 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | `0 failed`; the set, unset and blank `BUILD_COMMIT` tests are among those run | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
