# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports API_BASE_URL from the new baseUrl.ts instead of declaring it
- frontend/src/components/AppFooter.tsx: fetches the version from GET /api/version instead of importing frontend/package.json
- frontend/src/components/AppFooter.test.tsx: tests rewritten around a mocked version client
- frontend/src/components/LandingPage.test.tsx: adds a mock of ../api/version; footer assertion uses the mocked version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml instead of frontend/package.json

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; PR 203 in CI). BUG-04 is scoped to NoteForm.tsx, but a double-submit regression test could land in LandingPage.test.tsx; if both change it, the second to merge must keep both the ../api/version mock and the new test.
- frontend/src/components/LandingPage.tsx: feature_map.md flags TEST-08 and BUG-04 as both plausibly editing it. This plan does NOT modify it (AppFooter owns its own fetch), so that flagged overlap does not materialise for TEST-08.
- frontend/src/api/notes.ts may also be touched by BUG-04 if its double-submit fix lands in the client rather than the form (independent, could run concurrently). TEST-08 only replaces the API_BASE_URL declaration with an import.
- GET /api/version response shape is being extended by TEST-09 (independent, PR 202 in CI): adds a commit field to backend/app/schemas/version.py. No file overlap with this plan; the client reads only version and ignores extra fields, so either merge order works. TEST-09 may update backend/tests/integration/test_version_integration.py; TEST-08 does not touch it.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will later be modified by TEST-10 and CHORE-02 (both depend on TEST-08, so not concurrent with it; they are serialized against each other in feature_map.md).
- e2e/uat/scenarios/TEST-04_page_footer.feature and e2e/uat/scripts/TEST-04_page_footer_uat_script.md still describe the footer version as coming from frontend/package.json. They are completed TEST-04 artifacts and are not in this plan; they become stale descriptions once TEST-08 merges (Gherkin is validated for well-formedness only, so nothing fails).
