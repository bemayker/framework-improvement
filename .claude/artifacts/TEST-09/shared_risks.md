# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds `build_commit` (BUILD_COMMIT) to `Settings`
- backend/app/services/version_service.py: adds `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: `VersionResponse.commit`
- backend/app/routers/version.py: response carries `commit`
- docker-compose.yml: backend `BUILD_COMMIT` pass-through
- .env.example: documents optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit cases
- backend/tests/unit/test_version_service_unit.py: get_build_commit cases
- backend/tests/integration/test_version_integration.py: commit assertions, set/unset paths
- docs/DEVELOPMENT.md: BUILD_COMMIT note

`backend/app/main.py` is NOT modified: the version router is already registered by TEST-05.

## Potential conflicts with other independent features
- backend/app/main.py: not touched by TEST-09, so no conflict with BUG-01 (server-time router registration), TEST-13, FEAT-7/8/10/12/14/16/21/24/25/26 or CHORE-06.
- backend/app/core/config.py may also be modified by FEAT-15, FEAT-17, FEAT-19 and FEAT-20 (independent, CORS_ORIGINS parsing); TEST-09 adds a separate field and helper beside it, but serialize if run concurrently.
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py and their tests may also be modified by FEAT-8 (independent, a version route like TEST-05 and TEST-09); serialize if run concurrently.
- docker-compose.yml and .env.example: no independent item lists them.
- Downstream (not independent): TEST-10 reads the `commit` field this item adds.
