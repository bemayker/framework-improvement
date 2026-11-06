# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/services/version_service.py: adds `get_build_commit()` (12-character rule)
- backend/app/schemas/version.py: adds `commit: str` to `VersionResponse`
- backend/app/routers/version.py: returns `commit` alongside `version`
- docker-compose.yml: backend environment passes `BUILD_COMMIT` through
- .env.example: declares optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit settings tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit set and unset over HTTP

backend/app/main.py is NOT modified: the version router is already registered there (TEST-05).

## Potential conflicts with other independent features
- backend/app/main.py: no conflict from TEST-09. BUG-01 registers a server_time router there; TEST-09 does not list main.py, so the two builds need not be serialized on that file.
- backend/app/core/config.py may also be modified by BUG-02 (CORS trailing-slash fix in the same settings module; depends on TEST-09, cancelled in the tracker, so sequential if it runs at all) — additive edits to different fields, low risk.
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py and backend/tests/integration/test_version_integration.py may also be modified by FEAT-8 ("GET /api/version returns a JSON version", depends only on TEST-01, not done; independent, could run concurrently) — serialize TEST-09 and FEAT-8 if both are scheduled.
- docker-compose.yml and .env.example: no other open independent item in feature_map.md is flagged as editing them.
