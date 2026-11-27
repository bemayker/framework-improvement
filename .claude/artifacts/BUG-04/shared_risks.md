# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (ref plus `isSaving` state), disabled "Save note" button and its disabled style
- frontend/src/components/NoteForm.test.tsx: unit tests for double submit, keyboard resubmit, disabled and re-enabled button

## Potential conflicts with other independent features
- No independent item's `shared_risks.md` lists `frontend/src/components/NoteForm.tsx` or `NoteForm.test.tsx` (neighbours call: 51 independent items, 4 with file lists: TEST-02, TEST-04, TEST-05, TEST-08).
- frontend/src/components/LandingPage.tsx is NOT modified by this plan: the fix stays inside `NoteForm`, so the map's flagged overlap with TEST-08 (merged) and TEST-10 (footer, wave 4) on that file does not materialize. TEST-10 and CHORE-02 work in `AppFooter.tsx` and `frontend/src/api/version.ts`, which this plan does not touch.
- backend/app/routers/notes.py, services/note_service.py, repositories/note_repository.py are NOT modified: the fix is client-side, so the map's conditional overlap with TEST-12 ("if the fix is server-side") does not apply.
- e2e/tests/TEST-03_simple_note_form.spec.ts exercises the same form and is left unchanged; any item that changes the note form's test ids (`note-input`, `note-submit`, `note-form-error`, `note-list-item-*`) would break both specs.
