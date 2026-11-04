# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `build_commit` settings field read from `BUILD_COMMIT`, default `unknown`
- backend/app/services/version_service.py: new `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: `VersionResponse` gains `commit: str`
- backend/app/routers/version.py: response includes `commit`
- backend/tests/unit/test_config_unit.py: `BUILD_COMMIT` set, unset and blank cases
- backend/tests/unit/test_version_service_unit.py: truncation and default cases
- backend/tests/integration/test_version_integration.py: set and unset commit over HTTP, schema check
- docker-compose.yml: backend service passes `BUILD_COMMIT` through
- .env.example: optional `BUILD_COMMIT` entry

`backend/app/main.py` is NOT modified: the version router is already registered in `create_app()` (TEST-05), so this item adds no router registration despite the feature note saying it does.

## Potential conflicts with other independent features
- backend/app/main.py: no conflict from this item. BUG-01 registers a server_time router there, but TEST-09's File Manifest does not list `main.py`, so the hold on BUG-01 for a `main.py` overlap can be released on the strength of this plan.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its server-time or cache work adds a setting; low likelihood, and both would be additive fields in the same dataclass, so a textual merge conflict at most.
- docker-compose.yml and .env.example may also be modified by any independent item that adds a backend environment variable; none in the current map names them.
- backend/app/schemas/version.py and the version router/service are consumed by TEST-10 (footer reads `commit`), which depends on TEST-09, so it is sequenced after this item, not concurrent.
