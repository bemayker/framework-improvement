# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled Save note button while a save is pending
- frontend/src/components/NoteForm.test.tsx: unit tests for overlapping submits, disabled state, retry after failure, sequential same-text saves

## Potential conflicts with other independent features
- None on file paths. TEST-08 (in review) lists frontend/src/api/notes.ts, AppFooter.tsx, AppFooter.test.tsx and LandingPage.test.tsx; this fix touches none of them. The feature map's warning about frontend/src/components/LandingPage.tsx (TEST-08, TEST-10) does not apply: this plan leaves LandingPage.tsx untouched.
- TEST-12 (notes router, service and repository): no overlap, this fix is client-side only.
