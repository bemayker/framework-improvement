# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker is running; from the repository root start the stack with a known build commit: `BUILD_COMMIT=3dd809b0a1c2 docker compose up -d --build`.
- Wait until `http://localhost:8010/api/version` answers.
- A browser with dev tools. Frontend is at `http://localhost:5183/`, backend at `http://localhost:8010`.

## Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Open `http://localhost:8010/api/version` in the browser | The JSON shows `version` (for example `0.1.0`) and `commit` `3dd809b0a1c2` | [ ] | [ ] |
| 1.2 | Open `http://localhost:5183/` (landing page) | The footer reads `Task Notes v0.1.0 (3dd809b)`: the version, then the commit in parentheses, exactly 7 characters | [ ] | [ ] |
| 1.3 | In dev tools Elements, inspect the footer (`data-testid="app-footer"`) | It holds a span `app-version` with text ` v0.1.0` and, right after it, a span `app-commit` with text ` (3dd809b)` | [ ] | [ ] |

## Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Restart the backend without a build commit: with `BUILD_COMMIT` unset run `docker compose up -d --build backend`, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` with no parentheses, and no `unknown`, `undefined` or `null` anywhere in it | [ ] | [ ] |
| 2.2 | In dev tools Network set throttling to `Slow 3G` and reload `http://localhost:5183/` | While `/api/version` is pending the footer reads `Task Notes` alone, with no commit, no `undefined` and no error text; once the request completes the version appears | [ ] | [ ] |
| 2.3 | Stop the backend: `docker compose stop backend`, then reload `http://localhost:5183/` | The page renders; the footer reads `Task Notes` alone, with no commit, no `undefined` and no error message | [ ] | [ ] |
| 2.4 | Start it again: `docker compose start backend`, then reload | The footer reads `Task Notes v0.1.0` again (version alone while `BUILD_COMMIT` is unset) | [ ] | [ ] |

## Criterion 3: A component test covers the success, pending and failure paths

This criterion is about the test suite, not the UI; verify it by running the tests.

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed` | [ ] | [ ] |
| 3.2 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a success test (version and 7-character commit), a pending test (client promise never settles: `Task Notes` alone, no `app-commit`) and a failure test (client rejects: `Task Notes` alone, no `undefined`, `null`, `unknown` or error text) | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. Commit shown, 7 characters, next to the version | 1.1 to 1.3 | [ ] Pass [ ] Fail |
| 2. Pending or failed: version alone, no undefined or error | 2.1 to 2.4 | [ ] Pass [ ] Fail |
| 3. Component test covers success, pending, failure | 3.1 to 3.2 | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass [ ] Fail

Corrections to the plan's walkthrough: none; the compose file confirms ports 8010 and 5183 and the `BUILD_COMMIT` variable. Step 3.1 names the test files and expects `0 failed`.
