# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/config.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports API_BASE_URL from ./config instead of computing it (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetches the version from GET /api/version instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, loading and failure renders
- frontend/src/components/LandingPage.test.tsx: footer assertion follows the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from the GET /api/version response, not package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: one step reworded (version source)
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: one step reworded (version source)

Not modified: frontend/src/components/LandingPage.tsx, frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx, anything under backend/.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (in flight) if its fix adds a page-level double-submit test; BUG-04 is declared to edit NoteForm.tsx and NoteForm.test.tsx only, so the overlap is unlikely. The feature_map flag on LandingPage.tsx no longer applies: this plan leaves LandingPage.tsx untouched.
- GET /api/version response shape is extended by TEST-09 (in flight, additive commit field). No shared file; this client reads only version and ignores extra fields, so either merge order is safe.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will be modified by TEST-10 and CHORE-02 (both depend on TEST-08, so not concurrent with it).
