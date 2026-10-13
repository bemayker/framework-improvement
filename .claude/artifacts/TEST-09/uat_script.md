# UAT script: TEST-09 Version endpoint reports the build commit

`GET /api/version` reports the package version and the commit the backend was built from. No acceptance criterion is verifiable through the application UI, because no frontend screen consumes the endpoint. The observable check is the HTTP response, read with `curl` against the compose stack, plus the backend's interactive docs page for criterion 3.

## Prerequisites

- Docker is running.
- The repository is on branch `feature/TEST-09-version-build-commit` (or `main` once merged).
- `.env` exists, copied from `.env.example`, and `BUILD_COMMIT` is not exported in your shell.
- From the repository root, `docker compose up --build -d backend` has completed and `docker compose ps` shows `backend` and `db` running.
- The backend is published on host port `8010` (from `docker-compose.yml`).
- A terminal with `curl` and `uv`, and a browser.
- `curl` prints JSON without spaces, so `{"version":"0.1.0","commit":"unknown"}` on screen is the same body as `{"version": "0.1.0", "commit": "unknown"}` below. `version` is whatever `[project].version` in `backend/pyproject.toml` says.

## Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` | Prints `200` | [ ] | [ ] |
| 1.2 | Run `curl -s http://localhost:8010/api/version` | A JSON object with exactly two keys, `version` and `commit`, both quoted strings, e.g. `{"version": "0.1.0", "commit": "unknown"}` | [ ] | [ ] |

## Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] | [ ] |
| 2.2 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up --build -d backend`, wait until `docker compose ps` shows `backend` running, then run `curl -s http://localhost:8010/api/version` | `commit` is `0123456789ab`, the first 12 characters and not all 40 | [ ] | [ ] |
| 2.3 | Run `BUILD_COMMIT=abc1234 docker compose up --build -d backend`, wait for `backend` to run, then run `curl -s http://localhost:8010/api/version` | `commit` is `abc1234`, a value of 12 characters or fewer is returned unchanged | [ ] | [ ] |
| 2.4 | Run `docker compose up --build -d backend` with `BUILD_COMMIT` unset again, wait for `backend` to run, then run `curl -s http://localhost:8010/api/version` | `commit` is back to `unknown`; compose passes an empty value and the app treats it as unset | [ ] | [ ] |
| 2.5 | Open `backend/app/routers/version.py` | The commit comes from `get_build_commit()`; no commit string literal appears in the router | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is named `VersionResponse`, with string fields `version` and `commit` | [ ] | [ ] |
| 3.2 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports no failures (`0 failed`) | [ ] | [ ] |
| 4.2 | Read `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` | Each has a test with `BUILD_COMMIT` set (including a 40-character sha expecting its first 12) and a test with `BUILD_COMMIT` unset expecting `unknown` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. Version returns 200 with `version` and `commit` | 1.1 to 1.2 | [ ] Pass  [ ] Fail |
| 2. `commit` from `BUILD_COMMIT`, default `unknown`, 12 characters | 2.1 to 2.5 | [ ] Pass  [ ] Fail |
| 3. Response body is a Pydantic schema | 3.1 to 3.2 | [ ] Pass  [ ] Fail |
| 4. Tests cover set and unset commit | 4.1 to 4.2 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
