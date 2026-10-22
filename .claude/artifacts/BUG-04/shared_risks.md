# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled "Save note" button while a save is pending
- frontend/src/components/NoteForm.test.tsx: reproduction test and guard-release tests

## Overlap with the files the scheduler asked about
- frontend/src/components/LandingPage.tsx: NOT modified by BUG-04. The fix lives entirely inside NoteForm; LandingPage's `onCreated` wiring is unchanged.
- frontend/src/components/AppFooter.tsx: NOT modified by BUG-04.
- frontend/src/api/version.ts: NOT modified by BUG-04 (no file under frontend/src/api/ is touched, notes.ts included).
- Verdict: BUG-04's manifest is disjoint from LandingPage.tsx, AppFooter.tsx and api/version.ts, so the feature_map.md shared_risk_notes pairing BUG-04 with TEST-08 and TEST-10 on LandingPage.tsx does not materialize.

## Potential conflicts with other independent features
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx: no other item in feature_map.md names them; no known concurrent editor.
- backend/app/routers/notes.py, backend/app/services/note_service.py, backend/app/repositories/note_repository.py: NOT modified (the fix is client-side), so the server-side overlap feature_map.md flags with TEST-12 does not materialize.
- e2e/tests/: BUG-04 adds its own spec file only; TEST-03's spec is not edited.
