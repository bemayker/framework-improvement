# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/apiBaseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: import the shared `API_BASE_URL` instead of defining it locally (no behaviour change)
- frontend/src/components/AppFooter.tsx: drop the `package.json` version import; fetch `GET /api/version` on mount and render the loading / resolved / unavailable states
- frontend/src/components/AppFooter.test.tsx: mock the version client; assert version present, version absent, loading and the landmark
- frontend/src/components/LandingPage.test.tsx: drop the `package.json` import; mock the version client; re-point the footer assertion
- e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from the page's own `/api/version` response instead of `frontend/package.json`
- e2e/uat/scenarios/TEST-04_page_footer.feature: one step re-scoped from `frontend/package.json` to the backend's response
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite bullet and step 4 re-scoped from `frontend/package.json` to `curl http://localhost:8010/api/version`

Not modified: `frontend/src/components/LandingPage.tsx` (TEST-04 already extracted the footer into `AppFooter.tsx`), anything under `backend/` (TEST-05's `GET /api/version` is reused as merged), `frontend/package.json`, `package.json`, `package-lock.json`, `backend/pyproject.toml`, `uv.lock`, `README.md`, `docs/DEVELOPMENT.md`, `docker-compose.yml`, `.github/`.

## Potential conflicts with other independent features
- None live. The items that could run concurrently with TEST-08 per `feature_map.md` are TEST-07 (Uptime endpoint) and FEAT-1 (Server time endpoint); both are backend-only and register a router in `backend/app/main.py`, which this feature does not touch. `feature_map.md` already records TEST-08 as disjoint from both on TEST-06's, TEST-07's and FEAT-1's rows.
- The only items that ever touched the files above are TEST-03 (`frontend/src/api/notes.ts`), TEST-04 (`AppFooter.tsx`, `LandingPage.test.tsx`, the TEST-04 spec, feature file and UAT script) and TEST-05 (`backend/app/routers/version.py`, read but not modified). All three are done and merged, so no serialization is needed.
- Runtime coupling, not a file conflict: this feature depends on the response shape of TEST-05's `GET /api/version` (`{"version": string}`). A later item changing that schema must re-scope `frontend/src/api/version.ts` and both footer specs; `depends_on: [TEST-04, TEST-05]` in `feature_map.md` already expresses the edge.
