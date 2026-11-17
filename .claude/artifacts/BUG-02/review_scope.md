# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
e70414b6 fix(BUG-02): CORS origin with a trailing slash no longer blocks the frontend

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
A	backend/tests/integration/test_config_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                         | 12 +++++++--
 .../tests/integration/test_config_integration.py   | 30 ++++++++++++++++++++++
 backend/tests/unit/test_config_unit.py             | 14 ++++++++++
 3 files changed, 54 insertions(+), 2 deletions(-)
