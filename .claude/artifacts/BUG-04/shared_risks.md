# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard (ref plus isSaving state) in handleSubmit; submit button disabled while saving
- frontend/src/components/NoteForm.test.tsx: unit cases for the double submit and the disabled-while-saving button

## Potential conflicts with other independent features
- frontend/src/api/notes.ts is modified by TEST-08 (PR #700, open: imports API_BASE_URL from a new frontend/src/api/config.ts). BUG-04 does not edit it, but NoteForm.tsx imports `createNote` from it and NoteForm.test.tsx mocks that module; a rename or signature change of `createNote` in TEST-08 would break this build. The run holds BUG-04's build until TEST-08 merges.
- frontend/src/components/LandingPage.test.tsx is modified by TEST-08 (PR #700). BUG-04 does not edit it; it renders NoteForm, so a test there that asserts the submit button's state would see the new `disabled` attribute while a mocked save is pending.
- frontend/src/components/AppFooter.tsx is modified by TEST-08 (PR #700). BUG-04 does not edit it; no overlap beyond the shared LandingPage render.
- frontend/src/components/LandingPage.tsx: feature_map.md flags BUG-04 against TEST-08 and TEST-10 on this file. This plan does not modify it (the fix is inside NoteForm), so that flag is cleared by this plan.
- backend/app/routers/notes.py, backend/app/services/note_service.py, backend/app/repositories/note_repository.py: feature_map.md flags TEST-12 against BUG-04 if the fix were server-side. It is not; BUG-04 touches no backend file.
- e2e/tests/: TEST-12 may add a notes spec there; distinct file names, no conflict. Both create notes against the same database, which is safe because each spec uses a unique note text.
