# Review scope: TEST-09 (branch feature/TEST-09-version-build-commit)

## Commits
b72c84c test(TEST-09): add UAT scenarios and manual script
b89bca1 feat(TEST-09): implement backend

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
A	e2e/uat/scenarios/TEST-09_version-build-commit.feature
A	e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md

## Diffstat
 .claude/artifacts/TEST-09/uat_script.md            | 63 ++++++++++++++++++++++
 .env.example                                       |  6 +++
 backend/app/core/config.py                         | 11 ++++
 backend/app/routers/version.py                     |  8 +--
 backend/app/schemas/version.py                     |  3 +-
 backend/app/services/version_service.py            | 13 +++++
 .../tests/integration/test_version_integration.py  | 35 ++++++++++--
 backend/tests/unit/test_config_unit.py             | 46 +++++++++++++++-
 backend/tests/unit/test_version_service_unit.py    | 29 ++++++++++
 docker-compose.yml                                 |  2 +
 .../scenarios/TEST-09_version-build-commit.feature | 55 +++++++++++++++++++
 .../TEST-09_version-build-commit_uat_script.md     | 63 ++++++++++++++++++++++
 12 files changed, 324 insertions(+), 10 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
