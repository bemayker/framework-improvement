# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the BUILD_COMMIT setting (build_commit, default unknown)
- backend/app/services/version_service.py: add get_build_commit() (first 12 characters)
- backend/app/schemas/version.py: VersionResponse gains commit
- backend/app/routers/version.py: response carries commit
- docker-compose.yml: backend environment passes BUILD_COMMIT through
- .env.example: document BUILD_COMMIT
- backend/tests/unit/test_config_unit.py: build_commit cases
- backend/tests/unit/test_version_service_unit.py: get_build_commit cases
- backend/tests/integration/test_version_integration.py: commit in the response, set and unset cases
- docs/DEVELOPMENT.md: document BUILD_COMMIT

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified: the version router is already registered (TEST-05), so the feature map note about main.py (TEST-06, TEST-07, FEAT-1, all complete) does not materialise.
- BUG-01 (wave 3, depends on FEAT-1) edits backend/app/routers/server_time.py and its tests only: disjoint, no shared file.
- TEST-08 and BUG-04 are frontend only: disjoint. TEST-08 reads /api/version; the added commit field is additive and does not break it.
- backend/app/core/config.py is also plausibly modified by BUG-02 (CORS trailing slash), but BUG-02 depends on TEST-09, so the dependency already serialises them.
- CHORE-01 and TEST-10 depend on TEST-09 and cannot run concurrently with it.
- docker-compose.yml, .env.example and docs/DEVELOPMENT.md: no other ready item in wave 2 or 3 is known to edit them; a concurrent infrastructure or docs item would need serialising.
