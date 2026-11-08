# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (ref plus state), disabled "Save note" button while a save is pending
- frontend/src/components/NoteForm.test.tsx: reproduction case and in-flight / release cases

## Potential conflicts with other independent features
- None on the files above. TEST-08 (PR #655, in flight) changes frontend/src/components/AppFooter.tsx, frontend/src/api/version.ts, frontend/src/api/baseUrl.ts (new), frontend/src/api/notes.ts and frontend/src/components/LandingPage.test.tsx; BUG-04 edits none of them. The feature_map row's flagged overlap on frontend/src/components/LandingPage.tsx does not materialize: the fix lives in NoteForm.tsx and LandingPage.tsx is not modified, so the TEST-08 and TEST-10 serialization advice for that file no longer applies to BUG-04.
- Indirect, not a file collision: TEST-08 moves API_BASE_URL out of frontend/src/api/notes.ts into frontend/src/api/baseUrl.ts. NoteForm.test.tsx mocks the whole "../api/notes" module and NoteForm.tsx imports only createNote and Note from it, both of which TEST-08 keeps, so BUG-04 is unaffected; a rebase onto TEST-08's merge needs no change here. The BUG-04 E2E spec runs against whatever base URL the merged client resolves.
- TEST-12 (notes router, service and repository) was flagged for a server-side BUG-04 fix; this plan is client-side only, so there is no overlap with TEST-12.
- e2e/tests/TEST-03_simple_note_form.spec.ts and its UAT files are not edited; BUG-04's spec reuses its patterns in its own file.
