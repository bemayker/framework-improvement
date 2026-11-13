# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/apiBaseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports API_BASE_URL from the new apiBaseUrl module instead of declaring it (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetches the backend version at runtime, explicit loading and failure states
- frontend/src/components/AppFooter.test.tsx: version client mocked, present, pending, failed and unresolved paths
- frontend/src/components/LandingPage.test.tsx: version client mocked, footer asserts the backend version instead of package.json
- e2e/tests/TEST-04_page_footer.spec.ts: stops asserting the frontend package.json version
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source line corrected to the backend
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source line corrected to the backend

Not modified: frontend/src/components/LandingPage.tsx (the description expected it; AppFooter owns the fetch instead). No backend file: GET /api/version already exists from TEST-05.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, queued; its note-form double-submit fix is tested through the landing page). Serialize the builds if both manifests list it.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent) if its fix lands client-side in createNote. Serialize if both manifests list it.
- frontend/src/components/LandingPage.tsx: feature_map flags TEST-08 and BUG-04 on this file; this plan no longer touches it, so that overlap is cleared for TEST-08.
- backend/app/schemas/version.py, backend/app/routers/version.py, backend/app/services/version_service.py are modified by TEST-09 (independent, planned concurrently: build commit on the version endpoint). No file overlap, but a contract overlap: TEST-08 consumes GET /api/version. TEST-09's change must stay additive (keep the `version` string field); the TEST-08 client ignores extra fields.
- BUG-01 (backend server time): disjoint, no shared files.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will be modified later by TEST-10 and CHORE-02, both of which depend on TEST-08 (not concurrent).
