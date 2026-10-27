# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard, `isSaving` state, disabled submit button and its disabled style
- frontend/src/components/NoteForm.test.tsx: double-submit reproduction and guard tests

## Potential conflicts with other independent features
- No file overlap with TEST-08 (in flight, PR #358). TEST-08's manifest lists `frontend/src/api/notes.ts`, `frontend/src/api/baseUrl.ts`, `frontend/src/api/version.ts`, `frontend/src/api/version.test.ts`, `frontend/src/components/AppFooter.tsx`, `frontend/src/components/AppFooter.test.tsx`, `frontend/src/components/LandingPage.test.tsx` and `e2e/tests/TEST-04_page_footer.spec.ts`; BUG-04 edits none of them, and neither item edits `frontend/src/components/LandingPage.tsx`. The graph's LandingPage.tsx pair (TEST-08 and BUG-04) therefore does not materialize, and the two builds need not be serialized on file grounds.
- Indirect dependency on TEST-08: `NoteForm.tsx` imports `createNote` from `frontend/src/api/notes.ts`, which TEST-08 changes to import its base URL from `./baseUrl`. The exported signature is unchanged, and `NoteForm.test.tsx` mocks `../api/notes`, so the tests do not depend on that file's internals. A merge of either first leaves the other clean.
- `LandingPage.test.tsx` renders `NoteForm` (TEST-08 edits that test): the new `disabled` attribute only appears while a save is pending, so a test that never submits sees the same markup as before.
- TEST-10 (blocked by TEST-08 and TEST-09, footer build commit): plausibly edits AppFooter and the version client, not NoteForm; no overlap expected with this item.
- e2e: TEST-03's `e2e/tests/TEST-03_simple_note_form.spec.ts` drives the same form and is not edited. Its submits wait for each `201` before the next action, so a briefly disabled button does not change its outcome; it should be in the build's E2E smoke run as a regression check.
