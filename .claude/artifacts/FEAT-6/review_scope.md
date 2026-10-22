# Review scope: FEAT-6 (branch feature/FEAT-6-stamp-endpoint-and-footer)

## Commits
97db7ed test(FEAT-6): add UAT scenarios and manual script
575c39a test(FEAT-6): add E2E test specs
5257b44 feat(FEAT-6): implement backend
2345d96 feat(FEAT-6): implement frontend components

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/FEAT-6/uat_script.md
M	backend/app/main.py
A	backend/app/routers/stamp.py
A	backend/app/schemas/stamp.py
A	backend/app/services/stamp_service.py
A	backend/tests/integration/test_stamp_integration.py
M	backend/tests/unit/test_main_unit.py
A	backend/tests/unit/test_stamp_service_unit.py
A	e2e/tests/FEAT-6_stamp_endpoint_and_footer.spec.ts
A	e2e/uat/scenarios/FEAT-6_stamp_endpoint_and_footer.feature
A	e2e/uat/scripts/FEAT-6_stamp_endpoint_and_footer_uat_script.md
A	frontend/src/api/config.ts
M	frontend/src/api/notes.ts
A	frontend/src/api/stamp.test.ts
A	frontend/src/api/stamp.ts
M	frontend/src/components/AppFooter.test.tsx
M	frontend/src/components/AppFooter.tsx
M	frontend/src/components/LandingPage.test.tsx

## Diffstat
 .claude/artifacts/FEAT-6/uat_script.md             | 64 ++++++++++++++++++++++
 backend/app/main.py                                |  4 +-
 backend/app/routers/stamp.py                       | 15 +++++
 backend/app/schemas/stamp.py                       | 12 ++++
 backend/app/services/stamp_service.py              | 42 ++++++++++++++
 .../tests/integration/test_stamp_integration.py    | 42 ++++++++++++++
 backend/tests/unit/test_main_unit.py               |  9 +++
 backend/tests/unit/test_stamp_service_unit.py      | 53 ++++++++++++++++++
 e2e/tests/FEAT-6_stamp_endpoint_and_footer.spec.ts | 18 ++++++
 .../FEAT-6_stamp_endpoint_and_footer.feature       | 39 +++++++++++++
 .../FEAT-6_stamp_endpoint_and_footer_uat_script.md | 64 ++++++++++++++++++++++
 frontend/src/api/config.ts                         |  7 +++
 frontend/src/api/notes.ts                          |  5 +-
 frontend/src/api/stamp.test.ts                     | 62 +++++++++++++++++++++
 frontend/src/api/stamp.ts                          | 22 ++++++++
 frontend/src/components/AppFooter.test.tsx         | 55 +++++++++++++++++--
 frontend/src/components/AppFooter.tsx              | 29 ++++++++++
 frontend/src/components/LandingPage.test.tsx       |  5 ++
 18 files changed, 538 insertions(+), 9 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
