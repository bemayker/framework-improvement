# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports the shared `API_BASE_URL` instead of declaring its own
- frontend/src/components/AppFooter.tsx: fetches the version from `GET /api/version` instead of importing `package.json`
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent, pending and differs-from-bundle cases
- frontend/src/components/LandingPage.test.tsx: mocks `../api/version`; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: drops the `frontend/package.json` version assertions
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step now refers to the backend's `GET /api/version`
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: same correction

`frontend/src/components/LandingPage.tsx` is **not** modified (the fetch lives in `AppFooter`). No backend file is modified: `GET /api/version` already exists on main from TEST-05.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently). The feature map flagged `LandingPage.tsx` for this pair; this plan leaves `LandingPage.tsx` untouched, but a BUG-04 fix to note-form submit wiring would plausibly add or change cases in the same test file, which this plan edits (the module mock block and the footer case). Keep the pair serialized.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its double-submit fix lands in the client layer rather than the form; this plan changes only its base-URL constant.
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx are also the target of TEST-10 ("Footer shows the build commit"), which depends on TEST-08 in the tracker. That is a dependency, not a concurrent pair, so TEST-10 must be planned against this item's merged footer and not the `package.json` one.
