# Review scope: BUG-05 (branch feature/BUG-05-echo-keeps-whitespace)

## Commits
175f2b5 fix(BUG-05): strip whitespace around the echoed message

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/routers/echo.py
A	backend/tests/integration/test_echo_whitespace_integration.py

## Diffstat
 backend/app/routers/echo.py                             |  7 +++++--
 .../integration/test_echo_whitespace_integration.py     | 17 +++++++++++++++++
 2 files changed, 22 insertions(+), 2 deletions(-)
