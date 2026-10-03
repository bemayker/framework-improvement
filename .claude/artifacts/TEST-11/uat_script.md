# UAT Script: TEST-11 Echo endpoint trims surrounding whitespace

`GET /api/echo?msg={text}` returns the text with leading and trailing whitespace removed. No acceptance criterion is verifiable through the application UI (no frontend page calls `/api/echo`), so every check reads the HTTP response with `curl`, and criterion 4 is checked by the test run.

## Prerequisites

- Docker running.
- Repository on branch `feature/TEST-11-echo-trims-whitespace` (or `main` once merged).
- From the repository root run `docker compose up -d --build`, then wait until `docker compose ps` shows `backend` running.
- Host port 8010 free (the backend mapping in `docker-compose.yml`).
- A terminal with `curl` and `uv`. Run every command from the repository root.

## Criterion 1: `GET /api/echo?msg=%20%20hello%20%20` returns `{"echo": "hello"}`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -s -w ' %{http_code}' 'http://localhost:8010/api/echo?msg=%20%20hello%20%20'` | Output is `{"echo":"hello"} 200`: no spaces before or after `hello` | [ ] | [ ] |
| 1.2 | Run `curl -s -w ' %{http_code}' 'http://localhost:8010/api/echo?msg=%09hello%20%20world%0A'` | Output is `{"echo":"hello  world"} 200`: the tab and newline around the text are gone and the two inner spaces are kept | [ ] | [ ] |

## Criterion 2: a message that is only whitespace returns `{"echo": ""}`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s -w ' %{http_code}' 'http://localhost:8010/api/echo?msg=%20%20%20'` | Output is `{"echo":""} 200` | [ ] | [ ] |
| 2.2 | Run `curl -s -w ' %{http_code}' 'http://localhost:8010/api/echo?msg=%09%0A%20'` (a tab, a newline and a space) | Output is `{"echo":""} 200` | [ ] | [ ] |

## Criterion 3: the 200-character limit applies to the message as sent, before trimming

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `printf ' %0199d ' 0 > /tmp/test11_msg201.txt`, then `wc -c /tmp/test11_msg201.txt` | `wc` prints `201` (a space, 199 zeros, a space) | [ ] | [ ] |
| 3.2 | Run `curl -s -w ' %{http_code}' -G --data-urlencode msg@/tmp/test11_msg201.txt http://localhost:8010/api/echo` | Status at the end is `422`; the first `detail` entry has `"type":"string_too_long"` and `"loc":["query","msg"]`, even though the message would be 199 characters once trimmed | [ ] | [ ] |
| 3.3 | Run `printf ' %0198d ' 0 > /tmp/test11_msg200.txt`, then `curl -s -w ' %{http_code}' -G --data-urlencode msg@/tmp/test11_msg200.txt http://localhost:8010/api/echo` | Status is `200` and the body is `{"echo":"000...0"}` with exactly 198 zeros and no surrounding spaces | [ ] | [ ] |

## Criterion 4: unit and integration tests cover criteria 1 to 3

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py` | Every test passes, including the new trimming tests (surrounding spaces, whitespace-only, 201 and 200 characters as sent), with no failures and no skips | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. Surrounding spaces removed | 1.1 - 1.2 | [ ] Pass  [ ] Fail |
| 2. Whitespace-only message returns empty echo | 2.1 - 2.2 | [ ] Pass  [ ] Fail |
| 3. Limit applies before trimming | 3.1 - 3.3 | [ ] Pass  [ ] Fail |
| 4. Tests cover criteria 1 to 3 | 4.1 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
