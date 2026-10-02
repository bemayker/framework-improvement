# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `build_commit` setting read from `BUILD_COMMIT` (default `"unknown"`)
- backend/app/services/version_service.py: new `get_build_commit()`
- backend/app/schemas/version.py: `VersionResponse` gains `commit: str` (additive)
- backend/app/routers/version.py: response populates `commit`
- backend/Dockerfile: `ARG BUILD_COMMIT` / `ENV BUILD_COMMIT`
- docker-compose.yml: backend `build.args` passthrough
- .env.example: documented `BUILD_COMMIT` entry
- backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py, backend/tests/integration/test_version_integration.py: commit tests
- README.md: one line on `BUILD_COMMIT` at build time

`backend/app/main.py` is NOT modified: the version router is already registered (TEST-05). The feature_map.md note that TEST-09 "registers a router in backend/app/main.py" no longer applies.

## Potential conflicts with other independent features
- backend/app/core/config.py may also be modified by BUG-01 only if its fix reaches settings; feature_map.md says BUG-01 edits only `server_time.py`, so no overlap expected.
- TEST-08 (frontend, running concurrently) consumes `GET /api/version`'s `version` field but edits no backend file; the change here is additive, so no file conflict and no contract break.
- docker-compose.yml and README.md are shared project files: any concurrent item touching the frontend service block or README would merge-conflict textually (TEST-08 is frontend source only per feature_map.md; flag if its build touches compose or README).
- TEST-10 depends on TEST-09 (not independent) and will read `commit`; no concurrency risk.
