# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
59c3057 fix(BUG-02): strip trailing slash from CORS origins

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py             | 10 ++++++++--
 backend/tests/unit/test_config_unit.py | 21 +++++++++++++++++++++
 2 files changed, 29 insertions(+), 2 deletions(-)
