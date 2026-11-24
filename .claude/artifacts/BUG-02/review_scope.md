# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
91a5792d fix(BUG-02): strip trailing slash from CORS_ORIGINS entries

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
A	backend/tests/integration/test_cors_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                         | 11 ++++--
 backend/tests/integration/test_cors_integration.py | 41 ++++++++++++++++++++++
 backend/tests/unit/test_config_unit.py             |  7 ++++
 3 files changed, 57 insertions(+), 2 deletions(-)
