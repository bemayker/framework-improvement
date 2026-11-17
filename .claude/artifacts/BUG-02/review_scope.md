# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
3417a91a fix(BUG-02): CORS origin with a trailing slash silently blocks the frontend

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
A	backend/tests/integration/test_cors_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                         | 11 ++++++++--
 backend/tests/integration/test_cors_integration.py | 25 ++++++++++++++++++++++
 backend/tests/unit/test_config_unit.py             | 14 ++++++++++++
 3 files changed, 48 insertions(+), 2 deletions(-)
