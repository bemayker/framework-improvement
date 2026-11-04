# Shared Risk Analysis, TEST-08

## Files this feature will create
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: optional `version` prop defaulting to the package.json version; render the app name alone when the version is missing or blank
- frontend/src/components/AppFooter.test.tsx: version-present and version-absent component tests

## Potential conflicts with other independent features
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx may also be modified by FEAT-9 (depends only on TEST-04, wave 3, "frontend footer shows a build note"; independent, could run concurrently). Serialize.
- frontend/src/components/LandingPage.tsx is NOT modified by this plan, so the feature map's flagged pair with BUG-04 (wave 3, note-form submit wiring) no longer collides on that file; BUG-04 does not touch the footer files.
- TEST-10, CHORE-02, BUG-03, CHORE-03, CHORE-1 and FEAT-6 also edit AppFooter.tsx but all depend on TEST-08 directly or transitively, so they cannot run concurrently with it.
- TEST-09 and BUG-01 are backend only: disjoint.
