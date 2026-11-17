# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: read the `commit` field, return `{ version, commit }` with the commit cut to 7 characters
- frontend/src/api/version.test.ts: new return shape and commit cases
- frontend/src/components/AppFooter.tsx: render the short commit in a sibling span after the version
- frontend/src/components/AppFooter.test.tsx: new mock shape and commit cases

## Potential conflicts with other independent features
- frontend/src/api/version.ts may also be modified by CHORE-02 (independent, could run concurrently; TEST-08 follow-up, fetch timeout). Serialize.
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx may also be modified by CHORE-02 (independent, could run concurrently). Serialize.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, footer build note). Serialize if both run.
- BUG-04 (building now): its manifest is frontend/src/components/NoteForm.tsx, NoteForm.test.tsx and its own e2e/UAT files. No file overlap with this plan: TEST-10 does not edit frontend/src/components/LandingPage.tsx (the feature map's plausible overlap note does not materialize, since the footer change stays inside AppFooter.tsx). Safe to run concurrently.
