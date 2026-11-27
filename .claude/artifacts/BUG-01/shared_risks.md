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
- backend/app/main.py: import and register the server-time router (FEAT-1's code is absent from main after the sandbox reset, so BUG-01 recreates it)
- backend/tests/unit/test_main_unit.py: add the route-registration test for /api/time

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently; the map asks to serialize the builds when both manifests list main.py)
- backend/app/main.py may also be modified by TEST-06, TEST-07, TEST-13, FEAT-4, FEAT-5, FEAT-7, FEAT-8, FEAT-10, FEAT-12, FEAT-14, FEAT-16, FEAT-21, FEAT-24, FEAT-25 and FEAT-26 (each registers a router there; independent, could run concurrently)
- backend/app/main.py may also be modified by BUG-02 (CORS middleware; cancelled in the tracker, not a graph node)
- backend/app/main.py and backend/tests/unit/test_main_unit.py are listed by TEST-02 and TEST-05; backend/app/main.py by TEST-03 (all three complete, so no concurrent build expected)
- No other item lists the server-time files this feature creates; CHORE-06 (downstream BUG-01 follow-up) is not independent and runs after it
