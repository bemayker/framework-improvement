# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: version read from GET /api/version at runtime instead of package.json; loading and failure render the app name only
- frontend/src/components/AppFooter.test.tsx: client mocked; present, absent and loading paths asserted
- frontend/src/components/LandingPage.test.tsx: footer assertion uses the mocked backend version instead of the package.json version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (note-form submit wiring and its page test); feature_map flags TEST-08 and BUG-04 on LandingPage; serialize. LandingPage.tsx itself is NOT modified by this plan, which narrows the overlap to the test file.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx are extended by TEST-10 (depends on TEST-08, so ordered, not concurrent) and may be modified by CHORE-02 (feature_map flags TEST-10 and CHORE-02 on these files); CHORE-02 could run concurrently with TEST-08 if it does not depend on it, so serialize.
- No backend file is touched, so there is no overlap with TEST-09 or BUG-01 (backend only).
