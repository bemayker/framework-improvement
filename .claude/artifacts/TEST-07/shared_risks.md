# Shared Risk Analysis, TEST-07

## Files this feature will create
- backend/app/routers/uptime.py
- backend/app/services/uptime_service.py
- backend/app/schemas/uptime.py
- backend/tests/unit/test_uptime_service_unit.py
- backend/tests/unit/test_uptime_schema_unit.py
- backend/tests/integration/test_uptime_integration.py
- e2e/uat/scenarios/TEST-07_uptime_endpoint.feature
- e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md

## Existing files this feature will modify
- backend/app/main.py: router import and `include_router` in `create_app()`, plus one statement at the top of `lifespan` capturing the process start on `app.state`
- backend/tests/unit/test_main_unit.py: one added route-registration test

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-06 (independent, could run concurrently: both register a router)
- backend/app/main.py may also be modified by FEAT-1 (independent, could run concurrently: registers the server_time router)
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently: registers or edits the version router wiring)
- backend/app/main.py may also be modified by TEST-13 (independent, could run concurrently: registers a ping router)
- backend/app/main.py may also be modified by FEAT-4, FEAT-5, FEAT-7, FEAT-8, FEAT-10 and FEAT-12 (independent, could run concurrently: each registers a router)
- backend/app/main.py may also be modified by FEAT-14 (independent, could run concurrently: adds a route)
- backend/app/main.py may also be modified by BUG-01 (independent of TEST-07, could run concurrently: re-registers the server_time router)
- backend/app/main.py may also be modified by BUG-02 (independent of TEST-07, could run concurrently: edits the CORS middleware; cancelled in the tracker as of 2026-10-27 per feature_map.md)
- backend/app/main.py `lifespan` may also be modified by any item that changes startup behaviour; TEST-07 adds a statement there, which is a second edit point beyond router registration
- backend/tests/unit/test_main_unit.py may also be modified by TEST-06, FEAT-1, TEST-09, TEST-13, FEAT-4, FEAT-5, FEAT-7, FEAT-8, FEAT-10, FEAT-12 and FEAT-14 (independent, could run concurrently: each plausibly adds a route-registration test, as TEST-02 and TEST-05 did)
