# Shared Risk Analysis, TEST-09

## Files this feature will create
- e2e/uat/scenarios/TEST-09_version_build_commit.feature
- e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md
- .claude/artifacts/TEST-09/uat_script.md

## Existing files this feature will modify
- backend/app/core/config.py: add `build_commit` to `Settings`, read per call from `BUILD_COMMIT`, default `unknown`
- backend/app/services/version_service.py: add `get_build_commit()` (first 12 characters)
- backend/app/schemas/version.py: add `commit: str` to `VersionResponse`
- backend/app/routers/version.py: return `commit` beside `version`
- docker-compose.yml: pass `BUILD_COMMIT` to the backend service environment
- .env.example: document the optional `BUILD_COMMIT`
- backend/tests/unit/test_config_unit.py: build_commit resolution tests
- backend/tests/unit/test_version_service_unit.py: get_build_commit tests
- backend/tests/integration/test_version_integration.py: two-field body, set and unset commit paths
- README.md: project-structure comment on the `.env.example` line

## Potential conflicts with other independent features
- backend/app/main.py: listed by feature_map as shared with TEST-06, TEST-07, FEAT-1 (all complete) and TEST-13; this plan does NOT modify it, because the version router is already registered there by TEST-05. No conflict on this file from TEST-09.
- backend/app/core/config.py may also be modified by BUG-02 (CORS origin trailing slash, which edits CORS origin parsing in the same settings module). BUG-02 depends on TEST-09, so it cannot run concurrently; noted for rebase awareness only.
- docker-compose.yml and .env.example may also be modified by BUG-02 if its fix touches the `CORS_ORIGINS` default; again sequenced after TEST-09 by dependency, not concurrent.
- BUG-01 (in flight this round) edits backend/app/routers/server_time.py only: disjoint from every file above.
- BUG-04 (in flight this round) edits the frontend note form (frontend/src/components/LandingPage.tsx and related), or server-side notes files if the fix is server-side: disjoint from every file above.
- TEST-13 (ping endpoint, independent, could run concurrently) registers a router in backend/app/main.py; TEST-09 does not touch that file, so no overlap. README.md project-structure tree could be edited by any feature adding files; TEST-09 edits only the `.env.example` comment line, low risk.
