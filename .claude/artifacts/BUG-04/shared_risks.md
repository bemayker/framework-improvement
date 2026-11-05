# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard, disabled submit button while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard

## Potential conflicts with other independent features
- None on file level with TEST-08 (PR #592): it edits frontend/src/api/notes.ts, frontend/src/components/LandingPage.test.tsx and frontend/src/components/AppFooter*.tsx and adds frontend/src/api/baseUrl.ts; this plan touches none of those. The feature_map.md warning about frontend/src/components/LandingPage.tsx does not apply: the fix lives entirely in NoteForm.tsx and LandingPage.tsx is not edited.
- Behavioural note, not a file overlap: TEST-08 changes how frontend/src/api/notes.ts builds its base URL; NoteForm.test.tsx mocks that module, so the unit tests are unaffected, and the E2E spec matches the POST on its exact pathname, so a base-URL change does not affect it.
- None with TEST-09 (backend version only) or TEST-12 (notes router, service and repository): this fix is frontend-only.
- e2e/tests/ is shared by directory only; the spec file name is unique to BUG-04.
