# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled Save note button while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the disabled state

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan: the fix stays inside NoteForm, so the feature_map flag against TEST-08 and TEST-10 (LandingPage.tsx) does not materialize. The pair can be unflagged once this plan is approved.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx: no other open item (TEST-08, TEST-09, TEST-10, BUG-01, BUG-02, BUG-03, CHORE items) is expected to touch them.
- e2e/tests/TEST-03_simple_note_form.spec.ts exercises the same form; it is not edited, but its single-click specs must stay green with the button now disabled during the request (they wait for the 201 before asserting, so no change is expected).
- TEST-09 and BUG-01 are backend only: disjoint.
