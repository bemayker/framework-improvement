# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: export the existing `API_BASE_URL` constant (one keyword, no behaviour change)
- frontend/src/components/AppFooter.tsx: fetch the backend version from GET /api/version on mount; loading and failure render "Task Notes" alone; drop the package.json import
- frontend/src/components/AppFooter.test.tsx: mock the version client; resolved, pending, failed and sentinel paths
- frontend/src/components/LandingPage.test.tsx: mock the version client; footer assertion moves from package.json to the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected footer version read from backend/pyproject.toml instead of frontend/package.json

Not modified: `frontend/src/components/LandingPage.tsx` (the map note's predicted overlap with BUG-04 does not materialize on this file) and every backend file (GET /api/version already exists from TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a double-submit fix in the note form is likely tested at page level here. Serialize TEST-08 and BUG-04.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client (e.g. createNote); TEST-08 only adds `export` to `API_BASE_URL`. Covered by the same serialization.
- frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by TEST-10 (footer shows the build commit; wave 4, depends on this item per the map, so ordered, not concurrent).
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (the map flags it with TEST-10 on exactly these two files; independent of TEST-08 unless the map says otherwise). Serialize TEST-08 and CHORE-02 if both are scheduled.
- Runtime contract, not a file: TEST-09 (version endpoint reports the build commit) modifies backend/app/schemas/version.py, backend/app/services/version_service.py and backend/app/routers/version.py, the response this footer consumes. No shared file; the client reads only `version` and ignores added fields, so concurrent runs are safe as long as TEST-09 keeps the `version` key.
