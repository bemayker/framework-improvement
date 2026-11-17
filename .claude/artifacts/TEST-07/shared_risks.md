# Shared Risk Analysis, TEST-07

## Files this feature will create
- backend/app/schemas/uptime.py
- backend/app/services/uptime_service.py
- backend/app/routers/uptime.py
- backend/tests/unit/test_uptime_service_unit.py
- backend/tests/integration/test_uptime_integration.py
- e2e/uat/scenarios/TEST-07_uptime_endpoint.feature
- e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md
- .claude/artifacts/TEST-07/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: capture the process start clock in `lifespan` onto `app.state`, and register the uptime router in `create_app()`
- backend/tests/unit/test_main_unit.py: add a route-registration test for `/api/uptime`

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-02 (independent, could run concurrently)
- backend/app/main.py may also be modified by TEST-03 (independent, could run concurrently)
- backend/app/main.py may also be modified by TEST-05 (independent, could run concurrently)
- backend/app/main.py may also be modified by TEST-06 (independent, could run concurrently)
- backend/tests/unit/test_main_unit.py may also be modified by TEST-02 (independent, could run concurrently)
- backend/tests/unit/test_main_unit.py may also be modified by TEST-05 (independent, could run concurrently)
- backend/tests/unit/test_main_unit.py may also be modified by TEST-06 (independent, could run concurrently)
- backend/app/main.py is also named by the feature map as a router-registration target of FEAT-1, TEST-09, TEST-13, BUG-01, BUG-02, FEAT-4, FEAT-5, FEAT-7, FEAT-8, FEAT-10, FEAT-12 and FEAT-14 (independent, no shared_risks.md of their own; could run concurrently): serialize with any of them that is in flight
- TEST-08 (frontend only) shares no file with this feature and can run in parallel
