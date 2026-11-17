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
- frontend/src/api/notes.ts: imports the API base URL from the new baseUrl.ts instead of declaring it
- frontend/src/components/AppFooter.tsx: fetches the version from GET /api/version instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent, loading and backend-over-frontend tests
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from the page's /api/version response instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step compares to GET /api/version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare to GET /api/version

frontend/src/components/LandingPage.tsx is NOT modified by this plan (the fetch lives in AppFooter), although the feature map row names it.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): its note-form submit fix plausibly adds a double-submit test there. The feature map already serializes TEST-08 and BUG-04 on LandingPage.tsx; keep that serialization, the overlap is now the test file.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client; this plan only swaps the base-URL constant for an import.
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx may also be modified by FEAT-9 (independent, could run concurrently; its row says it edits the footer, AppFooter.tsx).
- frontend/src/components/LandingPage.test.tsx was listed by TEST-03 (independent per the neighbours call, complete on main); no live conflict.
- TEST-10 (downstream, depends on TEST-08 and TEST-09) will edit AppFooter.tsx and its tests to add the build commit; it must build on this item's fetch-based footer, not on the package.json import.
- No backend file is touched, so the backend/app/main.py serialization group (TEST-09, BUG-01, TEST-13, FEAT-7, FEAT-8 and others) does not apply. FEAT-8 adds a version route like TEST-05: if it replaced GET /api/version's response shape, this feature's client would break; FEAT-8 is not scheduled in this run per its row status.
