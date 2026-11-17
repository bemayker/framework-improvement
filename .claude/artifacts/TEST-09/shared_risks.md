# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/services/version_service.py: add `get_build_commit()`
- backend/app/schemas/version.py: add `commit` to `VersionResponse`
- backend/app/routers/version.py: return `commit` in the response
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service
- .env.example: document `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build-commit resolution tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: commit set and unset tests, updated body assertions

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this feature (the version router is already registered by TEST-05), so the map's BUG-01, TEST-13 and CHORE-06 main.py overlap does not apply to this plan.
- backend/app/core/config.py may also be modified by TEST-03 (independent, complete; listed it) and plausibly by BUG-01 if its edge-cache fix adds a setting; serialize with BUG-01 if its manifest lists config.py.
- docker-compose.yml and .env.example may also be modified by BUG-01 if its fix adds an environment variable; serialize if both manifests list them.
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py, backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py were created by TEST-05 (independent, complete) and are named by FEAT-8 (a version route, not done); serialize with FEAT-8 if it runs concurrently.
- Downstream TEST-10 (footer shows the build commit) consumes the `commit` field this item adds; it must build after this item merges.
