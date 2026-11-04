# Shared Risk Analysis, BUG-01

## Files this feature will create
- backend/app/schemas/server_time.py
- backend/app/services/server_time_service.py
- backend/app/routers/server_time.py
- backend/tests/unit/test_server_time_service_unit.py
- backend/tests/integration/test_server_time_integration.py
- e2e/uat/scenarios/BUG-01_server_time_no_store.feature
- e2e/uat/scripts/BUG-01_server_time_no_store_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: import and register the server time router (FEAT-1's code is absent from main 1f1df4f, so BUG-01 recreates it).
- backend/tests/unit/test_main_unit.py: add the `/api/time` route registration test.

## Potential conflicts with other independent features
- backend/app/main.py: TEST-09 (in flight, extends GET /api/version) reports its plan does not touch it, and its File Manifest lists no `main.py` entry; feature_map.md flags it as a plausible edit, so serialize the builds only if TEST-09's final manifest gains `main.py`.
- backend/tests/unit/test_main_unit.py: not in TEST-09's File Manifest; same condition as `main.py` if TEST-09 adds a version route assertion there.
- No file shared with TEST-08 (frontend footer: `frontend/src/**`, `e2e/tests/TEST-04_page_footer.spec.ts`, TEST-04 and TEST-08 UAT files); disjoint.
- Adjacent but not shared with TEST-09: both add files under `backend/app/routers/`, `backend/app/schemas/`, `backend/app/services/` and the backend test directories, all distinct paths; no merge conflict expected.
