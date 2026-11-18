# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `Settings.build_commit` read per call from `BUILD_COMMIT`, default `"unknown"`
- backend/app/services/version_service.py: add `get_build_commit()` with 12-character truncation
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: include `commit` in the response
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service
- .env.example: document the `BUILD_COMMIT` key
- backend/tests/unit/test_version_service_unit.py: commit unit tests
- backend/tests/unit/test_config_unit.py: `build_commit` settings tests
- backend/tests/integration/test_version_integration.py: commit integration tests, existing body assertions updated

`backend/app/main.py` is NOT modified: the version router (TEST-05) is already registered in `create_app()` on main d7663f0d.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by TEST-03 (independent, complete; its tree lists config.py)
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py, backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py may also be modified by TEST-05 (independent, complete; it created them)
- backend/app/routers/version.py and backend/app/schemas/version.py may also be modified by FEAT-8 (independent, not started; it adds a GET /api/version route like TEST-05 and TEST-09)
- docker-compose.yml and .env.example: no neighbour lists either file
- BUG-01 (independent, in this run): no overlap; its registration in backend/app/main.py does not collide because this plan leaves main.py untouched
