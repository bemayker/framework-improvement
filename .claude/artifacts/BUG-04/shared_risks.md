# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight `isSaving` guard and disabled submit button
- frontend/src/components/NoteForm.test.tsx: reproduction test plus guard-release tests

## Potential conflicts with other independent features
- None on file level. `feature_map.md` flagged `frontend/src/components/LandingPage.tsx` as shared with TEST-08 and TEST-10, but this plan does NOT touch `LandingPage.tsx`: the fix is contained in `NoteForm.tsx`, and the `onCreated` wiring in `LandingPage.tsx` is unchanged. The scheduler can lift that serialization advice for BUG-04.
- TEST-08 (footer shows the app version; expected `AppFooter.tsx` / `LandingPage.tsx`): disjoint from BUG-04's files. Only contact point: both add Playwright specs that load `/`; specs are independent files with unique data, so no conflict.
- TEST-09 (backend version router, `backend/app/main.py`) and BUG-01 (`backend/app/routers/server_time.py`): backend only, disjoint from BUG-04 (frontend only).
