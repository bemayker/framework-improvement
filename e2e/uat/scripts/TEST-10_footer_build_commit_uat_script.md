# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker running; repository root as the terminal's working directory.
- `backend/pyproject.toml` `[project].version` is `0.1.0`.
- Chrome (for the DevTools steps), `curl`, and frontend dependencies installed (`npm --prefix frontend install`).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `BUILD_COMMIT=3f9c2a7b1d4e8f60a5b2c9d1e7f3a4b6c8d0e2f1 docker compose up -d --build backend frontend` | The backend and frontend containers start | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | Body is `{"version":"0.1.0","commit":"3f9c2a7b1d4e"}` | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:5183/` and scroll to the footer | It reads exactly `Task Notes v0.1.0 (3f9c2a7)`: seven commit characters in parentheses, right after the version | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | In Chrome DevTools open Network request blocking, add the pattern `*/api/version`, and reload `http://localhost:5183/` | The footer reads exactly `Task Notes` (TEST-08's failure state; the single request failed so there is no version): no commit, no `undefined`, no error text | [ ] Pass [ ] Fail |
| 5 | Remove the block, set Network throttling to `Slow 3G`, and reload | While `/api/version` is pending the footer reads `Task Notes` with no commit; once it completes it reads `Task Notes v0.1.0 (3f9c2a7)` | [ ] Pass [ ] Fail |
| 6 | Reset Network throttling to `No throttling` | Throttling cleared | [ ] Pass [ ] Fail |
| 7 | Run `unset BUILD_COMMIT`, then `docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` | `commit` is `"unknown"` | [ ] Pass [ ] Fail |
| 8 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`: the version alone, no `(unknown)`, no `undefined`, no empty parentheses | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | Run passes, exit code 0, no failed or errored test | [ ] Pass [ ] Fail |
| 10 | Check the listed tests | `renders the first 7 characters of the commit next to the version`, `renders no commit while the version request is pending` and `renders no commit when the version request fails` are among the passed tests | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
