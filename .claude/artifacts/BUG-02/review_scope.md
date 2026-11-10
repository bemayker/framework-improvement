# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
2467753 fix(BUG-02): normalize trailing slash on CORS origins

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py             | 11 +++++++++--
 backend/tests/unit/test_config_unit.py | 28 ++++++++++++++++++++++++++++
 2 files changed, 37 insertions(+), 2 deletions(-)
