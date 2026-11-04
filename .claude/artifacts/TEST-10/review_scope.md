# Review scope: TEST-10 (branch feature/TEST-10-footer-build-commit)

## Commits
32dfa7c chore(TEST-10): update documentation
49a87b2 test(TEST-10): add UAT scenarios and manual script
44719be test(TEST-10): add E2E test specs
49fa5aa feat(TEST-10): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-10/uat_script.md
M	docs/DEVELOPMENT.md
A	e2e/tests/TEST-10_footer_build_commit.spec.ts
A	e2e/uat/scenarios/TEST-10_footer_build_commit.feature
A	e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
A	frontend/src/api/apiBaseUrl.ts
M	frontend/src/api/notes.ts
A	frontend/src/api/version.test.ts
A	frontend/src/api/version.ts
M	frontend/src/components/AppFooter.test.tsx
M	frontend/src/components/AppFooter.tsx
M	frontend/src/components/LandingPage.test.tsx

## Diffstat
 .claude/artifacts/TEST-10/uat_script.md            | 34 ++++++++++
 docs/DEVELOPMENT.md                                |  2 +-
 e2e/tests/TEST-10_footer_build_commit.spec.ts      | 43 ++++++++++++
 .../scenarios/TEST-10_footer_build_commit.feature  | 29 ++++++++
 .../TEST-10_footer_build_commit_uat_script.md      | 34 ++++++++++
 frontend/src/api/apiBaseUrl.ts                     |  5 ++
 frontend/src/api/notes.ts                          |  5 +-
 frontend/src/api/version.test.ts                   | 65 ++++++++++++++++++
 frontend/src/api/version.ts                        | 28 ++++++++
 frontend/src/components/AppFooter.test.tsx         | 77 +++++++++++++++++++++-
 frontend/src/components/AppFooter.tsx              | 30 +++++++++
 frontend/src/components/LandingPage.test.tsx       |  5 ++
 12 files changed, 351 insertions(+), 6 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
