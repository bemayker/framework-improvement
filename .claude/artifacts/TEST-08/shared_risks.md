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
- frontend/src/components/AppFooter.tsx: version comes from GET /api/version at runtime instead of frontend/package.json; loading and failure render "Task Notes" alone
- frontend/src/components/AppFooter.test.tsx: tests for resolved, pending, rejected and unknown paths
- frontend/src/api/notes.ts: imports API_BASE_URL from ./baseUrl instead of declaring it; no behaviour change
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: expected-version step names the backend's version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: same correction

Not modified, contrary to the description's note: frontend/src/components/LandingPage.tsx (it already renders AppFooter). No backend file is modified (GET /api/version already exists from TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx: the feature_map flags TEST-08 and BUG-04 on this file, but this plan does not modify it, so that pair does not collide here.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its double-submit fix lands in the notes client rather than in NoteForm.tsx. TEST-08's edit is a 2-line import swap at the top of the file, so the overlap is small but textual; BUG-04 is already held until this item merges.
- frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts are later edited by TEST-10 and CHORE-02. Both depend on TEST-08 (not independent), so the graph already orders them after this item.
- backend/app/routers/version.py, backend/app/services/version_service.py and backend/app/schemas/version.py are read at runtime but not modified. TEST-09 (independent, could run concurrently) edits them to add a commit field; the client here ignores extra response fields, so there is no file conflict and no contract break.
