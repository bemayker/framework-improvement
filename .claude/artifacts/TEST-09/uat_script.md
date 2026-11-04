# UAT Script, TEST-09: Version endpoint reports the build commit

This item has no UI. Every criterion is verified against the API with `curl` and against the test suite; the observable check is the HTTP response body.

## Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is running with `docker compose up -d --build` from the repository root, with `BUILD_COMMIT` not set in your shell; the backend listens on `http://localhost:8010`.
1. Run `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8010/api/version` → prints `200`.
2. Run `curl -s http://localhost:8010/api/version` → prints a JSON object with exactly two keys, `version` (a string such as `0.1.0`, matching `[project].version` in `backend/pyproject.toml`) and `commit` (a string).

## Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters
Prerequisites: as Criterion 1.
1. With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` → `"commit": "unknown"`.
2. Restart the backend with a full sha: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` → the backend container restarts.
3. Run `curl -s http://localhost:8010/api/version` → `"commit": "0123456789ab"` (the first 12 characters, not the full 40).
4. Restart with a blank value: `BUILD_COMMIT= docker compose up -d backend`, then run `curl -s http://localhost:8010/api/version` → `"commit": "unknown"`.
5. Open `backend/app/routers/version.py` → the router passes `commit=get_build_commit()` and contains no commit string literal; open `backend/app/core/config.py` → `BUILD_COMMIT` is read there with the `"unknown"` default.
6. Restore the default: `docker compose up -d backend` with `BUILD_COMMIT` unset → `"commit": "unknown"` again.

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with the fields `version` and `commit`, both strings.

## Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: a PostgreSQL instance is reachable and `DATABASE_URL` points at it (the integration conftest needs one), for example the compose `db` service at `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`.
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → `0 failed`; the output lists tests for a set, an unset and a blank `BUILD_COMMIT`, and for the 12-character truncation.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`; the file holds a set-`BUILD_COMMIT` request cycle and an unset one.
