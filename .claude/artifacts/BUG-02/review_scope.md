# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
c187352 fix(BUG-02): normalize trailing slash in CORS_ORIGINS entries

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py
M	backend/tests/unit/test_main_unit.py

## Diffstat
 backend/app/core/config.py             | 11 +++++++++--
 backend/tests/unit/test_config_unit.py | 15 +++++++++++++++
 backend/tests/unit/test_main_unit.py   | 18 ++++++++++++++++++
 3 files changed, 42 insertions(+), 2 deletions(-)
