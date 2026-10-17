# UAT Script: TEST-09 Version endpoint reports the build commit

No screen shows the commit yet (the footer that does is TEST-10), so each block verifies through the browser address bar or a terminal against the running backend on port 8010. The commit comes from the `BUILD_COMMIT` environment variable, defaults to `unknown`, and a value longer than 12 characters is returned as its first 12 (tracker clarification on criterion 2).

## Prerequisites

- Docker and Docker Compose running.
- Repository on branch `feature/TEST-09-version-build-commit`.
- From the repository root, the stack started with `BUILD_COMMIT` unset: run `docker compose up -d --build --force-recreate backend`, then wait until `docker compose ps` shows the `backend` service running.
- The backend answers on `http://localhost:8010` (the host port `docker-compose.yml` publishes).
- A browser; a terminal at the repository root.

## Criterion 1: GET /api/version returns 200 with version and commit strings

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Open `http://localhost:8010/api/version` in a browser | The page shows a JSON object with exactly two fields, `version` and `commit`, both text values | [ ] | [ ] |
| 1.2 | Open the browser developer tools Network tab and reload the page | The request to `/api/version` shows status 200 | [ ] | [ ] |

## Criterion 2: commit comes from BUILD_COMMIT, default unknown, first 12 characters when longer

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | With `BUILD_COMMIT` unset (as started in the prerequisites), open `http://localhost:8010/api/version` | `commit` reads `unknown` | [ ] | [ ] |
| 2.2 | In a terminal at the repository root run `BUILD_COMMIT=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b docker compose up -d --force-recreate backend`, wait for the container to report healthy, then reload `http://localhost:8010/api/version` | `commit` reads `1a2b3c4d5e6f` (the first 12 of the 40 characters) and `version` is unchanged from step 2.1 | [ ] | [ ] |
| 2.3 | Run `BUILD_COMMIT=abc123 docker compose up -d --force-recreate backend`, wait for the container to report healthy, and reload the page | `commit` reads `abc123` (12 characters or fewer, returned unchanged) | [ ] | [ ] |
| 2.4 | Run `BUILD_COMMIT=" " docker compose up -d --force-recreate backend`, wait for the container to report healthy, and reload the page | `commit` reads `unknown` (blank is treated as unset) | [ ] | [ ] |
| 2.5 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is named `VersionResponse` and lists `version` and `commit`, both strings, both marked required | [ ] | [ ] |
| 3.2 | Open `backend/app/schemas/version.py` | `VersionResponse` declares `version: str` and `commit: str` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

Prerequisite for this block: the database from `docker compose up -d db` is reachable on localhost port 5442.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` | The summary line reports `0 failed`; run with `-v` to see tests for `BUILD_COMMIT` set, unset and blank | [ ] | [ ] |
| 4.2 | Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/integration/test_version_integration.py` | The summary line reports `0 failed`; run with `-v` to see tests for `BUILD_COMMIT` set to a 40-character sha and unset | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `version` and `commit` | 1.1 to 1.2 | [ ] Pass  [ ] Fail |
| 2. `commit` from `BUILD_COMMIT`, default `unknown`, first 12 characters | 2.1 to 2.5 | [ ] Pass  [ ] Fail |
| 3. Pydantic schema in `backend/app/schemas/` | 3.1 to 3.2 | [ ] Pass  [ ] Fail |
| 4. Unit and integration tests cover set and unset paths | 4.1 to 4.2 | [ ] Pass  [ ] Fail |

Overall: [ ] Pass  [ ] Fail

Tester: ______________  Date: ______________
