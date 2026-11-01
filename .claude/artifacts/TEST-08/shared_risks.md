# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports the API base URL from the new baseUrl.ts instead of defining it (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetches the backend version at runtime instead of importing frontend/package.json; adds the loading and failure rendering
- frontend/src/components/AppFooter.test.tsx: rewritten around a mocked version client
- frontend/src/components/LandingPage.test.tsx: mocks the version client; asserts the backend version, not the package.json version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: line 15's frontend/package.json reference replaced with the backend's version as served by GET /api/version (`[project].version` in backend/pyproject.toml)
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisites (line 9) and step 4 (line 26) compare the footer to backend/pyproject.toml's `version` (or the GET /api/version response) instead of frontend/package.json

Not modified: frontend/src/components/LandingPage.tsx (the footer owns its own fetch), and every backend file (GET /api/version already exists from TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is no longer edited by TEST-08, so the map's TEST-08 / BUG-04 flag on that file no longer applies to the source file. frontend/src/components/LandingPage.test.tsx may still be modified by BUG-04 (note-form submit wiring tests), which is independent of TEST-08 and could run concurrently; serialize if both are in flight.
- frontend/src/api/notes.ts may also be modified by BUG-04 (a client-side double-submit fix around createNote), independent and could run concurrently; TEST-08's change there is one import line.
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py are read at runtime but not edited here; TEST-09 (independent, could run concurrently) plans to extend the version response with the build commit. The version client reads only the `version` field, so an added field does not break it; a rename or removal of `version` would.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will be extended by TEST-10 (depends on TEST-08, so not concurrent) and then by BUG-03 / CHORE follow-ups; no live conflict.
- e2e/uat/scenarios/TEST-04_page_footer.feature and e2e/uat/scripts/TEST-04_page_footer_uat_script.md belong to TEST-04, which is complete; no in-flight item is known to edit them, so there is no live conflict.
