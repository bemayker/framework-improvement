# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- Frontend dependencies installed (`npm --prefix frontend ci`) for step 9.
- `backend/pyproject.toml` declares `version = "0.1.0"`.
- Chrome, for the DevTools throttling steps.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=abcdef1234567890abcdef1234567890abcdef12 docker compose up -d --build
   ```
2. Wait until `http://localhost:8010/api/version` answers and `http://localhost:5183/` loads (frontend http://localhost:5183, backend http://localhost:8010).

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser tab (criterion 1) | The JSON reads `{"version":"0.1.0","commit":"abcdef123456"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` (criterion 1) | The footer at the bottom of the landing page reads exactly `Task Notes v0.1.0 (abcdef1)`: seven characters inside the parentheses, right after the version | [ ] Pass [ ] Fail |
| 3 | From the repository root run `BUILD_COMMIT= docker compose up -d backend`, then check `http://localhost:8010/api/version` (criterion 2, edge case) | The backend is recreated and the JSON reads `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 4 | Reload `http://localhost:5183/` (criterion 2, edge case) | The footer reads exactly `Task Notes v0.1.0`, with no parentheses, no `unknown` and no trailing space | [ ] Pass [ ] Fail |
| 5 | Open DevTools, Network, set throttling to "Slow 3G" and reload while watching the footer (criterion 2, pending) | Before the version request completes the footer reads exactly `Task Notes`, with no `undefined` and no error text; once it completes it reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 6 | Set throttling back to "No throttling" | Network behaves normally again | [ ] Pass [ ] Fail |
| 7 | Run `docker compose stop backend`, then reload `http://localhost:5183/` (criterion 2, failure) | The footer reads exactly `Task Notes`, with no `undefined`, `null`, error text or empty parentheses | [ ] Pass [ ] Fail |
| 8 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 9 | Run `npm --prefix frontend test` from the repository root (criterion 3) | The run includes `src/components/AppFooter.test.tsx` (success with commit, success without commit, pending and failure tests) and `src/api/version.test.ts`, and reports 0 failed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
