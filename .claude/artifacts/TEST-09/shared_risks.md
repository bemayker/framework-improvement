# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds the `build_commit` setting read from `BUILD_COMMIT` (default `unknown`)
- backend/app/services/version_service.py: adds `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: adds `commit: str` to `VersionResponse`
- backend/app/routers/version.py: response carries `commit`
- docker-compose.yml: backend environment passes `BUILD_COMMIT`
- .env.example: documents `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit cases
- backend/tests/unit/test_version_service_unit.py: get_build_commit cases
- backend/tests/integration/test_version_integration.py: two-field body, commit set and unset

## Potential conflicts with other independent features
- backend/app/main.py: NOT modified by this item (the version router is already registered), so the main.py serialization noted against BUG-01 and TEST-13 in feature_map.md does not apply to TEST-09.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its recreated server_time router needs a setting; the map row lists config.py in TEST-09's slice only, so serialize only if BUG-01's File Manifest lists config.py.
- docker-compose.yml and .env.example may also be modified by any concurrently built item that adds a backend environment variable; none is known in feature_map.md today.
- TEST-10 (Footer shows the build commit) depends on TEST-09 and consumes the `commit` field; it is not independent, so it is sequenced by the dependency graph rather than by a conflict flag.
