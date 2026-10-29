# Review scope: TEST-10 (branch feature/TEST-10-footer-build-commit)

## Commits
defee67 test(TEST-10): add UAT scenarios and manual script
118ed80 feat(TEST-10): implement frontend

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-10/uat_script.md
A	e2e/uat/scenarios/TEST-10_footer_build_commit.feature
A	e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
M	frontend/src/api/version.test.ts
M	frontend/src/api/version.ts
M	frontend/src/components/AppFooter.test.tsx
M	frontend/src/components/AppFooter.tsx
M	frontend/src/components/LandingPage.test.tsx

## Diffstat
 .claude/artifacts/TEST-10/uat_script.md            | 45 +++++++++++
 .../scenarios/TEST-10_footer_build_commit.feature  | 43 +++++++++++
 .../TEST-10_footer_build_commit_uat_script.md      | 45 +++++++++++
 frontend/src/api/version.test.ts                   | 64 +++++++++++++---
 frontend/src/api/version.ts                        | 42 +++++++----
 frontend/src/components/AppFooter.test.tsx         | 88 +++++++++++++++++-----
 frontend/src/components/AppFooter.tsx              | 16 +++-
 frontend/src/components/LandingPage.test.tsx       |  5 +-
 8 files changed, 299 insertions(+), 49 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
