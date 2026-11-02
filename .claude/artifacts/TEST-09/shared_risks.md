# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and `Settings.build_commit`
- backend/app/services/version_service.py: adds `SHORT_COMMIT_LENGTH` and `get_build_commit()`
- backend/app/schemas/version.py: adds `commit: str` to `VersionResponse`
- backend/app/routers/version.py: passes `commit=get_build_commit()`
- docker-compose.yml: backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-}`
- backend/tests/unit/test_config_unit.py: build_commit tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit set/unset tests, exact-body assertions updated

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified: the version router is already registered there (TEST-05), so the `feature_map.md` main.py overlap with BUG-01 does not apply to this plan and the two builds need no serialization on main.py.
- docker-compose.yml may also be modified by BUG-01 only if its fix adds a backend environment value; BUG-01's feature_map note names only server_time.py and main.py, so the overlap is unlikely (independent, could run concurrently).
- backend/app/core/config.py may also be modified by BUG-02 (CORS settings), but BUG-02 is cancelled in the tracker and depends on TEST-09, so it cannot run concurrently.
- backend/app/routers/version.py, backend/app/services/version_service.py and backend/app/core/config.py may also be modified by CHORE-01 (TEST-09 follow-up), cancelled in the tracker and dependent on TEST-09, so not concurrent.
- backend/app/routers/version.py may also be modified by FEAT-8 (adds a version route like TEST-05 and TEST-09; independent, could run concurrently if scheduled).
- Disjoint from TEST-08, TEST-10 and BUG-04 (frontend only); TEST-10 consumes the `commit` field this item adds and already depends on TEST-09.
