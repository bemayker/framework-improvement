# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and `Settings.build_commit`
- backend/app/services/version_service.py: adds `COMMIT_LENGTH` and `get_build_commit()`
- backend/app/schemas/version.py: `VersionResponse` gains `commit`
- backend/app/routers/version.py: passes `commit` into the response
- backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT`
- docker-compose.yml: backend build argument `BUILD_COMMIT`
- .env.example: documents the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: `build_commit` tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit` tests
- backend/tests/integration/test_version_integration.py: exact-body assertions gain `commit`; set, unset, truncation and schema tests
- docs/DEVELOPMENT.md: short `BUILD_COMMIT` note

`backend/app/main.py` is NOT modified: the version router TEST-05 added is already registered, so the main.py serialization warnings on the map row do not apply to this plan.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by FEAT-15, FEAT-17, FEAT-19, FEAT-20 and FEAT-23 (CORS_ORIGINS parsing in the same settings module; independent, could run concurrently). TEST-09 only adds a new field and helper, so a textual merge conflict is likely only if both edit the `Settings` dataclass body at the same lines.
- backend/app/core/config.py may also be modified by TEST-03 (listed it; complete).
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py and backend/tests/integration/test_version_integration.py may also be modified by FEAT-8 (adds a version route like TEST-05 and TEST-09; independent, could run concurrently) and were created by TEST-05 (complete).
- backend/tests/unit/test_version_service_unit.py may also be modified by TEST-05 (listed it; complete).
- docker-compose.yml and .env.example: no independent item lists them.
