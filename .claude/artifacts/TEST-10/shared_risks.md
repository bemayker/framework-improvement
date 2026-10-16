# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchVersion()` resolves to a version-and-commit object; the short commit (first 7 characters) or null is added
- frontend/src/api/version.test.ts: assertions move to the object result; commit cases added
- frontend/src/components/AppFooter.tsx: holds the object and renders the `app-footer-commit` span after the version only when the commit is a string
- frontend/src/components/AppFooter.test.tsx: mock switched to the object result; success, pending and failure component tests
- frontend/src/components/LandingPage.test.tsx: fetchVersion mock switched to the object result (version plus a commit or null) so the existing footer-version assertion keeps passing

## Potential conflicts with other independent features
- BUG-04 (building concurrently in `.claude/worktrees/BUG-04`): no overlapping files. BUG-04 plan manifest is `frontend/src/components/NoteForm.tsx`, `frontend/src/components/NoteForm.test.tsx`, `e2e/tests/BUG-04_double_submit_note.spec.ts`, `e2e/uat/scenarios/BUG-04_double_submit_note.feature`, `e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md` and `.claude/artifacts/BUG-04/uat_script.md`; none appears above. TEST-10 now modifies `frontend/src/components/LandingPage.test.tsx` (the test file only, a one-line mock change), while `LandingPage.tsx` itself stays unmodified; BUG-04 lists neither. Safe to run concurrently, though if BUG-04 later adds a LandingPage test case, a trivial merge in `LandingPage.test.tsx` is possible.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, wave 4, independent of TEST-10, could run concurrently): CHORE-02 is flagged for a fetch timeout in `version.ts` and possibly `AppFooter.tsx`, and `version.test.ts` / `AppFooter.test.tsx` / `LandingPage.test.tsx` would follow. Serialize TEST-10 and CHORE-02.
- BUG-03 (depends on TEST-10, so never concurrent): it targets the footer showing `unknown` as the commit; this plan already hides the `unknown` sentinel, so BUG-03 may be found satisfied. Not a conflict, recorded for its planner.
- CHORE-03 (TEST-10 follow-up, depends on TEST-10): sequential by dependency, no conflict.
