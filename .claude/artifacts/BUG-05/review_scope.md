# Review scope: BUG-05 (branch feature/BUG-05-echo-keeps-whitespace)

## Commits
9f8de42 fix(BUG-05): trim surrounding whitespace from the echo message

## Changed files (A=added M=modified D=deleted R=renamed)
M	backend/app/routers/echo.py
A	backend/tests/integration/test_echo_whitespace_integration.py

## Diffstat
 backend/app/routers/echo.py                        |  7 ++--
 .../test_echo_whitespace_integration.py            | 42 ++++++++++++++++++++++
 2 files changed, 47 insertions(+), 2 deletions(-)
