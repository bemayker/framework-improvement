# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion` resolves `{ version, commit }` instead of a string; an unusable commit becomes `null`
- frontend/src/api/version.test.ts: existing cases moved to the object result, new commit cases
- frontend/src/components/AppFooter.tsx: renders the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: mock shape and the success, pending, failure and no-usable-commit cases
- frontend/src/components/LandingPage.test.tsx: the `fetchBackendVersion` mock returns the new object shape
- e2e/tests/TEST-08_footer_app_version.spec.ts: the success assertion accepts an optional ` (abcdef1)` commit suffix

## Potential conflicts with other independent features
- frontend/src/api/version.ts may also be modified by CHORE-02 (TEST-08 follow-up: known-improvements; depends only on TEST-08, so independent of TEST-10 and could run concurrently). The feature map already flags this pair (fetch timeout there, the commit field here): serialize.
- frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently); flagged in the map as "possibly". Serialize with the pair above.
- frontend/src/api/version.test.ts and frontend/src/components/AppFooter.test.tsx follow the two files above and carry the same CHORE-02 risk.
- BUG-04 (planned, `.claude/artifacts/BUG-04/plan.md`): no real file overlap. BUG-04's manifest is `frontend/src/components/NoteForm.tsx`, `frontend/src/components/NoteForm.test.tsx`, `e2e/tests/BUG-04_double_submit_note.spec.ts`, its two UAT files and its `uat_script.md` copy; TEST-10 touches none of them. The feature map's flag on `frontend/src/components/LandingPage.tsx` does not materialize: neither plan modifies `LandingPage.tsx`. TEST-10 modifies `LandingPage.test.tsx`, which BUG-04 does not list. The two can run concurrently on files; the map's serialization is conservative, not required by either manifest.
- The full frontend Vitest suite and the E2E suite are shared by every item: a change to `fetchBackendVersion`'s resolved shape breaks any test outside this manifest that mocks it with a string. At the plan base only `AppFooter.test.tsx` and `LandingPage.test.tsx` mock it, and both are in this manifest.
- Not modified, noted for a reader: `e2e/uat/scenarios/TEST-08_footer_app_version.feature` reads "exactly Task Notes v0.1.0", which stays true on a stack built without `BUILD_COMMIT` (the default) and is not executed by a runner; it is left unchanged.
