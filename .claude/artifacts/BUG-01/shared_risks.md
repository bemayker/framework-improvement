# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/services/server_time_service.py
- backend/app/schemas/server_time.py
- backend/app/routers/server_time.py
- backend/tests/unit/test_server_time_service_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server_time router (FEAT-1's code is absent from main after the sandbox reset c5a6e64)
- backend/tests/unit/test_main_unit.py: add a route-registration test for /api/time

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-02, TEST-03 and TEST-05 (independent; their recorded file sets list it; all complete on main, so no live conflict)
- backend/tests/unit/test_main_unit.py may also be modified by TEST-02 and TEST-05 (independent; complete on main)
- TEST-09 (independent, current run): its recorded file set does NOT include backend/app/main.py or backend/tests/unit/test_main_unit.py, and BUG-01 touches none of TEST-09's files (core/config.py, services/version_service.py, schemas/version.py, routers/version.py, backend/Dockerfile, docker-compose.yml, .env.example, version and config tests). No shared file; the map note's "plausibly main.py" does not hold against TEST-09's plan.
- backend/app/main.py is named in the map notes of TEST-06, TEST-07, TEST-13, FEAT-4, FEAT-5, FEAT-6, FEAT-7, FEAT-8, FEAT-10 to FEAT-14, BUG-02 and CHORE-06 (downstream of BUG-01) as a router-registration or CORS edit; none records a file set. Serialize BUG-01's build against any of them dispatched concurrently.
