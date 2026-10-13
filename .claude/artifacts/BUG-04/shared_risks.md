# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled submit button while saving
- frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the disabled state

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx: feature_map.md flags BUG-04 with TEST-08 and TEST-10 on this file. This plan does NOT modify it (the guard lives in NoteForm), so that pair no longer collides on it. Serializing remains harmless if the scheduler keeps the flag.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx: no other open item in feature_map.md is expected to touch them (TEST-08, TEST-10 and CHORE-02 work on the footer and version API; TEST-09 and BUG-01 are backend only).
