# Shared Risk Analysis, TEST-02

## Files this feature will create
- backend/app/schemas/health.py
- backend/app/services/health_service.py
- backend/app/routers/health.py
- backend/tests/unit/test_health_service_unit.py
- backend/tests/integration/test_health_integration.py
- e2e/uat/scenarios/TEST-02_health_endpoint.feature
- e2e/uat/scripts/TEST-02_health_endpoint_uat_script.md
- .claude/artifacts/TEST-02/uat_script.md

## Existing files this feature will modify
- backend/app/core/db.py: adds a `probe_connection` helper (bounded SELECT 1 connectivity probe)
- backend/app/main.py: registers the health router in `create_app()`
- backend/tests/unit/test_main_unit.py: adds a route-registration assertion for `/api/health`

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by TEST-03 (independent, could run concurrently): per `feature_map.md`, both TEST-02 and TEST-03 touch the FastAPI app entry (router registration); serialize rather than run concurrently. Note: the notes router is already registered on main, so TEST-03 appears merged, in which case the risk is retired; the flag is kept because the map still lists both as independent.
- backend/app/main.py and backend/tests/unit/test_main_unit.py may also be modified by TEST-05 (independent, could run concurrently): per `feature_map.md`, TEST-05 and TEST-02 both modify these two files; serialize rather than run concurrently. Same note: the version router already exists on main, so TEST-05 appears merged.
- TEST-04 is disjoint from TEST-02 (frontend only, per `feature_map.md`): no shared files, no serialization needed.
