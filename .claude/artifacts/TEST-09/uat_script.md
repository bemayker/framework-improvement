# UAT Script: TEST-09 Version endpoint reports the build commit

No acceptance criterion is verifiable through the UI: no frontend screen calls `GET /api/version` yet (the footer display is TEST-10). Each block gives an observable HTTP check instead, made with `curl` in a terminal (or the same URL in a browser address bar).

## Prerequisites

- Docker and Docker Compose running.
- Repository on branch `feature/TEST-09-version-build-commit`.
- `BUILD_COMMIT` not exported in your shell.
- From the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running.
- The backend answers on `http://localhost:8010` (the host port `docker-compose.yml` publishes).
- For Criterion 4, the compose database is up (`docker compose up -d db`) on host port 5442.
- A terminal with `curl`; a browser for steps that name one.

## Criterion 1: GET /api/version returns 200 with version and commit strings

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/version` and read the first response line | It reads `HTTP/1.1 200 OK` | [ ] | [ ] |
| 1.2 | Read the `content-type` header of the same response | It is `application/json` | [ ] | [ ] |
| 1.3 | Read the response body | A JSON object with exactly two keys, `version` and `commit`, both quoted strings, and nothing else | [ ] | [ ] |
| 1.4 | Compare `version` with `[project].version` in `backend/pyproject.toml` | They are equal | [ ] | [ ] |

## Criterion 2: commit comes from BUILD_COMMIT, default unknown, never typed into the router

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | With `BUILD_COMMIT` still unset, run `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] | [ ] |
| 2.2 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend`, wait until `docker compose ps` shows the backend running, then repeat the curl | `commit` is `0123456789ab`, the first 12 characters | [ ] | [ ] |
| 2.3 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, wait for it, then repeat the curl | `commit` is `abc1234`, unchanged because it is shorter than 12 characters | [ ] | [ ] |
| 2.4 | Run `BUILD_COMMIT= docker compose up -d backend` (blank), wait for it, then repeat the curl | `commit` is `unknown` | [ ] | [ ] |
| 2.5 | Run `grep -rn BUILD_COMMIT backend/app` | Every hit is in `backend/app/core/config.py` | [ ] | [ ] |
| 2.6 | Open `backend/app/routers/version.py` | It holds no commit literal and calls `get_build_commit()` | [ ] | [ ] |
| 2.7 | Run `docker compose up -d backend` with `BUILD_COMMIT` unset to restore the default, then repeat the curl | `commit` is `unknown` again | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `backend/app/schemas/version.py` | It defines `class VersionResponse(BaseModel)` with `version: str` and `commit: str` | [ ] | [ ] |
| 3.2 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is named `VersionResponse`, with the two string fields `version` and `commit` | [ ] | [ ] |
| 3.3 | Run `curl -i -X POST http://localhost:8010/api/version` | The status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | From the repository root run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports `0 failed` and no skipped tests | [ ] | [ ] |
| 4.2 | Open `backend/tests/unit/test_version_service_unit.py` | It has a test for `BUILD_COMMIT` set to a 40-character sha (expects its first 12 characters) and one for `BUILD_COMMIT` unset (expects `unknown`) | [ ] | [ ] |
| 4.3 | Open `backend/tests/integration/test_version_integration.py` | It has the same two cases through the HTTP cycle | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `version` and `commit` strings | 1.1 to 1.4 | [ ] Pass  [ ] Fail |
| 2. `commit` from `BUILD_COMMIT`, default `unknown` | 2.1 to 2.7 | [ ] Pass  [ ] Fail |
| 3. Pydantic schema in `backend/app/schemas/` | 3.1 to 3.3 | [ ] Pass  [ ] Fail |
| 4. Tests cover set and unset paths | 4.1 to 4.3 | [ ] Pass  [ ] Fail |

Overall: [ ] Pass  [ ] Fail

Tester: ______________  Date: ______________
