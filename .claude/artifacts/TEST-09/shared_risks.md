# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `Settings.build_commit` read from `BUILD_COMMIT`
- backend/app/services/version_service.py: add `get_build_commit()` (12-character cut)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` from the service
- backend/tests/unit/test_version_service_unit.py: build-commit unit tests
- backend/tests/unit/test_config_unit.py: `build_commit` resolution tests
- backend/tests/integration/test_version_integration.py: body now includes `commit`; set, unset, truncation and schema tests
- docker-compose.yml: backend environment gains `BUILD_COMMIT`
- .env.example: documents `BUILD_COMMIT`
- docs/DEVELOPMENT.md: documents `BUILD_COMMIT` and the version endpoint's `commit`

`backend/app/main.py` is NOT modified: the version router TEST-05 added is already registered, so the map's main.py warnings for this row do not apply to this plan.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by TEST-03 (independent, could run concurrently; complete per its row, its tree file list names config.py)
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py and backend/tests/integration/test_version_integration.py may also be modified by TEST-05 (independent, could run concurrently; complete per its row) and by FEAT-8 (independent, adds a GET /api/version route like TEST-05 and TEST-09; its file list is not recorded, so the overlap is inferred from its row)
- backend/tests/unit/test_version_service_unit.py may also be modified by TEST-05 (independent; complete)
- docker-compose.yml and .env.example may also be modified by BUG-01 (independent, server-time edge cache; plausible if its fix adds a deployment variable, not recorded in its row)
- docs/DEVELOPMENT.md may also be modified by TEST-03 (independent; complete)
- backend/app/main.py: no conflict from this plan with TEST-13, BUG-01, CHORE-06, FEAT-7, FEAT-8, FEAT-10, FEAT-12 or FEAT-14, because this plan does not edit it
