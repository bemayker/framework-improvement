# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
4dedbb88 fix(BUG-02): CORS origin with a trailing slash no longer blocks the frontend

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
A	backend/tests/integration/test_cors_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                         | 12 +++++--
 backend/tests/integration/test_cors_integration.py | 41 ++++++++++++++++++++++
 backend/tests/unit/test_config_unit.py             | 14 ++++++++
 3 files changed, 65 insertions(+), 2 deletions(-)
