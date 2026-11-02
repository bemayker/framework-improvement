# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
b62d8e4 fix(BUG-02): Strip trailing slash from CORS origins

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
A	backend/tests/integration/test_main_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                         | 10 +++++++--
 backend/tests/integration/test_main_integration.py | 18 ++++++++++++++++
 backend/tests/unit/test_config_unit.py             | 25 ++++++++++++++++++++++
 3 files changed, 51 insertions(+), 2 deletions(-)
