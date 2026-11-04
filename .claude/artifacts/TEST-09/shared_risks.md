# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `build_commit` setting read from `BUILD_COMMIT`, default `unknown`
- backend/app/services/version_service.py: new `get_build_commit()` with the 12-character truncation
- backend/app/schemas/version.py: `VersionResponse` gains `commit: str`
- backend/app/routers/version.py: response includes `commit`
- docker-compose.yml: backend service passes `BUILD_COMMIT` through
- backend/tests/unit/test_config_unit.py: `build_commit` cases
- backend/tests/unit/test_version_service_unit.py: `get_build_commit()` cases
- backend/tests/integration/test_version_integration.py: `commit` in body assertions, set and unset cycles

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05).

## Potential conflicts with other independent features
- backend/app/main.py: no conflict with BUG-01 or TEST-13. This item does not touch it, so the feature_map.md note to serialize TEST-09 and BUG-01 when both manifests list main.py does not trigger.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its edge-cache fix adds a setting there; its feature_map.md row names only server_time.py and main.py, so this is a low-likelihood overlap, flagged because both would add a field to the same `Settings` dataclass.
- docker-compose.yml may also be modified by BUG-01 (independent, could run concurrently) if it adds backend environment for the deployed edge; low likelihood, same backend `environment:` block.
- TEST-10 (frontend footer) consumes the `commit` field of `GET /api/version` but edits frontend files only: no file overlap, an API-contract dependency only.
