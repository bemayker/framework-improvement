# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT`
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` in the response
- backend/tests/unit/test_config_unit.py: build_commit set, unset and blank cases
- backend/tests/unit/test_version_service_unit.py: get_build_commit cases
- backend/tests/integration/test_version_integration.py: exact-body assertions gain `commit`; set and unset HTTP cases
- docker-compose.yml: forward `BUILD_COMMIT` to the backend service
- .env.example: document `BUILD_COMMIT`

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05).

## Potential conflicts with other independent features
- backend/app/main.py: not touched by TEST-09, so no conflict with BUG-01 (which registers the server_time router there this round). The feature_map advice to serialize TEST-09 and BUG-01 "when both File Manifests list main.py" does not trigger.
- backend/app/core/config.py, docker-compose.yml and .env.example are shared run-configuration files; BUG-01 (edge-cache headers for server time) could plausibly touch config.py or docker-compose.yml if its plan adds a setting. Serialize only if BUG-01's File Manifest lists either file.
- backend/app/main.py and backend/app/core/config.py may also be edited by CHORE-06 (BUG-01 follow-up) and TEST-13 (registers a router in main.py) if they run concurrently; TEST-09 leaves main.py alone, so only config.py is a possible overlap.
- /api/version response shape: TEST-08 (footer shows the app version, frontend only, running concurrently) is file-disjoint. If TEST-08 consumes `/api/version`, the added `commit` field is additive and does not break a consumer reading `version`; a frontend test asserting the exact response body would need the new key.
