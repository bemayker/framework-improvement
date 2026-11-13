# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled submit button while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard

## Potential conflicts with other independent features
- TEST-08 (in flight on feature/TEST-08-footer-app-version): its manifest names frontend/src/api/notes.ts and frontend/src/components/LandingPage.test.tsx. BUG-04 touches NEITHER of them, and does not touch frontend/src/components/LandingPage.tsx either (the feature_map.md note anticipated LandingPage.tsx; this plan keeps the fix inside NoteForm.tsx). No file overlap with TEST-08, so no serialization is needed on files. Behavioural note only: TEST-08 changes how notes.ts builds its base URL; NoteForm.test.tsx mocks `../api/notes` wholesale and the BUG-04 E2E spec matches on the request pathname, so neither depends on that change.
- TEST-10 (wave 4): feature_map.md flags LandingPage.tsx as shared; BUG-04 does not modify it, so no overlap.
- TEST-12 (notes router, service and repository): BUG-04 makes no backend change, so no overlap.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx may also be modified by any other item that changes the note form; none is named in feature_map.md's conflict notes for BUG-04.
