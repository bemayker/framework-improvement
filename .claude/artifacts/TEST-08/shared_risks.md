# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/config.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports the API base URL from the new config.ts instead of declaring it
- frontend/src/components/AppFooter.tsx: fetches the version from GET /api/version instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; asserts version present and absent
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version becomes the backend version from backend/pyproject.toml

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by TEST-08 (the footer owns its fetch), which removes the feature_map pairing with BUG-04 on that file. BUG-04 plan touches only frontend/src/components/NoteForm.tsx (plus its test, an E2E spec and UAT), so the two manifests are disjoint.
- frontend/src/components/LandingPage.test.tsx is modified by TEST-08; BUG-04 could touch it only if its fix moves into LandingPage wiring (independent, could run concurrently; low risk, its plan names NoteForm only).
- frontend/src/api/notes.ts may also be modified by BUG-04 or TEST-12 if a note fix lands client side (independent, could run concurrently; low risk, a one-line import change here).
- Backend version files (backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py) are modified by TEST-09 (in flight, PR 227) and only READ at runtime by TEST-08; no file overlap. TEST-09 adds a commit field additively, so TEST-08 reading version only is unaffected.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will later be modified by TEST-10, CHORE-02, BUG-03 and CHORE-03, all of which depend on TEST-08 (not independent; sequenced by the dependency graph).
