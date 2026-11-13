# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
addc88a fix(BUG-02): strip trailing slash from CORS_ORIGINS entries

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
A	backend/tests/integration/test_main_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                         | 11 +++++++--
 backend/tests/integration/test_main_integration.py | 26 ++++++++++++++++++++++
 backend/tests/unit/test_config_unit.py             | 25 +++++++++++++++++++++
 3 files changed, 60 insertions(+), 2 deletions(-)
