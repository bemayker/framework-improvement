# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard, disabled submit button while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the disabled state

## Potential conflicts with other independent features
- None on file level with TEST-10 (footer shows the build commit): BUG-04 does not touch frontend/src/components/LandingPage.tsx, LandingPage.test.tsx or AppFooter.tsx. The feature_map.md conflict note predicted a LandingPage.tsx edit for the submit wiring; the fix lives entirely inside NoteForm.tsx, so that serialization is not needed.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx may also be modified by any later notes-form item (TEST-12 is noted in feature_map.md as touching the notes router, service and repository only, which this fix does not touch).
