# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `build_commit` read from `BUILD_COMMIT`
- backend/app/services/version_service.py: add `get_build_commit()` (default "unknown", first 12 characters)
- backend/app/schemas/version.py: add `commit` to `VersionResponse`
- backend/app/routers/version.py: return `commit`
- backend/tests/unit/test_version_service_unit.py: build-commit unit tests
- backend/tests/unit/test_config_unit.py: `BUILD_COMMIT` settings tests
- backend/tests/integration/test_version_integration.py: set and unset commit HTTP tests, existing assertions gain `commit`
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service
- .env.example: document `BUILD_COMMIT`
- docs/DEVELOPMENT.md: document `BUILD_COMMIT`

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this plan (the version router is already registered by TEST-05), so the feature_map.md flag about TEST-06, TEST-07, FEAT-1 and TEST-13 sharing `main.py` does not apply to this build.
- backend/app/core/config.py and backend/tests/unit/test_config_unit.py may also be modified by BUG-02 (CORS origin trailing slash; depends on TEST-09, so it runs after, not concurrently) and by any independent item touching settings, such as TEST-13 or FEAT-4/FEAT-5 if they add a setting (independent, could run concurrently).
- docker-compose.yml and .env.example may also be modified by any concurrent item that adds a backend environment variable (none identified in feature_map.md).
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py are read by TEST-10 (frontend footer, depends on TEST-09) and CHORE-01 (TEST-09 follow-up, depends on TEST-09); both wait for this item, so no concurrent conflict.
