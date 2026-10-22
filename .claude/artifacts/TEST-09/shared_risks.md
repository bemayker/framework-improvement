# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: adds `Settings.build_commit` read from `BUILD_COMMIT` (default `unknown`)
- backend/app/services/version_service.py: adds `get_build_commit()` with the 12-character truncation
- backend/app/schemas/version.py: adds `commit: str` to `VersionResponse`
- backend/app/routers/version.py: passes `commit` into the response
- docker-compose.yml: backend `environment:` gains `BUILD_COMMIT: ${BUILD_COMMIT:-unknown}`
- .env.example: documents the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit resolution tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit key in body assertions, set and unset paths
- docs/DEVELOPMENT.md: corrects the existing `BUILD_COMMIT` paragraph

`backend/app/main.py` is NOT modified: the version router is already registered there by TEST-05, so the `feature_map.md` note that TEST-09 "registers a router in backend/app/main.py" no longer applies, and TEST-09 does not collide with TEST-13, FEAT-4 or FEAT-5 on that file.

## Potential conflicts with other independent features
- docker-compose.yml may also be modified by FEAT-4 or FEAT-5 (independent, could run concurrently) only if either adds backend environment wiring; neither is expected to. Low risk.
- docs/DEVELOPMENT.md may also be modified by any concurrently built item whose build-feature Section 15 docs check fires (TEST-08, BUG-01, TEST-13, FEAT-4, FEAT-5 are independent of TEST-09); TEST-09 edits one paragraph under Running tests locally. Low risk, textual merge.
- backend/app/core/config.py and backend/tests/unit/test_config_unit.py are also the likely files of BUG-02 (CORS trailing slash), but BUG-02 depends on TEST-09, so the two never run concurrently. Not a concurrency conflict.
- backend/app/routers/version.py, schemas/version.py and services/version_service.py are later read by TEST-10 and CHORE-01, both of which depend on TEST-09. Not a concurrency conflict.
