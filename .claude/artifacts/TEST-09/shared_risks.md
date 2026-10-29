# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `BUILD_COMMIT`-backed `Settings.build_commit` field (default `unknown`)
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: populate `commit`
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service
- .env.example: document the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py, backend/tests/integration/test_version_integration.py: set and unset commit cases

`backend/app/main.py` is NOT modified: the version router is already registered there.

## Potential conflicts with other independent features
- backend/app/main.py: not touched by this plan, so the BUG-01 overlap flagged in feature_map.md (BUG-01 registers the server_time router there) does not materialize; the two builds need no serialization on main.py.
- backend/app/core/config.py may also be modified by BUG-02 (CORS trailing slash), cancelled in the tracker and not a graph node; if revived, serialize with this item.
- docker-compose.yml backend `environment:` block: BUG-01 is not expected to edit it, but if its fix needs a backend env var it would touch the same block; flag only, low likelihood.
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py may also be modified by FEAT-8 (GET /api/version returns a JSON version, independent, depends only on TEST-01); serialize if run concurrently.
- TEST-10 (footer shows the build commit) consumes the `commit` field this item adds; it depends on TEST-09, so no concurrent conflict.
