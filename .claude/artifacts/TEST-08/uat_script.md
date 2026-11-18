# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Backend running on `http://localhost:8010` via `uv run` (so package metadata is installed); `backend/pyproject.toml` `[project].version` is `0.1.0`.
- Frontend dev server on `http://localhost:5183`; `frontend/package.json` `version` is `0.0.0`.
- Chrome (for the DevTools steps) and `curl`.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl http://localhost:8010/api/version` | Body is `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the `Task Notes` heading | [ ] Pass [ ] Fail |
| 3 | Scroll to the footer | It reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `http://localhost:5183/` | The footer reads `Task Notes v0.1.0`, not `Task Notes v0.0.0` | [ ] Pass [ ] Fail |
| 5 | Open DevTools Network tab and reload | One request to `http://localhost:8010/api/version`, status 200, body `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 6 | Stop the backend, set `backend/pyproject.toml` `[project].version` to `0.1.1`, run `uv sync --directory backend`, start the backend; do not touch the frontend. Reload the page | The footer reads `Task Notes v0.1.1` | [ ] Pass [ ] Fail |
| 7 | Revert `[project].version` to `0.1.0` and re-sync | Version restored | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Stop the backend so `http://localhost:8010` does not answer | Backend is down | [ ] Pass [ ] Fail |
| 9 | Open `http://localhost:5183/` | The footer reads exactly `Task Notes`: no ` v`, no `undefined`, `null` or `unknown`, no trailing space or gap | [ ] Pass [ ] Fail |
| 10 | Start the backend again and reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | Run passes, exit code 0, no failed or errored test | [ ] Pass [ ] Fail |
| 12 | Check the listed tests | `renders the version the backend reports` and `renders the app name without a version when the version request fails` are among the passed tests | [ ] Pass [ ] Fail |

### Criterion 5: Loading and failure states show the app name only

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | In Chrome DevTools open Network request blocking, add `*/api/version`, reload `http://localhost:5183/` | The footer reads `Task Notes` (failure state) | [ ] Pass [ ] Fail |
| 14 | Remove the block, set throttling to `Slow 3G`, reload | While the request is pending the footer reads `Task Notes`; once complete it reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 15 | Reset throttling to `No throttling` | Throttling cleared | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
