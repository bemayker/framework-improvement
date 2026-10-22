# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: fetches the backend version on mount instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent and loading paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source step updated
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source prerequisite and step updated

Not modified: frontend/src/components/LandingPage.tsx (AppFooter owns its own fetch), and no backend file (GET /api/version already exists from TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx: the feature_map row predicted TEST-08 and BUG-04 both edit it. This plan does NOT modify LandingPage.tsx, so that overlap no longer holds for this item.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently) if its double-submit regression test lands at page level rather than in NoteForm.test.tsx. This is the one remaining plausible overlap with BUG-04; it is a test file, and the edits would touch different tests (footer assertion and a new vi.mock for ../api/version here, note-submit behaviour there), so a textual merge conflict is possible only around the vi.mock block at the top of the file.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will also be modified by TEST-10, CHORE-02, BUG-03, CHORE-03 and FEAT-6, all of which depend (directly or transitively) on TEST-08, so none can run concurrently with it; no serialization needed beyond the dependency graph.
- No overlap with TEST-09, BUG-01 or TEST-12: this item changes no backend file and no notes client file.
