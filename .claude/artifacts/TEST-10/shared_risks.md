# Shared Risk Analysis, TEST-10

## Files this feature will create
- frontend/src/api/apiBaseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: base URL constant moves to apiBaseUrl.ts and is imported
- frontend/src/components/AppFooter.tsx: fetch the commit on mount and append its first 7 characters
- frontend/src/components/AppFooter.test.tsx: mock the version client; success, pending and failure tests
- frontend/src/components/LandingPage.test.tsx: mock the version client so the page test makes no request

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (double-submit of a note; independent, planning concurrently). TEST-10 adds one `vi.mock` block near the existing notes mock. `frontend/src/components/LandingPage.tsx` itself is NOT touched by TEST-10, so the feature map's flagged overlap on that file does not apply.
- frontend/src/api/notes.ts may also be modified by BUG-04 if its fix reaches the notes client (independent, could run concurrently). TEST-10's change is limited to the base-URL lines.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (feature map flags both; serialize if run concurrently).
