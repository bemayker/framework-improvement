# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `build_commit` to `Settings`, read from `BUILD_COMMIT`, default "unknown"
- backend/app/services/version_service.py: add `get_build_commit()` with 12-character truncation
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit`
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service environment
- backend/tests/unit/test_config_unit.py: build_commit tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: two-key body assertions, set/unset/truncation/schema tests
- docs/DEVELOPMENT.md: document BUILD_COMMIT

backend/app/main.py is NOT modified: the version router is already registered there by TEST-05.

## Potential conflicts with other independent features
- backend/app/main.py: the feature map flags TEST-09 vs BUG-01 (and TEST-13, CHORE-06) on router registration in main.py. TEST-09 does not modify main.py, so this pair needs no serialization on that file.
- backend/app/core/config.py may also be modified by BUG-02 (CORS middleware/origins) and the CORS_ORIGINS VERIFY items FEAT-15, FEAT-17, FEAT-19, FEAT-20, FEAT-22, FEAT-23 (all cancelled as of 2026-11-22). TEST-09 adds a separate field; a concurrent edit is a textual merge risk only.
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py, backend/tests/unit/test_version_service_unit.py, backend/tests/integration/test_version_integration.py may also be modified by FEAT-8 (independent, adds a version route like TEST-05 and TEST-09, could run concurrently). Serialize if FEAT-8 is ever scheduled.
- backend/tests/integration/test_version_integration.py and backend/app/schemas/version.py are read by TEST-08 (footer shows the app version, frontend only): the `commit` field is additive, so TEST-08's consumer of `version` keeps working. TEST-10 (downstream, reads the commit field) depends on this contract.
- docker-compose.yml: backend.environment is also where a handover rebuild rewrites CORS_ORIGINS; TEST-09 adds a sibling key only.
