# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/services/version_service.py: add `get_build_commit()` (12-character truncation)
- backend/app/schemas/version.py: add `commit` to `VersionResponse`
- backend/app/routers/version.py: return `commit`
- backend/Dockerfile: `BUILD_COMMIT` build argument and environment variable
- backend/tests/unit/test_config_unit.py: `build_commit` cases
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` cases
- backend/tests/integration/test_version_integration.py: body now includes `commit`; set and unset cases
- docs/DEVELOPMENT.md: document `BUILD_COMMIT`

## Potential conflicts with other independent features
- backend/app/main.py: NOT modified by this plan. The version router is already registered (TEST-05), so the feature_map flag against BUG-01 (which recreates backend/app/routers/server_time.py and registers it in main.py) does not apply; no serialization with BUG-01 is needed on main.py.
- backend/app/core/config.py may also be modified by BUG-01 if its fix adds a setting (for example a cache-control value); likely low, flag only. Both edits would add fields to `Settings`, an easy textual merge.
- docs/DEVELOPMENT.md may also be modified by any concurrent item whose build-feature Section 15 check fires (test or run configuration changes); additive edits in different sections, low risk.
- backend/Dockerfile: no other open item in feature_map.md is known to touch it.
