# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (ref plus isSaving state) and disabled submit button
- frontend/src/components/NoteForm.test.tsx: reproduction, disabled-state and retry-after-failure unit tests

## Potential conflicts with other independent features
- No file overlap with TEST-08 (in flight). TEST-08 modifies frontend/src/api/notes.ts (base URL moved to the new frontend/src/api/baseUrl.ts), frontend/src/components/AppFooter.tsx and frontend/src/components/LandingPage.test.tsx; BUG-04 modifies none of them and does not modify LandingPage.tsx, which feature_map.md flagged as the plausible shared file. BUG-04 imports createNote from frontend/src/api/notes.ts unchanged, so it is a read-only consumer of a file TEST-08 edits: if TEST-08 renames or moves createNote the import in NoteForm.tsx and the vi.mock path in NoteForm.test.tsx would need to follow. The build re-checks merged-since against plan base ecf26aa after TEST-08 merges.
- frontend/src/components/LandingPage.tsx: flagged in feature_map.md against TEST-08 and TEST-10 (wave 4), but this plan leaves it untouched, so the serialization flag is advisory only.
- e2e/tests/TEST-03_simple_note_form.spec.ts: not modified; it exercises the same form and must stay green (single clicks are unaffected by the guard).
- TEST-12 (Read one note by id, also depends on TEST-03, wave 3): backend-oriented; no expected overlap with NoteForm.tsx or NoteForm.test.tsx.
