# Shared Risk Analysis, BUG-06

## Files this feature will create
- backend/tests/integration/test_health_cache_control_integration.py
- e2e/uat/scenarios/BUG-06_health_cache_control.feature
- e2e/uat/scripts/BUG-06_health_cache_control_uat_script.md
- .claude/artifacts/BUG-06/uat_script.md

## Existing files this feature will modify
- backend/app/routers/health.py: adds the `NO_STORE_CACHE_CONTROL` constant and passes `Cache-Control: no-store` in the returned `JSONResponse` headers on both the 200 and 503 branches; docstring names BUG-06

## Potential conflicts with other independent features
- backend/app/routers/health.py may also be modified by FEAT-5 (independent, could run concurrently): FEAT-5 ("GET /api/health returns a JSON health", depends on TEST-01 only) targets the same `GET /api/health` route, and a build of it would edit or replace this router; serialize the two, and check FEAT-5's tracker status before building (it is a verify item and may be cancelled).
- No other row in `feature_map.md` names `backend/app/routers/health.py` or the health tests. BUG-06 does not touch `backend/app/main.py`, so the many router-registration overlaps on that file (TEST-06, TEST-07, FEAT-1, TEST-09, TEST-13, FEAT-4, FEAT-7, FEAT-8, FEAT-10, FEAT-12, FEAT-14, BUG-02) do not apply. `backend/app/routers/server_time.py` (BUG-01, CHORE-06) is read for precedent only and not edited.
