# Review scope: BUG-02 (branch feature/BUG-02-cors-trailing-slash)

## Commits
1ede324 fix(BUG-02): CORS origin with a trailing slash silently blocks the frontend

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/core/config.py
M	backend/tests/integration/test_health_integration.py
M	backend/tests/unit/test_config_unit.py

## Diffstat
 backend/app/core/config.py                          | 10 ++++++++--
 .../tests/integration/test_health_integration.py    | 14 ++++++++++++++
 backend/tests/unit/test_config_unit.py              | 21 +++++++++++++++++++++
 3 files changed, 43 insertions(+), 2 deletions(-)
