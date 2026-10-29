# Shared Risk Analysis, FEAT-11

## Files this feature will create
- backend/app/services/ping_service.py
- backend/tests/unit/test_ping_service_unit.py
- e2e/uat/scenarios/FEAT-11_api_ping_count.feature
- e2e/uat/scripts/FEAT-11_api_ping_count_uat_script.md
- .claude/artifacts/FEAT-11/uat_script.md

## Existing files this feature will modify
- backend/app/ping.py: adds `GET /api/ping/count` and `PingCountResponse`; `GET /api/ping` now increments the counter through a dependency
- backend/app/main.py: `create_app()` attaches `app.state.ping_counter`; docstring
- backend/tests/integration/test_ping_integration.py: count tests on a fresh app per test
- backend/tests/unit/test_main_unit.py: route registration and per-app counter tests

## Potential conflicts with other independent features
- backend/app/main.py and backend/tests/unit/test_main_unit.py are edited by every router-registering item in feature_map.md (TEST-02, TEST-05, TEST-06, TEST-07, TEST-09, TEST-13, FEAT-1, FEAT-4, FEAT-5, FEAT-7, FEAT-8, BUG-01, BUG-02). All of those are done or cancelled per the map's own notes, except BUG-02, which edits the CORS middleware in main.py and is cancelled in the tracker (not a graph node). No open independent item in wave 3 is mapped to these files, so no serialization is needed now; serialize against any newly added item that registers a router.
- backend/app/ping.py: only FEAT-10 (done, the dependency) touched it. FEAT-4, FEAT-7 and TEST-13 add a `/api/ping` route elsewhere, all cancelled; if any is revived it would collide with this route and the counter semantics.
- Runtime note, not a file conflict: the counter is per process. A future change adding `--workers` to the backend's uvicorn command (backend/Dockerfile) would make `/api/ping/count` report a per-worker count.
