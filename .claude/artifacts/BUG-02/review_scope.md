# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
b5e9c834 fix(BUG-02): CORS origin with a trailing slash silently blocks the frontend

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
A	backend/tests/integration/test_main_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                         | 12 ++++++--
 backend/tests/integration/test_main_integration.py | 33 ++++++++++++++++++++++
 backend/tests/unit/test_config_unit.py             | 14 +++++++++
 3 files changed, 57 insertions(+), 2 deletions(-)
