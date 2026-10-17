# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
82e6960 test(TEST-08): add UAT scenarios and manual script
e6962d7 test(TEST-08): add E2E test specs
b09c741 feat(TEST-08): implement frontend

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
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
 .claude/artifacts/TEST-08/uat_script.md            | 76 ++++++++++++++++++++
 e2e/helpers/backendVersion.ts                      | 19 +++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 11 ++-
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 36 ++++++++++
 .../scenarios/TEST-08_footer_app_version.feature   | 40 +++++++++++
 .../TEST-08_footer_app_version_uat_script.md       | 76 ++++++++++++++++++++
 frontend/src/api/baseUrl.ts                        |  7 ++
 frontend/src/api/notes.ts                          |  3 +-
 frontend/src/api/version.test.ts                   | 82 ++++++++++++++++++++++
 frontend/src/api/version.ts                        | 35 +++++++++
 frontend/src/components/AppFooter.test.tsx         | 66 +++++++++++++++--
 frontend/src/components/AppFooter.tsx              | 27 ++++++-
 frontend/src/components/LandingPage.test.tsx       | 13 +++-
 13 files changed, 471 insertions(+), 20 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
