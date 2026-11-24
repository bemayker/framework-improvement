# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard on submit, Save note button disabled while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard and its release

## Potential conflicts with other independent features
None. This fix does not modify LandingPage.tsx, so the overlap the feature map anticipated with TEST-10 and TEST-08 on that file does not materialize, and no file listed by any neighbour's shared_risks.md (TEST-02, TEST-04, TEST-05, TEST-08, TEST-09, BUG-01) is in this set. The notes backend items (TEST-12, TEST-14, FEAT-2, FEAT-3) do not overlap either: the fix is client-side and edits no backend file.
