# Review scope: BUG-01 (branch feature/BUG-01-server-time-edge-cache-reverify-1)

## Commits
da2bea2 fix(BUG-01): Send CDN-targeted no-store headers on /api/time

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/routers/server_time.py
M	backend/tests/integration/test_server_time_integration.py
M	backend/tests/unit/test_server_time_unit.py

## Diffstat
 backend/app/routers/server_time.py                        |  7 ++++++-
 backend/tests/integration/test_server_time_integration.py | 15 ++++++++++-----
 backend/tests/unit/test_server_time_unit.py               |  4 +++-
 3 files changed, 19 insertions(+), 7 deletions(-)
