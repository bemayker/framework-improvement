# Shared Risk Analysis, BUG-04

## Files this feature will create
- e2e/tests/BUG-04_double_submit_note.spec.ts
- e2e/uat/scenarios/BUG-04_double_submit_note.feature
- e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md
- .claude/artifacts/BUG-04/uat_script.md

## Existing files this feature will modify
- frontend/src/components/NoteForm.tsx: in-flight guard and disabled submit button while a save is pending
- frontend/src/components/NoteForm.test.tsx: reproduction test and disabled/re-enabled cases

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan: the fix lives entirely in NoteForm, so the feature_map flag pairing BUG-04 with TEST-10 (and with the now-merged TEST-08) on LandingPage.tsx does not materialize. No serialization with TEST-10 is needed on this plan.
- frontend/src/components/NoteForm.tsx and NoteForm.test.tsx may also be modified by any later notes-form item (none currently planned in feature_map.md touches them).
- Disjoint from TEST-12 (notes router, service and repository): no backend file is touched.
