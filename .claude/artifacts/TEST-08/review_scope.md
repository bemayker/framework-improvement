# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
9b9be0b test(TEST-08): add UAT scenarios and manual script
9eb4130 test(TEST-08): add E2E test specs
93bcac3 feat(TEST-08): implement frontend components

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
 .claude/artifacts/TEST-08/uat_script.md            | 57 +++++++++++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 15 ++--
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 58 +++++++++++++
 .../scenarios/TEST-08_footer_app_version.feature   | 41 +++++++++
 .../TEST-08_footer_app_version_uat_script.md       | 57 +++++++++++++
 frontend/src/api/baseUrl.ts                        |  7 ++
 frontend/src/api/notes.ts                          |  4 +-
 frontend/src/api/version.test.ts                   | 96 ++++++++++++++++++++++
 frontend/src/api/version.ts                        | 35 ++++++++
 frontend/src/components/AppFooter.test.tsx         | 61 ++++++++++++--
 frontend/src/components/AppFooter.tsx              | 27 +++++-
 frontend/src/components/LandingPage.test.tsx       | 15 +++-
 12 files changed, 454 insertions(+), 19 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
