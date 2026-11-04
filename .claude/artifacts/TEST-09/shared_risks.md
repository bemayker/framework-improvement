# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `build_commit` settings field read from `BUILD_COMMIT`
- backend/app/services/version_service.py: new `get_build_commit()` (12-character truncation)
- backend/app/schemas/version.py: `VersionResponse` gains `commit`
- backend/app/routers/version.py: response populates `commit`
- backend/Dockerfile: `ARG BUILD_COMMIT` / `ENV BUILD_COMMIT`
- docker-compose.yml: backend `build.args` forwards `BUILD_COMMIT`
- .env.example: documents optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: `build_commit` resolution tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: set and unset commit paths over HTTP

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05), so the feature_map main.py overlap with BUG-01 does not materialize for this item.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by any concurrent backend item adding a setting (e.g. BUG-01 if its server_time work reads configuration); small additive field, low conflict risk.
- docker-compose.yml and .env.example may also be modified by TEST-08 (independent, could run concurrently) if its footer reads the build commit through a frontend build variable such as a VITE_ value; coordinate so both items add separate entries rather than editing the same lines.
- backend/app/main.py: listed against BUG-01 in feature_map.md, but this plan does not touch it, so no serialization is required on that file for TEST-09.
