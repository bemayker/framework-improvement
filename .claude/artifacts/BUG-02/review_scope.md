# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
38d2b42 fix(BUG-02): CORS origin with a trailing slash silently blocks the frontend

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py
M	backend/tests/unit/test_main_unit.py

## Diffstat
 backend/app/core/config.py             | 10 ++++++++--
 backend/tests/unit/test_config_unit.py | 21 +++++++++++++++++++++
 backend/tests/unit/test_main_unit.py   | 23 +++++++++++++++++++++++
 3 files changed, 52 insertions(+), 2 deletions(-)
