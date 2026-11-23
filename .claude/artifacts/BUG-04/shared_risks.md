# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (ref plus state) and disabled submit button while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the disabled state

## Potential conflicts with other independent features
- No file overlap with TEST-08 (PR #966, in flight): its files are frontend/src/api/baseUrl.ts, frontend/src/api/version.ts, frontend/src/api/notes.ts, AppFooter.tsx, AppFooter.test.tsx and LandingPage.test.tsx. BUG-04 does not touch LandingPage.tsx, LandingPage.test.tsx or frontend/src/api/notes.ts, so the feature_map warning about LandingPage.tsx does not materialize; the build does not need to wait for TEST-08 on file grounds. Behavioural coupling only: NoteForm imports `createNote` from frontend/src/api/notes.ts, whose signature TEST-08 keeps unchanged (it only moves the base URL import).
- No overlap with TEST-12 (notes router, service, repository): BUG-04 is client-side only, no backend file changes.
- No overlap with TEST-10: its listed shared file is LandingPage.tsx, which BUG-04 does not modify.
