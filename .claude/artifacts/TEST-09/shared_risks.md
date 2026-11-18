# Shared Risk Analysis, TEST-09

## Files this feature will create
- backend/tests/unit/test_version_schema_unit.py
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/services/version_service.py: add `get_build_commit()` with the 12-character cap
- backend/app/schemas/version.py: add `commit` to `VersionResponse`
- backend/app/routers/version.py: return `commit` alongside `version`
- backend/tests/unit/test_version_service_unit.py: build commit unit tests
- backend/tests/unit/test_config_unit.py: `build_commit` settings unit tests
- backend/tests/integration/test_version_integration.py: two-field body, set, unset and truncation tests
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service
- .env.example: document `BUILD_COMMIT`

`backend/app/main.py` is NOT modified: the version router is already registered there by TEST-05. The map row's "registers a router in backend/app/main.py" note is stale for this plan.

## Potential conflicts with other independent features
- backend/app/main.py: no conflict with BUG-01 (independent, registers a server_time router there). TEST-09 does not list main.py, so the scheduler need not serialize TEST-09 and BUG-01 on that file.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its edge-cache fix adds a setting; the map row names config.py in TEST-09's slice only, so this is low likelihood.
- docker-compose.yml may also be modified by BUG-01 (independent, could run concurrently) if its fix touches the deployed backend's environment; low likelihood.
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py may also be modified by FEAT-8 (independent, could run concurrently: "GET /api/version returns a JSON version", adds a version route like TEST-05 and TEST-09).
- backend/app/core/config.py and backend/tests/unit/test_config_unit.py were last modified by TEST-03 (complete); no active independent item lists them.
