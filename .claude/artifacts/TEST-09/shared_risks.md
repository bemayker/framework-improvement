# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `BUILD_COMMIT` reading (`DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit`)
- backend/app/services/version_service.py: add `get_build_commit()` with the 12-character limit
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: fill `commit` in the response
- docker-compose.yml: forward `BUILD_COMMIT` to the backend service environment
- .env.example: document the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit settings tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit field assertions and new tests

Not modified: backend/app/main.py. The version router is already registered there on the plan base (8b2ca059), so the map's expected main.py overlap with BUG-01 does not occur.

## Potential conflicts with other independent features
- backend/app/main.py: the map pairs TEST-09 with BUG-01 on this file. TEST-09 does not modify it, so this pair needs no serialization on main.py.
- backend/app/core/config.py and docker-compose.yml may also be modified by BUG-01 (independent, could run concurrently) if its edge-cache fix adds a setting or service environment entry. BUG-01 lists no files yet (neighbours call: from=none), so this is unconfirmed; compare once BUG-01's manifest exists.
- GET /api/version response shape is consumed by TEST-08 (independent, could run concurrently; frontend footer shows the app version). No shared file, and the change is additive (`commit` added, `version` unchanged), so a client reading only `version` is unaffected. A frontend test asserting the exact response body would need the new field.
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py and backend/tests/integration/test_version_integration.py may also be modified by FEAT-8 (independent, a version route like TEST-05 and TEST-09); FEAT-8 lists no files.
- backend/app/core/config.py may also be modified by FEAT-15, FEAT-17, FEAT-19, FEAT-20, FEAT-22 and FEAT-23 (CORS_ORIGINS parsing), all cancelled in the tracker as of 2026-11-22, so no live conflict.
