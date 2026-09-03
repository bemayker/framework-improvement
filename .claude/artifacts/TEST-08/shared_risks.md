# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/appVersion.ts
- frontend/src/appVersion.test.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: reads the version through `getAppVersion()` from `../appVersion` instead of importing `package.json` directly; renders `Task Notes v{version}` when a version resolves and `Task Notes` alone when it does not. `<footer>`, `data-testid="app-footer"` and the present-path text are unchanged.
- frontend/src/components/AppFooter.test.tsx: mocks `../appVersion` and asserts both rendering paths (version present, version absent).

Not modified, stated because the work item's note names it: `frontend/src/components/LandingPage.tsx`. TEST-04 (done) extracted the footer into `AppFooter.tsx`, so the change lands there and `LandingPage.tsx` keeps rendering `<AppFooter />` untouched. `LandingPage.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts` and TEST-04's UAT artifacts are also untouched and must keep passing.

## Potential conflicts with other independent features
- None. TEST-08 is frontend-only (`frontend/src/` plus its own `e2e/uat/` files) and is disjoint from both items that could run concurrently:
  - TEST-06 (Echo endpoint, in review) is backend-only: `backend/app/main.py`, its router, schemas and `backend/tests/`. It touches no file this feature creates or modifies.
  - TEST-07 (Uptime endpoint, not started) is backend-only and shares `backend/app/main.py` with TEST-06 (both rows already flag that pair). It touches no file this feature creates or modifies.
- TEST-04 also modified `frontend/src/components/AppFooter.tsx` and `AppFooter.test.tsx`, but it is a dependency of TEST-08 (`depends_on [TEST-04]`) and is done, so it cannot run concurrently and there is no live conflict. TEST-01 through TEST-05 are all done.
- The `feature_map.md` row for TEST-08 carries no `shared_risk_notes`, and this analysis confirms none is needed: TEST-08 may run in parallel with TEST-06 and TEST-07 without serialization.
