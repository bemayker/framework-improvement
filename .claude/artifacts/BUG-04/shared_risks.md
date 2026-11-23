# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled button while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the button state

## Potential conflicts with other independent features
- No file overlap with TEST-08 (PR #958, in flight). TEST-08's files (from its branch) are frontend/src/api/apiBaseUrl.ts, frontend/src/api/version.ts and its test, frontend/src/api/notes.ts, frontend/src/components/AppFooter.tsx and its test, frontend/src/components/LandingPage.test.tsx, and its own TEST-04 and TEST-08 e2e and UAT files. BUG-04 touches none of them, and does not touch frontend/src/components/LandingPage.tsx, so the map's "plausibly both edit LandingPage.tsx" flag does not hold for this plan and the two can run concurrently.
- Semantic dependency on TEST-08, not a file conflict: NoteForm.tsx imports `createNote` from frontend/src/api/notes.ts, and NoteForm.test.tsx mocks `../api/notes`. TEST-08 only moves the base-URL import inside notes.ts; as long as `createNote` and `Note` keep their names and module, BUG-04 needs no change after TEST-08 merges.
- TEST-10 (wave 4, not started): its map row flags LandingPage.tsx against BUG-04; this plan does not edit LandingPage.tsx, so no conflict.
- TEST-12 (notes router, service and repository): no overlap, because this fix is client-side only.
