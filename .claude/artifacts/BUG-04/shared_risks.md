# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (useRef plus isSaving state) and the submit button disabled while saving
- frontend/src/components/NoteForm.test.tsx: unit cases for the double submit, the disabled state and re-enabling after success and failure

## Potential conflicts with other independent features
- None on file level with TEST-08 (in its PR, unmerged): TEST-08 touches frontend/src/api/baseUrl.ts, frontend/src/api/version.ts, frontend/src/api/notes.ts (import-only), frontend/src/components/AppFooter.tsx, their tests and frontend/src/components/LandingPage.test.tsx. BUG-04 touches none of them. The feature_map.md row anticipated a LandingPage.tsx overlap, but this plan leaves LandingPage.tsx unchanged, so the pair need not be serialized on that file.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx may also be modified by any later note-form feature (TEST-10 is flagged in the map on the same landing-page area, wave 4): check its plan before running them concurrently.
- Disjoint from TEST-09 and BUG-01 (backend only), and from TEST-12 (notes router, service and repository), because this fix is client-side only.
