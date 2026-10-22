# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds the `BUILD_COMMIT` setting (`Settings.build_commit`, default `unknown`)
- backend/app/services/version_service.py: adds `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: `VersionResponse` gains `commit`
- backend/app/routers/version.py: response composed from version and commit
- backend/Dockerfile: `ARG`/`ENV BUILD_COMMIT`
- docker-compose.yml: backend build arg `BUILD_COMMIT`
- .env.example: optional `BUILD_COMMIT` entry
- backend/tests/unit/test_config_unit.py: `BUILD_COMMIT` resolution tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: `commit` in every body assertion, set and unset paths, schema check

Not modified, contrary to the ticket's note: `backend/app/main.py`. The version router already exists and is registered there (TEST-05), so this item extends it rather than registering a new router.

## Potential conflicts with other independent features
- backend/app/main.py: no conflict. The feature_map row flags TEST-13, FEAT-4 and FEAT-5 for router registration in this file, but TEST-09 no longer edits it.
- backend/app/core/config.py may also be modified by BUG-02 (CORS trailing slash), but BUG-02 depends on TEST-09, so the two never run concurrently; BUG-02 must rebase onto this item's `Settings` change.
- backend/app/routers/version.py, schemas/version.py, services/version_service.py and docker-compose.yml are the base for TEST-10 and CHORE-01, both of which depend on TEST-09 (sequential, not concurrent).
- docker-compose.yml and .env.example: any concurrently running item that edits the backend service or the env template would conflict; no such independent item is flagged in feature_map.md.
- Disjoint from TEST-08, BUG-01, BUG-04 and the notes items (TEST-12, TEST-14, TEST-15, FEAT-2, FEAT-3).
