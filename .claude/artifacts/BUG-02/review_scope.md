# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
2850776 fix(BUG-02): CORS origin with a trailing slash silently blocks the frontend

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py             |  8 ++++++--
 backend/tests/unit/test_config_unit.py | 24 ++++++++++++++++++++++++
 2 files changed, 30 insertions(+), 2 deletions(-)
