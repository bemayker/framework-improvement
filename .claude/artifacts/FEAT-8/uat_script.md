# UAT Script: FEAT-8 GET /api/version returns a JSON version

`GET /api/version` answers 200 with a JSON body whose `version` member is `1.0`. The existing `commit` member stays in the body. The value comes from `[project].version` in `backend/pyproject.toml`. Run every command from the repository root.

## Prerequisites

- Docker is running, and `uv` is installed.
- Repository checked out on `feature/FEAT-8-api-version-json-version`.
- The stack is up with `docker compose up -d --build` (backend on port 8010, frontend on port 5183); no environment variables set.
- Backend dependencies installed through uv (`uv sync --directory backend`).
- A terminal with `curl` and a browser.

## Criterion 1: GET /api/version answers 200 with version "1.0"

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK`, header `content-type: application/json`, body `{"version":"1.0","commit":"unknown"}` (the `commit` value is the `BUILD_COMMIT` the image was built with, cut to 12 characters, or `unknown`) | [ ] | [ ] |
| 1.2 | Run `curl -i -X POST http://localhost:8010/api/version` | `405 Method Not Allowed` | [ ] | [ ] |
| 1.3 | Open `http://localhost:5183/` in a browser and look at the footer (`data-testid="app-footer"`) | It reads `Task Notes v1.0`, followed by a short commit in parentheses only when `BUILD_COMMIT` was set | [ ] | [ ] |

## Criterion 2: One pytest test for the endpoint passes

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `uv run --directory backend pytest -q -v tests/integration/test_version_integration.py` | The summary reads `0 failed`, and `test_get_version_returns_200_with_version_1_0` is listed as PASSED | [ ] | [ ] |
| 2.2 | Run the configured gate, `uv run --directory backend pytest -q && npm --prefix frontend test` | Both suites report `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with version "1.0" | 1.1 to 1.3 | | |
| 2. One pytest test passes | 2.1 to 2.2 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
