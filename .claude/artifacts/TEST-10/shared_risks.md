# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion` renamed to `getBackendBuildInfo`, returns version and commit
- frontend/src/api/version.test.ts: tests for the commit field, against the renamed function
- frontend/src/components/AppFooter.tsx: renders the 7-character commit after the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure cases, mock renamed
- frontend/src/components/LandingPage.test.tsx: version-client mock factory and seed retargeted to `getBackendBuildInfo` (rename follow-through, no assertion changes)
- e2e/tests/TEST-08_footer_app_version.spec.ts: the test asserting the commit is NOT shown is superseded; live-backend assertion loosened

## Potential conflicts with other independent features
- frontend/src/api/version.ts may also be modified by CHORE-02 (TEST-08 follow-up: fetch timeout on the `/api/version` request; planned concurrently). Both edit the same function: CHORE-02 the `fetch` call, TEST-10 the function name, return type and parsing. Serialize the builds; whichever builds second rebases onto the first and must use the name on main (`getBackendBuildInfo` if TEST-10 lands first).
- frontend/src/api/version.test.ts may also be modified by CHORE-02 (timeout tests against the same client). Serialize; same rename note.
- frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by CHORE-02 if its timeout surfaces through the footer's unavailable state (the CHORE-02 decision log names AppFooter.tsx as a shared risk). Serialize.
- frontend/src/components/LandingPage.test.tsx mocks the version client by name; any concurrent item that edits it (none planned now), and CHORE-02 if it adds a second export LandingPage's tree calls, must keep the factory in step with the exports on main. Serialize with CHORE-02 for the same reason as version.ts.
- frontend/src/components/LandingPage.tsx: flagged in feature_map.md as shared with BUG-04, but BUG-04 is done and TEST-10 does not modify LandingPage.tsx (the footer is its own component), so no live conflict.
- BUG-03 (Footer sometimes shows 'unknown' instead of the build commit) depends on TEST-10 and will touch the same footer and client files; it is sequenced after TEST-10 by the dependency graph, not concurrent.
