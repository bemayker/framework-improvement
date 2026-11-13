# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds `DEFAULT_BUILD_COMMIT` and `Settings.build_commit` (read from `BUILD_COMMIT`)
- backend/app/services/version_service.py: adds `COMMIT_DISPLAY_LENGTH` and `get_build_commit()`
- backend/app/schemas/version.py: `VersionResponse` gains `commit: str`
- backend/app/routers/version.py: passes `get_build_commit()` into the response
- backend/Dockerfile: `ARG BUILD_COMMIT` and `ENV BUILD_COMMIT`
- docker-compose.yml: backend `build.args` gains `BUILD_COMMIT`
- .env.example: optional `BUILD_COMMIT` entry
- backend/tests/unit/test_config_unit.py: `build_commit` tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: commit set and unset paths, schema check, existing body assertions updated

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this feature: the version router is already registered there (TEST-05). The feature_map note that TEST-09 and BUG-01 both edit `main.py` does not hold for this plan, so the pair need not be serialized on that file.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its server-time or cache-header fix adds a setting; low likelihood, check BUG-01's manifest.
- backend/Dockerfile, docker-compose.yml and .env.example may also be modified by BUG-01 or CHORE-06 (independent) if either touches deployment wiring for the edge-cache fix; low likelihood, check their manifests.
- `GET /api/version` response shape is consumed by nobody else today: TEST-08 (frontend footer, running concurrently) reads the version from `frontend/package.json`, not from this endpoint, and the change is additive anyway. No file overlap with TEST-08.
