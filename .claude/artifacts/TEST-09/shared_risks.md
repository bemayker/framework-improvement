# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `build_commit` setting read from `BUILD_COMMIT`, default `"unknown"`
- backend/app/services/version_service.py: new `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: `VersionResponse` gains `commit: str`
- backend/app/routers/version.py: response fills `commit`
- backend/Dockerfile: `BUILD_COMMIT` build arg promoted to env
- docker-compose.yml: backend build arg `BUILD_COMMIT`
- .env.example: documents `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit cases
- backend/tests/unit/test_version_service_unit.py: get_build_commit cases
- backend/tests/integration/test_version_integration.py: two-key body, set and unset commit cases

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this feature (the version router is already registered), so the feature_map.md note pairing TEST-09 with BUG-01 and TEST-13 on main.py does not apply to this plan.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its server-time edge-cache fix adds a setting; low likelihood, since its map row names only server_time.py and main.py.
- docker-compose.yml and backend/Dockerfile may also be modified by any concurrently running item that changes backend run configuration; none is named in feature_map.md for this wave.
- TEST-10 (Footer shows the build commit) depends on TEST-09 and consumes the `commit` field; it is not independent, so it cannot run concurrently, but its frontend version client must match this plan's API Contract.
