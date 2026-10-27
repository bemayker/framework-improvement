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
- backend/app/main.py: lifespan captures the process start on `app.state`; uptime router imported and registered
- backend/tests/unit/test_main_unit.py: one route-registration test added

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-06 (independent, could run concurrently): registers the echo router
- backend/app/main.py may also be modified by FEAT-1 (independent, could run concurrently): registers the server time router
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently): version endpoint change, registers a router per its feature_map note
- backend/app/main.py may also be modified by TEST-13 (independent, could run concurrently): registers the ping router
- backend/app/main.py may also be modified by FEAT-4 (independent, could run concurrently): registers a GET /api/ping router
- backend/app/main.py may also be modified by FEAT-5 (independent, could run concurrently): registers a GET /api/health router
- backend/app/main.py may also be modified by FEAT-7 (independent, could run concurrently): registers a GET /api/ping router
- backend/app/main.py may also be modified by FEAT-8 (independent, could run concurrently): registers a GET /api/version router
- backend/app/main.py may also be modified by FEAT-6 (independent, could run concurrently; it depends on TEST-10, not on TEST-07): registers the stamp router
- backend/app/main.py may also be modified by BUG-02 (independent, could run concurrently): the CORS middleware it fixes is configured in main.py's create_app, though its fix may stay in core/config.py
- backend/tests/unit/test_main_unit.py may also be modified by TEST-06, FEAT-1, TEST-09, TEST-13, FEAT-4, FEAT-5, FEAT-7, FEAT-8 and FEAT-6 (independent, could run concurrently): each router-registering item adds its own route-registration test there, as TEST-02 and TEST-05 did
- None with TEST-08 (frontend only, disjoint)

Statuses of these items were not read in this dispatch (the sandbox is reset between release runs, so the feature_map footer's "done" notes are not evidence); the scheduler should check live status before treating any pair as safe.
