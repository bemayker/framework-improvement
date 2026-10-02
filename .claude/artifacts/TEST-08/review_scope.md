# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
0790cd6 test(TEST-08): add UAT scenarios and manual script
6b6a2e7 test(TEST-08): add E2E test specs
1be083b feat(TEST-08): implement frontend

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
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
 .claude/artifacts/TEST-08/uat_script.md            | 64 ++++++++++++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 16 +---
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 27 ++++++
 e2e/uat/scenarios/TEST-04_page_footer.feature      | 16 ++--
 .../scenarios/TEST-08_footer_app_version.feature   | 41 +++++++++
 e2e/uat/scripts/TEST-04_page_footer_uat_script.md  | 21 +++--
 .../TEST-08_footer_app_version_uat_script.md       | 64 ++++++++++++++
 frontend/src/api/apiBaseUrl.ts                     |  8 ++
 frontend/src/api/notes.ts                          |  3 +-
 frontend/src/api/version.test.ts                   | 98 ++++++++++++++++++++++
 frontend/src/api/version.ts                        | 38 +++++++++
 frontend/src/components/AppFooter.test.tsx         | 56 +++++++++++--
 frontend/src/components/AppFooter.tsx              | 33 +++++++-
 frontend/src/components/LandingPage.test.tsx       | 13 ++-
 14 files changed, 453 insertions(+), 45 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
