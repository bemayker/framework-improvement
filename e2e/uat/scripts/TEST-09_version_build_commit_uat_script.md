# UAT script, TEST-09: Version endpoint reports the build commit

Backend only: no criterion is verifiable through the UI, so each check is an HTTP response read with curl, a source read, or a test run.

## Prerequisites
- Docker running; commands run from the repository root.
- The stack is up with `docker compose up -d --build`, the backend published at `http://localhost:8010` and the database at host port 5442.
- `BUILD_COMMIT` is not set in your shell for Criterion 1.
- `uv` is installed for Criterion 4.

## Criterion 1: GET /api/version returns 200 with version and commit

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -s -i http://localhost:8010/api/version` | Status line reads `HTTP/1.1 200 OK` and the body is `{"version":"0.1.0","commit":"unknown"}` (`version` is whatever `[project].version` in `backend/pyproject.toml` says) | [ ] | [ ] |
| 1.2 | Run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/version` | Prints `405` | [ ] | [ ] |

## Criterion 2: commit comes from BUILD_COMMIT, default "unknown", first 12 characters only

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` | The backend container is recreated | [ ] | [ ] |
| 2.2 | Run `curl -s http://localhost:8010/api/version` | `commit` is exactly `0123456789ab` (12 characters, not the full 40) | [ ] | [ ] |
| 2.3 | Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234`, unchanged | [ ] | [ ] |
| 2.4 | Run `BUILD_COMMIT= docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] | [ ] |
| 2.5 | Open `backend/app/routers/version.py` | It contains no quoted commit value; `commit` comes from `get_build_commit()` | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with `version` (string) and `commit` (string), both required | [ ] | [ ] |
| 3.2 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] | [ ] |
| 4.2 | Re-run the same command with `-v` and read the test names | They include `test_get_build_commit_returns_value_when_set`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_commit_from_build_commit_env` and `test_get_version_returns_unknown_commit_when_build_commit_unset`, each reported as passed | [ ] | [ ] |

Correction against the plan: the plan's Criterion 4 prerequisite asked for a reachable PostgreSQL and a `DATABASE_URL` export. The built version endpoint needs no database (Phase B ran these tests with none), so both are dropped from step 4.1.

## Summary

| Criterion | Steps | Passed | Failed | Notes |
|---|---|---|---|---|
| 1. 200 with version and commit | 1.1, 1.2 | | | |
| 2. commit from BUILD_COMMIT, first 12 characters | 2.1 to 2.5 | | | |
| 3. Pydantic schema | 3.1, 3.2 | | | |
| 4. Tests cover set and unset paths | 4.1, 4.2 | | | |

Overall result: [ ] Pass  [ ] Fail

Tester: ____________  Date: ____________
