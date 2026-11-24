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
- backend/app/main.py: import and register the server time router (FEAT-1's code is absent from main after the sandbox reset, so BUG-01 restores it).
- backend/tests/unit/test_main_unit.py: add a test asserting the `/api/time` route is registered.

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently): its map row says it registers a router in main.py and names BUG-01 explicitly; serialize the builds.
- backend/app/main.py and backend/tests/unit/test_main_unit.py may also be modified by TEST-02 (independent; its shared_risks lists both files).
- backend/app/main.py and backend/tests/unit/test_main_unit.py may also be modified by TEST-05 (independent; its shared_risks lists both files).
- backend/app/main.py may also be modified by TEST-03 (independent; its shared_risks lists it).
- backend/app/main.py may also be modified by any other independent item that registers a backend router there per its map row (TEST-06, TEST-07, TEST-13, FEAT-4, FEAT-5, FEAT-7, FEAT-8, FEAT-10, FEAT-12, FEAT-14, FEAT-16, FEAT-21, FEAT-24, FEAT-25) or edits its CORS middleware (BUG-02), and by downstream CHORE-06 (BUG-01 follow-up).
