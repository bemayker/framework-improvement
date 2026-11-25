# Review scope: TEST-08 (branch feature/TEST-08-footer-app-version)

## Commits
50b9e1cc test(TEST-08): UAT artifacts for the footer backend version
8af0852f test(TEST-08): E2E specs for the footer backend version
73938484 feat(TEST-08): footer shows the backend version

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
 .claude/artifacts/TEST-08/uat_script.md            | 72 ++++++++++++++++++++++
 e2e/tests/TEST-04_page_footer.spec.ts              | 16 +----
 e2e/tests/TEST-08_footer_app_version.spec.ts       | 54 ++++++++++++++++
 e2e/uat/scenarios/TEST-04_page_footer.feature      |  2 +-
 .../scenarios/TEST-08_footer_app_version.feature   | 48 +++++++++++++++
 e2e/uat/scripts/TEST-04_page_footer_uat_script.md  |  4 +-
 .../TEST-08_footer_app_version_uat_script.md       | 72 ++++++++++++++++++++++
 frontend/src/api/baseUrl.ts                        |  7 +++
 frontend/src/api/notes.ts                          |  5 +-
 frontend/src/api/version.test.ts                   | 49 +++++++++++++++
 frontend/src/api/version.ts                        | 34 ++++++++++
 frontend/src/components/AppFooter.test.tsx         | 51 ++++++++++++---
 frontend/src/components/AppFooter.tsx              | 28 ++++++++-
 frontend/src/components/LandingPage.test.tsx       | 13 +++-
 14 files changed, 425 insertions(+), 30 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Phase G, UAT generation: e2e/uat/scenarios/, e2e/uat/scripts/, .claude/artifacts/TEST-08/uat_script.md
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
