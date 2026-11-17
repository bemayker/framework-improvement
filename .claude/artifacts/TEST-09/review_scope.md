# Review scope: TEST-09 (branch feature/TEST-09-version-build-commit)

## Commits
8006ef0b test(TEST-09): add UAT scenarios and manual script
88a82e5e feat(TEST-09): implement backend

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-09/uat_script.md
M	.env.example
M	backend/Dockerfile
M	backend/app/core/config.py
M	backend/app/routers/version.py
M	backend/app/schemas/version.py
M	backend/app/services/version_service.py
M	backend/tests/integration/test_version_integration.py
M	backend/tests/unit/test_config_unit.py
M	backend/tests/unit/test_version_service_unit.py
M	docker-compose.yml
A	e2e/uat/scenarios/TEST-09_version_build_commit.feature
A	e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md

## Diffstat
 .claude/artifacts/TEST-09/uat_script.md            | 68 ++++++++++++++++++++++
 .env.example                                       |  5 ++
 backend/Dockerfile                                 |  3 +
 backend/app/core/config.py                         | 11 ++++
 backend/app/routers/version.py                     |  8 +--
 backend/app/schemas/version.py                     |  5 +-
 backend/app/services/version_service.py            | 11 ++++
 .../tests/integration/test_version_integration.py  | 55 +++++++++++++++--
 backend/tests/unit/test_config_unit.py             | 16 ++++-
 backend/tests/unit/test_version_service_unit.py    | 30 ++++++++++
 docker-compose.yml                                 |  2 +
 .../scenarios/TEST-09_version_build_commit.feature | 39 +++++++++++++
 .../TEST-09_version_build_commit_uat_script.md     | 68 ++++++++++++++++++++++
 13 files changed, 309 insertions(+), 12 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
