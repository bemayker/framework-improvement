# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled submit button
- frontend/src/components/NoteForm.test.tsx: unit cases for the guard and the re-enable

## Potential conflicts with other independent features
- None by file. TEST-08 (open, independent) lists frontend/src/api/notes.ts, frontend/src/components/AppFooter.tsx, AppFooter.test.tsx and LandingPage.test.tsx; BUG-04 touches none of them, and the map's predicted LandingPage.tsx overlap does not materialize because the fix stays inside NoteForm.tsx.
- TEST-12 (independent): a server-side dedupe would have shared the notes router, service and repository; this fix is client-side only, so there is no overlap.
- TEST-10 (wave 4): predicted LandingPage.tsx overlap does not materialize for the same reason.
- No other neighbour's listed files (TEST-02, TEST-04, TEST-05, TEST-09, BUG-01) intersect this item's files.
