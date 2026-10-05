# UAT Script: TEST-09 Version endpoint reports the build commit

Backend only: there is no UI (the footer that shows the commit is TEST-10). Every check is an HTTP request read in a terminal. Run commands from the repository root. Mark each step Pass or Fail.

## Prerequisites

- Docker running; stack built and started with `docker compose up -d --build`.
- `BUILD_COMMIT` not exported in the shell you start from.
- `curl` and `uv` installed.
- The API is served on `http://localhost:8010`.

## Criterion 1: `GET /api/version` returns 200 with `version` and `commit`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -s -i http://localhost:8010/api/version` | Status line is `HTTP/1.1 200 OK` and `content-type: application/json` | [ ] | [ ] |
| 1.2 | Read the body | Exactly two keys, `version` and `commit`, both strings: `{"version": "0.1.0", "commit": "unknown"}` (version is `[project].version` in `backend/pyproject.toml`) | [ ] | [ ] |
| 1.3 | Run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/version` | Prints `405` | [ ] | [ ] |

## Criterion 2: `commit` comes from the build-time `BUILD_COMMIT`, default "unknown", first 12 characters

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `unset BUILD_COMMIT`, then `docker compose build backend` and `docker compose up -d backend` | Backend container restarts | [ ] | [ ] |
| 2.2 | Run `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] | [ ] |
| 2.3 | Run `export BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` (40 characters), then `docker compose build backend` and `docker compose up -d backend` | Backend container restarts | [ ] | [ ] |
| 2.4 | Run `curl -s http://localhost:8010/api/version` | `{"version": "0.1.0", "commit": "0123456789ab"}` (first 12 characters only) | [ ] | [ ] |
| 2.5 | Run `export BUILD_COMMIT=abc1234`, rebuild and restart as in 2.3, then curl again | `commit` is `"abc1234"` (shorter values are unchanged) | [ ] | [ ] |
| 2.6 | Run `docker compose exec backend printenv BUILD_COMMIT` | Prints `abc1234`, the value baked in at build time | [ ] | [ ] |
| 2.7 | Open `backend/app/routers/version.py` | `commit` is passed as `get_build_commit()`; no sha or `"unknown"` literal appears in the router | [ ] | [ ] |
| 2.8 | Run `unset BUILD_COMMIT`, rebuild and restart the backend | Stack is back in its default state (`commit` is `"unknown"`) | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] | [ ] |
| 3.2 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with `version` and `commit`, both required strings | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

Extra prerequisite: a database for the integration tier per CLAUDE.md Backing Services (the version tests themselves need none).

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_unit.py` | All pass, including the build-commit set, unset and blank cases | [ ] | [ ] |
| 4.2 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | All pass, including the 40-character set path (`commit` is 12 characters) and the unset path (`commit` is `"unknown"`) | [ ] | [ ] |
| 4.3 | Run `uv run --directory backend pytest -q -k build_commit` | Collected count is greater than zero and every selected test passes | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed | Result |
|---|---|---|---|---|
| 1. Endpoint returns 200 with `version` and `commit` | 1.1 - 1.3 | | | |
| 2. `commit` from build-time `BUILD_COMMIT` | 2.1 - 2.8 | | | |
| 3. Pydantic schema | 3.1 - 3.2 | | | |
| 4. Set and unset paths tested | 4.1 - 4.3 | | | |

Tester: ______________  Date: ______________  Overall result: [ ] Pass  [ ] Fail

Notes: steps are carried through unchanged from the plan's Manual verification plan; the implementation needed no corrections to them (port 8010 and the `BUILD_COMMIT` build arg match `docker-compose.yml`).
