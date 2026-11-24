# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
89e0f59f fix(BUG-02): strip trailing slash from CORS origins

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
A	backend/tests/integration/test_config_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                           |  9 +++++++--
 backend/tests/integration/test_config_integration.py | 18 ++++++++++++++++++
 backend/tests/unit/test_config_unit.py               | 14 ++++++++++++++
 3 files changed, 39 insertions(+), 2 deletions(-)
