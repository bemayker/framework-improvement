# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/routers/server_time.py
- backend/app/services/server_time_service.py
- backend/app/schemas/server_time.py
- backend/tests/unit/test_server_time_service_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server-time router in `create_app()` (FEAT-1's code is absent from main after the sandbox reset, so BUG-01 recreates the endpoint)
- backend/tests/unit/test_main_unit.py: one new test asserting `/api/time` is registered

## Potential conflicts with other independent features
- TEST-09 (approved, building concurrently): no overlap. Its File Manifest (`.claude/worktrees/TEST-09/.claude/artifacts/TEST-09/plan.md`) lists backend/app/core/config.py, backend/app/services/version_service.py, backend/app/schemas/version.py, backend/app/routers/version.py, docker-compose.yml, .env.example and the version/config tests; its plan states explicitly that `backend/app/main.py` is unchanged. BUG-01 touches none of those files, so the two builds may run concurrently. Both builds append to the same pytest suite but in different test files.
- backend/app/main.py may also be modified by TEST-13 and FEAT-14 (both register a route there per `feature_map.md`) and by BUG-02 (CORS middleware; cancelled in the tracker, not a graph node): serialize with any of them that builds concurrently.
- backend/tests/unit/test_main_unit.py may also be modified by any item that registers a router in `create_app()` (TEST-13, FEAT-14), alongside the main.py overlap above.
- Disjoint from TEST-08, BUG-04 and TEST-10 (frontend only).
