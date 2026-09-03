# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/http.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports `API_BASE_URL` and `requestFailed` from the new `./http` module instead of defining them locally; exported behaviour unchanged.
- frontend/src/components/AppFooter.tsx: fetches the version from `GET /api/version` on mount through `frontend/src/api/version.ts`; renders `Task Notes` while loading, `Task Notes v{version}` when resolved, `Task Notes · version unavailable` on failure. `<footer>`, `data-testid="app-footer"` unchanged; the `package.json` import is removed.
- frontend/src/components/AppFooter.test.tsx: mocks `../api/version` and asserts the resolved, unavailable and loading states.
- frontend/src/components/LandingPage.test.tsx: adds the `../api/version` mock; the footer case asserts the mocked backend version instead of `frontend/package.json`.
- e2e/tests/TEST-04_page_footer.spec.ts: the version assertions read the page's own `GET /api/version` response instead of `frontend/package.json` (TEST-04's contract, overridden by the tracker comment on TEST-08; the two values differ today, `0.0.0` vs `0.1.0`).
- e2e/uat/scenarios/TEST-04_page_footer.feature: the version-source line in the first scenario names `GET /api/version` instead of `frontend/package.json`.
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite and step 4 compare the footer with `GET /api/version` instead of `frontend/package.json`.

Not modified, stated because the work item's note names it: `frontend/src/components/LandingPage.tsx` (TEST-04 extracted the footer into `AppFooter.tsx`; `LandingPage.tsx` keeps rendering `<AppFooter />` untouched). Not modified, stated because the tracker comment asks for it: every file under `backend/`. `GET /api/version` exists from TEST-05 (done) and is consumed as-is, so `backend/app/main.py`, the version router, schema, service and their tests are untouched.

## Potential conflicts with other independent features
- None live. TEST-08 modifies files under `frontend/src/` and `e2e/` only, plus its own artifacts, and is disjoint from both items that could run concurrently:
  - TEST-06 (Echo endpoint, in review) is backend-only: `backend/app/main.py`, its router, schemas and `backend/tests/`. It touches no file this feature creates or modifies.
  - TEST-07 (Uptime endpoint, not started) is backend-only and shares `backend/app/main.py` with TEST-06 (both rows already flag that pair). It touches no file this feature creates or modifies. The `feature_map.md` note that TEST-06 and TEST-07 are "disjoint from TEST-08 (frontend only)" still holds after this re-plan.
- Overlaps with done dependencies, no live conflict:
  - TEST-04 (done, `depends_on` of TEST-08) also created `AppFooter.tsx`, `AppFooter.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts` and the TEST-04 UAT artifacts; this feature modifies all of them, and re-scopes TEST-04's version contract from `frontend/package.json` to the backend's response. TEST-04 cannot run concurrently.
  - TEST-03 (done) created `frontend/src/api/notes.ts` and `LandingPage.test.tsx`; this feature makes a behaviour-preserving edit to the first and adds a mock to the second.
  - TEST-05 (done) owns `GET /api/version`. TEST-08 now depends on it at runtime; `feature_map.md` lists `depends_on [TEST-04]` only. No scheduling effect since TEST-05 is done; the dispatching session may add the edge for accuracy.
- The `feature_map.md` row for TEST-08 carries no `shared_risk_notes`, and this analysis confirms none is needed: TEST-08 may run in parallel with TEST-06 and TEST-07 without serialization.
