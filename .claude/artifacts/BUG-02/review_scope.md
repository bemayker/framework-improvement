# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
c48717f fix(BUG-02): CORS origin with a trailing slash silently blocks the frontend

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py             | 10 ++++++++--
 backend/tests/unit/test_config_unit.py | 14 ++++++++++++++
 2 files changed, 22 insertions(+), 2 deletions(-)
