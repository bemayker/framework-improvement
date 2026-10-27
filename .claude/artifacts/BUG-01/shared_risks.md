# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/routers/server_time.py
- backend/app/schemas/server_time.py
- backend/tests/unit/test_server_time_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server time router (FEAT-1's registration, absent from main since the reset 9dcba19); docstring clause
- backend/tests/unit/test_main_unit.py: restore the `/api/time` route-registration test

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently): TEST-09 registers or changes a router in the same factory. Serialize the builds; the second to merge rebases onto the first's import and `include_router` lines.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-09 (independent, could run concurrently): both add a route-registration test to the same module.
- backend/app/main.py may also be modified by BUG-02 (depends on TEST-09, not on BUG-01, so independent): BUG-02 edits the CORS middleware block. BUG-01 does not touch that block, so the overlap is textual only; BUG-02 is cancelled in the tracker as of 2026-10-27.
- FEAT-1 (complete in the tracker) owns the same server-time files; it is a dependency, not a concurrent item, and its code is absent from main, which is why BUG-01 restores it. If anyone re-delivers FEAT-1 separately, it collides with every file listed above.
