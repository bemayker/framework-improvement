# UAT Script, TEST-09: Version endpoint reports the build commit

This item has no UI: every criterion is verified against the running backend at `http://localhost:8010` with `curl` (or a browser tab on the same URL), or by running the named tests.

## Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: the stack is up with `docker compose up -d --build` from the repository root, and `BUILD_COMMIT` is not set in your shell or `.env`.
1. Run `curl -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present.
2. Read the body printed after the headers → it is a JSON object with exactly two keys, `version` (the value of `[project].version` in `backend/pyproject.toml`, e.g. `0.1.0`) and `commit`, and both values are quoted strings.

## Criterion 2: `commit` comes from `BUILD_COMMIT`, default `"unknown"`, first 12 characters
Prerequisites: as for Criterion 1.
1. With `BUILD_COMMIT` unset, run `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
2. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234`.
3. Run `BUILD_COMMIT=3f9c2a1b7d4e8f60a1b2c3d4e5f60718293a4b5c docker compose up -d backend` (40 characters), then `curl -s http://localhost:8010/api/version` → `commit` is `3f9c2a1b7d4e`, exactly 12 characters.
4. Run `BUILD_COMMIT="   " docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
5. Open `backend/app/routers/version.py` → the router builds `commit` from `get_build_commit()` and contains no commit string of its own.
6. Restore the default with `docker compose up -d backend` (no `BUILD_COMMIT`) → `commit` is back to `unknown`.

## Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response names the schema `VersionResponse`.
2. Expand `VersionResponse` under Schemas at the bottom of the page → it lists `version` (string, required) and `commit` (string, required).
3. Open `backend/app/schemas/version.py` → `VersionResponse` is a `BaseModel` with `version: str` and `commit: str`.

## Criterion 4: Unit and integration tests cover the set and unset commit paths
Prerequisites: `uv` installed; no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
3. Run `uv run --directory backend pytest -q -k "build_commit or commit"` → the selected tests include both a set path (`test_get_build_commit_returns_configured_value_when_set`, `test_get_version_returns_commit_from_build_commit_env`) and an unset path (`test_get_build_commit_returns_unknown_when_unset`, `test_get_version_returns_unknown_commit_when_build_commit_unset`), and the run passes with no failed or errored test.
