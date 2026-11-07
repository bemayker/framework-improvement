# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/schemas/server_time.py
- backend/app/services/server_time_service.py
- backend/app/routers/server_time.py
- backend/tests/unit/test_server_time_service_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server time router (one `include_router` line plus the docstring list); FEAT-1's registration is absent from main after the sandbox reset.
- backend/tests/unit/test_main_unit.py: one new test asserting `/api/time` is registered.

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently this round: the version build-commit slice plausibly touches the app factory). Serialize the builds when both File Manifests list main.py, per the feature_map.md rows of both items.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-09 (independent, could run concurrently) if it adds a route-registration test beside the version one.
- No overlap with TEST-08 (frontend footer only).
