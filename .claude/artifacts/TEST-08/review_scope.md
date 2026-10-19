# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
f871a3c test(TEST-08): add UAT scenarios and manual script
449ce6a test(TEST-08): add E2E test specs
264dec3 feat(TEST-08): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
M	e2e/tests/TEST-04_page_footer.spec.ts
A	e2e/tests/TEST-08_footer_app_version.spec.ts
A	e2e/uat/scenarios/TEST-08_footer_app_version.feature
A	e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
A	frontend/src/api/config.ts
M	frontend/src/api/notes.ts
A	frontend/src/api/version.test.ts
A	frontend/src/api/version.ts
M	frontend/src/components/AppFooter.test.tsx
M	frontend/src/components/AppFooter.tsx
M	frontend/src/components/LandingPage.test.tsx

## Diffstat
 .claude/artifacts/TEST-08/uat_script.md            | 56 +++++++++++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 12 +--
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 32 ++++++++
 .../scenarios/TEST-08_footer_app_version.feature   | 44 ++++++++++
 .../TEST-08_footer_app_version_uat_script.md       | 56 +++++++++++++
 frontend/src/api/config.ts                         |  6 ++
 frontend/src/api/notes.ts                          |  4 +-
 frontend/src/api/version.test.ts                   | 94 ++++++++++++++++++++++
 frontend/src/api/version.ts                        | 33 ++++++++
 frontend/src/components/AppFooter.test.tsx         | 59 ++++++++++++--
 frontend/src/components/AppFooter.tsx              | 28 ++++++-
 frontend/src/components/LandingPage.test.tsx       | 13 ++-
 12 files changed, 417 insertions(+), 20 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
