# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/schemas/server_time.py
- backend/app/services/server_time_service.py
- backend/app/routers/server_time.py
- backend/tests/unit/test_server_time_service_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server-time router in `create_app()` (FEAT-1's code is absent from main at 9c543db, so BUG-01 restores it)
- backend/tests/unit/test_main_unit.py: add a test asserting `/api/time` is registered

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently; planned in this run): it registers or changes the version router in the same `create_app()` import and `include_router` block. Serialize the builds when both File Manifests list main.py.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-09 (independent, could run concurrently) if it adds or changes a route-registration test.
- No overlap with TEST-08 (frontend only).
