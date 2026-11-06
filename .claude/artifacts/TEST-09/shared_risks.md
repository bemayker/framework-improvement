# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT` (default `unknown`)
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` in the response
- docker-compose.yml: pass `BUILD_COMMIT` into the backend environment
- backend/tests/unit/test_config_unit.py: build_commit settings tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit field in the response body

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this plan: the existing version router is extended in place, so there is no overlap with BUG-01's server_time router registration there.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its server_time work adds a setting; additive fields, low risk.
- docker-compose.yml may also be modified by BUG-01 (independent, could run concurrently) if it adds backend environment; additive lines in the same block, low risk.
- backend/app/routers/version.py and backend/app/schemas/version.py are consumed by TEST-10 (footer shows the build commit), which depends on this item's `commit` field rather than running concurrently with it.
