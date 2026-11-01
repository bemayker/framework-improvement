# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/routers/server_time.py
- backend/app/schemas/server_time.py
- backend/app/services/server_time_service.py
- backend/tests/unit/test_server_time_service_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server-time router (FEAT-1's code is absent from main after the sandbox reset, so BUG-01 recreates it)
- backend/tests/unit/test_main_unit.py: one test asserting `/api/time` is registered

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (version slice; registers or edits a router in main.py), independent of BUG-01, could run concurrently: serialize the builds.
- backend/app/main.py may also be modified by BUG-02 (CORS middleware in main.py; cancelled in the tracker as of 2026-10-27, not a graph node) and FEAT-14 (adds a route in main.py), per feature_map.md: serialize if either runs concurrently.
- backend/tests/unit/test_main_unit.py may also be modified by any item that registers a router and asserts it there (TEST-09, FEAT-14): serialize with the main.py pair above.
- Disjoint from TEST-08, BUG-04 and TEST-10 (frontend only).
