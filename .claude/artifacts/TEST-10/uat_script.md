# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- A terminal at the repository root, on branch `feature/TEST-10-footer-build-commit` (or, once merged, on `main`).
- Host ports `5183` (frontend) and `8010` (backend) free.
- A browser with developer tools.
- Criterion 3 only: frontend dependencies installed (`npm --prefix frontend install`).

## Test Environment Setup

Criterion 1 starts the stack with a build commit. Criterion 2 rebuilds it without one. Stop the stack with `docker compose down` when you are done.

## Steps

### Criterion 1: the footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `BUILD_COMMIT=4e631128d7285ec47eb354795bf120878553505b docker compose up -d --build` | All services report started | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | It prints `{"version":"0.1.0","commit":"4e631128d728"}` | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:5183/` in a browser | The landing page shows the `Task Notes` heading, the note form and the footer | [ ] Pass [ ] Fail |
| 4 | Read the footer | It reads exactly `Task Notes v0.1.0 (4e63112)`: seven commit characters, after the version | [ ] Pass [ ] Fail |
| 5 | Open developer tools, Elements tab, and inspect the footer | It holds `<span data-testid="app-version"> v0.1.0</span>` followed by `<span data-testid="app-commit"> (4e63112)</span>` | [ ] Pass [ ] Fail |

### Criterion 2: while the request is pending or when it fails, the footer shows no commit and no error

Prerequisites: the stack from Criterion 1 running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `docker compose up -d --build` without `BUILD_COMMIT` set, then `curl -s http://localhost:8010/api/version` | `commit` is `unknown` | [ ] Pass [ ] Fail |
| 7 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`, with no parentheses, no `unknown`, no `undefined` | [ ] Pass [ ] Fail |
| 8 | In developer tools, Network tab, set throttling to `Slow 3G` and reload. Set throttling back to `No throttling` afterwards | While `/api/version` is still loading the footer reads exactly `Task Notes`; when it completes it reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 9 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, with no `v`, no commit, no `undefined`, no `null` and no error text; the Elements tab shows no `app-version` and no `app-commit` element | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers, then reload | The footer shows the version again | [ ] Pass [ ] Fail |

### Criterion 3: a component test covers the success, pending and failure paths

Prerequisites: a terminal at the repository root.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The summary line reports no failed test and the command exits 0 | [ ] Pass [ ] Fail |
| 12 | Read the run's output | `renders the first 7 characters of the commit next to the backend version`, `renders the app name without a version or commit while the request is pending` and `renders the app name without a version or commit when the request fails` are listed as passed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
