# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `build_commit` setting read per call from `BUILD_COMMIT`, default `unknown`
- backend/app/services/version_service.py: new `get_build_commit()` truncating to 12 characters
- backend/app/schemas/version.py: `commit: str` added to `VersionResponse`
- backend/app/routers/version.py: response carries `commit`
- docker-compose.yml: backend service environment passes `BUILD_COMMIT` through
- .env.example: optional `BUILD_COMMIT` documented
- backend/tests/unit/test_config_unit.py: build_commit tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: commit set and unset request tests, existing body assertions extended

`backend/app/main.py` is NOT modified: the version router is already registered there (TEST-05).

## Potential conflicts with other independent features
- None with TEST-08 (footer app version): frontend only, and it consumes `GET /api/version`'s `version` field, which this item keeps unchanged; adding `commit` is additive to the response.
- BUG-01 (server time edge cache): `feature_map.md` flags a `backend/app/main.py` overlap, but this item does not modify `main.py`, so the overlap does not arise from TEST-09's side. BUG-01 may modify `backend/app/core/config.py` if it adds a cache setting there; if its manifest lists `backend/app/core/config.py`, serialize the two builds.
- docker-compose.yml and .env.example may also be modified by any concurrently running item that adds an environment variable (none of TEST-08 or BUG-01 is expected to); serialize if a peer manifest lists either.
- TEST-10 (footer build commit) depends on TEST-09 and consumes the `commit` field; it is not concurrent.
