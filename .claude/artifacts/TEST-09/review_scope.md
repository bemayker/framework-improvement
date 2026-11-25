# Review scope: TEST-09 (branch feature/TEST-09-version-build-commit)

## Commits
a89ff9d0 docs(TEST-09): documentation check
c3f33606 test(TEST-09): UAT artifacts for the version build commit
b5c57c36 feat(TEST-09): version endpoint reports the build commit

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/TEST-09/plan.md
A	.claude/artifacts/TEST-09/uat_script.md
M	.env.example
M	README.md
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
 .claude/artifacts/TEST-09/plan.md                  | 146 +++++++++++++++++++++
 .claude/artifacts/TEST-09/uat_script.md            |  63 +++++++++
 .env.example                                       |   5 +
 README.md                                          |   6 +-
 backend/Dockerfile                                 |   5 +
 backend/app/core/config.py                         |  12 ++
 backend/app/routers/version.py                     |   8 +-
 backend/app/schemas/version.py                     |   3 +-
 backend/app/services/version_service.py            |  14 +-
 .../tests/integration/test_version_integration.py  |  49 ++++++-
 backend/tests/unit/test_config_unit.py             |  29 +++-
 backend/tests/unit/test_version_service_unit.py    |  31 +++++
 docker-compose.yml                                 |   3 +
 .../scenarios/TEST-09_version_build_commit.feature |  61 +++++++++
 .../TEST-09_version_build_commit_uat_script.md     |  63 +++++++++
 15 files changed, 483 insertions(+), 15 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Phase G, UAT generation: e2e/uat/scenarios//, e2e/uat/scripts//, .claude/artifacts/TEST-09/uat_script.md
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
