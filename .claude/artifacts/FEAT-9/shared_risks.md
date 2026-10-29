# Shared Risk Analysis, FEAT-9

## Files this feature will create
- e2e/uat/scenarios/FEAT-9_footer_build_note.feature
- e2e/uat/scripts/FEAT-9_footer_build_note_uat_script.md
- .claude/artifacts/FEAT-9/uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: adds the unconditional `Build note` line as the footer's last child
- frontend/src/components/AppFooter.test.tsx: adds the build-note tests and changes `expectFooterText` so every exact footer-text expectation ends with `Build note`
- e2e/tests/TEST-10_footer_build_commit.spec.ts: the two exact footer `toHaveText` assertions gain the trailing `Build note`
- e2e/tests/TEST-08_footer_app_version.spec.ts: the exact footer `toHaveText("Task Notes")` assertion gains the trailing `Build note`

## Potential conflicts with other independent features
<!--
  Cross-reference feature_map.md. FEAT-9 depends only on TEST-04, so every row
  below has no dependency path to or from FEAT-9. Statuses were not read from
  the tracker in this dispatch; a pair whose other item is already Done is
  harmless to serialize.
-->
- frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by BUG-03 (independent, could run concurrently): it fixes the footer's commit rendering, and any exact footer-text expectation it adds must include FEAT-9's trailing `Build note` (and vice versa)
- frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by CHORE-03 (independent, could run concurrently): TEST-10 follow-up on the same footer and its tests
- frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by FEAT-6 (independent, could run concurrently): it adds a stamp to the footer, so both items append children to the same `<footer>` and both change its exact text
- frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently): TEST-08 follow-up flagged in feature_map.md as plausibly editing AppFooter.tsx
- e2e/tests/TEST-10_footer_build_commit.spec.ts may also be modified by BUG-03 and CHORE-03 (independent, could run concurrently): both follow TEST-10, whose spec carries the exact footer-text assertions FEAT-9 changes
