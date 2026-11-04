# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT` (default `unknown`)
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return the commit in the response
- docker-compose.yml: pass `BUILD_COMMIT` through to the backend container
- .env.example: document the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: `build_commit` resolution tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: commit set and unset cases, updated exact-body assertions

`backend/app/main.py` is NOT modified: `version_router` is already registered on this base, so this item does not collide with BUG-01 on main.py.

## Potential conflicts with other independent features
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py and backend/tests/integration/test_version_integration.py may also be modified by FEAT-8 (adds a version route like TEST-05 and TEST-09; independent, could run concurrently)
- backend/app/core/config.py may also be modified by BUG-02 (CORS trailing slash, depends on TEST-09 and is cancelled in the tracker, so not concurrent in practice)
- docker-compose.yml and .env.example: no other open item in feature_map.md names them
- BUG-01 (server_time router): disjoint, since this plan does not list backend/app/main.py
