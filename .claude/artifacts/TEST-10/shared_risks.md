# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchAppVersion()` returns `{ version, commit }` instead of a bare version string (public signature change)
- frontend/src/api/version.test.ts: tests updated to the new return shape, commit cases added
- frontend/src/components/AppFooter.tsx: renders the 7-character commit after the version
- frontend/src/components/AppFooter.test.tsx: success, version-only, pending and failure cases
- e2e/tests/TEST-08_footer_app_version.spec.ts: footer text assertion accepts an optional commit suffix

## Potential conflicts with other independent features
- frontend/src/api/version.ts, frontend/src/api/version.test.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, wave 4, independent of TEST-10, could run concurrently); CHORE-02 is also the most likely other editor of e2e/tests/TEST-08_footer_app_version.spec.ts. Serialize the pair.
- frontend/src/components/LandingPage.tsx is flagged in feature_map.md against BUG-04, but this plan does not modify it (the footer is already mounted there), and BUG-04 is merged; no conflict expected.
- BUG-03, CHORE-03 and FEAT-6 also edit AppFooter.tsx and the version client but all depend on TEST-10, so they cannot run concurrently with it; they must build on the `AppVersion | null` return shape this item introduces.
