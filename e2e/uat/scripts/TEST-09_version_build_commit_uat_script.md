# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI: every criterion is verified against the HTTP endpoint with `curl` from a terminal at the repository root, or by running the named tests. The backend listens on `http://localhost:8010`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-09-version-build-commit` (or `main` once merged).
- No `BUILD_COMMIT` exported in your shell (`unset BUILD_COMMIT`).
- A terminal with `curl`; `uv` installed for criterion 4.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `docker compose up -d --build backend` | The `db` and `backend` containers start; `docker compose ps` shows backend as running | [ ] Pass [ ] Fail |
| 2 | Run `curl -s -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK`; body is JSON with exactly two string keys, `version` (the `[project].version` in `backend/pyproject.toml`) and `commit` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 4 | Run `BUILD_COMMIT=3f9c2a7b1d4e8f60a5b2c9d1e7f3a4b6c8d0e2f1 docker compose up -d backend` | The backend container is recreated | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"3f9c2a7b1d4e"` (first 12 characters) | [ ] Pass [ ] Fail |
| 6 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"abc1234"` (shorter than 12, unchanged) | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/version.py` | No commit string literal; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |
| 8 | Run `docker compose up -d backend` with `BUILD_COMMIT` unset, then `curl -s http://localhost:8010/api/version` | `commit` returns to `"unknown"` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with required string fields `version` and `commit` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

Needs a PostgreSQL database reachable at `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes` (the compose `db` service) for the integration tier.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` | No failed or errored test on the summary line; exit code 0 | [ ] Pass [ ] Fail |
| 12 | Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` | No failed or errored test on the summary line; exit code 0 | [ ] Pass [ ] Fail |
| 13 | Read the test names in both files | Set (`..._when_set`, `..._from_build_commit_env`), unset (`..._when_unset`, `..._when_build_commit_unset`) and truncation tests are present | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
