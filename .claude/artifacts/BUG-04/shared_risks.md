# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard (ref plus state), finally reset, disabled saving state of the submit button
- frontend/src/components/NoteForm.test.tsx: new component tests for the double-submit guard

## Potential conflicts with other independent features
- None of this item's files is shared with TEST-08 (PR #681, in review). TEST-08 touches frontend/src/api/notes.ts, frontend/src/api/baseUrl.ts, frontend/src/api/version.ts, frontend/src/components/AppFooter.*, frontend/src/components/LandingPage.test.tsx and the TEST-04 E2E and UAT files; this item edits none of them. feature_map.md's warning that BUG-04 and TEST-08 both edit frontend/src/components/LandingPage.tsx no longer holds: this plan leaves LandingPage.tsx unchanged (the fix lives inside NoteForm), and TEST-08's plan leaves it unchanged too.
- Indirect only: NoteForm.tsx imports createNote from frontend/src/api/notes.ts, which TEST-08 edits (base URL import). The createNote signature is unchanged by TEST-08, so no textual or behavioural conflict is expected.
- frontend/src/components/LandingPage.tsx: not modified by this plan, so the map's BUG-04 and TEST-10 pairing on it does not apply.
- Backend notes router, service and repository: not modified (client-side fix), so the map's BUG-04 and TEST-12 pairing does not apply.
