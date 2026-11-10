# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `BUILD_COMMIT` read (`Settings.build_commit`, default `unknown`)
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` from the service
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service
- .env.example: document `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build-commit settings cases
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` cases
- backend/tests/integration/test_version_integration.py: `commit` in the response, set and unset paths

`backend/app/main.py` is NOT modified: the version router is already registered by TEST-05. The feature map's TEST-09 row and the BUG-01 row expect a `main.py` edit; this plan does not make one, so no serialization on `main.py` is needed.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by BUG-02 (CORS trailing slash) and CHORE-01; both depend on TEST-09 and are cancelled in the tracker, so neither can run concurrently.
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py may also be modified by FEAT-8 (`GET /api/version` returns a JSON version; depends only on TEST-01, not Done in the map), which is independent and could run concurrently. Serialize if both are scheduled.
- docker-compose.yml and .env.example: no other open item in the feature map names them.
- BUG-01 (planned in parallel): disjoint from this plan. BUG-01 touches backend/app/routers/server_time.py and backend/app/main.py; this plan touches neither.
- TEST-10 (footer shows the build commit) consumes the `commit` field this item adds. It depends on TEST-09, so it is ordered after it rather than concurrent.
