# Review scope: TEST-10 (branch feature/TEST-10-footer-build-commit)

## Commits
54e624ff test(TEST-10): UAT artifacts for the footer build commit
d4fad1d5 test(TEST-10): E2E specs for the footer build commit
1cd9569b feat(TEST-10): footer shows the build commit

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-10/uat_script.md
M	e2e/tests/TEST-08_footer_app_version.spec.ts
A	e2e/tests/TEST-10_footer_build_commit.spec.ts
A	e2e/uat/scenarios/TEST-10_footer_build_commit.feature
A	e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
M	frontend/src/api/version.test.ts
M	frontend/src/api/version.ts
M	frontend/src/components/AppFooter.test.tsx
M	frontend/src/components/AppFooter.tsx
M	frontend/src/components/LandingPage.test.tsx

## Diffstat
 .claude/artifacts/TEST-10/uat_script.md            | 56 ++++++++++++++++++
 e2e/tests/TEST-08_footer_app_version.spec.ts       |  3 +-
 e2e/tests/TEST-10_footer_build_commit.spec.ts      | 64 +++++++++++++++++++++
 .../scenarios/TEST-10_footer_build_commit.feature  | 44 +++++++++++++++
 .../TEST-10_footer_build_commit_uat_script.md      | 56 ++++++++++++++++++
 frontend/src/api/version.test.ts                   | 66 +++++++++++++++++++++-
 frontend/src/api/version.ts                        | 34 +++++++++--
 frontend/src/components/AppFooter.test.tsx         | 32 ++++++++++-
 frontend/src/components/AppFooter.tsx              | 12 +++-
 frontend/src/components/LandingPage.test.tsx       |  5 +-
 10 files changed, 359 insertions(+), 13 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Phase G, UAT generation: e2e/uat/scenarios/, e2e/uat/scripts/, .claude/artifacts/TEST-10/uat_script.md
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
