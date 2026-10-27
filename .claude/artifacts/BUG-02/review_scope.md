# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
c0ae9f9 fix(BUG-02): strip trailing slash from CORS_ORIGINS entries

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py             |  8 ++++++--
 backend/tests/unit/test_config_unit.py | 14 ++++++++++++++
 2 files changed, 20 insertions(+), 2 deletions(-)
