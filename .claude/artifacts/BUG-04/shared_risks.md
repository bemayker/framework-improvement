# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard (ref plus `isSaving` state), submit button disabled while a save is pending
- frontend/src/components/NoteForm.test.tsx: reproduction test for the double submit, release-after-success and release-after-failure tests

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan. feature_map.md flags BUG-04 against TEST-08 and TEST-10 on that file (note-form submit wiring vs footer render); the fix lives entirely inside NoteForm, so that overlap does not materialize. TEST-08 is already merged (5fecc80).
- TEST-10 (Footer shows the build commit, wave 4, follows this item): expected to touch AppFooter.tsx, frontend/src/api/version.ts and possibly LandingPage.tsx; none of those is in this plan, so no file overlap with BUG-04 is expected. Serialization is not required on file grounds.
- TEST-12 (notes router, service and repository): no overlap, this plan makes no backend change.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx: no other open item in feature_map.md names them.
