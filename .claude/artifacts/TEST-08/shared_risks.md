# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: drop the package.json import, fetch the backend version from GET /api/version on mount, render the version only when resolved
- frontend/src/components/AppFooter.test.tsx: mock the version client, assert present, absent and loading paths
- frontend/src/components/LandingPage.test.tsx: mock the version client, replace the package.json version assertion
- frontend/src/api/notes.ts: import API_BASE_URL from the new baseUrl.ts (no behaviour change)
- e2e/tests/TEST-04_page_footer.spec.ts: remove the frontend package.json version assertions

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan (the fetch lives in AppFooter.tsx), which removes the overlap the ingestion graph note assumed. The residual overlap with BUG-04 (double-submit fix, independent of TEST-08) is frontend/src/components/LandingPage.test.tsx, which a client-side BUG-04 fix plausibly extends with submit tests, and frontend/src/api/notes.ts if BUG-04 changes createNote; keep the serialization flag on the pair until BUG-04's manifest is known.
- Runtime, not file, coupling: the footer now depends on backend GET /api/version (TEST-05 code). TEST-09 (version endpoint reports the build commit) changes that endpoint's response; if it removes or renames the `version` field the footer silently degrades to the name-only state. Independent of TEST-08 in the graph; additive field changes are safe.
- TEST-10 and CHORE-02 depend on TEST-08 (not concurrent) and will edit frontend/src/api/version.ts and AppFooter.tsx after it; no concurrent conflict.
