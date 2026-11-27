# Shared Risk Analysis, TEST-09

## Files this feature will create
- backend/tests/unit/test_version_schema_unit.py
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the BUILD_COMMIT-backed `build_commit` settings field
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: fill `commit` from the service
- backend/tests/unit/test_config_unit.py: build_commit tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit assertions and set/unset tests
- docker-compose.yml: pass BUILD_COMMIT to the backend service
- .env.example: document BUILD_COMMIT

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05), so there is no main.py overlap with BUG-01, CHORE-06, TEST-13 or the other router-registering items.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by FEAT-15 (independent, could run concurrently): CORS_ORIGINS parsing in the same settings module
- backend/app/core/config.py may also be modified by FEAT-17 (independent, could run concurrently): CORS_ORIGINS parsing in the same settings module
- backend/app/core/config.py may also be modified by FEAT-19 (independent, could run concurrently): CORS_ORIGINS parsing in the same settings module
- backend/app/core/config.py may also be modified by FEAT-20 (independent, could run concurrently): CORS_ORIGINS parsing in the same settings module
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py may also be modified by FEAT-8 (independent, could run concurrently): it adds a GET /api/version route
- docker-compose.yml may also be modified by any item that changes backend environment wiring; none of the neighbours lists it today
- BUG-01 (planned concurrently): no file overlap; BUG-01 edits backend/app/routers/server_time.py and backend/app/main.py, neither of which TEST-09 touches
