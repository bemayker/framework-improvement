# Shared Risk Analysis, TEST-09

## Files this feature will create
- backend/tests/unit/test_version_schema_unit.py
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds `Settings.build_commit` read from `BUILD_COMMIT`
- backend/app/services/version_service.py: adds `get_build_commit()`
- backend/app/schemas/version.py: adds `commit: str` to `VersionResponse`
- backend/app/routers/version.py: fills `commit` in the response
- backend/Dockerfile: `ARG BUILD_COMMIT` / `ENV BUILD_COMMIT`
- docker-compose.yml: backend build arg `BUILD_COMMIT`
- .env.example: optional `BUILD_COMMIT=` entry
- backend/tests/unit/test_version_service_unit.py: commit resolution tests
- backend/tests/unit/test_config_unit.py: `build_commit` settings tests
- backend/tests/integration/test_version_integration.py: set and unset commit path tests, existing body assertions extended
- README.md: one line on the `BUILD_COMMIT` build arg

`backend/app/main.py` is NOT modified: the version router is already registered there, so this item does not share that file with BUG-01, TEST-13 or CHORE-06.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by BUG-01 or TEST-13 if either adds a setting (independent, could run concurrently); additive field, low conflict risk
- docker-compose.yml, backend/Dockerfile and .env.example may also be modified by any concurrently planned item that changes run configuration (none named in feature_map.md for this wave); additive lines, low conflict risk
- README.md may also be modified by BUG-01's [Docs] step if it documents its endpoint (independent, could run concurrently); different section, low conflict risk
