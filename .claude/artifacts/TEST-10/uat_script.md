# UAT Script, TEST-10: Footer shows the build commit

## Prerequisites
- The repository root `.env` file contains the line `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`.
- The stack was rebuilt with `docker compose up --build -d` from the repository root so the backend image carries that commit.
- Frontend dependencies installed (`npm --prefix frontend install`) for Criterion 3.
- A browser with DevTools. App at `http://localhost:5183/`, API at `http://localhost:8010/`.

## Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Open `http://localhost:8010/api/version` in a browser | The JSON shows version `0.1.0` and commit `0123456789ab` (12 characters) | [ ] | [ ] |
| 1.2 | Open `http://localhost:5183/` | The landing page shows the title Task Notes and, at the bottom, the footer | [ ] | [ ] |
| 1.3 | Read the footer | It reads exactly `Task Notes v0.1.0 (0123456)`; the 7-character commit `0123456` sits directly after the version, and `0123456789ab` does not appear anywhere in the footer | [ ] | [ ] |
| 1.4 | Inspect the footer in the DevTools Elements panel | It holds a span with data-testid `app-footer-version` followed by a span with data-testid `app-footer-commit` | [ ] | [ ] |

## Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error

Note: as the plan records, the version and the commit come from the same single request, so while it is pending or after it fails the footer shows `Task Notes` with no version and no commit. When the request succeeds but the commit is the `unknown` sentinel, the footer shows the version alone.

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | In DevTools Network set throttling to Slow 3G and reload `http://localhost:5183/` | While the `/api/version` request is in flight the footer reads exactly `Task Notes`, with no version, no commit, no `undefined` and no error text; once it completes it reads `Task Notes v0.1.0 (0123456)` | [ ] | [ ] |
| 2.2 | Set throttling back to No throttling, right-click the `/api/version` request in the Network panel, choose Block request URL, and reload the page | The footer reads exactly `Task Notes`; it contains no `undefined`, `null`, `unknown`, empty parentheses or error message | [ ] | [ ] |
| 2.3 | Unblock the URL, remove the `BUILD_COMMIT` line from `.env`, and run `docker compose up --build -d` again from the repository root; open `http://localhost:8010/api/version` | The JSON shows commit `unknown` | [ ] | [ ] |
| 2.4 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`: the version alone, with no commit, no `unknown` and no empty parentheses | [ ] | [ ] |

## Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` from the repository root | The run lists the AppFooter tests for success with a commit, success without a commit, pending and failure, and reports 0 failed | [ ] | [ ] |
| 3.2 | Run `npm --prefix frontend test -- src/api/version.test.ts` from the repository root | The `fetchVersion` tests, including the commit cases, report 0 failed | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed | Result |
|---|---|---|---|---|
| 1. Footer shows the 7-character commit next to the version | 1.1 to 1.4 | | | |
| 2. Pending or failure shows no commit, never undefined or an error | 2.1 to 2.4 | | | |
| 3. Component test covers success, pending and failure | 3.1 to 3.2 | | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
