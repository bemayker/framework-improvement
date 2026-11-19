# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: export the existing API_BASE_URL constant (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetch the backend version at runtime instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mock the version client, assert present and absent paths
- frontend/src/components/LandingPage.test.tsx: mock the version client, footer assertion uses the backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source named as backend/pyproject.toml
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison against backend/pyproject.toml

Not modified: frontend/src/components/LandingPage.tsx (it already renders AppFooter), and no backend file (GET /api/version already exists from TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a double-submit fix in the note form wiring is likely to add or change a LandingPage test. TEST-08 does NOT edit LandingPage.tsx itself, so the map's flagged pair narrows to this test file.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix touches the notes client; TEST-08's change there is a one-word export.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent; footer build note), which edits the same footer component.
- Runtime dependency, not a file conflict: the footer now reads GET /api/version, which TEST-09 (independent; version endpoint reports the build commit) and FEAT-8 (independent; version route) change on the backend. An additive field in the response is harmless to this client; a renamed or removed `version` field would make the footer render the name alone.
- Downstream, not concurrent: TEST-10 (footer shows the build commit) builds on this footer and the same files.
