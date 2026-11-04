# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled submit button while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the button state

## Potential conflicts with other independent features
- No overlap with TEST-08 (in flight, PR open). TEST-08 changes frontend/src/api/baseUrl.ts, frontend/src/api/version.ts and its test, frontend/src/api/notes.ts, frontend/src/components/AppFooter.tsx and its test, frontend/src/components/LandingPage.test.tsx, e2e/helpers/backendVersion.ts, the TEST-08 and TEST-04 E2E specs and UAT files; BUG-04 touches none of them. In particular the feature_map warning about frontend/src/components/LandingPage.tsx does not materialize: the fix lives entirely in NoteForm.tsx, and LandingPage.tsx is not modified. BUG-04 can build concurrently with TEST-08.
- NoteForm.tsx imports `createNote` from frontend/src/api/notes.ts, which TEST-08 edits (an import swap for the base URL). BUG-04 does not edit notes.ts and does not change the `createNote` signature, so there is no textual conflict; the only coupling is that BUG-04's E2E spec must match the notes request on its pathname `/api/notes`, not on a host, so it passes against either base-URL source.
- No overlap with TEST-10 (wave 4, footer): BUG-04 does not touch AppFooter.tsx or LandingPage.tsx.
- No overlap with TEST-09 (merged, backend version endpoint) or BUG-01 (backend only).
- No overlap with TEST-12 (notes router, service and repository): BUG-04's fix is client-side and leaves backend/app/routers/notes.py, backend/app/services/note_service.py and backend/app/repositories/note_repository.py untouched.
- e2e/tests/TEST-03_simple_note_form.spec.ts is not modified; its flows (single click save, empty and whitespace validation, reload) are unaffected by the guard, but any item that later edits NoteForm.tsx (none known in feature_map.md) would share that file with BUG-04.
