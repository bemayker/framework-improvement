# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new BUILD_COMMIT setting (`build_commit`, read per call, default unknown)
- backend/app/services/version_service.py: `get_build_commit()` with the 12-character rule
- backend/app/schemas/version.py: required `commit` field on `VersionResponse`
- backend/app/routers/version.py: response carries `commit`
- docker-compose.yml: BUILD_COMMIT passed to the backend service environment
- backend/tests/unit/test_config_unit.py: BUILD_COMMIT setting tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: two-field body, set and unset commit, OpenAPI schema
- docs/DEVELOPMENT.md: BUILD_COMMIT documented

## Potential conflicts with other independent features
- No conflict with the items being planned concurrently: BUG-01 edits only backend/app/routers/server_time.py and its tests, and BUG-04 is frontend only (note form). Neither touches a file listed above.
- backend/app/main.py is NOT modified (the version router is already registered by TEST-05), so the feature_map note about TEST-06, TEST-07 and FEAT-1 sharing it does not apply; all three are complete anyway.
- docker-compose.yml is a shared file across the project; no ready or in-flight independent item is known to edit it.
- Dependent, not concurrent (they depend on TEST-09, so the graph already serializes them): BUG-02 (CORS trailing slash) will likely edit backend/app/core/config.py and backend/tests/unit/test_config_unit.py; CHORE-01 (TEST-09 follow-up) will edit the version files above; TEST-10 consumes the new `commit` field from the frontend.
