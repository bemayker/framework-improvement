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
- frontend/src/api/notes.ts: imports `API_BASE_URL` from the new `./config` instead of defining it (no behaviour change)
- frontend/src/components/AppFooter.tsx: version fetched from `GET /api/version` at runtime instead of imported from `frontend/package.json`
- frontend/src/components/AppFooter.test.tsx: rewritten around a mocked version client
- frontend/src/components/LandingPage.test.tsx: mocks `../api/version`; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from `backend/pyproject.toml` instead of `frontend/package.json`
- docs/DEVELOPMENT.md: the footer paragraph matched to what this item builds

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by TEST-08 (the footer owns its own fetch, and `LandingPage.tsx` already renders `<AppFooter />`). The `feature_map.md` note that TEST-08 and BUG-04 both plausibly edit it does not hold for this plan.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, planned concurrently): TEST-08 adds a `vi.mock("../api/version")` and changes the footer test case; a BUG-04 fix to note-form submit wiring would most likely add or change cases in the same file. A textual merge conflict is possible in the mock block at the top; serialize or rebase the second build.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, planned concurrently) if its fix touches the notes client: TEST-08 only replaces the `API_BASE_URL` definition lines with an import.
- frontend/src/components/AppFooter.tsx, frontend/src/api/version.ts and e2e/tests/TEST-04_page_footer.spec.ts are the files a later TEST-10 (footer shows the build commit) would build on; it is a dependant rather than a concurrent item, so no serialization is needed, only ordering.
- No backend file is touched, so TEST-09 and BUG-01 (backend only) stay disjoint. Runtime dependency: the footer now reads `GET /api/version`; a concurrent change to that endpoint's response shape (TEST-09 adds a `commit` field) is additive and does not break this client, which reads only `version`.
