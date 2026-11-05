# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
0c375e4 fix(BUG-02): strip trailing slash from CORS origins

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py
M	backend/tests/unit/test_main_unit.py

## Diffstat
 backend/app/core/config.py             | 11 +++++++++--
 backend/tests/unit/test_config_unit.py | 14 ++++++++++++++
 backend/tests/unit/test_main_unit.py   | 16 ++++++++++++++++
 3 files changed, 39 insertions(+), 2 deletions(-)
