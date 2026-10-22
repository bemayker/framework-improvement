# UAT Script: TEST-09 Version endpoint reports the build commit

`GET /api/version` reports the package version and the commit the build was made from. No UI consumes the endpoint yet (TEST-10 will), so every step is checked with `curl`, the OpenAPI document and the test suite against the running backend.

## Prerequisites

- Docker is running.
- Repository checked out on `feature/TEST-09-version-build-commit`.
- From the repository root, `docker compose up -d --build` has been run with no `BUILD_COMMIT` in the shell and none in `.env`, and `docker compose ps` shows the `backend` service running, published on `http://localhost:8010`.
- A terminal with `curl` and `uv`.

## Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/version` | Prints `200` | [ ] | [ ] |
| 1.2 | Run `curl -s http://localhost:8010/api/version` | One JSON object with exactly two keys: `version` (`"0.1.0"`, the value in `backend/pyproject.toml`) and `commit` (a string) | [ ] | [ ] |

## Criterion 2: `commit` comes from one declared source, default `"unknown"`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] | [ ] |
| 2.2 | Restart the backend with a short value: `BUILD_COMMIT=abc1234 docker compose up -d backend` | The container is recreated | [ ] | [ ] |
| 2.3 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"abc1234"`, proving the value comes from the environment | [ ] | [ ] |
| 2.4 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` | [ ] | [ ] |
| 2.5 | Restore: run `docker compose up -d backend` with `BUILD_COMMIT` unset, then `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` again | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open http://localhost:8010/docs in a browser and find `GET /api/version` | The operation is listed | [ ] | [ ] |
| 3.2 | Expand it and look at the 200 response schema | It is `VersionResponse` with `version` (string) and `commit` (string) | [ ] | [ ] |
| 3.3 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `docker compose up -d db`, then from the repository root `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The run ends with `0 failed` | [ ] | [ ] |
| 4.2 | Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/unit/test_config_unit.py` | A set-value test (`test_settings_build_commit_reads_the_environment_value`) and an unset test (`test_get_build_commit_returns_unknown_when_unset`, `test_settings_build_commit_defaults_to_unknown_when_unset`) exist | [ ] | [ ] |
| 4.3 | Open `backend/tests/integration/test_version_integration.py` | It contains `test_get_version_returns_first_twelve_characters_of_a_full_sha` (set) and `test_get_version_returns_unknown_commit_when_build_commit_is_unset` (unset) | [ ] | [ ] |

## Criterion 5: when `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 5.1 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` | The container is recreated | [ ] | [ ] |
| 5.2 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"0123456789ab"` (12 characters) | [ ] | [ ] |
| 5.3 | Edge case: run `BUILD_COMMIT=0123456789ab docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"0123456789ab"`, unchanged | [ ] | [ ] |
| 5.4 | Restore: run `docker compose up -d backend` with `BUILD_COMMIT` unset, then `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with `version` and `commit` | 1.1 to 1.2 | | |
| 2. One declared source, default `unknown` | 2.1 to 2.5 | | |
| 3. Response defined by a Pydantic schema | 3.1 to 3.3 | | |
| 4. Tests cover set and unset paths | 4.1 to 4.3 | | |
| 5. Truncation to 12 characters | 5.1 to 5.4 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
