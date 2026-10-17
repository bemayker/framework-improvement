# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard, button disabled while saving
- frontend/src/components/NoteForm.test.tsx: new unit tests including the reproduction

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx: NOT modified by BUG-04. The feature_map flag (BUG-04 and TEST-08, and BUG-04 and TEST-10, on LandingPage.tsx) does not hold for this plan, so TEST-08 need not be serialized behind BUG-04 on that file.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx: no other open item in feature_map.md names them. TEST-12 (read one note by id, also depends on TEST-03) is backend-oriented by its title; flag only if its plan turns out to edit NoteForm.
- e2e/: new files only, no shared edits.
