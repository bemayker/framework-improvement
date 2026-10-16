# UAT Script: TEST-09 Version endpoint reports the build commit

No screen of the task-notes app calls this endpoint, so every criterion is verified against the HTTP response itself (curl or the interactive docs at http://localhost:8010/docs) or against the code and the test runner.

## Prerequisites

- On branch `feature/TEST-09-version-build-commit` (or `main` once merged).
- Docker running, and a terminal with `curl` and `uv` installed.
- The backend answers on http://localhost:8010 (docker-compose.yml publishes 8010).
- Start from a stack built without a commit: from the repository root run `docker compose build backend` and `docker compose up -d backend` with `BUILD_COMMIT` not exported.

## Criterion 1: GET /api/version returns 200 with JSON fields version and commit

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i -s http://localhost:8010/api/version` | The first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers | [ ] | [ ] |
| 1.2 | Run `curl -s http://localhost:8010/api/version` | A JSON object with exactly two keys: `version` (the value of `[project].version` in `backend/pyproject.toml`, quoted as a string) and `commit` (a quoted string) | [ ] | [ ] |

## Criterion 2: commit comes from BUILD_COMMIT, default unknown, cut to 12 characters

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | With no `BUILD_COMMIT` exported, run `docker compose build backend`, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] | [ ] |
| 2.2 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose build backend`, then `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `0123456789ab` (the first 12 of the 40 characters); `version` is unchanged | [ ] | [ ] |
| 2.3 | Run `BUILD_COMMIT=abc1234 docker compose build backend`, then `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` (shorter than 12, returned whole) | [ ] | [ ] |
| 2.4 | Open `backend/app/routers/version.py` | It contains no commit literal; the value arrives through `get_build_commit()` in `backend/app/services/version_service.py`, which reads `get_settings().build_commit` | [ ] | [ ] |
| 2.5 | Rebuild without `BUILD_COMMIT` (step 2.1 again) | The local stack is back to `commit` `unknown` | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/

This is a code-structure property with no UI behaviour; the observable checks are the module and the OpenAPI document.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] | [ ] |
| 3.2 | Open http://localhost:8010/docs in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with the string properties `version` and `commit` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports `0 failed` | [ ] | [ ] |
| 4.2 | Read the test names in those three files | At least one test sets `BUILD_COMMIT` (including a 40-character value) and at least one unsets it, in both the unit files and the integration file | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|-----------|-------|--------|--------|
| 1. Version returns 200 with version and commit | 1.1 to 1.2 | | |
| 2. commit from BUILD_COMMIT, default unknown, 12 characters | 2.1 to 2.5 | | |
| 3. Pydantic response schema | 3.1 to 3.2 | | |
| 4. Tests cover set and unset paths | 4.1 to 4.2 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
