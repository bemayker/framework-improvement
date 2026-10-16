# Shared Risk Analysis, TEST-07

## Files this feature will create
- backend/app/routers/uptime.py
- backend/app/schemas/uptime.py
- backend/app/services/uptime_service.py
- backend/tests/unit/test_uptime_service_unit.py
- backend/tests/unit/test_uptime_unit.py
- backend/tests/integration/test_uptime_integration.py
- e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md
- e2e/uat/scenarios/TEST-07_uptime_endpoint.feature

## Existing files this feature will modify
- backend/app/main.py: import and register the uptime router; capture the start mark as the first statement of lifespan; docstring clauses
- backend/tests/unit/test_main_unit.py: one route-registration assertion for /api/uptime and one lifespan start-capture test

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-06 (independent, could run concurrently): it registers the echo router in the same include_router block (feature_map.md shared_risk_notes on both rows). TEST-06 merged on main at 375a655, so this plan is already written on top of it; the pair matters only if TEST-06 is re-planned or revised.
- backend/app/main.py may also be modified by FEAT-1 (independent, could run concurrently): it registers the server-time router in the same block (feature_map.md shared_risk_notes on both rows).
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently): the map notes it registers a router in backend/app/main.py.
- backend/app/main.py may also be modified by TEST-13 (independent, could run concurrently): the Ping endpoint registers a router in the same block. Its feature_map.md row carries no shared_risk_notes yet, so this pair is not flagged there; it should be.
- backend/app/main.py may also be modified by BUG-02 (depends on TEST-09, not on TEST-07, so it can run concurrently): a CORS-origin fix plausibly edits the CORSMiddleware wiring in create_app or app/core/config.py, next to the lines this item edits.
- backend/app/main.py lifespan: TEST-07 is the first item to add a statement to lifespan besides the schema initialisation; any concurrent item that edits lifespan (none in the map today) would conflict on the same lines.
- backend/tests/unit/test_main_unit.py may also be modified by FEAT-1, TEST-09 and TEST-13 (independent, could run concurrently): each new router has added a registration assertion here since TEST-02 and TEST-05.
- Disjoint: TEST-08 is frontend only (feature_map.md row note), and the notes items (TEST-12, TEST-14, TEST-15, FEAT-2, FEAT-3, CHORE-04) edit only notes files, which this item does not touch.
