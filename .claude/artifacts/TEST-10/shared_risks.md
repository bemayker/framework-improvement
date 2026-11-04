# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion` resolves `{ version, commit }`, with the commit shortened to 7 characters
- frontend/src/api/version.test.ts: object-shape assertions and the commit cases
- frontend/src/components/AppFooter.tsx: renders the `app-commit` span next to the version
- frontend/src/components/AppFooter.test.tsx: success with and without a commit, plus the pending and failure paths
- frontend/src/components/LandingPage.test.tsx: the `fetchBackendVersion` mock moves to the object shape (assertions unchanged)
- e2e/helpers/backendVersion.ts: adds `openLandingPageAndReadBackendBuild`
- e2e/tests/TEST-08_footer_app_version.spec.ts: the exact-text success assertion is narrowed to the version part

## Potential conflicts with other independent features
- BUG-04 (building concurrently now, on frontend/src/components/NoteForm.tsx, NoteForm.test.tsx and its own e2e and UAT files): **no shared file.** TEST-10 does not modify `frontend/src/components/LandingPage.tsx` (feature_map's warning names it, and this plan leaves it untouched), `NoteForm.tsx` or `NoteForm.test.tsx`. The nearest file is `frontend/src/components/LandingPage.test.tsx`, which TEST-10 modifies (the version mock only). It is shared only if BUG-04's build also edits it, for example to test a double submit through the page. In that case the two edits touch different tests in the same file (TEST-10 changes the `beforeEach` mock line), and the later merge needs a text merge, not a behavioural one. If BUG-04 also changes how `vi.mock("../api/version")` is used there, serialize.
- frontend/src/api/version.ts, frontend/src/api/version.test.ts and frontend/src/components/AppFooter.tsx (with AppFooter.test.tsx) may also be modified by CHORE-02 (TEST-08 follow-up: a fetch timeout in version.ts, possibly AppFooter.tsx). It is independent of TEST-10 and could run concurrently. Both change the same function, `fetchBackendVersion`: TEST-10 changes its return shape. Serialize the two.
- e2e/helpers/backendVersion.ts and e2e/tests/TEST-08_footer_app_version.spec.ts may also be modified by CHORE-02, if its follow-up touches TEST-08's E2E coverage (independent, could run concurrently). Serialize with CHORE-02 as above.
