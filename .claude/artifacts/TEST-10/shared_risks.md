# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer-build-commit.feature
- e2e/uat/scripts/TEST-10_footer-build-commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion()` returns `{ version, commit }` or null and reads the `commit` field
- frontend/src/api/version.test.ts: cases updated to the object result, commit cases added
- frontend/src/components/AppFooter.tsx: renders the first 7 characters of the commit after the version
- frontend/src/components/AppFooter.test.tsx: success, version-without-commit, pending and failure paths
- frontend/src/components/LandingPage.test.tsx: the `fetchBackendVersion` mock resolves the new object shape
- docs/DEVELOPMENT.md: the footer paragraph gains the commit `unknown` case

That is the complete list. This feature does **not** modify `frontend/src/components/LandingPage.tsx`, `frontend/src/components/NoteForm.tsx`, `frontend/src/components/NoteForm.test.tsx`, any backend file, or any E2E spec.

## Potential conflicts with other independent features
- BUG-04 (being planned concurrently): per its dispatch it changes only `frontend/src/components/NoteForm.tsx`, `frontend/src/components/NoteForm.test.tsx` and its own UAT files. **No file overlap with TEST-10.** The feature map row's warning about `frontend/src/components/LandingPage.tsx` does not materialise: TEST-10 leaves `LandingPage.tsx` untouched and changes only `LandingPage.test.tsx`'s version mock. If BUG-04's plan ends up editing `LandingPage.test.tsx` too, the two edits are in different `vi.mock`/`it` blocks and merge trivially, but serialize if that happens.
- frontend/src/api/version.ts, frontend/src/api/version.test.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up; independent of TEST-10, could run concurrently). TEST-10 changes the return type of `fetchBackendVersion()`, so a concurrent CHORE-02 edit to the same function conflicts semantically, not only textually: serialize the pair.
- docs/DEVELOPMENT.md is a shared document; another item editing the same footer paragraph (CHORE-02 plausibly) would conflict on one line.
