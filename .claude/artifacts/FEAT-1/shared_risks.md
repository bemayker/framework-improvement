# Shared Risk Analysis, FEAT-1

## Files this feature will create
- backend/app/schemas/server_time.py
- backend/app/routers/server_time.py
- backend/tests/unit/test_server_time_schema_unit.py
- backend/tests/unit/test_server_time_router_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature
- e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md

## Existing files this feature will modify
- backend/app/main.py: one router import (between notes and uptime), one `include_router` call after the uptime registration, one docstring clause
- backend/tests/unit/test_main_unit.py: one test asserting `/api/time` is registered with `ServerTimeResponse`

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent: depends only on TEST-01; registers a router in main.py). Cancelled in the tracker, so it cannot run concurrently today; serialize with FEAT-1 if it is reopened.
- backend/app/main.py and backend/tests/unit/test_main_unit.py may also be modified by TEST-13 (Ping endpoint; independent: depends only on TEST-01; a new endpoint would register a router there). Cancelled in the tracker; serialize with FEAT-1 if it is reopened.
- backend/app/main.py and backend/tests/unit/test_main_unit.py were also modified by TEST-06 and TEST-07 (independent of FEAT-1). Both are complete and merged (957fda7, cf617b3), and this plan is derived against main as they left it, so no concurrent conflict remains.
- backend/app/schemas/uptime.py is read (its `UtcTimestamp` is imported) but not modified. An item that renames or moves `UtcTimestamp` would break `backend/app/schemas/server_time.py`; no open item in feature_map.md plans that.
- BUG-01 edits backend/app/routers/server_time.py but depends on FEAT-1, so it is sequenced after it, not concurrent.
- No other open item in feature_map.md touches these files: TEST-08, TEST-10 and BUG-04 are frontend only, and the notes items (TEST-12, TEST-14, TEST-15, FEAT-2, FEAT-3, CHORE-04) touch only the notes router, service, repository and schema.
