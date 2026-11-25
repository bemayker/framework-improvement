# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `BUILD_COMMIT` reader and `Settings.build_commit`
- backend/app/services/version_service.py: add `get_build_commit()` (12-character truncation)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` in the response
- backend/Dockerfile: `BUILD_COMMIT` build argument and environment variable
- docker-compose.yml: forward `BUILD_COMMIT` as a backend build argument
- .env.example: document the optional `BUILD_COMMIT`
- backend/tests/unit/test_version_service_unit.py: commit unit tests
- backend/tests/unit/test_config_unit.py: `build_commit` settings tests
- backend/tests/integration/test_version_integration.py: body now includes `commit`; set and unset tests

`backend/app/main.py` is NOT modified: the version router is already registered on main, so the map's main.py overlap with BUG-01, TEST-13 and CHORE-06 does not apply to this plan.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by FEAT-15, FEAT-17, FEAT-19 and FEAT-20 (independent, could run concurrently): they change CORS_ORIGINS parsing in the same settings module; TEST-09 adds a separate field, so the edits are adjacent but disjoint. Serialize if run concurrently.
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py may also be modified by FEAT-8 (independent, could run concurrently): it adds a version route like TEST-05 and TEST-09. Serialize if run concurrently.
- backend/tests/unit/test_config_unit.py may also be modified by FEAT-15, FEAT-17, FEAT-19 and FEAT-20 (independent, could run concurrently) if they add CORS tests there.
- docker-compose.yml: no independent item lists it; noted because a handover rebuild reads it.
- Downstream, not independent: TEST-10 (footer shows the build commit) and CHORE-02 consume the `commit` field this item adds; they wait on TEST-09 through the dependency graph.
