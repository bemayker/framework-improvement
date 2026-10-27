# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT` (default `unknown`)
- backend/app/services/version_service.py: add `get_build_commit()` (12-character truncation)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` alongside `version`
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service
- .env.example: document the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py, backend/tests/integration/test_version_integration.py: set and unset commit coverage

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this feature: the version router is already registered (TEST-05). The graph's TEST-09 and BUG-01 pair was flagged on main.py only, so on this plan that pair does not overlap and BUG-01's build need not wait for TEST-09's merge on main.py's account.
- backend/app/core/config.py and docker-compose.yml may also be modified by BUG-01 (independent, could run concurrently) if its fix for edge-cache staleness adds a setting or compose wiring; compare BUG-01's File Manifest at plan verdict and serialize the builds if either path appears there.
- backend/app/routers/version.py and backend/app/schemas/version.py are consumed by TEST-10 (Footer shows the build commit), which depends on TEST-09, so it is ordered after this item rather than concurrent.
