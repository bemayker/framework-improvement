# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion()` resolves `{ version, commit }` instead of the version string
- frontend/src/api/version.test.ts: client tests for the commit field and the new resolved shape
- frontend/src/components/AppFooter.tsx: renders the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and no-commit component tests
- frontend/src/components/LandingPage.test.tsx: the version client mock returns the new shape
- e2e/tests/TEST-08_footer_app_version.spec.ts: only its first test, so it holds with or without a build commit

## Cross-feature test dependence on BUILD_COMMIT
- TEST-08's E2E spec (`e2e/tests/TEST-08_footer_app_version.spec.ts`, line 21) asserts the whole footer text `Task Notes v${backendVersion()}` against the real backend. Once TEST-10 renders the commit, that full-text match holds only while BUILD_COMMIT is unset (the backend answers `commit: "unknown"`, so no commit span renders). No workflow sets BUILD_COMMIT today, so it would pass by the commit's absence and break in the first environment that sets one, although TEST-08's promise still holds. This plan changes that first test to accept an optional ` ({7 hex characters})` suffix and to assert `app-version` directly; the failure test is untouched.
- Any later feature that sets BUILD_COMMIT in CI, compose or the E2E environment (for example a deploy or CI change) changes what the real-backend footer reads; specs that assert the footer against the live backend must tolerate the optional commit part.

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, wave 4, no dependency on TEST-10; feature_map.md flags it); serialize if run concurrently.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, being built concurrently) only if its fix moves into LandingPage; its approved manifest names frontend/src/components/NoteForm.tsx, NoteForm.test.tsx, its own E2E spec and UAT files, so there is no overlap with this plan. feature_map.md's flag on frontend/src/components/LandingPage.tsx does not apply: this plan does not modify LandingPage.tsx.
- BUG-03, CHORE-03 and FEAT-6 also edit AppFooter.tsx and the version client, but each depends on TEST-10, so they run after it and cannot run concurrently.
