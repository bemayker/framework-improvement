# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
370aa2c fix(BUG-02): strip trailing slash from CORS origins

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py             | 14 +++++++++++---
 backend/tests/unit/test_config_unit.py | 14 ++++++++++++++
 2 files changed, 25 insertions(+), 3 deletions(-)
