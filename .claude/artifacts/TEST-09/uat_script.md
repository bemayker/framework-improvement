# UAT Script: TEST-09 Version endpoint reports the build commit

Backend-only feature: no screen shows the commit yet (the footer display is TEST-10), so every check is a terminal `curl`, a browser address bar, a file read or a test run.

## Prerequisites

- Docker running.
- Repository on branch `feature/TEST-09-version-build-commit` (or `main` once merged).
- From the repository root run `docker compose up -d --build` with no `BUILD_COMMIT` in the shell or `.env`, then `docker compose ps` until the `backend` service shows running.
- The backend answers on `http://localhost:8010` (published by `docker-compose.yml`).
- Criterion 4 only: `uv` installed and backend dependencies synced (`uv sync --directory backend`), and a PostgreSQL instance reachable through `DATABASE_URL` for step 4.2 (for example `docker compose up -d db` and `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`).

## Criterion 1: GET /api/version returns 200 with version and commit strings

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i http://localhost:8010/api/version` | First response line is `HTTP/1.1 200 OK`; `content-type` header is `application/json` | [ ] | [ ] |
| 1.2 | Read the body under the headers | `{"version":"0.1.0","commit":"unknown"}`; the `version` value is whatever `backend/pyproject.toml` `[project].version` says; both values are quoted strings | [ ] | [ ] |

## Criterion 2: commit comes from BUILD_COMMIT (default unknown, first 12 characters), never a router literal

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/version` with `BUILD_COMMIT` unset | `commit` is `unknown` | [ ] | [ ] |
| 2.2 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` from the repository root, wait until `backend` runs, then `curl -s http://localhost:8010/api/version` | `commit` is `0123456789ab` (the first 12 of the 40 characters) | [ ] | [ ] |
| 2.3 | Run `BUILD_COMMIT=abc123 docker compose up -d backend`, wait, then `curl -s http://localhost:8010/api/version` | `commit` is `abc123` (shorter than 12, returned as is) | [ ] | [ ] |
| 2.4 | Run `BUILD_COMMIT=" " docker compose up -d backend`, wait, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` (blank counts as unset) | [ ] | [ ] |
| 2.5 | Open `backend/app/routers/version.py`, then run `grep -rn BUILD_COMMIT backend/app` | The router calls `get_build_commit()` and contains no commit string literal; `BUILD_COMMIT` appears only in `backend/app/core/config.py` | [ ] | [ ] |
| 2.6 | Run `docker compose up -d backend` with no `BUILD_COMMIT` to restore the default | Backend restarts and `curl -s http://localhost:8010/api/version` reports `unknown` again | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] | [ ] |
| 3.2 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with the two string fields `version` and `commit` | [ ] | [ ] |
| 3.3 | Run `curl -s http://localhost:8010/api/version` | The body carries exactly the keys `version` and `commit`, nothing else | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` | `0 failed`; with `-v` the new `build_commit` set, unset and blank tests and the `get_build_commit` truncation and unknown tests are listed | [ ] | [ ] |
| 4.2 | With `DATABASE_URL` set, run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | `0 failed`, with the set-commit (first 12 characters) and unset-commit (`unknown`) request tests among those run | [ ] | [ ] |

## Additional checks (edge cases)

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| E.1 | Run `curl -i -X POST http://localhost:8010/api/version` | `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. 200 with version and commit strings | 1.1 to 1.2 | [ ] Pass  [ ] Fail |
| 2. commit from BUILD_COMMIT, 12 characters, default unknown | 2.1 to 2.6 | [ ] Pass  [ ] Fail |
| 3. Pydantic response schema | 3.1 to 3.3 | [ ] Pass  [ ] Fail |
| 4. Tests cover set and unset paths | 4.1 to 4.2 | [ ] Pass  [ ] Fail |
| Edge cases | E.1 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
