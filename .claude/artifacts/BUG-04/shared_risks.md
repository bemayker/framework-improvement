# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard in handleSubmit, submit button disabled while saving
- frontend/src/components/NoteForm.test.tsx: new unit cases for double submit and guard release

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan. The feature_map.md note pairing BUG-04 with TEST-08 (and TEST-10, wave 4) on that file was a plausibility guess; the fix lives entirely inside NoteForm, so on this plan BUG-04 and TEST-08 share no file and need not be serialized on LandingPage.tsx.
- frontend/src/components/NoteForm.tsx may also be modified by TEST-10 if that item touches the note-form wiring (map shares LandingPage.tsx only; wave 4, not concurrent with this wave).
- No backend file is touched, so BUG-04 is disjoint from TEST-09, BUG-01 and TEST-12 (notes router, service, repository).
