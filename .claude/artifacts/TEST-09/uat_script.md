# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI. Every criterion is verified through the HTTP endpoint and the test suite, from a terminal at the repository root, with `curl` against the backend on port 8010.

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- `uv` installed, and nothing else listening on port `8010`.
- A terminal with `curl`; a browser for step 11.
- Step 12 only: the run's PostgreSQL reachable, with `DATABASE_URL` pointing at it (CLAUDE.md Backing Services).
- A `DATABASE_URL is not set` warning when the server starts is expected and harmless.

## Steps

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In terminal 1 run `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` | The log shows `Uvicorn running on http://127.0.0.1:8010` | [ ] Pass [ ] Fail |
| 2 | In terminal 2 run `curl -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK`; body is a JSON object with string keys `version` (`"0.1.0"`) and `commit` | [ ] Pass [ ] Fail |
| 3 | Stop the server with Ctrl+C | Server stops | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters when longer

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Start the server with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:create_app --factory --port 8010` | Server starts | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | Body is `{"version":"0.1.0","commit":"0123456789ab"}`: exactly the first 12 characters | [ ] Pass [ ] Fail |
| 6 | Stop the server, restart it with `BUILD_COMMIT=abc1234` in front of the same command, and repeat the curl | `"commit":"abc1234"`: a value of 12 characters or fewer is returned unchanged | [ ] Pass [ ] Fail |
| 7 | Stop the server, start it with no `BUILD_COMMIT` (plain command from step 1, in a shell where `echo $BUILD_COMMIT` prints an empty line), and repeat the curl | `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/version.py` | It contains no commit string literal; the value comes from `get_build_commit()` in `backend/app/services/version_service.py`, which reads `BUILD_COMMIT` through `backend/app/core/config.py` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/version.py` | `VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/routers/version.py` | The route declares `response_model=VersionResponse` and returns a `VersionResponse` | [ ] Pass [ ] Fail |
| 11 | With the server running (step 1 command), open `http://localhost:8010/docs` and expand `GET /api/version` | The 200 response schema shows `VersionResponse` with fields `version` and `commit`, both strings | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Stop the server. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |
| 13 | Read the test names in those three files | Each of the three files has at least one case with `BUILD_COMMIT` set and one with it unset | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
