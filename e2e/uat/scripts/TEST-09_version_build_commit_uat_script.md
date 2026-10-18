# UAT Script: TEST-09 Version endpoint reports the build commit

Backend-only feature: no screen shows the commit, so every check is a terminal `curl`, a browser address bar, or a file read. Port 8011 is used so the check does not collide with a compose stack already on 8010.

## Prerequisites

- A terminal at the repository root on branch `feature/TEST-09-version-build-commit` (or `main` once merged).
- `uv` installed and backend dependencies synced (`uv sync --directory backend`).
- Nothing listening on port 8011.
- `BUILD_COMMIT` not set in the shell (run `unset BUILD_COMMIT`).
- Start the server wherever a step says "start the server" with `uv run --directory backend uvicorn app.main:create_app --factory --port 8011`. The log ends with `Uvicorn running on http://127.0.0.1:8011`; a warning that DATABASE_URL is not set is expected and harmless. Query it from a second terminal; stop it with Ctrl+C.

## Criterion 1: GET /api/version returns 200 with a string version and a string commit

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | With `BUILD_COMMIT` unset, start the server | Log ends with `Uvicorn running on http://127.0.0.1:8011` | [ ] | [ ] |
| 1.2 | In a second terminal run `curl -i http://localhost:8011/api/version` | Status line reads `HTTP/1.1 200 OK` | [ ] | [ ] |
| 1.3 | Read the body under the headers | A JSON object with exactly two keys: `version` with the value `0.1.0` (the `[project].version` of backend/pyproject.toml) and `commit` with a string value | [ ] | [ ] |
| 1.4 | Stop the server with Ctrl+C | Server exits | [ ] | [ ] |

## Criterion 2: commit comes from BUILD_COMMIT, default unknown, first 12 characters of a longer value

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | With `BUILD_COMMIT` unset, start the server and run `curl -s http://localhost:8011/api/version`, then stop the server | `commit` is `unknown` | [ ] | [ ] |
| 2.2 | Run `export BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` (40 characters, the shape CI passes in), start the server again, run the same curl, then stop the server | `commit` is `0123456789ab` (its first 12 characters), not the full sha | [ ] | [ ] |
| 2.3 | Run `export BUILD_COMMIT=abc1234` (7 characters), start the server again, run the same curl, then stop the server | `commit` is `abc1234`, unchanged | [ ] | [ ] |
| 2.4 | Run `export BUILD_COMMIT="   "` (blank), start the server again, run the same curl, stop the server, then run `unset BUILD_COMMIT` | `commit` is `unknown` | [ ] | [ ] |
| 2.5 | Open `backend/app/routers/version.py` | The commit value is passed in from `get_build_commit()`; no commit string is typed into the router | [ ] | [ ] |
| 2.6 | Open `docker-compose.yml` | The backend service `environment:` lists `BUILD_COMMIT` with the default `unknown` | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `backend/app/schemas/version.py` | `VersionResponse` is a Pydantic `BaseModel` with exactly two fields, `version: str` and `commit: str` | [ ] | [ ] |
| 3.2 | Open `backend/app/routers/version.py` | The route is declared with `response_model=VersionResponse` and returns a `VersionResponse` | [ ] | [ ] |
| 3.3 | Start the server as in step 1.1, open `http://localhost:8011/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with `version` and `commit`, both strings. Stop the server afterwards | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | With `BUILD_COMMIT` unset, run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports `0 failed` | [ ] | [ ] |
| 4.2 | Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` | Each has a test that sets `BUILD_COMMIT` (including a 40-character sha that comes back as its first 12 characters) and a test that deletes it and expects `unknown` | [ ] | [ ] |

## Additional checks (edge cases)

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| E.1 | With the server running, run `curl -i -X POST http://localhost:8011/api/version` | `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. 200 with version and commit strings | 1.1 to 1.4 | [ ] Pass  [ ] Fail |
| 2. commit from BUILD_COMMIT, default unknown, 12 characters | 2.1 to 2.6 | [ ] Pass  [ ] Fail |
| 3. Pydantic response schema | 3.1 to 3.3 | [ ] Pass  [ ] Fail |
| 4. Tests cover set and unset paths | 4.1 to 4.2 | [ ] Pass  [ ] Fail |
| Edge cases | E.1 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
