# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
49e56f4 chore(TEST-08): update documentation
b7057a5 test(TEST-08): add UAT scenarios and manual script
0afde38 test(TEST-08): add E2E test specs
17102da feat(TEST-08): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
M	docs/DEVELOPMENT.md
M	e2e/tests/TEST-04_page_footer.spec.ts
A	e2e/tests/TEST-08_footer_app_version.spec.ts
M	e2e/uat/scenarios/TEST-04_page_footer.feature
A	e2e/uat/scenarios/TEST-08_footer_app_version.feature
M	e2e/uat/scripts/TEST-04_page_footer_uat_script.md
A	e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
A	frontend/src/api/apiBaseUrl.ts
M	frontend/src/api/notes.ts
A	frontend/src/api/version.test.ts
A	frontend/src/api/version.ts
M	frontend/src/components/AppFooter.test.tsx
M	frontend/src/components/AppFooter.tsx
M	frontend/src/components/LandingPage.test.tsx

## Diffstat
 .claude/artifacts/TEST-08/uat_script.md            |  49 ++++++++++
 docs/DEVELOPMENT.md                                |   2 +-
 e2e/tests/TEST-04_page_footer.spec.ts              |  27 +++---
 e2e/tests/TEST-08_footer_app_version.spec.ts       |  29 ++++++
 e2e/uat/scenarios/TEST-04_page_footer.feature      |   2 +-
 .../scenarios/TEST-08_footer_app_version.feature   |  47 +++++++++
 e2e/uat/scripts/TEST-04_page_footer_uat_script.md  |   4 +-
 .../TEST-08_footer_app_version_uat_script.md       |  49 ++++++++++
 frontend/src/api/apiBaseUrl.ts                     |   5 +
 frontend/src/api/notes.ts                          |   5 +-
 frontend/src/api/version.test.ts                   | 105 +++++++++++++++++++++
 frontend/src/api/version.ts                        |  46 +++++++++
 frontend/src/components/AppFooter.test.tsx         |  64 +++++++++++--
 frontend/src/components/AppFooter.tsx              |  28 +++++-
 frontend/src/components/LandingPage.test.tsx       |  17 +++-
 15 files changed, 448 insertions(+), 31 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
