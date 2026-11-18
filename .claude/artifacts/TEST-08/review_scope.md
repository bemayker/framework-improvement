# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
61ce210f test(TEST-08): add UAT scenarios and manual script
af4b1378 test(TEST-08): add E2E test specs
4f41bd39 feat(TEST-08): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
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
 .claude/artifacts/TEST-08/uat_script.md            | 50 ++++++++++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 35 ++++++---
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 48 ++++++++++++
 .../scenarios/TEST-08_footer_app_version.feature   | 54 +++++++++++++
 .../TEST-08_footer_app_version_uat_script.md       | 50 ++++++++++++
 frontend/src/api/baseUrl.ts                        |  6 ++
 frontend/src/api/notes.ts                          |  5 +-
 frontend/src/api/version.test.ts                   | 88 ++++++++++++++++++++++
 frontend/src/api/version.ts                        | 31 ++++++++
 frontend/src/components/AppFooter.test.tsx         | 76 +++++++++++++++++--
 frontend/src/components/AppFooter.tsx              | 26 ++++++-
 frontend/src/components/LandingPage.test.tsx       | 20 ++++-
 12 files changed, 461 insertions(+), 28 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
