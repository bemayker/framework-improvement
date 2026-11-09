# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `Settings.build_commit` field read from `BUILD_COMMIT`
- backend/app/services/version_service.py: new `get_build_commit()`
- backend/app/schemas/version.py: `VersionResponse` gains `commit`
- backend/app/routers/version.py: populate `commit`
- backend/tests/unit/test_version_service_unit.py: build-commit unit tests
- backend/tests/unit/test_config_unit.py: `build_commit` settings tests
- backend/tests/integration/test_version_integration.py: two-field body, set and unset cases
- docker-compose.yml: backend `BUILD_COMMIT` passthrough
- .env.example: document `BUILD_COMMIT`

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this plan (the version router is already registered on the plan base), so the feature_map flag pairing TEST-09 with BUG-01 on main.py does not apply to this build; BUG-01 can be built concurrently on that file.
- backend/app/core/config.py may also be modified by BUG-02 (CORS trailing slash, cancelled in the tracker) and CHORE-01 (TEST-09 follow-up, cancelled); neither is a live graph node, but serialize if either is revived.
- docker-compose.yml may also be modified by BUG-01 only if its fix needs new backend environment or cache configuration (independent, could run concurrently); low likelihood, serialize if both manifests list it.
- backend/app/routers/version.py, schemas/version.py and services/version_service.py may also be modified by FEAT-8 (GET /api/version, depends on TEST-01 only) if it is ever built; it is not in this run.
- TEST-10 (footer shows the build commit) consumes the `commit` field this item adds; it depends on TEST-09, so it is sequenced, not concurrent.
