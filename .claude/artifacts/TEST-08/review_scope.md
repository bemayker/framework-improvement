# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
a83253c chore(TEST-08): update documentation
8b17cfc test(TEST-08): add UAT scenarios and manual script
776a9b5 test(TEST-08): add E2E test specs
9952f1b feat(TEST-08): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
M	docs/DEVELOPMENT.md
A	e2e/helpers/backendVersion.ts
M	e2e/tests/TEST-04_page_footer.spec.ts
A	e2e/tests/TEST-08_footer_app_version.spec.ts
M	e2e/uat/scenarios/TEST-04_page_footer.feature
A	e2e/uat/scenarios/TEST-08_footer_app_version.feature
M	e2e/uat/scripts/TEST-04_page_footer_uat_script.md
A	e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
A	frontend/src/api/baseUrl.ts
M	frontend/src/api/notes.ts
A	frontend/src/api/version.test.ts
A	frontend/src/api/version.ts
M	frontend/src/components/AppFooter.test.tsx
M	frontend/src/components/AppFooter.tsx
M	frontend/src/components/LandingPage.test.tsx

## Diffstat
 .claude/artifacts/TEST-08/uat_script.md            | 44 +++++++++++
 docs/DEVELOPMENT.md                                |  2 +-
 e2e/helpers/backendVersion.ts                      | 17 +++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 10 +--
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 45 ++++++++++++
 e2e/uat/scenarios/TEST-04_page_footer.feature      |  2 +-
 .../scenarios/TEST-08_footer_app_version.feature   | 42 +++++++++++
 e2e/uat/scripts/TEST-04_page_footer_uat_script.md  |  4 +-
 .../TEST-08_footer_app_version_uat_script.md       | 44 +++++++++++
 frontend/src/api/baseUrl.ts                        |  7 ++
 frontend/src/api/notes.ts                          |  5 +-
 frontend/src/api/version.test.ts                   | 85 ++++++++++++++++++++++
 frontend/src/api/version.ts                        | 37 ++++++++++
 frontend/src/components/AppFooter.test.tsx         | 59 +++++++++++++--
 frontend/src/components/AppFooter.tsx              | 33 ++++++++-
 frontend/src/components/LandingPage.test.tsx       | 21 +++++-
 16 files changed, 428 insertions(+), 29 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
