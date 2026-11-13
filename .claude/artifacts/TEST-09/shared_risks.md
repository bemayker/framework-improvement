# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/schemas/version.py: adds `commit` to `VersionResponse`
- backend/app/services/version_service.py: adds `get_build_commit()` with the 12-character cap
- backend/app/routers/version.py: passes `commit` into the response
- backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT`
- docker-compose.yml: backend build arg `BUILD_COMMIT`
- .env.example: optional `BUILD_COMMIT` entry
- backend/tests/unit/test_config_unit.py: build-commit settings tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: two-field body, set and unset commit tests

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this feature: the version router is already registered there (TEST-05), so the main.py overlap the feature map flags with BUG-01, TEST-13 and CHORE-06 does not apply to TEST-09.
- backend/app/core/config.py may also be modified by any concurrent item that adds a setting (feature_map.md names none for this wave; BUG-01 is recorded there as server_time.py and main.py only).
- docker-compose.yml and .env.example may also be modified by any concurrent item that adds run configuration (none named in feature_map.md for this wave).
