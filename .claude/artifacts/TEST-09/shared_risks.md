# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `Settings.build_commit` read from `BUILD_COMMIT`
- backend/app/services/version_service.py: new `get_build_commit()` (12-character cap)
- backend/app/schemas/version.py: `VersionResponse.commit`
- backend/app/routers/version.py: response carries `commit`
- backend/Dockerfile: `BUILD_COMMIT` build argument promoted to an environment variable
- docker-compose.yml: `backend.build.args.BUILD_COMMIT`
- .env.example: documented `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py, backend/tests/integration/test_version_integration.py: set/unset commit tests
- README.md: one sentence on `BUILD_COMMIT` under "Running the project"

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified, contrary to the feature_map row: the version router is already registered there (TEST-05). The row's main.py overlap with TEST-06, TEST-07 and FEAT-1 is therefore moot (all three are complete anyway).
- BUG-01 (planning concurrently): disjoint as long as it stays inside backend/app/routers/server_time.py and its tests. Low risk on backend/app/core/config.py if BUG-01 adds a setting there; a textual conflict would be an adjacent-line merge, not a semantic one.
- BUG-04 (planning concurrently): disjoint (frontend note form). Low risk on README.md, docker-compose.yml or .env.example only if BUG-04 also edits run configuration.
- TEST-08 (footer shows the app version, depends on TEST-05): consumes `GET /api/version` from the frontend. The `commit` field is additive, so a client reading only `version` is unaffected; no file overlap.
