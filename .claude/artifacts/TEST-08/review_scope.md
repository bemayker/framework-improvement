# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
beed905 test(TEST-08): add UAT scenarios and manual script
905d2af test(TEST-08): add E2E test specs
b6ca679 feat(TEST-08): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/uat_script.md
A	e2e/helpers/backendVersion.ts
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
 .claude/artifacts/TEST-08/uat_script.md            | 42 +++++++++++++++
 e2e/helpers/backendVersion.ts                      | 21 ++++++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 10 ++--
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 38 ++++++++++++++
 .../scenarios/TEST-08_footer_app_version.feature   | 47 +++++++++++++++++
 .../TEST-08_footer_app_version_uat_script.md       | 42 +++++++++++++++
 frontend/src/api/config.ts                         |  5 ++
 frontend/src/api/notes.ts                          |  3 +-
 frontend/src/api/version.test.ts                   | 60 ++++++++++++++++++++++
 frontend/src/api/version.ts                        | 31 +++++++++++
 frontend/src/components/AppFooter.test.tsx         | 53 ++++++++++++++++---
 frontend/src/components/AppFooter.tsx              | 28 +++++++++-
 frontend/src/components/LandingPage.test.tsx       | 16 +++++-
 13 files changed, 376 insertions(+), 20 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
