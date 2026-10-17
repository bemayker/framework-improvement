# Shared Risk Analysis, BUG-01

## Files this feature will create
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/routers/server_time.py: inject a Response and set Cache-Control: no-store on GET /api/time
- backend/tests/unit/test_server_time_router_unit.py: pass a Response to the handler, add the header test
- backend/tests/integration/test_server_time_integration.py: add the header test

## Potential conflicts with other independent features
- None expected. TEST-09 (wave 2, independent) touches the version router, service, schema, core/config.py and backend/app/main.py, none of which BUG-01 edits; BUG-01 does not touch backend/app/main.py.
- TEST-08, BUG-04 and TEST-10 are frontend only: disjoint.
- BUG-02 (depends on TEST-09) edits CORS configuration, not server_time.py: disjoint.
- CHORE-06 depends on BUG-01, so it cannot run concurrently with it.
