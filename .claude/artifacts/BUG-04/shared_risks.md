# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (ref plus isSaving state), disabled submit button with a disabled style, finally reset
- frontend/src/components/NoteForm.test.tsx: component tests for the pending, resolved and rejected save states

## Potential conflicts with other independent features
- No file overlap with TEST-08 (in flight, PR #487). TEST-08 edits frontend/src/components/AppFooter.tsx, frontend/src/api/version.ts, frontend/src/api/baseUrl.ts, frontend/src/api/notes.ts and frontend/src/components/LandingPage.test.tsx; this plan edits none of them. The feature map's earlier warning about frontend/src/components/LandingPage.tsx does not apply: the fix lives in NoteForm.tsx and LandingPage.tsx is not touched. Semantic dependency only: NoteForm.tsx imports createNote and the Note type from frontend/src/api/notes.ts, and NoteForm.test.tsx mocks that module with a factory that provides createNote only. If TEST-08 renames or re-signatures createNote, this build breaks at compile time; a base-URL refactor inside notes.ts does not affect it. No build serialization needed.
- No file overlap with TEST-10 (later, footer). The same LandingPage.tsx note applies.
- No overlap with TEST-12, TEST-14, FEAT-2 or FEAT-3 (notes router, service and repository): this fix is client-side only and touches no backend file.
- e2e/tests/TEST-03_simple_note_form.spec.ts is not modified; the new spec writes uniquely named notes and asserts on its own text only, so it stays parallel-safe beside TEST-03's spec.
