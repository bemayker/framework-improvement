# Shared Risk Analysis, TEST-09

## Files this feature will create
- backend/tests/unit/test_version_schema_unit.py
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `build_commit` read from `BUILD_COMMIT`, default `"unknown"`
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` alongside `version`
- docker-compose.yml: pass `BUILD_COMMIT` through to the backend service
- .env.example: document `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit cases
- backend/tests/unit/test_version_service_unit.py: get_build_commit cases
- backend/tests/integration/test_version_integration.py: commit in assertions; set, unset and truncation cases

backend/app/main.py is NOT modified: the version router is already registered there (TEST-05).

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by TEST-03 (independent, complete; its tree lists config.py)
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py, backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py may also be modified by TEST-05 (independent, complete) and FEAT-8 (independent, adds a version route like TEST-05)
- backend/app/main.py: BUG-01 registers a server_time router there (planned in parallel); TEST-09 does not list main.py, so no main.py conflict with BUG-01, CHORE-06, TEST-13 or FEAT-14
- docker-compose.yml and .env.example: no independent item lists them; a BUG-01 edge-cache fix could plausibly touch deployment config, check its manifest before running both concurrently
