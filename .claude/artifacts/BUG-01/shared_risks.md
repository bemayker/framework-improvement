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
- backend/app/main.py: import and register the server-time router (FEAT-1's registration, absent from main after the sandbox resets)
- backend/tests/unit/test_main_unit.py: add a route-registration test for `/api/time`

## Potential conflicts with other independent features
- TEST-09 (building concurrently): no file overlap. TEST-09's plan (.claude/worktrees/TEST-09/.claude/artifacts/TEST-09/plan.md) modifies docker-compose.yml, .env.example, backend/Dockerfile, backend/app/core/config.py, backend/tests/unit/test_config_unit.py and the version slice (routers/version.py, schemas/version.py, services/version_service.py and their tests); BUG-01 touches none of those. TEST-09's plan states explicitly that it does not modify backend/app/main.py, so the feature_map serialisation condition ("when both File Manifests list main.py") is not met. Residual risk: if TEST-09's build deviates and edits main.py after all, both items edit the router import block and the `include_router` lines of `create_app()`; serialize then.
- backend/tests/unit/test_main_unit.py may also be modified by any item that registers a router (TEST-13 per feature_map; CHORE-06, the BUG-01 follow-up, plausibly edits backend/app/main.py) (independent, could run concurrently); serialize with whichever of them builds at the same time.
- backend/tests/conftest.py: read-only here (session `client` fixture reused, not modified), so no conflict with TEST-09, which also leaves it unchanged.
- Disjoint from TEST-08, BUG-04 and TEST-10 (frontend only), per feature_map.
