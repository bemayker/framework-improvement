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
- frontend/src/api/notes.ts: base URL constant moved to `api/baseUrl.ts` and imported; no behaviour change
- frontend/src/components/AppFooter.tsx: version fetched from `GET /api/version` instead of imported from `package.json`; loading and failure render the app name only
- frontend/src/components/AppFooter.test.tsx: version client mocked; present, loading, unreachable and empty-version cases
- frontend/src/components/LandingPage.test.tsx: version client mocked; footer assertion moves from the `package.json` version to the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected footer version read from `backend/pyproject.toml`
- e2e/uat/scenarios/TEST-04_page_footer.feature: version line now refers to the backend's version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison now against `backend/pyproject.toml`

`frontend/src/components/LandingPage.tsx` is NOT modified (the footer owns its fetch), contrary to the description's note and the feature map's conflict note.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): BUG-04's double-submit fix is likely tested through the landing page's note form. The map flags `LandingPage.tsx`; the real overlap is this test file (both add mocks or cases to the same `vi.mock` block). Serialize, or expect a small merge in the mock setup.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client; TEST-08 only changes its two base URL lines.
- GET /api/version response shape is owned by TEST-09 (independent, planned in parallel), which edits `backend/app/routers/version.py`, `schemas/version.py` and `services/version_service.py`. No file overlap: TEST-08 edits no backend file. Contract risk only: the footer reads the `version` string field; an additive field (a build commit) is harmless, but renaming or removing `version`, or changing it to carry the commit instead of the `[project].version`, would break the footer and `TEST-04_page_footer.spec.ts` / `TEST-08_footer_app_version.spec.ts`, which expect `[project].version` from `backend/pyproject.toml`.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, footer build note); not in the current run, serialize if it is scheduled.
