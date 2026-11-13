# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: client returns `{ version, commit }` instead of a version string
- frontend/src/api/version.test.ts: client tests updated to the object shape, commit cases added
- frontend/src/components/AppFooter.tsx: renders the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and null-commit paths
- frontend/src/components/LandingPage.test.tsx: one version-mock value changes to the object shape
- e2e/tests/TEST-08_footer_app_version.spec.ts: resolved-footer assertion tolerates an optional commit suffix

Not modified: frontend/src/components/LandingPage.tsx (the footer render site is unchanged; AppFooter owns its fetch).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (double-submit note fix; independent of TEST-10, could run concurrently). TEST-10 changes only the `fetchVersionMock.mockResolvedValue(...)` line in `beforeEach`; BUG-04 would add note-form tests. A textual conflict is likely only if both edit the same `beforeEach`. frontend/src/components/LandingPage.tsx is NOT touched by TEST-10, so the feature_map's LandingPage.tsx overlap does not hold for this plan.
- frontend/src/api/version.ts and frontend/src/api/version.test.ts may also be modified by CHORE-02 (TEST-08 follow-up: fetch timeout; independent of TEST-10, could run concurrently). Both change `fetchBackendVersion()`; serialize.
- frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by CHORE-02 (independent, could run concurrently). Serialize.
- Runtime coupling (not a file conflict): any later change to the `GET /api/version` response shape (backend `backend/app/schemas/version.py`) changes what this footer renders.
