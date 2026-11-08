# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: new `Settings.build_commit` field read from `BUILD_COMMIT`, default `"unknown"`
- backend/app/services/version_service.py: new `get_build_commit()` with 12-character truncation
- backend/app/schemas/version.py: `VersionResponse` gains `commit: str`
- backend/app/routers/version.py: response includes `commit`
- backend/Dockerfile: `ARG BUILD_COMMIT` / `ENV BUILD_COMMIT`
- docker-compose.yml: backend build arg `BUILD_COMMIT`
- .env.example: documents `BUILD_COMMIT`
- backend/tests/unit/test_version_service_unit.py: commit cases
- backend/tests/unit/test_config_unit.py: `build_commit` cases
- backend/tests/integration/test_version_integration.py: exact-body assertions now include `commit`; set and unset path tests

## Potential conflicts with other independent features
- backend/app/main.py is NOT modified by this item: the version router is already registered on main @ 81e1e8f (TEST-05), so the main.py overlap the feature map flags with BUG-01 and TEST-13 does not arise from this plan.
- backend/app/core/config.py may also be modified by BUG-01 (independent, could run concurrently) if its edge-cache fix adds a setting; both edits would be additive fields on `Settings`.
- backend/app/core/config.py may also be modified by CHORE-06 (BUG-01 follow-up), on the same additive-field basis.
- docker-compose.yml and backend/Dockerfile may also be modified by BUG-01 (independent, could run concurrently) if the edge-cache fix touches backend serving configuration; the TEST-09 edits are confined to the `backend.build` block and two Dockerfile lines.
- No overlap with TEST-08 (frontend footer, `frontend/src/` only). TEST-10 depends on TEST-09 and consumes the `commit` field of `GET /api/version`; it is not independent, so it is sequenced rather than conflicting.
