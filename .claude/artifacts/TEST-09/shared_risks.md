# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT`, default `unknown`
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return the `commit` field
- docker-compose.yml: pass `BUILD_COMMIT` through to the backend service
- .env.example: document the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build-commit setting tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: `commit` field in existing assertions, set and unset path tests

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05), so this item only extends it.

## Potential conflicts with other independent features
- backend/app/main.py: no conflict. BUG-01 (wave 3, server_time router) and TEST-13 register routers in `backend/app/main.py`, but this plan's File Manifest does not list `main.py`, so the feature map's "serialize the builds when both File Manifests list main.py" condition does not trigger. BUG-01 is already serialized after this item by the dispatch.
- backend/app/core/config.py may also be modified by BUG-02 (CORS trailing slash; depends on TEST-09 and is cancelled in the tracker, so not concurrent).
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py and backend/tests/integration/test_version_integration.py may also be modified by FEAT-8 (GET /api/version returns a JSON version; independent, could run concurrently).
- docker-compose.yml: no other open item in feature_map.md names it; a handover rebuild rewrites only the `CORS_ORIGINS` line, which this item does not touch.
- TEST-10 (footer shows the build commit) consumes the `commit` field but depends on TEST-09, so it is not concurrent.
