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
- frontend/src/api/notes.ts: API base URL constant moved to baseUrl.ts and imported
- frontend/src/components/AppFooter.tsx: version fetched from GET /api/version instead of imported from package.json
- frontend/src/components/AppFooter.test.tsx: assertions moved from package.json to the mocked backend version
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source step corrected
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source prerequisite and step corrected

Runtime dependency, no diff: backend GET /api/version (backend/app/routers/version.py, services/version_service.py, schemas/version.py). An item that changes that endpoint's response shape or its "unknown" sentinel changes what this footer shows.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): BUG-04's note-form double-submit fix plausibly edits LandingPage.tsx and its test. TEST-08 no longer edits LandingPage.tsx itself, only its test file.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client; TEST-08 changes only its base URL import.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, could run concurrently): FEAT-9 "frontend footer shows a build note" edits the footer.
- backend/app/routers/version.py and backend/app/schemas/version.py (consumed, not edited) may be modified by TEST-09 and FEAT-8 (independent): TEST-09 adds a commit field to GET /api/version; an additive field does not affect this footer, a rename of `version` would.
- frontend/src/components/AppFooter.tsx is also edited by TEST-10 (Footer shows the build commit), which is downstream of TEST-08 rather than independent, so the dependency graph already orders it.
