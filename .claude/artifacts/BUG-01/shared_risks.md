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
- backend/app/main.py: import and register the server-time router (FEAT-1's code is absent from main at 6bdffa31, so BUG-01 recreates it)
- backend/tests/unit/test_main_unit.py: add a route-registration test for `/api/time`

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, planned in this run in parallel): its version slice plausibly registers or touches the version router in main.py. Serialize the builds when TEST-09's File Manifest lists main.py.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-09 (independent) if it adds a route-registration assertion there, as TEST-05 and TEST-02 did; same serialization.
- backend/app/main.py may also be modified by TEST-13, FEAT-4, FEAT-7, FEAT-8, FEAT-10, FEAT-12, FEAT-14, FEAT-16, FEAT-21, FEAT-24, FEAT-25 and FEAT-26 (independent, each registers a router or route in main.py per the map), and by BUG-02 (CORS middleware, cancelled in the tracker); serialize with any of them run concurrently.
- backend/app/main.py and backend/tests/unit/test_main_unit.py were listed by TEST-02, TEST-03 and TEST-05 (complete; their code is on main); no live conflict, listed because the neighbours call reports their files.
- No conflict on the server_time files themselves: no other item lists backend/app/routers/server_time.py, schemas/server_time.py or services/server_time_service.py. CHORE-06 (downstream of BUG-01, not independent) plausibly edits main.py after this merges.
