# Review scope: TEST-09 (branch feature/TEST-09-version-build-commit)

## Commits
56698a2 chore(TEST-09): update documentation
740b1a8 test(TEST-09): add UAT scenarios and manual script
e21dcae feat(TEST-09): implement backend

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-09/uat_script.md
M	.env.example
M	backend/app/core/config.py
M	backend/app/routers/version.py
M	backend/app/schemas/version.py
M	backend/app/services/version_service.py
M	backend/tests/integration/test_version_integration.py
M	backend/tests/unit/test_config_unit.py
M	backend/tests/unit/test_version_service_unit.py
M	docker-compose.yml
M	docs/DEVELOPMENT.md
A	e2e/uat/scenarios/TEST-09_version-build-commit.feature
A	e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md

## Diffstat
 .claude/artifacts/TEST-09/uat_script.md            | 72 ++++++++++++++++++++++
 .env.example                                       |  5 ++
 backend/app/core/config.py                         | 15 +++++
 backend/app/routers/version.py                     |  6 +-
 backend/app/schemas/version.py                     |  1 +
 backend/app/services/version_service.py            | 12 ++++
 .../tests/integration/test_version_integration.py  | 55 +++++++++++++++--
 backend/tests/unit/test_config_unit.py             | 59 +++++++++++++++---
 backend/tests/unit/test_version_service_unit.py    | 34 ++++++++++
 docker-compose.yml                                 |  2 +
 docs/DEVELOPMENT.md                                |  2 +-
 .../scenarios/TEST-09_version-build-commit.feature | 54 ++++++++++++++++
 .../TEST-09_version-build-commit_uat_script.md     | 72 ++++++++++++++++++++++
 13 files changed, 371 insertions(+), 18 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
