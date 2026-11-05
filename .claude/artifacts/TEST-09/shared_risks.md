# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `BUILD_COMMIT`-backed `build_commit` setting and its `unknown` default
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: include `commit` in the response
- docker-compose.yml: pass `BUILD_COMMIT` through to the backend service
- backend/tests/unit/test_config_unit.py: build_commit tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit field assertions

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this feature: the version router is already registered (TEST-05). The feature_map note about serializing with BUG-01 on main.py therefore does not apply to this plan.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its server-time router reads a new setting; additive edits, low conflict risk.
- docker-compose.yml may also be modified by BUG-01 (independent, could run concurrently) only if it adds a backend environment variable; additive, low risk.
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py are consumed by TEST-10 (depends on TEST-09, so not concurrent): TEST-10 relies on the `commit` field name and the `unknown` sentinel defined here.
