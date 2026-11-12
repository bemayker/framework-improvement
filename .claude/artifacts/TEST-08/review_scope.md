# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
7a87f6c test(TEST-08): add UAT scenarios and manual script
2a73bf2 test(TEST-08): add E2E test specs
665ccbb feat(TEST-08): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
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
 .claude/artifacts/TEST-08/uat_script.md            | 54 +++++++++++++++
 e2e/helpers/backendVersion.ts                      | 18 +++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 10 +--
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 29 ++++++++
 e2e/uat/scenarios/TEST-04_page_footer.feature      |  2 +-
 .../scenarios/TEST-08_footer_app_version.feature   | 40 +++++++++++
 e2e/uat/scripts/TEST-04_page_footer_uat_script.md  |  4 +-
 .../TEST-08_footer_app_version_uat_script.md       | 54 +++++++++++++++
 frontend/src/api/baseUrl.ts                        |  6 ++
 frontend/src/api/notes.ts                          |  5 +-
 frontend/src/api/version.test.ts                   | 80 ++++++++++++++++++++++
 frontend/src/api/version.ts                        | 36 ++++++++++
 frontend/src/components/AppFooter.test.tsx         | 59 +++++++++++++---
 frontend/src/components/AppFooter.tsx              | 30 +++++++-
 frontend/src/components/LandingPage.test.tsx       | 14 +++-
 15 files changed, 415 insertions(+), 26 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
