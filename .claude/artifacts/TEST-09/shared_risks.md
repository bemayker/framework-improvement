# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `build_commit` setting read from `BUILD_COMMIT`, default `unknown`
- backend/app/services/version_service.py: new `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: `commit: str` on `VersionResponse`
- backend/app/routers/version.py: response fills `commit`
- backend/tests/unit/test_config_unit.py: build_commit resolution tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit set and unset over HTTP; exact-body assertions updated
- docker-compose.yml: backend `BUILD_COMMIT: ${BUILD_COMMIT:-}` pass-through
- .env.example: optional `BUILD_COMMIT` entry

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this feature (the version router is already registered by TEST-05), so the ingest-flagged overlap with BUG-01 (server_time router registration in main.py) does not apply; TEST-09 and BUG-01 can build concurrently.
- docker-compose.yml may also be modified by BUG-01 (independent, could run concurrently) only if its edge-cache fix touches the backend service environment; low likelihood, different keys, but serialize if BUG-01's manifest lists docker-compose.yml.
- backend/app/core/config.py may also be modified by BUG-02 (depends on TEST-09, cancelled in the tracker; not concurrent).
- backend/app/routers/version.py, services/version_service.py, schemas/version.py, core/config.py may also be modified by CHORE-01 (depends on TEST-09, cancelled; not concurrent).
- backend/app/schemas/version.py and the `/api/version` contract are consumed by TEST-10 (depends on TEST-09; reads the new `commit` field) and were touched by FEAT-8 (cancelled); not concurrent.
