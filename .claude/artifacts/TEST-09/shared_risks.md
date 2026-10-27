# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT`, default `unknown`
- backend/app/services/version_service.py: add `get_build_commit()` with 12-character truncation
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` in the response
- docker-compose.yml: pass `BUILD_COMMIT` through to the backend service
- .env.example: document optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit settings tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit in the response, set and unset paths

`backend/app/main.py` is NOT modified: the version router is already registered on main (TEST-05). The ingestion note that TEST-09 and BUG-01 may both touch `main.py` does not hold for this plan.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by BUG-02 (CORS trailing slash, edits the CORS setting in the same module). BUG-02 depends on TEST-09 and is cancelled in the tracker, so no concurrent run is expected.
- docker-compose.yml backend `environment` block may also be modified by BUG-02 (CORS_ORIGINS) for the same reason; same dependency, no concurrent run expected.
- backend/app/main.py: no overlap from this item. BUG-01 registers a server_time router there; the two builds need no serialization on main.py.
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py may also be touched by FEAT-8 (adds a version route like TEST-05 and TEST-09, independent, depends only on TEST-01). Serialize if FEAT-8 is scheduled concurrently.
- TEST-10 and CHORE-01 depend on TEST-09 and consume the `commit` field; they are not concurrent.
