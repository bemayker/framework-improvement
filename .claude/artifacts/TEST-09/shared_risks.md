# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `Settings.build_commit` field read from `BUILD_COMMIT`
- backend/app/services/version_service.py: new `get_build_commit()` (12-character truncation)
- backend/app/schemas/version.py: `VersionResponse.commit`
- backend/app/routers/version.py: response carries `commit`
- docker-compose.yml: backend environment passes `BUILD_COMMIT`
- .env.example: documents `BUILD_COMMIT`
- backend/tests/unit/test_version_service_unit.py, backend/tests/unit/test_config_unit.py, backend/tests/integration/test_version_integration.py: tests

## Potential conflicts with other independent features
- **backend/app/main.py is NOT in this plan's manifest.** The version router already exists and is registered in `create_app()` on main @ ac6e44c (TEST-05), so TEST-09 extends it and does not touch the registration. The feature_map.md warning that TEST-09 and BUG-01 both edit main.py does not apply to this plan; no serialization on main.py is needed with BUG-01, TEST-13 or CHORE-06.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its server-time slice adds a setting; this plan adds one field and its default constant, an additive change that merges cleanly unless both edit the same `Settings` lines.
- docker-compose.yml and .env.example may also be modified by BUG-01 (independent, could run concurrently) if its edge-cache fix adds a backend environment variable; additive, same lines possible in the backend `environment:` block.
- backend/tests/unit/test_config_unit.py may also be modified by BUG-01 if it adds a setting; additive.
