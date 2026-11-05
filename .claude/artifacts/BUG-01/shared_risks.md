# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/routers/server_time.py
- backend/app/schemas/server_time.py
- backend/app/services/server_time_service.py
- backend/tests/unit/test_server_time_service_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server_time router in `create_app()` (FEAT-1's endpoint is absent from main after the sandbox reset, so this fix recreates it); docstring router list gains one clause
- backend/tests/unit/test_main_unit.py: one new test asserting `/api/time` is registered

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-09 (independent, could run concurrently): `feature_map.md` says TEST-09 may register or touch the version router wiring in `main.py`; serialize the builds when both File Manifests list `main.py`.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-09 (independent, could run concurrently) if TEST-09 adds a route-registration assertion there.
- No overlap with TEST-08 (frontend only: `AppFooter.tsx`, `LandingPage.tsx`, `frontend/src/api/`), BUG-04 or TEST-10 (frontend).
