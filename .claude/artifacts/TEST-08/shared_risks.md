# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- frontend/src/api/baseUrl.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: fetch the version from GET /api/version at runtime; loading and failure render "Task Notes" alone
- frontend/src/components/AppFooter.test.tsx: mock the version client; present, absent and pending paths
- frontend/src/components/LandingPage.test.tsx: mock the version client so the footer assertion uses the backend version
- frontend/src/api/notes.ts: import API_BASE_URL from the new baseUrl module (no behaviour change)
- e2e/tests/TEST-04_page_footer.spec.ts: expected version comes from backend/pyproject.toml
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source wording
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source wording

frontend/src/components/LandingPage.tsx is NOT modified by TEST-08 (the footer owns its own fetch). No backend file is modified: GET /api/version already exists (TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a double-submit fix in the note-form wiring would plausibly add or change a LandingPage test, while TEST-08 adds a `vi.mock("../api/version")` and changes the footer assertion. The feature_map flag on LandingPage.tsx itself does not apply: TEST-08 leaves LandingPage.tsx untouched.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the client layer; TEST-08's change there is a one-line import swap.
- frontend/src/components/AppFooter.tsx, AppFooter.test.tsx and frontend/src/api/version.ts may also be modified by TEST-10 (later wave, per feature_map) if it adds a commit suffix to the footer; it is not concurrent in this run's wave order, so this is a sequencing note, not a conflict.
- No overlap with TEST-09 or BUG-01 (backend only per feature_map).
