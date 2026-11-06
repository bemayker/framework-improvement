# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()` and `Settings.build_commit`
- backend/app/services/version_service.py: add `COMMIT_LENGTH` and `get_build_commit()`
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` alongside `version`
- docker-compose.yml: pass `BUILD_COMMIT` into the backend service environment
- .env.example: document the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit resolution tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: response now includes `commit`; set and unset path tests

`backend/app/main.py` is NOT modified: the version router is already registered there on main (64dae87).

## Potential conflicts with other independent features
- backend/app/main.py: no conflict. BUG-01 (registers its server_time router there) and TEST-13 (registers a ping router there) edit it; TEST-09 does not, so neither pair needs serializing on main.py.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its edge-cache fix adds a setting; low likelihood, its registry note lists only server_time.py and main.py. Both edits would be additive fields in `Settings`, so a textual merge conflict is possible but semantic conflict is not.
- docker-compose.yml and .env.example may also be modified by BUG-01 (independent, could run concurrently) only if it introduces a deployment setting; low likelihood.
- backend/app/schemas/version.py and the `GET /api/version` response shape: TEST-08 (footer shows the app version, frontend only) reads this endpoint. The change is additive (`commit` added, `version` unchanged), so TEST-08 is unaffected; no shared file.
