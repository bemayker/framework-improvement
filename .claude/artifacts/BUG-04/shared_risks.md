# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard on submit, `disabled` on the submit button while saving
- frontend/src/components/NoteForm.test.tsx: three added Vitest cases

## Potential conflicts with other independent features
- TEST-08 (PR #764, not yet merged) modifies `frontend/src/api/notes.ts` and `frontend/src/components/LandingPage.test.tsx`. This plan lists neither file, so there is no direct overlap and no build hold is needed on that account. Indirect coupling only: `NoteForm.tsx` imports `createNote` from `../api/notes`; TEST-08 moves `API_BASE_URL` out of that module but is not expected to change the `createNote` export. If TEST-08 renames or moves `createNote`, the import in `NoteForm.tsx` and the `vi.mock("../api/notes")` in `NoteForm.test.tsx` must follow.
- `frontend/src/components/LandingPage.tsx`: feature_map.md flags BUG-04 and TEST-08 (and TEST-10, wave 4) as plausibly sharing it. This plan does not modify it (the fix lives entirely in `NoteForm`), so the flagged serialization is not needed for this file.
- `frontend/src/components/NoteForm.tsx` and `NoteForm.test.tsx` may also be modified by any later item touching the note form (TEST-10 if it changes form wiring); serialize with BUG-04 if run concurrently.
- Backend notes router, service and repository: feature_map.md mentions TEST-12 overlap "if the fix is server-side". This fix is client-side only, so no overlap with TEST-12.
