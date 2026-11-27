# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `build_commit` read from `BUILD_COMMIT`
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str`
- backend/app/routers/version.py: return `commit`
- backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT`
- docker-compose.yml: backend build arg `BUILD_COMMIT`
- .env.example: document `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit assertions and set, unset and schema tests
- docs/DEVELOPMENT.md: document `BUILD_COMMIT`

## Potential conflicts with other independent features
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py, backend/tests/unit/test_version_service_unit.py, backend/tests/integration/test_version_integration.py may also be modified by TEST-05 (independent; complete, its files are on main, so this is only a conflict if it is re-run)
- backend/app/routers/version.py, backend/app/schemas/version.py may also be modified by FEAT-8 (independent, adds a GET /api/version route; could run concurrently)
- backend/app/core/config.py may also be modified by FEAT-15, FEAT-17, FEAT-19 and FEAT-20 (independent, CORS_ORIGINS parsing in the same settings module; could run concurrently)
- backend/app/core/config.py, docs/DEVELOPMENT.md may also be modified by TEST-03 (independent; complete, listed in its shared risks)
- docker-compose.yml may also be modified by BUG-01 (independent; edge-cache fix on the deployed environment, plausibly touches deploy config; could run concurrently)
- backend/app/main.py is NOT modified by this plan (the version router is already registered by TEST-05), so the map's main.py serialization notes against BUG-01, TEST-13, CHORE-06 and the FEAT-14/16/21/24/25/26 route items do not apply to TEST-09
