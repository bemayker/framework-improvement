# Review scope: BUG-05 (branch feature/BUG-05-echo-keeps-whitespace)

## Commits
8b42df1 fix(BUG-05): Echo trims the whitespace around the message

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/routers/echo.py
A	backend/tests/integration/test_echo_whitespace_integration.py

## Diffstat
 backend/app/routers/echo.py                             |  4 ++--
 .../integration/test_echo_whitespace_integration.py     | 17 +++++++++++++++++
 2 files changed, 19 insertions(+), 2 deletions(-)
