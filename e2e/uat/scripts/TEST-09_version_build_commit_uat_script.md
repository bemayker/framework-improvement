# UAT Script: TEST-09 Version endpoint reports the build commit

Backend-only feature: every check uses the browser address bar or a terminal HTTP client against the running backend (http://localhost:8010).

Prerequisites (all criteria):
- Docker running; terminal at the repository root.
- No `BUILD_COMMIT` exported in the shell, unless a step says otherwise.
- Stack started with `docker compose up -d` (backend on http://localhost:8010).

## Criterion 1: `GET /api/version` returns 200 with `version` and `commit` strings

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Open `http://localhost:8010/api/version` in a browser | JSON body with exactly two keys, `version` and `commit` | [ ] | [ ] |
| 1.2 | Open dev tools, Network tab, reload the URL | Status `200`, content type `application/json` | [ ] | [ ] |
| 1.3 | Read the body | `version` equals `[project].version` in `backend/pyproject.toml` (for example `0.1.0`); `commit` is a non-empty string | [ ] | [ ] |

## Criterion 2: `commit` comes from `BUILD_COMMIT` at build time, default `"unknown"`

Prerequisites: no `BUILD_COMMIT` exported in the shell.

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `docker compose build backend`, then `docker compose up -d backend` | Backend container starts | [ ] | [ ] |
| 2.2 | Open `http://localhost:8010/api/version` | `commit` reads `unknown` | [ ] | [ ] |
| 2.3 | Run `export BUILD_COMMIT=3f9c2a1`, then `docker compose build backend` and `docker compose up -d --force-recreate backend` | Backend rebuilt and restarted | [ ] | [ ] |
| 2.4 | Reload `http://localhost:8010/api/version` | `commit` reads `3f9c2a1`; `version` unchanged from step 2.2 | [ ] | [ ] |
| 2.5 | Run `unset BUILD_COMMIT`, rebuild and recreate the backend as in step 2.3, reload the URL | `commit` is back to `unknown` | [ ] | [ ] |
| 2.6 | Open `backend/app/routers/version.py` | No commit string appears in the file; the value comes from `get_build_commit()` | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: backend running as above.

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `http://localhost:8010/docs` | Swagger UI lists `GET /api/version` | [ ] | [ ] |
| 3.2 | Expand `GET /api/version`, select the 200 response's Schema tab | Schema named `VersionResponse` with `version` (string, required) and `commit` (string, required) | [ ] | [ ] |
| 3.3 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the set and unset commit paths

Prerequisites: `uv` installed; the dev database reachable (`docker compose up -d db`).

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` | All tests pass, including the commit set, unset and empty cases | [ ] | [ ] |
| 4.2 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | All tests pass, including one asserting `commit` equals the set `BUILD_COMMIT` and one asserting `"unknown"` when unset | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with `version` and `commit` | 1.1 to 1.3 | | |
| 2. Commit from `BUILD_COMMIT`, default `unknown` | 2.1 to 2.6 | | |
| 3. Pydantic schema | 3.1 to 3.3 | | |
| 4. Tests cover set and unset | 4.1 to 4.2 | | |

Overall result: [ ] Pass  [ ] Fail

Tester: ____________  Date: ____________
