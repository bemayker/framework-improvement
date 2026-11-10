# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion` resolves `{ version, commit } | null`, commit cut to 7 characters
- frontend/src/api/version.test.ts: cases moved to the new shape, commit cases added
- frontend/src/components/AppFooter.tsx: renders the short commit after the version
- frontend/src/components/AppFooter.test.tsx: success, version-without-commit, pending and failure paths
- frontend/src/components/LandingPage.test.tsx: the version mock resolves the new object shape

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx: BUG-04 (planned concurrently) lists only frontend/src/components/NoteForm.tsx and NoteForm.test.tsx in its manifest, so no file is shared today; feature_map.md flags the LandingPage area for the pair, so serialize the builds if BUG-04's build widens to LandingPage.tsx or LandingPage.test.tsx.
- frontend/src/api/version.ts may also be modified by CHORE-02 (TEST-08 follow-up, fetch timeout; independent of TEST-10, could run concurrently)
- frontend/src/api/version.test.ts may also be modified by CHORE-02 (independent, could run concurrently)
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx may also be modified by CHORE-02 (independent, could run concurrently)
- frontend/src/api/version.ts return-shape change: any item that calls or mocks `fetchBackendVersion` as returning a string (today only AppFooter.tsx, AppFooter.test.tsx and LandingPage.test.tsx) breaks after TEST-10 merges; CHORE-02 must rebase onto it.
