# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled submit button while a save is pending
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the disabled state

## Potential conflicts with other independent features
- None on a file: no `independent` item from the neighbours call lists NoteForm.tsx, NoteForm.test.tsx or a BUG-04 test file (neighbours BUG-04: rows=53 independent=50 with-files=6).
- TEST-08 (PR #987, open, branch feature/TEST-08-footer-app-version) edits frontend/src/api/notes.ts (moves API_BASE_URL into frontend/src/api/baseUrl.ts) and frontend/src/components/LandingPage.test.tsx. This plan touches neither, and TEST-08 leaves the `createNote(text)` signature NoteForm imports unchanged (checked with git diff origin/main...origin/feature/TEST-08-footer-app-version). The map row's flagged overlap on frontend/src/components/LandingPage.tsx does not materialise: this fix lives entirely in NoteForm.tsx. Holding the BUG-04 build behind TEST-08 is therefore not required by any shared file; it costs nothing beyond ordering.
- TEST-10 (wave 4) is flagged in the map on LandingPage.tsx; no overlap with this plan's files for the same reason.
- TEST-12 and its notes-backend successors (TEST-14, FEAT-2, FEAT-3, CHORE-04, TEST-15) edit backend/app/routers/notes.py, services/note_service.py and repositories/note_repository.py; this plan makes no server-side change (Assumption 2), so no overlap.
- e2e/tests/TEST-03_simple_note_form.spec.ts is not modified, but its specs exercise the same button: they must keep passing with the button disabled during a save (they wait for the 201 before asserting, so a disabled-while-pending button does not affect them).
