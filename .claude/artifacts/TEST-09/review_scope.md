# Review scope: TEST-09 (branch feature/TEST-09-version-build-commit)

## Commits
165971d test(TEST-09): UAT scenarios and manual script for the build commit
9b44a89 feat(TEST-09): version endpoint reports the build commit

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
 .claude/artifacts/TEST-09/uat_script.md            | 27 ++++++++++
 .env.example                                       |  5 ++
 backend/Dockerfile                                 |  4 ++
 backend/app/core/config.py                         | 11 +++++
 backend/app/routers/version.py                     |  6 +--
 backend/app/schemas/version.py                     |  1 +
 backend/app/services/version_service.py            |  9 ++++
 .../tests/integration/test_version_integration.py  | 57 +++++++++++++++++++---
 backend/tests/unit/test_config_unit.py             | 29 ++++++++++-
 backend/tests/unit/test_version_service_unit.py    | 31 ++++++++++++
 docker-compose.yml                                 |  2 +
 .../scenarios/TEST-09_version_build_commit.feature | 42 ++++++++++++++++
 .../TEST-09_version_build_commit_uat_script.md     | 27 ++++++++++
 13 files changed, 241 insertions(+), 10 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Phase G, UAT generation: e2e/uat/scenarios//, e2e/uat/scripts//, .claude/artifacts/TEST-09/uat_script.md
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
