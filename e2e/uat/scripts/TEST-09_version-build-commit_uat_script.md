# UAT Script: TEST-09 Version endpoint reports the build commit

No criterion is verifiable through the UI: the endpoint has no frontend in this feature, so the observable check is the HTTP response, read with `curl`.

## Prerequisites

- Repository checked out on branch `feature/TEST-09-version-build-commit`.
- `uv` installed; nothing listening on host port `8010`.
- `BUILD_COMMIT` not set in your shell.
- A terminal with `curl`, and a second terminal for the server.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | At the repository root run `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` | The log shows `Uvicorn running on http://127.0.0.1:8010` (a warning that `DATABASE_URL` is not set is expected and harmless) | [ ] Pass [ ] Fail |
| 2 | In the second terminal run `curl -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK`, header `content-type: application/json` | [ ] Pass [ ] Fail |
| 3 | Read the body | Exactly `{"version":"0.1.0","commit":"unknown"}` (`version` is `[project].version` in `backend/pyproject.toml`; both values are strings) | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters

Prerequisite: stop the server from Criterion 1 (Ctrl+C).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Start the server with `BUILD_COMMIT=3f9c2a1b7d4e8f60a1b2c3d4e5f60718293a4b5c uv run --directory backend uvicorn app.main:create_app --factory --port 8010` | The server starts | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | `{"version":"0.1.0","commit":"3f9c2a1b7d4e"}`: the first 12 characters of the 40-character sha (edge case: truncation) | [ ] Pass [ ] Fail |
| 6 | Stop the server, restart with `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, run the same curl | `"commit":"abc1234"` (12 or fewer characters come back unchanged) | [ ] Pass [ ] Fail |
| 7 | Stop the server, restart with `BUILD_COMMIT= uv run --directory backend uvicorn app.main:create_app --factory --port 8010` (blank), run the same curl | `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisite: a server running (any `BUILD_COMMIT`).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 10 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` | The 200 response schema is `VersionResponse` with the two string properties `version` and `commit` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line shows `0 failed` | [ ] Pass [ ] Fail |
| 12 | Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` | Each has a test that sets `BUILD_COMMIT` (asserting the first 12 characters of a 40-character sha) and a test with it unset (asserting `unknown`) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
