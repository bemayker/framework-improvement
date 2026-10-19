# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
f0aba83 fix(BUG-02): CORS origin with a trailing slash silently blocks the frontend

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py             | 10 ++++++++--
 backend/tests/unit/test_config_unit.py | 15 +++++++++++++++
 2 files changed, 23 insertions(+), 2 deletions(-)
