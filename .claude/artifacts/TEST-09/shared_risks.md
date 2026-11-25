# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/services/version_service.py: adds `get_build_commit()` (12-character truncation)
- backend/app/schemas/version.py: adds `commit: str` to `VersionResponse`
- backend/app/routers/version.py: passes `commit` into the response
- docker-compose.yml: backend environment gains `BUILD_COMMIT`
- .env.example: documents `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit setting tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit assertions and set/unset tests

Not modified: backend/app/main.py (the version router is already registered since TEST-05) and backend/tests/unit/test_main_unit.py.

## Potential conflicts with other independent features
- backend/app/main.py: NOT touched by TEST-09, so no conflict with BUG-01 (server_time router registration), TEST-13, FEAT-7, FEAT-8, FEAT-10, FEAT-12, FEAT-14, FEAT-16, FEAT-21, FEAT-24, FEAT-25 or FEAT-26 on this file. The feature map's note that TEST-09 registers a router in main.py is stale: the router exists.
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py, backend/tests/integration/test_version_integration.py may also be modified by FEAT-8 (independent, could run concurrently: it adds a GET /api/version route returning a JSON version)
- backend/app/core/config.py may also be modified by FEAT-15, FEAT-17, FEAT-19 and FEAT-20 (independent, could run concurrently: they change CORS_ORIGINS parsing in the same settings module); TEST-09 adds a separate field, so the overlap is textual, not semantic
- backend/tests/unit/test_config_unit.py may also be modified by FEAT-15, FEAT-17, FEAT-19 and FEAT-20 (independent, could run concurrently)
- docker-compose.yml and .env.example: no independent item lists them
