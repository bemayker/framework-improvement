# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: `Settings.build_commit` read from `BUILD_COMMIT`
- backend/app/services/version_service.py: `get_build_commit()`
- backend/app/schemas/version.py: `VersionResponse.commit`
- backend/app/routers/version.py: response includes `commit`
- backend/Dockerfile: `BUILD_COMMIT` build arg baked into an env var
- docker-compose.yml: backend build arg `BUILD_COMMIT`
- .env.example: documents `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py, backend/tests/integration/test_version_integration.py: set and unset commit tests
- README.md: project tree line for `.env.example`

## Potential conflicts with other independent features
- None among items that can run concurrently. `backend/app/main.py` is NOT modified (the version router is already registered by TEST-05), so the feature_map note pairing TEST-09 with TEST-06, TEST-07 and FEAT-1 on `main.py` no longer applies, and TEST-13 (ping endpoint, also wave 2) would only touch `main.py`.
- BUG-02 (CORS trailing slash) will plausibly edit `backend/app/core/config.py` and `backend/tests/unit/test_config_unit.py`, but it depends on TEST-09, so it cannot run concurrently; noted for its planner.
- TEST-10 (footer shows the build commit) consumes the `commit` field of this contract and depends on TEST-09; CHORE-01 is this item's follow-up. Both are dependants, never concurrent.
- TEST-08 and BUG-04 are frontend only, BUG-01 edits only server_time files: disjoint.
