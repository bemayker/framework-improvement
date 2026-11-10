# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion` renamed `fetchBackendBuildInfo`, returns `{ version, commit }` (commit cut to 7 characters, or null)
- frontend/src/api/version.test.ts: retargeted to the renamed client, commit cases added
- frontend/src/components/AppFooter.tsx: renders the commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and version-without-commit paths
- frontend/src/components/LandingPage.test.tsx: the `../api/version` mock only (renamed function, new resolved shape); no note-form or note-list test changes
- e2e/tests/TEST-08_footer_app_version.spec.ts: spec (a) tolerates a build commit after the version

That is the complete list: this item does NOT modify `frontend/src/components/LandingPage.tsx`, `frontend/src/components/NoteForm.tsx`, `frontend/src/components/NoteForm.test.tsx`, `frontend/src/api/notes.ts`, or any backend file.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (note double-submit, being planned concurrently). TEST-10 touches only the top-of-file `../api/version` mock (lines 5, 12-17, 34) and leaves every note test alone; BUG-04 plausibly edits the submit tests further down. A textual merge is likely clean, but the two are not dependency-ordered, so serialize the builds or merge one and rebase the other. `feature_map.md` already flags TEST-10 and BUG-04 on `LandingPage.tsx`; TEST-10 does not modify `LandingPage.tsx` itself.
- frontend/src/api/version.ts, frontend/src/api/version.test.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up: fetch timeout; independent of TEST-10, both depend only on TEST-08). TEST-10 renames the client function, so a concurrent CHORE-02 edit to it will conflict semantically, not only textually: serialize.
