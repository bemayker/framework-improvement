# UAT script: TEST-09 Version endpoint reports the build commit

Manual verification, one section per acceptance criterion. Each step lists the action and the expected result.

## Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
Prerequisites: from the repository root, `cp .env.example .env` done once; Docker running; no `BUILD_COMMIT` exported in the shell.
1. Run `docker compose build backend` then `docker compose up -d` → both commands finish without error; `docker compose ps` shows `backend` running.
2. Run `curl -i http://localhost:8010/api/version` → status line `HTTP/1.1 200 OK`, header `content-type: application/json`.
3. Read the body from step 2 → it has exactly two keys, `version` (e.g. `0.1.0`, the value of `[project].version` in `backend/pyproject.toml`) and `commit`, both strings.

## Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters
Prerequisites: Criterion 1's setup.
1. With no `BUILD_COMMIT` set, run `docker compose build backend` and `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
2. Run `BUILD_COMMIT=0418677a1b2c3d4e5f60718293a4b5c6d7e8f901 docker compose build backend` then `docker compose up -d backend` → build succeeds and the backend restarts.
3. Run `curl -s http://localhost:8010/api/version` → `commit` is `0418677a1b2c` (the first 12 characters of the value from step 2).
4. Run `BUILD_COMMIT=abc123 docker compose build backend`, `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc123` (shorter than 12, unchanged).
5. Open `backend/app/routers/version.py` → it contains no commit literal; `commit` is filled from `get_build_commit()`.

## Criterion 3: Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running from Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with `version` (string) and `commit` (string), both required.
2. Open `backend/app/schemas/version.py` → `class VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

## Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: test database available per `docs/DEVELOPMENT.md` → Running tests locally (`DATABASE_URL` exported for the integration tier).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py` → `0 failed`; the output lists the build_commit set, unset and truncation tests as passed.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`, including `test_get_version_returns_commit_from_build_commit_env` and `test_get_version_returns_unknown_commit_when_build_commit_unset`.
