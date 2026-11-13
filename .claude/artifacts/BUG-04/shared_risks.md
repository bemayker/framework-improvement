# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight submit guard, `isSaving` state, disabled save button
- frontend/src/components/NoteForm.test.tsx: reproduction tests plus disabled and retry cases

## Potential conflicts with other independent features
- TEST-08 (in flight, PR #792, plan at `.claude/worktrees/TEST-08/.claude/artifacts/TEST-08/plan.md`): **no file overlap with its File Manifest.** TEST-08 modifies `frontend/src/api/notes.ts` (imports `API_BASE_URL` from a new `frontend/src/api/baseUrl.ts`), `frontend/src/components/AppFooter.tsx`, `AppFooter.test.tsx`, `LandingPage.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts` and TEST-04's UAT files; BUG-04 touches none of them. Indirect couplings, none a merge conflict: `NoteForm.tsx` imports `createNote` from `../api/notes`, whose exported signature TEST-08 leaves unchanged, and `NoteForm.test.tsx` mocks that module by path, which still resolves. After TEST-08 the landing page also issues `GET /api/version`; BUG-04's E2E spec matches `POST /api/notes` on exact pathname and method, so it is unaffected. The build is serialized behind TEST-08's merge anyway.
- frontend/src/components/LandingPage.tsx: the feature map flags BUG-04, TEST-08 and TEST-10 on this file. BUG-04 does **not** modify it (the `onCreated` wiring stays as is), so that flag is cleared for BUG-04. TEST-10 (wave 4) still shares it with TEST-08.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx: no other open item in the feature map names these files; they were last changed by TEST-03 (done).
- TEST-12 (notes router, service and repository): disjoint, because this fix is client-side only and changes no backend file.
- TEST-09 and BUG-01: disjoint (backend only).
