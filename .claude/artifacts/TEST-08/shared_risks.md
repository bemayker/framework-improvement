# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports the API base URL from the new baseUrl.ts instead of declaring it (behaviour unchanged)
- frontend/src/components/AppFooter.tsx: fetches the backend version from GET /api/version instead of importing frontend/package.json; loading and failure both render "Task Notes"
- frontend/src/components/AppFooter.test.tsx: mocked-client tests for resolved, rejected, pending and sentinel paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version taken from backend/pyproject.toml instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature and e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source re-pointed to the backend

frontend/src/components/LandingPage.tsx is deliberately NOT modified (the footer owns its fetch). No backend file is modified: GET /api/version already exists from TEST-05.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (double submit; independent, same wave, could run concurrently). The feature_map flags LandingPage.tsx for this pair; this plan leaves LandingPage.tsx untouched, so the remaining overlap is the test file only (TEST-08 edits the footer assertion and adds a version-client mock; BUG-04 would edit submit tests). Serialize if both manifests list LandingPage.test.tsx.
- frontend/src/api/notes.ts may also be modified by BUG-04 if its fix lands client-side (independent, could run concurrently); TEST-08 changes only its base-URL import line.
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py are read (consumed over HTTP), not modified, by TEST-08; TEST-09 (independent, ready now) edits them to add the build commit. The client reads only the `version` field, so an added field does not conflict; a renamed or removed `version` field in TEST-09 would break this item.
- frontend/src/components/AppFooter.tsx, frontend/src/api/version.ts and e2e/tests/TEST-04_page_footer.spec.ts are later edited by TEST-10 (depends on TEST-08, so sequential, not concurrent) and by CHORE-02, BUG-03, CHORE-03, CHORE-1 and FEAT-6 downstream; no concurrent conflict, but they build on this item's file names.
