# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (ref plus `isSaving` state) and a disabled "Save note" button while a save is pending
- frontend/src/components/NoteForm.test.tsx: repro and guard tests

## Potential conflicts with other independent features
- None on file level with TEST-08 (PR #576, open, in flight): TEST-08 changes frontend/src/api/config.ts (new), frontend/src/api/notes.ts (import of API_BASE_URL), frontend/src/api/version.ts, frontend/src/components/AppFooter.tsx and frontend/src/components/LandingPage.test.tsx; this plan touches none of them. The feature map's warning that BUG-04 and TEST-08 both edit frontend/src/components/LandingPage.tsx does not apply to this plan: the fix stays inside NoteForm.tsx and LandingPage.tsx is not modified. Residual, non-file risk: NoteForm.test.tsx mocks `../api/notes` wholesale; TEST-08's change to notes.ts keeps `createNote`'s signature, so the mock stays valid.
- None with TEST-10: feature_map.md names frontend/src/components/LandingPage.tsx as shared with TEST-10 (wave 4), and this plan does not modify LandingPage.tsx.
- None with TEST-09 and BUG-01 (merged, backend only) or TEST-12 (notes router, service and repository): this fix is client-side only and changes no backend file.
