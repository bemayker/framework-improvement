# UAT Script: TEST-10 Footer shows the build commit

The footer shows the first 7 characters of the commit reported by the backend's `GET /api/version`, after the version. Run commands from the repository root. Mark each step Pass or Fail.

## Prerequisites

- Docker running; stack built with a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` (frontend on `http://localhost:5183`, backend on `http://localhost:8010`, database on port `5442`).
- A browser with DevTools.
- A terminal at the repository root; `npm` installed for Criterion 3.

## Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Open `http://localhost:8010/api/version` in a browser tab | JSON reading `"version": "0.1.0"` and `"commit": "0123456789ab"` (12 characters) | [ ] | [ ] |
| 1.2 | Open `http://localhost:5183/` and scroll to the footer | It reads exactly `Task Notes v0.1.0 · 0123456`: the version, a middle dot, then the first 7 characters of the commit | [ ] | [ ] |
| 1.3 | Inspect the footer in DevTools Elements | A `span` with `data-testid="app-footer-commit"` containing `0123456`, and nowhere the full `0123456789ab` | [ ] | [ ] |
| 1.4 | Rebuild without a commit: `docker compose up -d --build backend` with BUILD_COMMIT unset, wait until `http://localhost:8010/api/version` shows `"commit": "unknown"`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0` (version alone), with no `unknown` and no trailing middle dot | [ ] | [ ] |
| 1.5 | Restore the known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend`, wait until `/api/version` shows `0123456789ab` | The backend reports the commit again, ready for Criterion 2 | [ ] | [ ] |

## Criterion 2: While the request is pending or when it fails, the footer shows no commit, never `undefined` or an error

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | In DevTools Network set throttling to "Slow 3G", then reload `http://localhost:5183/` and watch the footer | It first reads exactly `Task Notes` (no version, no commit, no separator), then changes to `Task Notes v0.1.0 · 0123456` when the request completes | [ ] | [ ] |
| 2.2 | Set throttling back to "No throttling" | Throttling is off | [ ] | [ ] |
| 2.3 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes · version unavailable`, with no `undefined`, no `null`, no `unknown`, no error text and no commit | [ ] | [ ] |
| 2.4 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0 · 0123456` again | [ ] | [ ] |
| 2.5 | Run `docker compose pause backend`, reload `http://localhost:5183/` and watch the footer for about 6 seconds (the version request has a 5 second timeout) | The footer reads `Task Notes` while waiting, then `Task Notes · version unavailable`, with no commit, `undefined` or error text | [ ] | [ ] |
| 2.6 | Run `docker compose unpause backend`, wait until `/api/version` answers, reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0 · 0123456` again | [ ] | [ ] |

## Criterion 3: A component test covers the success, pending and failure paths

This criterion is a test, not UI behaviour; the observable check is the test run.

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `npm --prefix frontend test -- AppFooter` | The run passes and lists a success case showing `Task Notes v9.8.7 · abc123d`, a success case with an unusable commit showing `Task Notes v9.8.7`, a pending case showing `Task Notes`, and failure cases (rejected request, unresolvable version) showing `Task Notes · version unavailable` | [ ] | [ ] |
| 3.2 | Run `npm --prefix frontend test -- LandingPage` | The existing LandingPage cases pass against the renamed client mock, with no "is not a function" or missing-export error | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed | Result |
|---|---|---|---|---|
| 1. Short commit next to the version | 1.1 - 1.5 | | | |
| 2. Pending / failure show no commit or error | 2.1 - 2.6 | | | |
| 3. Component test, three paths | 3.1 - 3.2 | | | |

Tester: ______________  Date: ______________  Overall result: [ ] Pass  [ ] Fail

Notes: steps are carried through from the plan's Manual verification plan. Corrections: the prerequisites name the compose ports (5183, 8010, 5442); throttling reset is split out as step 2.2 and the commit restore as step 1.5 so each can be ticked; steps 2.5 and 2.6 are added because CHORE-02 put a 5 second timeout on the version request, so a paused backend now ends in "version unavailable".
