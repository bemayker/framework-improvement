# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: return `{ version, commit }`, commit cut to 7 characters
- frontend/src/api/version.test.ts: client tests for the commit field
- frontend/src/components/AppFooter.tsx: render the short commit after the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and version-alone paths
- frontend/src/components/LandingPage.test.tsx: `fetchBackendVersion` mock returns the new object shape

## Potential conflicts with other independent features
- BUG-04 (independent, planned concurrently): no file overlap. Its listed set is frontend/src/components/NoteForm.tsx, NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts and its BUG-04 UAT files; TEST-10 touches none of them. The feature map's warning that both plausibly edit frontend/src/components/LandingPage.tsx does not hold for this plan: TEST-10 does not edit LandingPage.tsx. TEST-10 does edit frontend/src/components/LandingPage.test.tsx (one mock value); if BUG-04's build ends up editing that test file too, serialize the two builds or expect a trivial merge.
- CHORE-02 (independent, TEST-08 follow-up): frontend/src/api/version.ts, frontend/src/components/AppFooter.tsx and likely their tests may also be modified by CHORE-02 (fetch timeout vs reading the commit field); serialize if run concurrently.
- FEAT-9 (independent, verify item): frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (footer build note); serialize if run concurrently.
