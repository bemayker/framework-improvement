# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds the `BUILD_COMMIT`-backed `Settings.build_commit` field and its `unknown` default
- backend/app/services/version_service.py: adds `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: `VersionResponse` gains `commit`
- backend/app/routers/version.py: response carries `commit`
- docker-compose.yml: backend service passes `BUILD_COMMIT` through
- backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py, backend/tests/integration/test_version_integration.py: set and unset commit paths

`backend/app/main.py` is NOT modified: the version router (TEST-05) is already registered there, so the map's "registers a router in backend/app/main.py" note does not apply to this plan, and no serialization on `main.py` is needed with BUG-01, TEST-13 or any other router-registering item.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by BUG-02 (CORS trailing slash, depends on TEST-09, so it cannot run concurrently; cancelled in the tracker), listed only for completeness.
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py may also be modified by FEAT-8 (independent, depends only on TEST-01, adds a version route; could run concurrently if it is in the run's graph): serialize if both are scheduled.
- docker-compose.yml: no other item in the feature map names it.
- BUG-01 (server_time router in backend/app/main.py) is disjoint from this plan's files and is not in this run's graph.
