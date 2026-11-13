# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/services/version_service.py: add `get_build_commit()` (12-character truncation)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: include `commit` in the response
- docker-compose.yml: pass `BUILD_COMMIT` through to the backend service
- .env.example: document `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit setting tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit assertions and new tests

Not modified: `backend/app/main.py`. The version router is already registered there (TEST-05), so this item needs no change to it; the map's main.py overlap note for TEST-09 does not materialize.

## Potential conflicts with other independent features
- backend/app/main.py: no longer a conflict with BUG-01 (being planned concurrently), because TEST-09 does not edit it. BUG-01 can register its server_time router without serializing against TEST-09 on this file.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its server_time fix adds a cache-control setting; both changes would be additive fields on the `Settings` dataclass. Serialize only if BUG-01's File Manifest lists config.py.
- docker-compose.yml and .env.example may also be modified by BUG-01 (independent, could run concurrently) if its edge-cache fix introduces configuration; additive lines in the backend `environment:` block. Serialize only if BUG-01's File Manifest lists either file.
- backend/app/main.py: CHORE-06 and TEST-13 are named in feature_map.md as plausible main.py editors; no overlap with TEST-09 since this item does not touch main.py.
