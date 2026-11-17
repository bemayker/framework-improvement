# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/routers/server_time.py
- backend/app/services/server_time_service.py
- backend/app/schemas/server_time.py
- backend/tests/unit/test_server_time_service_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server-time router (FEAT-1's code is absent from main, so BUG-01 recreates it); one docstring clause.
- backend/tests/unit/test_main_unit.py: add a registration test for `/api/time`.

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently): its map row says it registers a router in main.py; serialize the builds when both File Manifests list main.py, per the dispatch's scheduling note.
- backend/app/main.py and backend/tests/unit/test_main_unit.py may also be modified by TEST-02 and TEST-05 (independent, their `shared_risks.md` lists both files; both are already merged on main, so the risk is only on a re-run).
- backend/app/main.py may also be modified by TEST-03 (independent, its `shared_risks.md` lists it; already merged on main).
- backend/app/main.py may also be modified by any router-registering item the map names (TEST-06, TEST-07, TEST-13, FEAT-4, FEAT-5, FEAT-6, FEAT-7, FEAT-8, FEAT-10, FEAT-11, FEAT-12, FEAT-13, FEAT-14) and by BUG-02's CORS edit (independent, could run concurrently if scheduled); each adds an import and an `include_router` line next to this one.
- Disjoint from BUG-06 (backend/app/routers/health.py only): BUG-06 adds the same `Cache-Control: no-store` pattern on `/api/health`, but in its own router file; no shared file.
