# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/routers/server_time.py
- backend/app/schemas/server_time.py
- backend/tests/unit/test_server_time_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server_time router in create_app(); docstring update (FEAT-1's registration is absent from main after the sandbox reset, so BUG-01 recreates it)
- backend/tests/unit/test_main_unit.py: add a test asserting /api/time is registered

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently; planned in this run): it registers or touches the version router wiring. Both edits sit in the router import block and the include_router list of create_app(), so concurrent branches will conflict textually. Serialize the builds.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-09 (independent, could run concurrently) if it adds a route-registration assertion; additions are separate test functions, low conflict risk but same file.
- backend/app/main.py is also named by TEST-13 in feature_map.md as registering a router (independent of BUG-01); serialize if run concurrently.
- Disjoint from TEST-08, BUG-04 and TEST-10 (frontend only), per feature_map.md.
