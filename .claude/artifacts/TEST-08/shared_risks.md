# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports API_BASE_URL from the new baseUrl.ts instead of defining it (no behaviour change)
- frontend/src/components/AppFooter.tsx: version fetched at runtime from GET /api/version instead of imported from package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, loading and failure paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion no longer reads package.json
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml instead of frontend/package.json

Not modified, contrary to the feature_map cell: frontend/src/components/LandingPage.tsx (the fetch lives inside AppFooter). No backend file is modified; the feature consumes TEST-05's existing GET /api/version at runtime.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently: a double-submit fix plausibly adds a test there). The overlap the map flags on LandingPage.tsx itself does not occur, since this plan does not edit that file.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client; this plan's change there is a one-line import swap.
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py are read at runtime, not edited, and are being edited by TEST-09 (independent, could run concurrently: adds a build-commit field). No file conflict; the response change is additive and the client reads only `version`, so the contract holds as long as TEST-09 keeps the `version` field.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx are then edited by TEST-10, CHORE-02, BUG-03, CHORE-03, CHORE-1 and FEAT-6, all downstream of TEST-08 (dependants, not concurrent).
