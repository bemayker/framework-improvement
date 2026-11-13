# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `Settings.build_commit` read from `BUILD_COMMIT` (default `unknown`)
- backend/app/services/version_service.py: add `get_build_commit()` with the 12-character cap
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: fill `commit` in the response
- backend/Dockerfile: `ARG`/`ENV BUILD_COMMIT`
- docker-compose.yml: backend build arg `BUILD_COMMIT`
- .env.example: document optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py, backend/tests/integration/test_version_integration.py: tests for set and unset commit paths

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this plan (the version router is already registered on main), so the feature-map overlap with BUG-01 on main.py does not materialize from this side.
- backend/app/core/config.py may also be modified by BUG-01 (planned concurrently; recreating FEAT-1's server_time router could add a setting) and by CHORE-06 (BUG-01 follow-up). Additive edits in different fields; serialize if both manifests list it.
- docker-compose.yml and .env.example may also be modified by BUG-01 if its edge-cache fix touches deployment configuration; serialize if both manifests list them.
- backend/app/schemas/version.py and backend/app/routers/version.py are the contract TEST-10 (depends on TEST-09) and CHORE-02 consume through frontend/src/api/version.ts; TEST-10 is dependent, not concurrent, so no conflict, but the `commit` field name is the shared contract.
