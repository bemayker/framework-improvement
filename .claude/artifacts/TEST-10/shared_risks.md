# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion()` returns `{ version, commit }` instead of a string
- frontend/src/api/version.test.ts: client tests for the new shape and the commit parsing
- frontend/src/components/AppFooter.tsx: renders the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure paths with the commit
- frontend/src/components/LandingPage.test.tsx: version mock returns the object shape; footer assertion includes the commit
- e2e/tests/TEST-08_footer_app_version.spec.ts: happy-path assertion tolerates the commit suffix

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, fetch timeout; independent of TEST-10, could run concurrently)
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; the dispatch states BUG-04 builds in NoteForm.tsx and NoteForm.test.tsx, so the overlap is plausible rather than planned)
- Any change to the return shape of `fetchBackendVersion()` affects BUG-03, CHORE-03 and FEAT-6, which depend on TEST-10 and so run after it (sequenced, not concurrent)
