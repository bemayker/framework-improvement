# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
7a82dcd fix(BUG-02): strip trailing slash from CORS origins

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py
M	backend/tests/unit/test_main_unit.py

## Diffstat
 backend/app/core/config.py             | 11 +++++++++--
 backend/tests/unit/test_config_unit.py | 21 +++++++++++++++++++++
 backend/tests/unit/test_main_unit.py   | 13 +++++++++++++
 3 files changed, 43 insertions(+), 2 deletions(-)
