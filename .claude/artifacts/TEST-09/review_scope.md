# Review scope: TEST-09 (branch feature/TEST-09-version-build-commit)

## Commits
7eca19e7 test(TEST-09): add UAT scenarios and manual script
48966f41 feat(TEST-09): implement backend

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-09/uat_script.md
M	.env.example
M	backend/app/core/config.py
M	backend/app/routers/version.py
M	backend/app/schemas/version.py
M	backend/app/services/version_service.py
M	backend/tests/integration/test_version_integration.py
M	backend/tests/unit/test_config_unit.py
A	backend/tests/unit/test_version_schema_unit.py
M	backend/tests/unit/test_version_service_unit.py
M	docker-compose.yml
A	e2e/uat/scenarios/TEST-09_version_build_commit.feature
A	e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md

## Diffstat
 .claude/artifacts/TEST-09/uat_script.md            | 66 ++++++++++++++++++++++
 .env.example                                       |  5 ++
 backend/app/core/config.py                         | 14 +++++
 backend/app/routers/version.py                     |  8 +--
 backend/app/schemas/version.py                     |  1 +
 backend/app/services/version_service.py            |  9 +++
 .../tests/integration/test_version_integration.py  | 56 ++++++++++++++++--
 backend/tests/unit/test_config_unit.py             | 24 +++++++-
 backend/tests/unit/test_version_schema_unit.py     | 24 ++++++++
 backend/tests/unit/test_version_service_unit.py    | 23 ++++++++
 docker-compose.yml                                 |  2 +
 .../scenarios/TEST-09_version_build_commit.feature | 32 +++++++++++
 .../TEST-09_version_build_commit_uat_script.md     | 66 ++++++++++++++++++++++
 13 files changed, 321 insertions(+), 9 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
