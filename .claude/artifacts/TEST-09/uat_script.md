# UAT Script, TEST-09: Version endpoint reports the build commit

This feature has no UI: every criterion is verified against the backend API from a terminal. Prerequisites for every block: the repository checked out on the feature branch, `uv` installed, and no other process listening on port 8010 (check with `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --probe 8010`). No database is needed for this endpoint.

## Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the backend started with a commit set: `BUILD_COMMIT=abc123 uv run --directory backend uvicorn app.main:app --port 8010` in its own terminal.
1. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK`.
2. Read the body of that response → it is exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`, e.g. `0.1.0`) and `commit` with value `abc123`, both JSON strings.

## Criterion 2: `commit` comes from `BUILD_COMMIT` (default `"unknown"`, first 12 characters)
Prerequisites: none beyond the shared ones; stop any backend started in another block.
1. Start the backend with a full sha: `BUILD_COMMIT=283fc31296537221cbdef4aedabbd59d0237dc95 uv run --directory backend uvicorn app.main:app --port 8010` → server logs `Uvicorn running on http://127.0.0.1:8010`.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `283fc3129653` (12 characters), not the full 40.
3. Stop the server, restart it without the variable: `uv run --directory backend uvicorn app.main:app --port 8010` → server starts.
4. Run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
5. Stop the server, restart it with a blank value: `BUILD_COMMIT= uv run --directory backend uvicorn app.main:app --port 8010`, then run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
6. Open `backend/app/routers/version.py` → the router contains no commit string literal; it calls `get_build_commit()`.

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running as in Criterion 1.
1. Run `curl -s http://localhost:8010/openapi.json` and find `components.schemas.VersionResponse` → its `properties` are `version` and `commit`, each `"type": "string"`, and both are listed under `required`.
2. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

## Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: none beyond the shared ones.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → output ends with `0 failed` (or no `failed` count), and includes `test_settings_build_commit_reads_env_value`, `test_settings_build_commit_defaults_to_unknown_when_unset`, `test_get_build_commit_returns_configured_value`, `test_get_build_commit_returns_unknown_when_unset` when run with `-v`.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`, and with `-v` the run lists `test_get_version_returns_commit_from_build_commit_env` and `test_get_version_returns_unknown_commit_when_build_commit_unset` as passed.
