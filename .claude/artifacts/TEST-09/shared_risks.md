# Shared Risk Analysis, TEST-09

## Files this feature will create
- backend/tests/unit/test_version_schema_unit.py
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `Settings.build_commit` read per call from `BUILD_COMMIT` (default "unknown")
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` alongside `version`
- docker-compose.yml: pass `BUILD_COMMIT` through to the backend service
- .env.example: document `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit set, unset and blank tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: two-key body, set and unset commit cycles

`backend/app/main.py` is NOT modified: the version router is already registered there by TEST-05.

## Potential conflicts with other independent features
- backend/app/main.py: not touched by TEST-09, so the feature-map warning that TEST-09 and BUG-01 both register a router there does not apply to this plan; BUG-01 and TEST-09 need not serialize on it.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its server_time slice adds a setting; the BUG-01 row names config.py only as part of TEST-09's slice, so the risk is low, but serialize if BUG-01's File Manifest lists config.py.
- backend/app/core/config.py, backend/tests/unit/test_config_unit.py, docker-compose.yml and .env.example were also modified by TEST-03 (independent, complete): no live conflict.
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py, backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py were created by TEST-05 (independent, complete): no live conflict.
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py may also be modified by FEAT-8 (independent, adds a version route like TEST-05 and TEST-09); serialize if run concurrently.
- TEST-08 (independent, planning concurrently, frontend only) consumes `GET /api/version`; this change is additive (`version` unchanged), so no file overlap and no contract break.
