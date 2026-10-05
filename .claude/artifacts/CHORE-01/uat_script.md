# UAT Script, CHORE-01: TEST-09 follow-up, version test docstring

Criterion 1: Line 1 docstring names both items, and nothing else changes. This is a comment in a backend test file, so it is verified with shell commands, not the UI. Run from the repository root.

## Prerequisites
- The `feature/CHORE-01-test-09-follow-up` branch is checked out and `origin/main` is fetched.
- `uv` is installed.
- The backing database from `CLAUDE.md` Backing Services is available for the integration tier.

## Steps

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1 | Run `sed -n 1p backend/tests/integration/test_version_integration.py` | Prints exactly `"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""` | [ ] | [ ] |
| 2 | Run `git diff --stat origin/main -- backend/tests/integration/test_version_integration.py` | Reports `1 file changed, 1 insertion(+), 1 deletion(-)` | [ ] | [ ] |
| 3 | Run `git diff origin/main -- backend/tests/integration/test_version_integration.py` | The only removed line is the `(TEST-05)` docstring; the only added line is the `(TEST-05, TEST-09)` docstring | [ ] | [ ] |
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | `8 passed`, no collection errors | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. Docstring names `(TEST-05, TEST-09)`, no other line changes | 1-4 | [ ] Pass / [ ] Fail |

Tester: ________  Date: ________
