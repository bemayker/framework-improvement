# UAT Script: TEST-09 Version endpoint reports the build commit

`GET /api/version` returns the backend version and the commit the image was built from. The commit comes from the `BUILD_COMMIT` environment variable set at build time, defaults to `unknown`, and is cut to its first 12 characters. This feature has no UI, so every step is checked with `curl`, the OpenAPI document, the source files and the test suite. Run every command from the repository root.

## Prerequisites

- Docker is running, and `uv` is installed.
- Repository checked out on `feature/TEST-09-version-build-commit`.
- No `BUILD_COMMIT` exported in your shell.
- The backend is published on `http://localhost:8010` (the `docker-compose.yml` mapping `8010:8010`).
- A terminal with `curl`.

## Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `docker compose up -d --build backend` | The `backend` container is up (`docker compose ps` shows it running) | [ ] | [ ] |
| 1.2 | Run `curl -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK`, header `content-type: application/json`, and a body with exactly two keys, `version` (the `[project].version` value in `backend/pyproject.toml`) and `commit`, both strings | [ ] | [ ] |
| 1.3 | Run `curl -i -X POST http://localhost:8010/api/version` | `405 Method Not Allowed` | [ ] | [ ] |

## Criterion 2: `commit` comes from `BUILD_COMMIT` set at build time, default `unknown`, first 12 characters only

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend` | The backend is rebuilt and running | [ ] | [ ] |
| 2.2 | Run `curl -s http://localhost:8010/api/version` | `"commit":"0123456789ab"` (12 characters, the sha's prefix) | [ ] | [ ] |
| 2.3 | Run `BUILD_COMMIT=abc1234 docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `"commit":"abc1234"` (shorter than 12, unchanged) | [ ] | [ ] |
| 2.4 | Run `BUILD_COMMIT=0123456789ab docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `"commit":"0123456789ab"` (exactly 12, unchanged) | [ ] | [ ] |
| 2.5 | Run `docker compose up -d --build backend` with no `BUILD_COMMIT` set, then `curl -s http://localhost:8010/api/version` | `"commit":"unknown"` | [ ] | [ ] |
| 2.6 | Open `backend/app/routers/version.py` | The commit comes from `get_build_commit()`; the file contains no commit string literal | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] | [ ] |
| 3.2 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with `version` and `commit`, both `string`, both required | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary reads `0 failed` | [ ] | [ ] |
| 4.2 | Read the test names in those three files | At least one test sets `BUILD_COMMIT` (a 40-character sha) and at least one unsets it, in both the unit and the integration file | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with `version` and `commit` | 1.1 to 1.3 | | |
| 2. `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | 2.1 to 2.6 | | |
| 3. Response defined by a Pydantic schema | 3.1 to 3.2 | | |
| 4. Tests cover set and unset paths | 4.1 to 4.2 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
