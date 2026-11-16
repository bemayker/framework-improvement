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
- backend/app/main.py: capture the process start instant on `app.state` in `create_app()` and register the uptime router
- backend/tests/unit/test_main_unit.py: add a test asserting `/api/uptime` is registered

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-06 (independent, could run concurrently)
- backend/tests/unit/test_main_unit.py may also be modified by TEST-06 (independent, could run concurrently)
- backend/app/main.py may also be modified by TEST-02 (independent, could run concurrently)
- backend/tests/unit/test_main_unit.py may also be modified by TEST-02 (independent, could run concurrently)
- backend/app/main.py may also be modified by TEST-03 (independent, could run concurrently)
- backend/app/main.py may also be modified by TEST-05 (independent, could run concurrently)
- backend/tests/unit/test_main_unit.py may also be modified by TEST-05 (independent, could run concurrently)
- backend/app/main.py may also be modified by FEAT-1, TEST-09, TEST-13, BUG-01, BUG-02, FEAT-4, FEAT-5, FEAT-7, FEAT-8, FEAT-10, FEAT-11, FEAT-12, FEAT-13, FEAT-14, FEAT-6 and CHORE-06 (independent, could run concurrently; their map rows name router registration or middleware edits in main.py, but they list no files of their own yet)
- No conflict with TEST-04, TEST-08 or the other frontend-only and notes-only rows: none of their files overlap this feature's.
