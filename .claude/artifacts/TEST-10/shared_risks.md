# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion()` resolves `{ version, commit }` (commit cut to 7 characters, or null) instead of a bare string
- frontend/src/api/version.test.ts: assertions moved to the new resolved shape, commit cases added
- frontend/src/components/AppFooter.tsx: renders an `app-commit` span after the version
- frontend/src/components/AppFooter.test.tsx: mock moved to the new shape, commit success, pending and failure assertions added
- frontend/src/components/LandingPage.test.tsx: one line in `beforeEach`, the `getBackendVersion` mock resolves `{ version, commit: null }`

Not modified: frontend/src/components/LandingPage.tsx, frontend/src/api/notes.ts, frontend/src/components/NoteForm.tsx, any existing spec under e2e/tests/, e2e/helpers/.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; planned in parallel this run). TEST-10 changes only the version mock line in `beforeEach`; BUG-04 would plausibly add note-form submit tests in the same file. Textually disjoint hunks, but the same file: serialize the builds or expect a trivial merge. TEST-10 does not touch frontend/src/components/LandingPage.tsx, which the map's note names for both.
- frontend/src/api/version.ts and frontend/src/api/version.test.ts may also be modified by CHORE-02 (independent, could run concurrently; TEST-08 follow-up, fetch timeout). Same function body: serialize.
- frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by CHORE-02 (independent) and FEAT-9 (independent, footer build note). Serialize if either runs concurrently.
- A change to the `getBackendVersion` return shape breaks any other item's test that mocks `../api/version` with a bare string: today that is AppFooter.test.tsx and LandingPage.test.tsx, both in this manifest.
