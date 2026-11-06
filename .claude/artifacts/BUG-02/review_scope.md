# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
0b2254e fix(BUG-02): strip trailing slash from CORS origins

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py
M	backend/tests/unit/test_main_unit.py

## Diffstat
 backend/app/core/config.py             |  3 ++-
 backend/tests/unit/test_config_unit.py |  7 +++++++
 backend/tests/unit/test_main_unit.py   | 17 +++++++++++++++++
 3 files changed, 26 insertions(+), 1 deletion(-)
