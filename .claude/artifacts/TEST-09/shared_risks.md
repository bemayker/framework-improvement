# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `Settings.build_commit` field read from `BUILD_COMMIT`
- backend/app/services/version_service.py: new `get_build_commit()` (12-character truncation)
- backend/app/schemas/version.py: `VersionResponse` gains `commit`
- backend/app/routers/version.py: response populates `commit`
- backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: `build_commit` resolution tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: two-field body, set and unset commit paths
- docs/DEVELOPMENT.md: document the `BUILD_COMMIT` build argument

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this feature (the version router is already registered), so the main.py serialization with BUG-01, TEST-13 and CHORE-06 recorded in feature_map.md does not apply to this plan.
- backend/app/core/config.py may also be modified by any concurrent feature that adds a setting (BUG-01's server_time router, CHORE-06); none is known to, but config.py is the project's single settings module, so a parallel settings edit would conflict textually.
- backend/Dockerfile may also be modified by a concurrent infrastructure item; none is listed in feature_map.md.
- docs/DEVELOPMENT.md is edited by many items' documentation checks; a concurrent [Docs] edit may conflict textually (low risk, append-only section).
