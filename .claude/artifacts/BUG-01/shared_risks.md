# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/routers/server_time.py
- backend/app/services/server_time_service.py
- backend/app/schemas/server_time.py
- backend/tests/unit/test_server_time_service_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and include the server_time router; module docstring names it
- backend/tests/unit/test_main_unit.py: assert /api/time is registered

## Potential conflicts with other independent features
- backend/app/main.py and backend/tests/unit/test_main_unit.py are listed by TEST-02, TEST-03 and TEST-05 (all complete, not running in this run); backend/app/main.py is also a router-registration point for TEST-06, TEST-07, TEST-13 and the FEAT-4 to FEAT-26 verify items (no file lists recorded). Serialize with any of them that is dispatched concurrently.
- TEST-09 (planned concurrently in this run): no file overlap. Its manifest lists backend/app/core/config.py, the version service, schema and router, docker-compose.yml, .env.example, backend/tests/unit/test_config_unit.py, the version unit and integration tests and docs/DEVELOPMENT.md; it does NOT touch backend/app/main.py or backend/tests/unit/test_main_unit.py. The map row's "plausibly main.py" warning does not hold for this run's TEST-09 plan, so the two builds may run concurrently. If a later TEST-09 re-plan adds main.py, serialize.
- TEST-08, TEST-10, BUG-04: frontend only, disjoint.
- CHORE-06 (downstream of BUG-01) plausibly edits backend/app/main.py; it depends on this item, so it runs after it.
