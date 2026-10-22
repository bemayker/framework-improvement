# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/services/version_service.py: adds `get_build_commit()` (12-character truncation)
- backend/app/schemas/version.py: adds `commit: str` to `VersionResponse`
- backend/app/routers/version.py: populates `commit`
- docker-compose.yml: passes `BUILD_COMMIT` to the backend service
- .env.example: documents `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit set and unset request tests, existing body assertions updated

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified (the version router is already registered by TEST-05), so the feature_map row's router-registration overlap with TEST-06, TEST-07, FEAT-1 and TEST-13 does not materialize.
- backend/app/core/config.py may also be modified by BUG-02 (CORS trailing slash; it lists TEST-09 as a dependency, so it is not concurrent) and by any item adding a setting; no independent concurrent item in feature_map.md is expected to edit it.
- docker-compose.yml backend `environment:` block may also be edited by an item adding a backend environment variable; none of TEST-08 or BUG-01 (the items ready alongside this one) touches it.
- backend/app/routers/version.py, schemas/version.py and services/version_service.py are downstream inputs for TEST-10 (footer shows the build commit) and CHORE-01 (TEST-09 follow-up), both of which depend on TEST-09 and therefore run after it, not concurrently.
- Disjoint from TEST-08 (frontend only) and BUG-01 (server_time.py only).
