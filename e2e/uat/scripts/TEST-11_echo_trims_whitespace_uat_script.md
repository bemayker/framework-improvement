# UAT Script: TEST-11 Echo endpoint trims surrounding whitespace

This feature has no screen in the app and the frontend never calls `/api/echo`. Every check runs against the backend directly with `curl` in a terminal; the observable result is the HTTP status line and the JSON body. `curl` prints the body without spaces after the colon, so `{"echo": "hello"}` below appears on screen as the same JSON without that space.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-11-echo-trims-whitespace` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A terminal with `curl` and `python3`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.
3. Run `curl -s http://localhost:8010/api/version`; it prints a body with a `version` value, confirming the backend answers on port 8010.

## Steps

### Criterion 1: `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=%20%20hello%20%20"` | The first line shows status `200` and the body is `{"echo":"hello"}`, with no leading or trailing spaces inside the quotes | [ ] Pass [ ] Fail |
| 2 | Run `curl -s "http://localhost:8010/api/echo?msg=%20%20hello%20world%20%20"` (edge case) | The body is `{"echo":"hello world"}`: the space between the words is kept, only the outer spaces are gone | [ ] Pass [ ] Fail |
| 3 | Run `curl -s "http://localhost:8010/api/echo?msg=hello"` | The body is `{"echo":"hello"}` (a message with nothing to trim is unchanged) | [ ] Pass [ ] Fail |

### Criterion 2: a message that is only whitespace returns `{"echo": ""}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i "http://localhost:8010/api/echo?msg=%20%20%20"` (three spaces) | Status `200` and the body is `{"echo":""}` | [ ] Pass [ ] Fail |
| 5 | Run `curl -s "http://localhost:8010/api/echo?msg=%20%09%0A%20"` (space, tab, newline, space) | The body is `{"echo":""}` | [ ] Pass [ ] Fail |

### Criterion 3: the 200-character limit applies to the message as sent, before trimming

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `python3 -c "print('http://localhost:8010/api/echo?msg=%20' + 'a' * 199 + '%20')"` and copy the URL it prints | A URL is printed (one space, 199 `a`, one space: 201 characters as sent, 199 after trimming) | [ ] Pass [ ] Fail |
| 7 | Run `curl -i "<the URL from step 6>"` | Status `422` (not `200`); the body's `detail` entry has `"type":"string_too_long"` and `"loc":["query","msg"]`. The message is rejected even though it would fit after trimming | [ ] Pass [ ] Fail |
| 8 | Run `python3 -c "print('http://localhost:8010/api/echo?msg=%20%20' + 'a' * 196 + '%20%20')"` and copy the URL (edge case: exactly 200 characters as sent) | A URL is printed (two spaces, 196 `a`, two spaces) | [ ] Pass [ ] Fail |
| 9 | Run `curl -s "<the URL from step 8>" \| python3 -c "import json,sys; print(len(json.load(sys.stdin)['echo']))"` | Prints `196`: status was `200` and the echo holds exactly 196 `a` with no spaces | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover criteria 1 to 3

Not verifiable through any UI: it is a property of the test suite.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `backend/tests/unit/test_echo_unit.py` and `backend/tests/integration/test_echo_integration.py` | Each criterion 1 to 3 has at least one test whose docstring names it | [ ] Pass [ ] Fail |
| 11 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py` | The summary line reports all collected tests passed and 0 failed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 (4 criteria; steps 2, 5 and 8 to 9 cover edge cases) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
