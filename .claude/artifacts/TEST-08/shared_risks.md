# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports the API base URL from the new `baseUrl.ts` instead of defining it
- frontend/src/components/AppFooter.tsx: version fetched at runtime from `GET /api/version` instead of imported from `frontend/package.json`
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent, loading and failure cases
- frontend/src/components/LandingPage.test.tsx: mocks the version client in the footer assertion
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from `backend/pyproject.toml`

`frontend/src/components/LandingPage.tsx` is no longer modified (the feature_map row assumed it would be): the footer fetches its own version.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a note-form double-submit fix is likely to add a case there. The production file `LandingPage.tsx` is not touched by TEST-08, so the risk is reduced to the test file.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix is client-side; TEST-08 changes only the base URL import at the top of the file.
- Runtime contract, not a file overlap: TEST-09 (independent, could run concurrently) edits `backend/app/routers/version.py`, `backend/app/schemas/version.py` and `backend/app/services/version_service.py` to add a commit field to `GET /api/version`. TEST-08 reads only the `version` field and ignores others, so an additive change is safe; a rename or removal of `version` would break the footer.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx are also edited by TEST-10 and CHORE-02, both of which depend on TEST-08 and so cannot run concurrently with it.
