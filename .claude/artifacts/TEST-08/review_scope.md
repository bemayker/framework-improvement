# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
380881e chore(TEST-08): update documentation
8ccae1b test(TEST-08): add UAT scenarios and manual script
c9abc0f test(TEST-08): add E2E test specs
5ab223f feat(TEST-08): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
M	docs/DEVELOPMENT.md
A	e2e/helpers/backendVersion.ts
M	e2e/tests/TEST-04_page_footer.spec.ts
A	e2e/tests/TEST-08_footer_app_version.spec.ts
A	e2e/uat/scenarios/TEST-08_footer_app_version.feature
A	e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
A	frontend/src/api/baseUrl.ts
M	frontend/src/api/notes.ts
A	frontend/src/api/version.test.ts
A	frontend/src/api/version.ts
M	frontend/src/components/AppFooter.test.tsx
M	frontend/src/components/AppFooter.tsx
M	frontend/src/components/LandingPage.test.tsx

## Diffstat
 .claude/artifacts/TEST-08/uat_script.md            |  45 +++++++++
 docs/DEVELOPMENT.md                                |   2 +-
 e2e/helpers/backendVersion.ts                      |  19 ++++
 e2e/tests/TEST-04_page_footer.spec.ts              |  10 +-
 e2e/tests/TEST-08_footer_app_version.spec.ts       |  26 ++++++
 .../scenarios/TEST-08_footer_app_version.feature   |  53 +++++++++++
 .../TEST-08_footer_app_version_uat_script.md       |  45 +++++++++
 frontend/src/api/baseUrl.ts                        |   7 ++
 frontend/src/api/notes.ts                          |   3 +-
 frontend/src/api/version.test.ts                   | 101 +++++++++++++++++++++
 frontend/src/api/version.ts                        |  38 ++++++++
 frontend/src/components/AppFooter.test.tsx         |  57 ++++++++++--
 frontend/src/components/AppFooter.tsx              |  31 ++++++-
 frontend/src/components/LandingPage.test.tsx       |  17 +++-
 14 files changed, 432 insertions(+), 22 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
