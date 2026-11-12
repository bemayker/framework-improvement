# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (ref plus `isSaving` state), submit button disabled while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the duplicate-submit guard and re-enable after a save

## Potential conflicts with other independent features
- None of BUG-04's paths is in TEST-08's announced set (frontend/src/api/baseUrl.ts, frontend/src/api/notes.ts, frontend/src/components/AppFooter.tsx, frontend/src/components/LandingPage.test.tsx, among others). The map row's flagged overlap, frontend/src/components/LandingPage.tsx, does not materialize: this plan leaves LandingPage.tsx untouched, because the defect lives in NoteForm's own submit handler. The scheduler's serialization behind TEST-08 is still safe to keep, since TEST-08's full list is not known here.
- frontend/src/components/NoteForm.tsx and frontend/src/components/NoteForm.test.tsx may also be modified by TEST-10 (wave 4) if it touches the note form; not concurrent with this wave.
- No backend path is touched, so the map's server-side overlap with TEST-12 (notes router, service, repository) does not apply.
- e2e/tests/TEST-03_simple_note_form.spec.ts is not modified; BUG-04 adds its own spec.
