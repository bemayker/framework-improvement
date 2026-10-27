# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion()` renamed to `fetchBackendBuildInfo()`, now returning `{ version, commit }`
- frontend/src/api/version.test.ts: retargeted to the renamed export, commit cases added
- frontend/src/components/AppFooter.tsx: renders the 7-character commit after the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure paths with the commit
- frontend/src/components/LandingPage.test.tsx: mock the renamed `fetchBackendBuildInfo` export (no assertion change)

## Potential conflicts with other independent features
- BUG-04 (in flight, worktree .claude/worktrees/BUG-04): its File Manifest lists `frontend/src/components/NoteForm.tsx`, `frontend/src/components/NoteForm.test.tsx`, `e2e/tests/BUG-04_double_submit_note.spec.ts` and its own UAT files. No file overlaps with this plan. The graph's predicted overlap on `frontend/src/components/LandingPage.tsx` does not materialize: neither plan modifies `LandingPage.tsx`. The nearest contact is `frontend/src/components/LandingPage.test.tsx`, which this item edits (mock rename only) and BUG-04 does not list; if BUG-04's build ends up touching it to cover the double-submit through the page, the two edits are in different `vi.mock` blocks and tests, so a merge is textual at most. Safe to build concurrently; no serialization needed on files.
- Renamed export: any branch that imports or mocks `fetchBackendVersion` from `frontend/src/api/version` breaks once this item merges. On main today only `AppFooter.tsx`, `AppFooter.test.tsx` and `LandingPage.test.tsx` reference it, all in this manifest; BUG-04's plan references none of them.
- CHORE-02 (TEST-08 known-improvements) is flagged in `feature_map.md` as plausibly editing `frontend/src/api/version.ts` and `AppFooter.tsx`; it is cancelled in the tracker and outside this run's graph, so there is no live conflict.
- TEST-08 and TEST-09 are dependencies, both merged on main (8636197); no concurrency with them.
