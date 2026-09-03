# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
e2693aa test(TEST-08): add UAT scenarios and manual script
af4314d test(TEST-08): add E2E test specs
728331c feat(TEST-08): implement frontend components
207afc1 plan(TEST-08): re-plan, version fetched from the backend at runtime
1e4ab8c plan(TEST-08): architect plan for footer app version

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-08/plan.md
A	.claude/artifacts/TEST-08/shared_risks.md
A	.claude/artifacts/TEST-08/uat_script.md
M	e2e/tests/TEST-04_page_footer.spec.ts
A	e2e/tests/TEST-08_footer_app_version.spec.ts
M	e2e/uat/scenarios/TEST-04_page_footer.feature
A	e2e/uat/scenarios/TEST-08_footer_app_version.feature
M	e2e/uat/scripts/TEST-04_page_footer_uat_script.md
A	e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
A	frontend/src/api/http.ts
M	frontend/src/api/notes.ts
A	frontend/src/api/version.test.ts
A	frontend/src/api/version.ts
M	frontend/src/components/AppFooter.test.tsx
M	frontend/src/components/AppFooter.tsx
M	frontend/src/components/LandingPage.test.tsx

## Diffstat
 .claude/artifacts/TEST-08/plan.md                  | 204 +++++++++++++++++++++
 .claude/artifacts/TEST-08/shared_risks.md          |  31 ++++
 .claude/artifacts/TEST-08/uat_script.md            |  84 +++++++++
 e2e/tests/TEST-04_page_footer.spec.ts              |  43 +++--
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 122 ++++++++++++
 e2e/uat/scenarios/TEST-04_page_footer.feature      |   2 +-
 .../scenarios/TEST-08_footer_app_version.feature   |  48 +++++
 e2e/uat/scripts/TEST-04_page_footer_uat_script.md  |   4 +-
 .../TEST-08_footer_app_version_uat_script.md       |  84 +++++++++
 frontend/src/api/http.ts                           |  14 ++
 frontend/src/api/notes.ts                          |  11 +-
 frontend/src/api/version.test.ts                   |  94 ++++++++++
 frontend/src/api/version.ts                        |  34 ++++
 frontend/src/components/AppFooter.test.tsx         |  65 ++++++-
 frontend/src/components/AppFooter.tsx              |  53 +++++-
 frontend/src/components/LandingPage.test.tsx       |  13 +-
 16 files changed, 872 insertions(+), 34 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
