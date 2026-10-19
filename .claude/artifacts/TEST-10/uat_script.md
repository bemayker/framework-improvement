# UAT Script: TEST-10 Footer shows the build commit next to the version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- Stack started from the repository root with a known commit: `BUILD_COMMIT=abc1234def5678 docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010). No sign-in, no seed data.
- Expected footer text derives from the response of `GET /api/version`: the version is its `version` field and the short commit is the first 7 characters of its `commit` field (the backend itself cuts BUILD_COMMIT to 12 characters).
- For criterion 3: frontend dependencies installed (`npm --prefix frontend install`).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:8010/api/version in a browser tab | The JSON shows a `version` field (0.1.0 at the time of writing) and a `commit` field holding the first 12 characters of BUILD_COMMIT (abc1234def56) | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:5183/ in another tab and scroll to the footer | The footer reads "Task Notes v" plus the version from step 1, then a space and the first 7 characters of the commit from step 1 in parentheses (Task Notes v0.1.0 (abc1234)) | [ ] Pass [ ] Fail |
| 3 | Inspect the footer in DevTools | A span with `data-testid="app-footer-commit"` holds the commit text, directly after the `app-footer-version` span; it shows 7 characters, not 12 | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Recreate only the backend without a commit: `docker compose up -d --force-recreate backend` with BUILD_COMMIT unset, wait until http://localhost:8010/api/version answers, then reload http://localhost:5183/ | The footer reads exactly "Task Notes v" plus the version, with no "(unknown)", no "undefined" and no empty parentheses; no `app-footer-commit` element exists | [ ] Pass [ ] Fail |
| 5 | In DevTools, Network tab, set throttling to Slow 3G and reload http://localhost:5183/ | While the /api/version request is pending the footer reads exactly "Task Notes"; when it completes the version appears after it. Reset throttling to No throttling afterwards | [ ] Pass [ ] Fail |
| 6 | Stop the backend with `docker compose stop backend` and reload http://localhost:5183/ | The footer reads exactly "Task Notes", with no error text and none of the words unknown, undefined or null | [ ] Pass [ ] Fail |
| 7 | Start the backend again with `docker compose start backend`, wait until http://localhost:8010/api/version answers, and reload http://localhost:5183/ | The footer shows the version again (and the commit, if BUILD_COMMIT is set for the running backend) | [ ] Pass [ ] Fail |

Note: version and commit come from one request, so a pending or failed request shows "Task Notes" (TEST-08 behaviour) and a missing commit shows the version alone.

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run includes both files and reports 0 failed | [ ] Pass [ ] Fail |
| 9 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a success test (version and short commit shown), a pending test (never-resolving promise, footer exactly "Task Notes"), failure tests (rejected request and null result, footer exactly "Task Notes") and a version-alone test for a null commit | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
