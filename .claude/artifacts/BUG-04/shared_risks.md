# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard on submit (synchronous ref plus `isSaving` state), `disabled` and disabled style on the Save note button, release in `finally`
- frontend/src/components/NoteForm.test.tsx: new unit tests for the guard, including the reproduction test

## Potential conflicts with other independent features
- TEST-08 (PR #415, open, not yet merged) edits frontend/src/api/notes.ts, frontend/src/components/LandingPage.test.tsx, frontend/src/components/AppFooter.tsx and docs/DEVELOPMENT.md. This plan's File Manifest lists none of those four files: no textual overlap. One semantic touch point: `NoteForm.tsx` imports `createNote` and `Note` from `../api/notes`, and `NoteForm.test.tsx` mocks that module with `vi.mock("../api/notes", ...)`. TEST-08 only moves the API base URL into a new frontend/src/api/baseUrl.ts, so as long as `notes.ts` keeps exporting `createNote` and `Note` the import and the mock stay valid in either merge order. Safe to run concurrently; re-run `npm --prefix frontend test` after whichever merges second.
- frontend/src/components/LandingPage.tsx: the feature map flags BUG-04 with TEST-08 and TEST-10 on this file ("note-form submit wiring"). This plan does not modify it (the fix lives entirely in NoteForm.tsx and `onCreated` is unchanged), so that flagged pair no longer collides; the scheduler need not serialize BUG-04 against TEST-08 or TEST-10 on it.
- backend/app/routers/notes.py, backend/app/services/note_service.py, backend/app/repositories/note_repository.py: the feature map flags TEST-12 "if the fix is server-side". The fix is client-side only, so no overlap with TEST-12 or any notes-backend item.
- None of the other in-flight or ready items (TEST-10, CHORE-02, BUG-01, TEST-09) lists NoteForm.tsx, NoteForm.test.tsx or the new e2e/UAT paths.
