# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchVersion()` resolves `{ version, commit }` instead of a bare version string
- frontend/src/api/version.test.ts: assertions for the commit field
- frontend/src/components/AppFooter.tsx: renders the first 7 characters of the commit after the version
- frontend/src/components/AppFooter.test.tsx: mocks resolve objects; success, pending, failure and unusable-commit cases
- frontend/src/components/LandingPage.test.tsx: one line, the `fetchVersion` mock in `beforeEach` resolves `{ version: BACKEND_VERSION, commit: null }` instead of a string (forced by the client's new return type)

LandingPage.tsx: NOT touched by this feature. LandingPage.test.tsx: touched, one line in `beforeEach` (the `vi.mocked(fetchVersion).mockResolvedValue(...)` call); no test is added or removed there.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; its map row flags LandingPage.tsx, and a double-submit fix in NoteForm.tsx or api/notes.ts plausibly adds a LandingPage-level test). The overlap is one line in `beforeEach`; a textual conflict is possible only if BUG-04 edits that same `beforeEach` block. frontend/src/components/LandingPage.tsx is not in this feature's set, so the map row's LandingPage.tsx flag does not materialise from this side.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently; TEST-08 follow-up, fetch timeout in version.ts per its map row). Serialize if both run.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent; its map row says it edits the frontend footer). Serialize if both run.
