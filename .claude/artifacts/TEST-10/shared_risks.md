# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion` renamed to `getBackendVersionInfo`, returns `{ version, commit }` with the commit cut to 7 characters
- frontend/src/api/version.test.ts: tests moved to the new function, commit cases added
- frontend/src/components/AppFooter.tsx: renders the `app-commit` span after the version
- frontend/src/components/AppFooter.test.tsx: new mock shape, commit success, pending and failure cases
- frontend/src/components/LandingPage.test.tsx: new mock shape for the version client only

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/api/version.test.ts may also be modified by CHORE-02 (TEST-08 follow-up, a fetch timeout per `feature_map.md`; independent of TEST-10, could run concurrently). The rename of `getBackendVersion` makes this a certain textual conflict, not a plausible one: serialize.
- frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by CHORE-02 (independent, could run concurrently).
- frontend/src/components/LandingPage.test.tsx: BUG-04 (planned, awaiting approval) does not list it; its plan names `NoteForm.tsx`, `NoteForm.test.tsx` and its own `BUG-04_*` E2E and UAT files, and explicitly leaves `LandingPage.tsx` and `LandingPage.test.tsx` untouched. `feature_map.md` flags TEST-10 and BUG-04 on `LandingPage.tsx`, but this plan does not modify `LandingPage.tsx`, so there is no file overlap with BUG-04 and no serialization is needed between them.
