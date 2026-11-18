# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard, button disabled while a save is pending
- frontend/src/components/NoteForm.test.tsx: new double-submit, disabled-state and retry-after-failure cases

## Potential conflicts with other independent features
- None on file level. The map's note that BUG-04 "plausibly edits frontend/src/components/LandingPage.tsx" does not hold for this plan: the fix stays inside NoteForm, and LandingPage.tsx, LandingPage.test.tsx and frontend/src/api/notes.ts are not modified.
- TEST-08 (merged) and TEST-10 (planned concurrently; expected to touch frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts): disjoint from this item's files, so no serialization is needed.
- TEST-12 and the other notes-backend items (routers/notes.py, note_service.py, note_repository.py): disjoint, because this fix is client-side only.
- No shared E2E spec or helper is edited (nothing under e2e/tests/ or e2e/helpers/).
