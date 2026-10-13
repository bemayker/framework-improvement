# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: reads API_BASE_URL from the new baseUrl.ts
- frontend/src/components/AppFooter.tsx: runtime fetch of GET /api/version replaces the package.json import
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent, loading and sentinel cases
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion re-pointed
- e2e/tests/TEST-04_page_footer.spec.ts: version expectation from GET /api/version instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source wording
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source wording

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx: the feature map flags TEST-08 and BUG-04 on this file; this plan does NOT modify it, so that overlap does not materialise. BUG-04 (PR #151) edits only NoteForm.tsx, NoteForm.test.tsx and its own E2E spec, none of which TEST-08 touches.
- frontend/src/components/LandingPage.test.tsx: modified here (mock of ../api/version, footer assertion). BUG-04 is not expected to touch it; if its PR does, serialize.
- frontend/src/api/version.ts and AppFooter.tsx: created/modified here and later edited by TEST-10 and CHORE-02, both of which depend on TEST-08, so no concurrent conflict.
- GET /api/version response shape: TEST-09 (PR #150, independent) adds a `commit` field to the backend response. No shared file; the client ignores extra fields, so either merge order is safe.
- frontend/src/api/notes.ts: no other open item is known to edit it.
