# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (ref flag plus `isSaving` state) and a disabled "Save note" button while a save is pending
- frontend/src/components/NoteForm.test.tsx: reproduction test for the double submit, disabled-state tests, retry-after-failure test

## Potential conflicts with other independent features
- None on file level for the current build. The fix does not touch `frontend/src/components/LandingPage.tsx`, `frontend/src/api/notes.ts`, `AppFooter.tsx` or any backend file.
- TEST-08 (in flight) edits `frontend/src/components/LandingPage.test.tsx`, `frontend/src/api/notes.ts` (imports `API_BASE_URL` from a new `frontend/src/api/baseUrl.ts`) and `AppFooter.tsx`: disjoint from BUG-04's two files, so BUG-04's build need not wait for TEST-08's merge. `NoteForm.test.tsx` mocks `../api/notes` wholesale, so TEST-08's change to that module's internals does not reach it.
- TEST-10 (wave 4) plausibly edits `frontend/src/components/LandingPage.tsx`: disjoint from BUG-04, which does not edit that file.
- TEST-12 (notes router, service and repository): disjoint, BUG-04 is client-side only and makes no server-side dedupe change.
- The feature map row's warning that BUG-04 edits `LandingPage.tsx` is superseded by this plan: the `onCreated` wiring there is unchanged.
