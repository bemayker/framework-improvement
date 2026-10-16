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
- frontend/src/api/notes.ts: base URL constant moved to `baseUrl.ts` and imported; no behaviour change
- frontend/src/components/AppFooter.tsx: version fetched from `GET /api/version` at runtime instead of imported from `package.json`; loading and failure render the app name alone
- frontend/src/components/AppFooter.test.tsx: present and absent path tests with the version client mocked
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked value
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from `backend/pyproject.toml` instead of `frontend/package.json`

Not modified, contrary to the item description: `frontend/src/components/LandingPage.tsx` (the footer lives in `AppFooter.tsx`). No backend file is modified: `GET /api/version` already exists (TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent of TEST-08, wave 3, note-form double submit; its tests live in the landing page and note form tests). `LandingPage.tsx` itself is no longer in TEST-08's set, so the feature map's flagged overlap narrows to this test file; keep the pair serialized as the map already says.
- frontend/src/api/notes.ts may also be modified by BUG-04 if its fix touches the notes client (independent, could run concurrently); the TEST-08 change there is a one-line import, so a conflict would be trivial but still textual.
- Runtime coupling, not a file overlap: TEST-09 (independent, building concurrently) changes the `GET /api/version` response by adding a `commit` field. TEST-08 reads only `version` and touches no backend file, so the two do not conflict in files; the TEST-08 client and its unit test explicitly tolerate the extra field.
- Downstream, not concurrent (dependants, listed for the scheduler): TEST-10 (depends on TEST-08) and CHORE-02 (depends on TEST-08) will edit `frontend/src/api/version.ts` and `frontend/src/components/AppFooter.tsx`, which this item creates and reshapes; they build after this merges.
