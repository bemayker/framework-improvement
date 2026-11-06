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
- backend/app/main.py: import and register the server time router (one import, one `include_router` line, docstring extended)
- backend/tests/unit/test_main_unit.py: one new test asserting `/api/time` is registered

## Potential conflicts with other independent features
- None of BUG-01's files is in TEST-09's File Manifest as given for this run (backend/app/core/config.py, backend/app/services/version_service.py, backend/app/schemas/version.py, backend/app/routers/version.py, three backend version/config test files, docker-compose.yml, .env.example, TEST-09 UAT files). No direct file overlap.
- backend/app/main.py may also be modified by TEST-09 (approved, building): feature_map.md's BUG-01 row flags it as "plausibly main.py". TEST-09's manifest does not list it, so no serialization is required on the manifests as they stand; if TEST-09's build adds main.py (for example to touch the version router registration), serialize the two builds, since both would edit the `create_app()` router block.
- backend/tests/unit/test_main_unit.py may also be modified by TEST-09 only if it changes main.py (same condition as above); otherwise disjoint.
- TEST-08 (frontend footer, in plan review): frontend only, disjoint from every BUG-01 file.
