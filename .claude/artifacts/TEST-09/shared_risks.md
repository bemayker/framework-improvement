# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT` (default "unknown")
- backend/app/services/version_service.py: add `get_build_commit()` with the 12-character cap
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` in the response
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service
- .env.example: document `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build commit setting tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: response now carries `commit`

`backend/app/main.py` is NOT modified: the version router is already registered on main (TEST-05), so this item is disjoint from BUG-01's server_time router registration.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by FEAT-15, FEAT-17, FEAT-19 and FEAT-20 (independent, CORS_ORIGINS parsing in the same settings module; TEST-09 adds a separate field and helper, so a conflict would be textual and adjacent, not semantic)
- backend/tests/unit/test_config_unit.py may also be modified by FEAT-15, FEAT-17, FEAT-19 and FEAT-20 (independent, CORS_ORIGINS tests in the same file)
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py and their tests may also be modified by FEAT-8 (independent, "GET /api/version returns a JSON version" adds a version route like TEST-05 and TEST-09)
- backend/app/core/config.py and docker-compose.yml may also be modified by BUG-01 (independent, planned in parallel in this run; its map row names `core/config.py` as part of a version slice, and an edge-cache fix could touch compose environment). TEST-09 does not list main.py, so the main.py serialization note on BUG-01's row does not apply to this pair
- backend/app/main.py: no conflict from TEST-09 (not modified)
