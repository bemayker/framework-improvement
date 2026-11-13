# Shared Risk Analysis, TEST-09

## Files this feature will create
- backend/tests/unit/test_version_schema_unit.py
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `BUILD_COMMIT`-backed `Settings.build_commit` field
- backend/app/services/version_service.py: add `get_build_commit()` (12-character truncation)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: include `commit` in the response
- backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT`
- docker-compose.yml: backend build arg `BUILD_COMMIT`
- .env.example: document `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py, backend/tests/integration/test_version_integration.py: new and updated tests

`backend/app/main.py` is NOT modified: the version router is already registered on main (TEST-05). So the map's main.py note against BUG-01 (and CHORE-06, TEST-13) does not apply to this plan, and the BUG-01 pair needs no serialization on main.py.

## Potential conflicts with other independent features
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py may also be modified by FEAT-8 (GET /api/version returns a JSON version; depends only on TEST-01, so it could run concurrently). Serialize if both are dispatched.
- backend/app/core/config.py may also be modified by BUG-02 (CORS origin handling; depends on TEST-09, and cancelled in the tracker as of 2026-10-27). It is not concurrent with TEST-09, so this is listed for completeness.
- backend/app/core/config.py, routers/version.py, services/version_service.py may also be modified by CHORE-01 (TEST-09 follow-up; depends on TEST-09, cancelled). Not concurrent.
- docker-compose.yml and .env.example: no other item in the map names them. A handover rebuild rewrites `CORS_ORIGINS` in docker-compose.yml at run time, which is not a committed edit.
- BUG-01 (independent, could run concurrently): disjoint from this plan. BUG-01 edits backend/app/routers/server_time.py and backend/app/main.py, and this plan touches neither.
- TEST-10 depends on TEST-09 (it reads the `commit` field in the frontend), so it is downstream rather than concurrent.
