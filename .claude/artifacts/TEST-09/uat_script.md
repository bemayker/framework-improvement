# UAT script, TEST-09: Version endpoint reports the build commit

Every criterion here is API or configuration behaviour with no UI. Each check observes an HTTP response, a source file or a test run.

## Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the repository checked out on the feature branch, uv installed, no process listening on port 8010.
1. In a terminal at the repository root, run `BUILD_COMMIT=3f9c2ab71d04e5a6b7c8d9e0f1a2b3c4d5e6f708 uv run --directory backend uvicorn app.main:app --port 8010`. Expected: the log ends with `Uvicorn running on http://127.0.0.1:8010` (a warning that DATABASE_URL is unset is expected and harmless).
2. In a second terminal, run `curl -i http://localhost:8010/api/version`. Expected: the status line reads `HTTP/1.1 200 OK` and the body is `{"version":"0.1.0","commit":"3f9c2ab71d04"}` (the version is whatever `backend/pyproject.toml` declares under `[project].version`).

## Criterion 2: `commit` comes from one declared source (env var, default `"unknown"`), never a string typed into the router
Prerequisites: the server from Criterion 1 stopped (Ctrl+C).
1. Run `uv run --directory backend uvicorn app.main:app --port 8010` with no `BUILD_COMMIT` set in the shell (`unset BUILD_COMMIT` first). Expected: the server starts.
2. Run `curl -s http://localhost:8010/api/version`. Expected: the body's `commit` is `"unknown"`.
3. Stop the server and start it again with `BUILD_COMMIT=abc123` in front of the same command, then repeat the curl. Expected: `commit` is `"abc123"` (fewer than 12 characters, returned unchanged).
4. Stop the server and start it again with `BUILD_COMMIT="   "` in front of the command, then repeat the curl. Expected: `commit` is `"unknown"` (blank is treated as unset).
5. Open `backend/app/routers/version.py`. Expected: the `commit` value comes from `get_build_commit()` and the file contains no commit string literal.

## Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the server running as in Criterion 1 step 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version`. Expected: the 200 response schema is `VersionResponse` with `version` (string) and `commit` (string), both required.
2. Open `backend/app/schemas/version.py`. Expected: `VersionResponse` declares `version: str` and `commit: str`.

## Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL instance reachable through `DATABASE_URL` (the conftest fails the integration tier in CI and skips it locally without one).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py`. Expected: the summary line reports no failed or errored test and the command exits 0.
2. Re-run step 1 with `-v` instead of `-q`. Expected: `test_get_build_commit_returns_configured_commit`, `test_get_build_commit_returns_unknown_when_unset`, `test_get_version_reports_commit_from_build_commit_env` and `test_get_version_reports_unknown_commit_when_build_commit_unset` are each reported PASSED.
