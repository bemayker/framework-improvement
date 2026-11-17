# UAT Script, TEST-09: Version endpoint reports the build commit

This feature has no UI. Every criterion is verified against the running API with curl, or by running the named tests. Run all commands from the repository root.

Result legend: record PASS or FAIL beside each step.

## Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
Prerequisites: backend dependencies installed (`uv sync --directory backend`); port 8010 free; no database needed.

1. Start the API without a commit: `uv run --directory backend uvicorn app.main:create_app --factory --port 8010`.
   Expected: the log shows `Uvicorn running on http://127.0.0.1:8010` (a warning about DATABASE_URL is expected and harmless). [ ]
2. In a second terminal run `curl -i http://localhost:8010/api/version`.
   Expected: status line `HTTP/1.1 200 OK`, `content-type: application/json`, and body `{"version":"0.1.0","commit":"unknown"}` (version is whatever `backend/pyproject.toml` declares). [ ]
3. Stop the server with Ctrl+C. [ ]

## Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters when longer
Prerequisites: as for criterion 1, server stopped.

1. Start the API with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:create_app --factory --port 8010`.
   Expected: server starts. [ ]
2. Run `curl -s http://localhost:8010/api/version`.
   Expected: `{"version":"0.1.0","commit":"0123456789ab"}`, exactly the first 12 characters, not the full 40. [ ]
3. Stop the server and restart it with a short value: `BUILD_COMMIT=abc1234 uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then `curl -s http://localhost:8010/api/version`.
   Expected: `commit` is `abc1234`, unchanged. [ ]
4. Stop the server and restart it with a blank value: `BUILD_COMMIT= uv run --directory backend uvicorn app.main:create_app --factory --port 8010`, then `curl -s http://localhost:8010/api/version`.
   Expected: `commit` is `unknown`. [ ]
5. Open `backend/app/routers/version.py`.
   Expected: no commit string literal appears in it; the value comes from `get_build_commit()`. [ ]
6. Stop the server. [ ]

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: API running as in criterion 1 step 1.

1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version`.
   Expected: the 200 response schema is `VersionResponse` with string fields `version` and `commit`, both required. [ ]
2. Open `backend/app/schemas/version.py`.
   Expected: `VersionResponse` declares `version: str` and `commit: str`. [ ]
3. Stop the server. [ ]

## Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: backend dependencies installed. These test files need no database, so no `DATABASE_URL` is needed.

1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py`.
   Expected: the summary line reports no failed or errored test and the command exits 0. [ ]
2. Re-run the same command with `-v` added.
   Expected: `test_get_version_returns_commit_from_build_commit_env`, `test_get_version_returns_unknown_commit_when_build_commit_unset`, `test_settings_build_commit_reads_env_value` and `test_settings_build_commit_defaults_to_unknown_when_unset` each show `PASSED`. [ ]
