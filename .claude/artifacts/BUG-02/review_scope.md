# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
8910e3d9 fix(BUG-02): CORS origin with a trailing slash silently blocks the frontend

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
A	backend/tests/integration/test_config_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                         | 11 ++++++++--
 .../tests/integration/test_config_integration.py   | 25 ++++++++++++++++++++++
 backend/tests/unit/test_config_unit.py             | 21 ++++++++++++++++++
 3 files changed, 55 insertions(+), 2 deletions(-)
