# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds the `build_commit` setting read from `BUILD_COMMIT`, default `unknown`
- backend/app/services/version_service.py: adds `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: adds `commit: str` to `VersionResponse`
- backend/app/routers/version.py: returns `commit` alongside `version`
- backend/tests/unit/test_config_unit.py: set and unset `BUILD_COMMIT` resolution tests
- backend/tests/unit/test_version_service_unit.py: 12-character cut and default tests
- backend/tests/integration/test_version_integration.py: response-shape, set and unset path tests
- docker-compose.yml: backend passes `BUILD_COMMIT` through
- .env.example: documents the optional `BUILD_COMMIT`

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this plan: the version router is already registered there (TEST-05), so the main.py overlap with BUG-01 that `feature_map.md` flags does not arise from TEST-09.
- backend/app/core/config.py may also be modified by BUG-01 only if its plan adds a setting (its row names server_time files and main.py; low risk).
- TEST-08 (footer app version, frontend) consumes the `commit` field of `GET /api/version` but edits no backend file; no file overlap. It depends on the response contract above (`commit` string, `unknown` when unset).
- docker-compose.yml may also be modified by any concurrent item that changes container environment; none in the current front names it.
