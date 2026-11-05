# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add the `build_commit` setting read from `BUILD_COMMIT` (default `unknown`)
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: include `commit` in the response
- docker-compose.yml: pass `BUILD_COMMIT` through to the backend service
- .env.example: document the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: `build_commit` resolution tests
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` tests
- backend/tests/integration/test_version_integration.py: body assertions include `commit`; set and unset path tests

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05).

## Potential conflicts with other independent features
- backend/app/main.py: no conflict from this item. The feature map's warning (TEST-09 and BUG-01 both register a router in main.py) does not apply, because this plan does not list main.py, so BUG-01 and TEST-09 need no serialization on that file.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) only if its edge-cache fix adds a setting; its feature map row names server_time.py and main.py only, so the risk is low. Serialize if BUG-01's File Manifest lists config.py.
- docker-compose.yml and .env.example may also be modified by BUG-01 (independent, could run concurrently) only if it adds runtime configuration; low risk, same rule.
- TEST-08 (footer shows the app version) consumes `GET /api/version`'s `version` field. No shared file (TEST-08 is frontend only), and the added `commit` field is additive, so its reader is unaffected.
