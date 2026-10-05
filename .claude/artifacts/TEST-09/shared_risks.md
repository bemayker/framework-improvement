# Shared Risk Analysis, TEST-09

## Files this feature will create
- backend/tests/unit/test_version_unit.py
- e2e/uat/scenarios/TEST-09_version-build-commit.feature
- e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `build_commit` setting read from `BUILD_COMMIT` (default "unknown")
- backend/app/services/version_service.py: new `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: `VersionResponse` gains `commit: str`
- backend/app/routers/version.py: passes `commit` into the response
- backend/Dockerfile: `ARG BUILD_COMMIT` exported as `ENV BUILD_COMMIT`
- docker-compose.yml: backend `build.args.BUILD_COMMIT`
- .env.example: documents `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: set/unset commit paths; existing exact-body assertions updated
- README.md: `.env.example` description line

`backend/app/main.py` is NOT modified (the version router is already registered by TEST-05), contrary to the item's note; the feature_map row's main.py risk therefore does not materialise for this item.

## Potential conflicts with other independent features
- BUG-01 (planned concurrently): expected scope is backend/app/routers/server_time.py (and its tests / possibly a response-header change). No file in common with TEST-09. Residual risk only if BUG-01 chooses a cache-header middleware in backend/app/main.py or a setting in backend/app/core/config.py; TEST-09 touches config.py, so if BUG-01's plan lists config.py, serialize the pair.
- BUG-04 (planned concurrently): frontend note form only. No file in common with TEST-09.
- BUG-02 (CORS trailing slash) will very likely modify backend/app/core/config.py, which TEST-09 also modifies, but BUG-02 depends on TEST-09, so the two are sequential, not concurrent.
- TEST-10 (footer shows the build commit) consumes the `commit` field defined here and depends on TEST-09; sequential, no concurrent conflict.
- docker-compose.yml, backend/Dockerfile and .env.example are shared project infrastructure that any concurrent item touching run configuration could also edit; none of BUG-01, BUG-04 is expected to.
