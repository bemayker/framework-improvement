# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/services/version_service.py: add `get_build_commit()` with 12-character truncation
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` in the response
- backend/Dockerfile: `BUILD_COMMIT` build arg exported as an environment variable
- docker-compose.yml: forward `BUILD_COMMIT` as a backend build arg
- .env.example: document `BUILD_COMMIT`
- backend/tests/unit/test_version_service_unit.py: commit unit tests
- backend/tests/unit/test_config_unit.py: `build_commit` setting tests
- backend/tests/integration/test_version_integration.py: commit integration tests, existing exact-body assertions updated

Not modified: backend/app/main.py. The version router is already registered there (TEST-05), so the main.py overlap the feature map records with BUG-01, TEST-13, CHORE-06 and the other router-registering items does not apply to this plan.

## Potential conflicts with other independent features
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py may also be modified by FEAT-8 (independent, could run concurrently; it adds a GET /api/version route like TEST-05 and TEST-09, and is not complete)
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py, backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py are listed by TEST-05 (independent, complete in the map; no concurrent run expected)
- backend/app/core/config.py is listed by TEST-03 (independent, complete in the map; no concurrent run expected)
- backend/app/core/config.py may also be edited by BUG-01 (independent; its row names TEST-09's slice including core/config.py, and BUG-01 itself edits server_time.py and main.py); serialize if both manifests list config.py
