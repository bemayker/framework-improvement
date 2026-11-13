# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
5862e2c test(TEST-08): UAT scenarios and manual script for the footer version
757abe8 test(TEST-08): E2E specs for the footer app version
740fab9 feat(TEST-08): footer shows the backend app version

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
 .claude/artifacts/TEST-08/uat_script.md            | 39 ++++++++++++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 14 +++--
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 34 +++++++++++++
 .../scenarios/TEST-08_footer_app_version.feature   | 45 +++++++++++++++++
 .../TEST-08_footer_app_version_uat_script.md       | 39 ++++++++++++++
 frontend/src/api/apiBaseUrl.ts                     |  5 ++
 frontend/src/api/notes.ts                          |  5 +-
 frontend/src/api/version.test.ts                   | 56 ++++++++++++++++++++
 frontend/src/api/version.ts                        | 27 ++++++++++
 frontend/src/components/AppFooter.test.tsx         | 59 +++++++++++++++++++---
 frontend/src/components/AppFooter.tsx              | 28 +++++++++-
 frontend/src/components/LandingPage.test.tsx       | 17 +++++--
 12 files changed, 348 insertions(+), 20 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Phase G, UAT generation: e2e/uat/scenarios//, e2e/uat/scripts//, .claude/artifacts/TEST-08/uat_script.md
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
