# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion is verifiable through the UI: this is a backend endpoint no screen reads yet. Every walkthrough is a terminal session against the running backend on `http://localhost:8010`.

## Prerequisites
- Docker running; commands run from the repository root.
- `uv` installed (Criterion 4 only; no database needed for those test files).
- `BUILD_COMMIT` not exported in the shell before Criterion 1.

## Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `docker compose up -d --build backend` | The `db` and `backend` containers start; `docker compose ps` shows `backend` up on port 8010 | [ ] | [ ] |
| 1.2 | Run `curl -i http://localhost:8010/api/version` | Status line reads `HTTP/1.1 200 OK` and `content-type: application/json` | [ ] | [ ] |
| 1.3 | Read the body | It is `{"version":"0.1.0","commit":"unknown"}` (`version` is whatever `backend/pyproject.toml` `[project].version` says); both values are strings | [ ] | [ ] |

## Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `export BUILD_COMMIT=81e1e8fa4bd74ad5b468f0d1aa5a2cd63e71b393` then `docker compose up -d --build backend` | The backend image rebuilds and the container restarts | [ ] | [ ] |
| 2.2 | Run `curl -s http://localhost:8010/api/version` | `commit` is `81e1e8fa4bd7` (exactly 12 characters, the sha's first 12) | [ ] | [ ] |
| 2.3 | Run `export BUILD_COMMIT=abc1234` then `docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `abc1234` (unchanged, under 12 characters) | [ ] | [ ] |
| 2.4 | Run `unset BUILD_COMMIT` then `docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] | [ ] |
| 2.5 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` | [ ] | [ ] |

## Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] | [ ] |
| 3.2 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with the two string fields `version` and `commit` | [ ] | [ ] |
| 3.3 | Run `curl -s http://localhost:8010/api/version` | The body has exactly those two keys and no others | [ ] | [ ] |

## Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` | `0 failed`; the `get_build_commit` and `build_commit` tests for the set, unset, blank and truncation cases are among those run | [ ] | [ ] |
| 4.2 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | `0 failed`; the set-path (40-char sha in, 12 out) and unset-path (`"unknown"`) tests are among those run | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `version` and `commit` strings | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. `commit` from `BUILD_COMMIT`, default `unknown`, 12-char cap | 2.1 to 2.5 | [ ] Pass  [ ] Fail |
| 3. Pydantic schema defines the body | 3.1 to 3.3 | [ ] Pass  [ ] Fail |
| 4. Tests cover set and unset paths | 4.1 to 4.2 | [ ] Pass  [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass  [ ] Fail
