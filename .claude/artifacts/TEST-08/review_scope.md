# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
d1fb8c7f test(TEST-08): add UAT scenarios and manual script
054d92f9 test(TEST-08): add E2E test specs
ff7e1d15 feat(TEST-08): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
M	e2e/tests/TEST-04_page_footer.spec.ts
A	e2e/tests/TEST-08_footer_app_version.spec.ts
A	e2e/uat/scenarios/TEST-08_footer_app_version.feature
A	e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
A	frontend/src/api/apiBaseUrl.ts
M	frontend/src/api/notes.ts
A	frontend/src/api/version.test.ts
A	frontend/src/api/version.ts
M	frontend/src/components/AppFooter.test.tsx
M	frontend/src/components/AppFooter.tsx
M	frontend/src/components/LandingPage.test.tsx

## Diffstat
 .claude/artifacts/TEST-08/uat_script.md            | 38 +++++++++++++
 e2e/tests/TEST-04_page_footer.spec.ts              |  9 ++-
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 31 +++++++++++
 .../scenarios/TEST-08_footer_app_version.feature   | 46 +++++++++++++++
 .../TEST-08_footer_app_version_uat_script.md       | 38 +++++++++++++
 frontend/src/api/apiBaseUrl.ts                     |  7 +++
 frontend/src/api/notes.ts                          |  4 +-
 frontend/src/api/version.test.ts                   | 65 ++++++++++++++++++++++
 frontend/src/api/version.ts                        | 34 +++++++++++
 frontend/src/components/AppFooter.test.tsx         | 58 ++++++++++++++++---
 frontend/src/components/AppFooter.tsx              | 26 ++++++++-
 frontend/src/components/LandingPage.test.tsx       | 15 ++++-
 12 files changed, 352 insertions(+), 19 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
