# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard on submit, Save note disabled while a save is pending
- frontend/src/components/NoteForm.test.tsx: reproduction and button-state cases

## Potential conflicts with other independent features
- TEST-10 (Footer shows the build commit, planned in parallel): no shared file. Its plausible set is frontend/src/components/LandingPage.test.tsx, frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts; this fix touches none of them. The feature_map.md warning that both edit frontend/src/components/LandingPage.tsx does not hold for this plan: the fix stays inside NoteForm and leaves LandingPage.tsx and its onCreated wiring unchanged.
- TEST-08 (merged at plan base): no remaining overlap, for the same reason (LandingPage.tsx untouched).
- TEST-12 (Read one note by id): no shared file. The fix is client-side, so backend/app/routers/notes.py, backend/app/services/note_service.py and backend/app/repositories/note_repository.py are untouched.
- BUG-01 and TEST-09: backend only, disjoint.
- frontend/src/components/NoteForm.tsx may also be modified by any later item that changes the note form; none in feature_map.md is known to.
