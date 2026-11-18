# Shared Risk Analysis, TEST-09

## Files this feature will create
- backend/tests/unit/test_version_schema_unit.py
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read per call from `BUILD_COMMIT`, default "unknown"
- backend/app/services/version_service.py: add `get_build_commit()` with the 12-character truncation
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: populate `commit` from the service
- backend/Dockerfile: `ARG BUILD_COMMIT` promoted to `ENV BUILD_COMMIT`
- docker-compose.yml: backend build arg `BUILD_COMMIT` passed through from the host
- .env.example: document the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: `build_commit` tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: body assertions include `commit`; set and unset commit tests

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05). This feature registers no router.

## Potential conflicts with other independent features
- backend/app/main.py: NOT a conflict. BUG-01 (server_time router registration), TEST-13, CHORE-06 and the FEAT-4/5/7/8/10/12/14 rows register routes in main.py; TEST-09 does not touch it, so the map's "serialize when both File Manifests list main.py" condition is not met for TEST-09 and BUG-01 can build concurrently.
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py, backend/tests/integration/test_version_integration.py may also be modified by FEAT-8 (independent, could run concurrently: "adds a version route like TEST-05 and TEST-09"). Serialize if FEAT-8 is scheduled.
- backend/app/core/config.py and backend/tests/unit/test_config_unit.py may also be modified by any item that adds a setting; TEST-03 (complete) last edited config.py. BUG-02 edits the CORS middleware in main.py and may touch the CORS setting in config.py (downstream of TEST-09, so not concurrent).
- docker-compose.yml and backend/Dockerfile: no neighbour lists either file; a handover rebuild rewrites `CORS_ORIGINS` in docker-compose.yml at run time, not in a commit.
