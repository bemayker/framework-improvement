# Shared Risk Analysis, TEST-07

## Files this feature will create
- backend/app/schemas/uptime.py
- backend/app/services/uptime_service.py
- backend/app/routers/uptime.py
- backend/tests/unit/test_uptime_service_unit.py
- backend/tests/unit/test_uptime_schema_unit.py
- backend/tests/integration/test_uptime_integration.py
- e2e/uat/scenarios/TEST-07_uptime_endpoint.feature
- e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md
- .claude/artifacts/TEST-07/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: capture the startup clock on `app.state` in `create_app()`, register the uptime router, docstring line
- backend/tests/unit/test_main_unit.py: two new tests (uptime route registered, startup clock captured per app)

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-06 (independent, could run concurrently; its branch lists main.py)
- backend/tests/unit/test_main_unit.py may also be modified by TEST-06 (independent, could run concurrently; its branch lists test_main_unit.py)
- backend/app/main.py may also be modified by TEST-02, TEST-03 and TEST-05 (independent; their own lists name main.py)
- backend/tests/unit/test_main_unit.py may also be modified by TEST-02 and TEST-05 (independent; their own lists name it)
- backend/app/main.py may also be modified by FEAT-1, TEST-09, TEST-13, BUG-01, BUG-02, FEAT-4, FEAT-5, FEAT-7, FEAT-8, FEAT-10, FEAT-12, FEAT-14, FEAT-16, FEAT-21, FEAT-24, FEAT-25 and FEAT-26 (independent; their map rows say they register a route or edit middleware in main.py, though none has a file list yet)
- No other overlap: no neighbour's list names a file this feature creates, and TEST-08 is frontend-only.
