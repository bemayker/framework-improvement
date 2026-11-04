# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled "Save note" button while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the disabled state

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx and frontend/src/components/LandingPage.test.tsx: NOT modified by this plan (the fix stays inside NoteForm, whose onCreated contract is unchanged), so the feature map's flagged overlap with TEST-08 and TEST-10 on LandingPage.tsx does not materialize.
- frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts (TEST-10): not touched; disjoint.
- backend notes router, service and repository (TEST-12): not touched, the fix is client-side only; disjoint.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx may also be modified by any later item changing the note form (none currently in feature_map.md besides TEST-03, which is merged and is this item's dependency).
