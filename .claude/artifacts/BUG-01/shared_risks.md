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
- backend/app/main.py: import and register the server_time router (one import line, one include_router line, one docstring line). FEAT-1 is complete in the tracker but its code is absent from main at c90cdbe, so BUG-01 recreates the router and registers it.
- backend/tests/unit/test_main_unit.py: add one route-registration test for /api/time

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently; planned in this same run). feature_map.md says TEST-09 registers a router in main.py; serialize the two builds when TEST-09's File Manifest also lists backend/app/main.py.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-09 (independent, could run concurrently) if TEST-09 adds or changes a route-registration test; serialize with the main.py pair above.
- backend/app/main.py may also be modified by TEST-13 (feature_map.md: registers a router in main.py) and by CHORE-06 (BUG-01 follow-up, plausibly edits main.py); CHORE-06 follows BUG-01, so it is ordered, not concurrent.
- Disjoint from TEST-08, BUG-04 and TEST-10 (frontend only, per feature_map.md).
