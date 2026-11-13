# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
4837fe0 test(TEST-08): add UAT scenarios and manual script
f26b5c2 test(TEST-08): add E2E test specs
0bcbf96 feat(TEST-08): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
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
 .claude/artifacts/TEST-08/uat_script.md            | 39 ++++++++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 16 +---
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 38 +++++++++
 e2e/uat/scenarios/TEST-04_page_footer.feature      |  2 +-
 .../scenarios/TEST-08_footer_app_version.feature   | 51 ++++++++++++
 e2e/uat/scripts/TEST-04_page_footer_uat_script.md  |  4 +-
 .../TEST-08_footer_app_version_uat_script.md       | 39 ++++++++++
 frontend/src/api/baseUrl.ts                        |  5 ++
 frontend/src/api/notes.ts                          |  4 +-
 frontend/src/api/version.test.ts                   | 90 ++++++++++++++++++++++
 frontend/src/api/version.ts                        | 35 +++++++++
 frontend/src/components/AppFooter.test.tsx         | 60 +++++++++++++--
 frontend/src/components/AppFooter.tsx              | 27 ++++++-
 frontend/src/components/LandingPage.test.tsx       | 16 +++-
 14 files changed, 394 insertions(+), 32 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
