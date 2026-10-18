# Shared Risk Analysis, FEAT-1

## Files this feature will create
- backend/app/routers/server_time.py
- backend/app/schemas/server_time.py
- backend/tests/unit/test_server_time_schema_unit.py
- backend/tests/unit/test_server_time_router_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature
- e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md

## Existing files this feature will modify
- backend/app/main.py: one router import and one `app.include_router(server_time_router)` call in the registration block of `create_app()`, plus a docstring clause
- backend/tests/unit/test_main_unit.py: one added route-registration test for `/api/time`
- backend/app/schemas/uptime.py: read only, not modified; `ServerTimeResponse` imports its `UtcTimestamp`, so a change to that type by another item changes this endpoint's serialisation

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-13 (Ping endpoint; independent, depends only on TEST-01, could run concurrently). A new endpoint in this API registers a router in `create_app()`, the same block FEAT-1 edits, and `feature_map.md` carries no shared-risk note for TEST-13 yet; serialize the two.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-13 (independent, could run concurrently): every router-registering item so far added a registration test there.
- backend/app/main.py and backend/tests/unit/test_main_unit.py were also modified by TEST-02, TEST-05, TEST-06, TEST-07 and TEST-09 (independent of FEAT-1, all done per `feature_map.md`): no concurrent conflict today; re-plan against main if any is reopened.
- backend/app/main.py may also be modified by BUG-02 (CORS trailing slash; independent, depends on TEST-09, done) and CHORE-01 (TEST-09 follow-up; independent, could run concurrently) if either touches the CORS middleware or the version router registration in `create_app()`; low likelihood, serialize if CHORE-01 turns out to edit `main.py`.
- backend/app/schemas/uptime.py is read by this feature and owned by TEST-07 (done); no open item in the map plans to change it.
- Disjoint: TEST-11, BUG-05 and CHORE-05 (echo router and schema only; FEAT-1 deliberately adds no echo code, see the plan Re-Plan Feedback point 2); TEST-12, TEST-14, TEST-15, CHORE-04, FEAT-2 and FEAT-3 (notes files only); TEST-03, TEST-04, TEST-08, TEST-10, BUG-03, BUG-04, CHORE-02 and CHORE-03 (frontend only).
- Not independent, so not a concurrency conflict: BUG-01 depends on FEAT-1 and will edit backend/app/routers/server_time.py (and plausibly backend/tests/integration/test_server_time_integration.py) after FEAT-1 is done; CHORE-06 depends on BUG-01. Both are sequenced by the graph, but the file names this plan fixes are the ones BUG-01 expects.
