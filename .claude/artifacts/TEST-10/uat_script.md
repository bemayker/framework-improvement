# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- Docker Compose available; the stack is started from the repository root in step 1 with a known commit. Backend is then on `http://localhost:8010`, frontend on `http://localhost:5183`.
- Frontend dependencies installed (`npm --prefix frontend install`) for the component test step.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | From the repository root run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up --build -d` and wait until it finishes | The stack is up with a known commit | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:8010/api/version` in a browser | The body is `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 4 | Read the footer | It reads exactly `Task Notes v0.1.0 (0123456)`: seven commit characters, in brackets, directly after the version (criterion 1) | [ ] Pass [ ] Fail |
| 5 | Open DevTools, Network tab, set throttling to "Slow 3G" and reload the page, watching the footer while `/api/version` is pending | The footer reads `Task Notes` with no version, no brackets and no `undefined` (criterion 2, pending) | [ ] Pass [ ] Fail |
| 6 | Set throttling back to "No throttling". Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes`; nothing reads `undefined`, `null`, `unknown` or an error message (criterion 2, failure) | [ ] Pass [ ] Fail |
| 7 | In a fresh terminal with no `BUILD_COMMIT` set, run `docker compose up --build -d backend` and wait until `http://localhost:8010/api/version` returns `{"version":"0.1.0","commit":"unknown"}` | The backend now reports the unknown commit (sets up the edge case) | [ ] Pass [ ] Fail |
| 8 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`: the version alone, with no brackets and no `unknown` (criterion 2, edge case) | [ ] Pass [ ] Fail |
| 9 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run lists `renders the short commit next to the version once the fetch resolves`, `renders the app name without a version or commit while the fetch is pending` and `renders the app name without a version or commit when the backend is unreachable`; no failed or errored test and the command exits 0 (criterion 3) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
