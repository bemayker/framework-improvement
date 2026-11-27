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
- frontend/src/api/notes.ts: imports API_BASE_URL from ./baseUrl instead of declaring it; no behaviour change
- frontend/src/components/AppFooter.tsx: fetches the version from GET /api/version at runtime instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, pending and failed paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: footer version asserted against the /api/version response instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step compares against GET /api/version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and comparison step use GET /api/version

frontend/src/components/LandingPage.tsx is NOT modified: the fetch lives inside AppFooter, which LandingPage already renders.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by TEST-03 (independent per the map, complete) and by BUG-04 (serialized behind this item; a note-form submit fix would touch the page test)
- frontend/src/api/notes.ts may also be modified by TEST-03 (independent per the map, complete) and plausibly by BUG-04 (double-submit fix, if done in the client); this item's change there is a two-line import swap
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx may also be modified by FEAT-9 (independent, footer build note) and by TEST-10 (downstream, footer build commit, serialized behind this item)
- frontend/src/components/LandingPage.tsx: listed by TEST-03 and named in the BUG-04 and TEST-10 serialization notes; this plan does not touch it, so that pair conflict does not arise from TEST-08
- No backend file is touched: disjoint from TEST-09, BUG-01 and every backend/app/main.py router-registration row
