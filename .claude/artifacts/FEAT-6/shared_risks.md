# Shared Risk Analysis, FEAT-6

## Files this feature will create
- backend/app/routers/stamp.py
- backend/app/services/stamp_service.py
- backend/app/schemas/stamp.py
- backend/tests/unit/test_stamp_service_unit.py
- backend/tests/integration/test_stamp_integration.py
- frontend/src/api/config.ts
- frontend/src/api/stamp.ts
- frontend/src/api/stamp.test.ts
- e2e/tests/FEAT-6_stamp_endpoint_and_footer.spec.ts
- e2e/uat/scenarios/FEAT-6_stamp_endpoint_and_footer.feature
- e2e/uat/scripts/FEAT-6_stamp_endpoint_and_footer_uat_script.md

## Existing files this feature will modify
- backend/app/main.py: registers the stamp router
- backend/tests/unit/test_main_unit.py: asserts the /api/stamp route is registered
- frontend/src/api/notes.ts: reads the API base URL from the new shared config module
- frontend/src/components/AppFooter.tsx: fetches and renders the stamp
- frontend/src/components/AppFooter.test.tsx: covers the stamp rendering
- frontend/src/components/LandingPage.test.tsx: mocks the stamp client

## Potential conflicts with other independent features
- backend/app/main.py and backend/tests/unit/test_main_unit.py are edited by every router-registering item (TEST-02, TEST-05, TEST-06, TEST-07, FEAT-1, TEST-09, TEST-13, FEAT-4, FEAT-5); per feature_map.md all are complete or cancelled, so no open item overlaps today. Serialize with any new item that registers a router.
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx were edited by TEST-04 and TEST-08 (both complete); serialize with any new footer item.
- frontend/src/api/notes.ts and frontend/src/components/LandingPage.test.tsx are notes-UI files (TEST-03, BUG-04, TEST-10, all complete); serialize with any new item touching the notes client or the landing page.
