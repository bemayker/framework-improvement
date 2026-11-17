# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit` to `VersionResponse`
- backend/app/routers/version.py: return `commit`
- backend/tests/unit/test_config_unit.py: build_commit setting tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: body assertions include `commit`; set, unset, truncation and schema tests
- docker-compose.yml: backend passes `BUILD_COMMIT` through
- .env.example: documents `BUILD_COMMIT`

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05).

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by TEST-03 (independent, could run concurrently; listed in its shared-risk files, complete in the tracker)
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py and backend/tests/integration/test_version_integration.py may also be modified by TEST-05 (independent, could run concurrently; listed in its shared-risk files, complete in the tracker)
- backend/app/routers/version.py and backend/app/schemas/version.py may also be modified by FEAT-8 (independent, adds a version route like TEST-05 and TEST-09 per its map row; no file list recorded)
- BUG-01 (independent, planned concurrently in this run) recreates backend/app/routers/server_time.py and registers it in backend/app/main.py; neither file is in this list, so TEST-09 and BUG-01 share no file. The map's main.py serialization note no longer applies because TEST-09 does not touch main.py.
- docker-compose.yml and .env.example: no neighbour lists them, but any concurrent item adding a backend environment key edits the same `backend.environment` block
