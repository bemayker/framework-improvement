# UAT Script: TEST-09 Version endpoint reports the build commit

This item has no UI: every criterion is checked against the API from a terminal at the repository root. Each block starts the backend directly on port 8010, so stop any `docker compose` backend first (or use another port and adjust the URLs).

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-09-version-build-commit` (or, once merged, on `main`).
- Backend dependencies installed: `uv sync --directory backend`.
- No database is needed for criteria 1 to 3: the version endpoint answers without `DATABASE_URL`. A warning that `DATABASE_URL` is unset at startup is expected.
- A terminal A (server) and a terminal B (`curl`).
- Criterion 4 only: the database running (`docker compose up -d db`, host port 5442).
- `version` below is the `backend/pyproject.toml` version (`0.1.0` at build time).

## Steps

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`, `commit` cut to its first 12 characters

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In terminal A run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 uv run --directory backend uvicorn app.main:create_app --factory --port 8010` | Uvicorn logs `Uvicorn running on http://127.0.0.1:8010` | [ ] Pass [ ] Fail |
| 2 | In terminal B run `curl -s -i http://localhost:8010/api/version` | Status line `HTTP/1.1 200 OK`; body `{"version":"0.1.0","commit":"0123456789ab"}` (12 characters) | [ ] Pass [ ] Fail |
| 3 | Stop terminal A, restart it with `BUILD_COMMIT=0123456789ab` (exactly 12 characters), repeat step 2 | `commit` is `0123456789ab`, unchanged | [ ] Pass [ ] Fail |
| 4 | Stop terminal A, restart it with `BUILD_COMMIT=abc1234`, repeat step 2 | `commit` is `abc1234` | [ ] Pass [ ] Fail |

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, never a router literal

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Stop terminal A. Run `unset BUILD_COMMIT` if your shell has it, then start `uv run --directory backend uvicorn app.main:create_app --factory --port 8010` | The server starts | [ ] Pass [ ] Fail |
| 6 | In terminal B run `curl -s http://localhost:8010/api/version` | `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 7 | Stop terminal A, restart it with `BUILD_COMMIT="   "` (blank), repeat step 6 | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/version.py` and `backend/app/core/config.py` | `commit` is assigned from `get_build_commit()` and no quoted commit value appears in the router. `BUILD_COMMIT` is read in one place and `DEFAULT_BUILD_COMMIT = "unknown"` is declared in `config.py` | [ ] Pass [ ] Fail |
| 9 | Optional, through Docker: run `BUILD_COMMIT=feedfacecafebeef00112233445566778899aabb docker compose up -d --build backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `feedfacecafe` | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisite: a server from criterion 2 running on port 8010.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `backend/app/schemas/version.py` | `class VersionResponse(BaseModel)` declares `version: str` and `commit: str` | [ ] Pass [ ] Fail |
| 11 | In terminal B run `curl -s http://localhost:8010/openapi.json` and find `components` then `schemas` then `VersionResponse` | Properties `version` and `commit`, both `"type": "string"`, both listed in `required` | [ ] Pass [ ] Fail |
| 12 | In the same output, under `paths` then `/api/version` then `get` then `responses` then `200` | The schema reference is `#/components/schemas/VersionResponse` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the set and unset commit paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Run `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py` | The summary line reports `0 failed`, and no test in `test_version_integration.py` is skipped | [ ] Pass [ ] Fail |
| 14 | Open `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py` | Each file has a test that sets `BUILD_COMMIT` (expecting the first 12 characters) and a test that deletes it (expecting `unknown`) | [ ] Pass [ ] Fail |

### Edge case: the method stays read-only

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 15 | With a server running, run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/version` | `405` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 (14 required, 1 optional) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
