# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
800d9881 fix(BUG-02): strip trailing slash from configured CORS origins

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
A	backend/tests/integration/test_cors_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                         | 11 +++++--
 backend/tests/integration/test_cors_integration.py | 36 ++++++++++++++++++++++
 backend/tests/unit/test_config_unit.py             | 14 +++++++++
 3 files changed, 59 insertions(+), 2 deletions(-)
