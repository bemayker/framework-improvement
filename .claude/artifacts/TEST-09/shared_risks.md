# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `BUILD_COMMIT` setting (`Settings.build_commit`, default `"unknown"`)
- backend/app/schemas/version.py: add `commit` to `VersionResponse`
- backend/app/services/version_service.py: add `get_build_commit()` (12-character prefix)
- backend/app/routers/version.py: return `commit`
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service
- .env.example: document `BUILD_COMMIT`
- backend/tests/unit/test_version_service_unit.py: commit tests
- backend/tests/unit/test_config_unit.py: build_commit settings tests
- backend/tests/integration/test_version_integration.py: two-field body and commit tests
- docs/DEVELOPMENT.md: document `BUILD_COMMIT`

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05).

## Potential conflicts with other independent features
- backend/app/main.py: no conflict. The feature map row flags TEST-09 as registering a router in main.py alongside BUG-01, TEST-13 and CHORE-06; this plan does not touch main.py, so BUG-01's concurrent server_time registration does not collide with TEST-09.
- backend/app/core/config.py may also be modified by FEAT-15, FEAT-17, FEAT-19 and FEAT-20 (independent, CORS_ORIGINS parsing in the same module, could run concurrently). TEST-09 adds a separate field and helper and leaves the CORS code untouched, but a concurrent build edits the same file: serialize if run concurrently.
- backend/tests/unit/test_config_unit.py may also be modified by FEAT-15, FEAT-17, FEAT-19 and FEAT-20 (independent, CORS settings tests, could run concurrently).
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py and backend/tests/integration/test_version_integration.py may also be modified by FEAT-8 (independent, "GET /api/version returns a JSON version", could run concurrently). Serialize if run concurrently.
- docker-compose.yml and .env.example: no independent item lists them.
