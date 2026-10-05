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
- frontend/src/api/notes.ts: imports the API base URL from the new shared `config.ts` instead of owning it
- frontend/src/components/AppFooter.tsx: fetches the backend version at runtime instead of importing frontend/package.json
- frontend/src/components/AppFooter.test.tsx: tests for the loading, version-present and version-absent states
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion no longer reads package.json
- e2e/tests/TEST-04_page_footer.spec.ts: expected version comes from the /api/version response
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source wording
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source wording

`frontend/src/components/LandingPage.tsx` is NOT modified (the fetch lives in AppFooter).

## Potential conflicts with other independent features
- BUG-04 (in flight, PR #95): its manifest modifies only `frontend/src/components/NoteForm.tsx` and `frontend/src/components/NoteForm.test.tsx` and adds BUG-04-named E2E/UAT files. **No file overlap with this plan.** The `feature_map.md` flag on `frontend/src/components/LandingPage.tsx` does not materialize: neither BUG-04's manifest nor this plan edits `LandingPage.tsx`. Residual, non-file risk: `LandingPage.test.tsx` (modified here) renders the real `NoteForm`, so BUG-04's change to submit behaviour could affect the existing "appends a submitted note" test in that file; this plan does not touch that test, so a merge conflict is not expected, only a possible test interaction to re-run after both merge.
- TEST-09 (PR #94, about to merge): backend only (`backend/app/core/config.py`, `services/version_service.py`, `schemas/version.py`, `routers/version.py`, Dockerfile, compose). No file overlap. Behavioural coupling: it adds `commit` to the `/api/version` body this feature consumes; the client reads `version` only, so the plan is correct whether TEST-09 merges before or after.
- TEST-10 (wave 4, depends on TEST-08 and TEST-09): will modify `frontend/src/components/AppFooter.tsx`, `AppFooter.test.tsx` and likely `frontend/src/api/version.ts` to show `commit`. Not independent (it depends on this item), so it is sequenced by the graph rather than a concurrent conflict.
- BUG-02 (CORS trailing slash, depends on TEST-09): backend CORS config only; no file overlap. Note: this feature adds a second cross-origin browser call (`/api/version`) on the same CORS path `listNotes` already uses.
