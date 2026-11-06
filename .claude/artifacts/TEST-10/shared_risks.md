# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: resolve `{ version, commit }` instead of a bare version string
- frontend/src/api/version.test.ts: assertions follow the new resolved shape, commit cases added
- frontend/src/components/AppFooter.tsx: render the 7-character commit in an `app-commit` span after the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure paths against the new shape
- frontend/src/components/LandingPage.test.tsx: the `../api/version` mock resolves `{ version: "9.9.9", commit: null }` instead of `"9.9.9"`

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; planned in parallel in this run). TEST-10 changes only the `vi.mock("../api/version", ...)` block near the top; a BUG-04 double-submit test would land in the note-form tests lower in the file. The hunks are disjoint, but serialize the merges and rebase the second branch.
- frontend/src/components/LandingPage.tsx is NOT modified by this plan (the footer fetch lives inside `AppFooter`), so the `feature_map.md` warning that TEST-10 and BUG-04 both edit it does not materialize for TEST-10. NoteForm.tsx is not touched either.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, fetch timeout; independent, could run concurrently), as `feature_map.md` already flags. Serialize if both run in the same wave.
