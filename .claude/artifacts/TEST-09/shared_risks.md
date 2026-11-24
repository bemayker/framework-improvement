# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT` (default `"unknown"`)
- backend/app/schemas/version.py: `VersionResponse` gains `commit: str`
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/routers/version.py: response carries `commit`
- backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT`
- docker-compose.yml: backend build arg `BUILD_COMMIT`
- .env.example: optional `BUILD_COMMIT` key
- backend/tests/unit/test_config_unit.py: build_commit resolution tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit field on set and unset paths

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05). The feature map's main.py serialization note for this item no longer applies.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by FEAT-15, FEAT-17, FEAT-19, FEAT-20 and FEAT-23 (independent, could run concurrently; all concern CORS_ORIGINS parsing in this file). Different function and field, but the same module and the same test file, backend/tests/unit/test_config_unit.py.
- backend/app/core/config.py may also be modified by TEST-03 (independent per the map; its tree file list names config.py, though it is already complete).
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py, backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py may also be modified by TEST-05 (independent; its tree file list names all five, complete) and FEAT-8 (independent, "adds a version route like TEST-05 and TEST-09"; serialize if FEAT-8 is ever planned to touch the version slice).
- docker-compose.yml and .env.example: no independent item lists them.
