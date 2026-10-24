# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `build_commit` setting read from `BUILD_COMMIT` (default `unknown`)
- backend/app/services/version_service.py: new `get_build_commit()` (first 12 characters)
- backend/app/routers/version.py: response carries `commit`
- backend/app/schemas/version.py: `VersionResponse` gains `commit: str`
- docker-compose.yml: backend environment passes `BUILD_COMMIT` through
- .env.example: documents `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit cases
- backend/tests/unit/test_version_service_unit.py: get_build_commit cases
- backend/tests/integration/test_version_integration.py: commit set and unset cases, existing body assertions updated
- docs/DEVELOPMENT.md: `BUILD_COMMIT` paragraph corrected

Not modified: backend/app/main.py. The version router is already registered there on main (TEST-05), so this item adds no router and does not share the router-registration lines with FEAT-1, TEST-06, TEST-07, TEST-13, FEAT-4, FEAT-5 or FEAT-7.

## Potential conflicts with other independent features
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py and backend/tests/integration/test_version_integration.py may also be modified by FEAT-8 (independent, could run concurrently). FEAT-8 defines `GET /api/version` with a different response, so the two specify the same route's contract. Serialize them, and settle the contract before building both.
- backend/app/core/config.py and backend/tests/unit/test_config_unit.py may also be modified by FEAT-1 (independent, being built concurrently) if its server-time endpoint adds a setting. That is not confirmed. The edits would be additive fields, so the risk is a textual merge conflict only.
- docker-compose.yml, .env.example and docs/DEVELOPMENT.md may also be modified by any concurrently running item that changes run configuration (FEAT-1 or TEST-13, unconfirmed). The edits would be additive lines in different blocks.
- Not a conflict, but downstream: TEST-10 (footer shows the build commit), BUG-02 (CORS trailing slash, which likely edits backend/app/core/config.py) and CHORE-01 all depend on TEST-09, so they run after it, never concurrently. TEST-10 consumes the `commit` field this item adds to the `/api/version` contract.
