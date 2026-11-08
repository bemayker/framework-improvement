# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/routers/server_time.py
- backend/app/schemas/server_time.py
- backend/app/services/server_time_service.py
- backend/tests/unit/test_server_time_service_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server time router (FEAT-1's code is absent from main @ 81e1e8f after the sandbox reset, so this item recreates it).
- backend/tests/unit/test_main_unit.py: add a test that `/api/time` is registered.

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (version endpoint reports the build commit; independent, planned concurrently in this run): serialize the builds when both File Manifests list main.py.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-09 if it adds a route-registration test; same serialization covers it.
- backend/app/main.py may also be modified by CHORE-06 (BUG-01 follow-up) and BUG-02 (CORS middleware); both are cancelled in the tracker and not graph nodes, listed for completeness.
- TEST-08 (frontend footer), BUG-04 and TEST-10 are frontend only: disjoint from this item.
