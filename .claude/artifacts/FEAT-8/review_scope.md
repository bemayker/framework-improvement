# Review scope: FEAT-8 (branch feature/FEAT-8-api-version-json-version)

## Commits
db7d36b test(FEAT-8): add UAT scenarios and manual script
e6360dc feat(FEAT-8): implement backend

## Changed files (A=added M=modified D=deleted R=renamed)
A	.claude/artifacts/FEAT-8/uat_script.md
M	backend/pyproject.toml
M	backend/tests/integration/test_version_integration.py
M	backend/uv.lock
A	e2e/uat/scenarios/FEAT-8_api_version_json_version.feature
A	e2e/uat/scripts/FEAT-8_api_version_json_version_uat_script.md

## Diffstat
 .claude/artifacts/FEAT-8/uat_script.md             | 37 ++++++++++++++++++++++
 backend/pyproject.toml                             |  2 +-
 .../tests/integration/test_version_integration.py  |  8 +++++
 backend/uv.lock                                    |  2 +-
 .../FEAT-8_api_version_json_version.feature        | 32 +++++++++++++++++++
 .../FEAT-8_api_version_json_version_uat_script.md  | 37 ++++++++++++++++++++++
 6 files changed, 116 insertions(+), 2 deletions(-)

## Not yet due at review time
- Phase F, refactor gate: no planned files (modifies existing ones; Phase H reviews any file it adds)
- Section 15, documentation check: README.md, docs/DEVELOPMENT.md
