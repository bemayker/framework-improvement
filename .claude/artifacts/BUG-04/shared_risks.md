# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard and disabled submit button
- frontend/src/components/NoteForm.test.tsx: reproduction test and unit tests for the guard

## Potential conflicts with other independent features
- No direct file overlap with TEST-08 (in flight). TEST-08 modifies frontend/src/api/notes.ts, frontend/src/components/AppFooter.tsx, AppFooter.test.tsx and LandingPage.test.tsx, and adds frontend/src/api/baseUrl.ts; BUG-04 modifies none of them.
- Indirect dependency on TEST-08: NoteForm.tsx imports `createNote` from frontend/src/api/notes.ts, which TEST-08 edits. BUG-04 relies only on `createNote(text: string): Promise<Note>` keeping its signature; NoteForm.test.tsx mocks the whole module, so its tests are unaffected by TEST-08's base-URL change. If TEST-08 changes that signature, re-check NoteForm.tsx after TEST-08 merges. Low risk; no serialization needed for file reasons.
- The feature_map.md row for BUG-04 anticipated frontend/src/components/LandingPage.tsx as shared with TEST-08 and TEST-10. This plan does not modify LandingPage.tsx, so that predicted collision does not materialize; TEST-08 touches LandingPage.test.tsx, which BUG-04 also does not modify.
- TEST-12 (notes router, service and repository): no overlap, because this fix is client-side only.
- e2e/tests/: BUG-04 adds its own spec file and does not edit TEST-03_simple_note_form.spec.ts, so concurrent E2E work on other items cannot collide on a file; the specs share the live notes table at run time and use unique note text to stay independent.
