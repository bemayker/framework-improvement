# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled state on the "Save note" button
- frontend/src/components/NoteForm.test.tsx: new unit tests for double submit, disabled-while-saving and re-enable after success or failure

## Potential conflicts with other independent features
- None by file. feature_map.md flagged frontend/src/components/LandingPage.tsx as shared with TEST-08 and TEST-10; this plan fixes the defect inside NoteForm.tsx and does not touch LandingPage.tsx or LandingPage.test.tsx, so that flag does not materialize.
- TEST-08 (in flight) changes AppFooter.tsx, AppFooter.test.tsx, LandingPage.test.tsx, frontend/src/api/notes.ts, baseUrl.ts, version.ts, version.test.ts and e2e/tests/TEST-04_page_footer.spec.ts: disjoint from this item's files. NoteForm.tsx imports createNote from frontend/src/api/notes.ts, which TEST-08 modifies; the plan relies only on createNote's existing signature (text in, Promise of the stored note out), so a TEST-08 refactor of the base URL does not conflict unless it changes that signature.
- TEST-12 edits backend/app/routers/notes.py, note_service.py and note_repository.py: disjoint, this fix is client-side only.
