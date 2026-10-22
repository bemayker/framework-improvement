# Shared Risk Analysis, FEAT-5

## Files this feature will create
- e2e/uat/scenarios/FEAT-5_health_returns_json_health.feature
- e2e/uat/scripts/FEAT-5_health_returns_json_health_uat_script.md
- .claude/artifacts/FEAT-5/uat_script.md

## Existing files this feature will modify
- backend/app/schemas/health.py: HealthResponse gains a `health` field ("green" or "red")
- backend/app/routers/health.py: sets `health` from the same healthy/degraded decision that picks 200 or 503
- backend/tests/integration/test_health_integration.py: asserts the new field on 200 and 503, and the exact 405 body for POST

## Potential conflicts with other independent features
- No other row in feature_map.md touches the health endpoint files (backend/app/routers/health.py, backend/app/schemas/health.py, backend/app/services/health_service.py, backend/tests/integration/test_health_integration.py); TEST-02, which created them, is done.
- The map's shared_risk_notes for FEAT-5 (router registration in backend/app/main.py, shared with FEAT-4; overlap with the version endpoint of TEST-05 and TEST-09) no longer apply: the tracker restated FEAT-5 from /api/version to /api/health, the health router is already registered, and this plan modifies neither backend/app/main.py nor any version file. FEAT-4 is done in any case.
- Behavioural overlap, not a file conflict: FEAT-5 extends the response body TEST-02 specified (one added field on both the 200 and 503 paths). Any later item that changes /api/health must keep both TEST-02's status/database fields and FEAT-5's health field.
