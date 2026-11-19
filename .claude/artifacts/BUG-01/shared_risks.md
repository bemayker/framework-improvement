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
- backend/app/main.py: import the recreated server-time router and register it with `app.include_router` (FEAT-1's code is absent from main at 2bf4ad07 after the sandbox reset, verified on the tree).
- backend/tests/unit/test_main_unit.py: add a test asserting `/api/time` is registered.

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently; planned in parallel in this run, version slice, plausibly registers or rewires a router in main.py). Serialize the builds when both File Manifests list main.py.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-09 (independent, could run concurrently) if it adds a route-registration test there, as TEST-05 and TEST-02 did.
- backend/app/main.py may also be modified by BUG-02 (independent, edits the CORS middleware in main.py; cancelled in the tracker, not a graph node) and by FEAT-14, FEAT-4, FEAT-5, FEAT-7, FEAT-8, FEAT-10, FEAT-12, TEST-13 (independent, each registers a router or route in main.py), and by CHORE-06 (downstream BUG-01 follow-up, plausibly edits main.py).
- No conflict with TEST-08, BUG-04 or TEST-10 (frontend only) and none with BUG-06 (health router only; this item sets its header in the server-time router, not app-wide).
