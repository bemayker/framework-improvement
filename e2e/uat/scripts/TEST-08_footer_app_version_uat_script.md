# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Frontend dependencies installed (`npm --prefix frontend ci`) for step 9.
- `backend/pyproject.toml` declares `version = "0.1.0"` and `frontend/package.json` declares `"version": "0.0.0"`. The expected footer version is the backend's, read from `pyproject.toml`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until `http://localhost:8010/api/version` answers and `http://localhost:5183/` loads (frontend http://localhost:5183, backend http://localhost:8010).

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The landing page shows the "Task Notes" heading, the note form and a footer at the bottom | [ ] Pass [ ] Fail |
| 2 | Read the footer (criterion 1) | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/version` in another tab (criterion 2) | The JSON shows `"version":"0.1.0"` (a `commit` field may also be present if TEST-09 has merged) | [ ] Pass [ ] Fail |
| 4 | Open `http://localhost:5183/` with DevTools, Network open, then reload (criterion 2) | One request to `http://localhost:8010/api/version` with status 200, and the footer shows the same `0.1.0` | [ ] Pass [ ] Fail |
| 5 | Open `frontend/src/components/AppFooter.tsx` (criterion 2) | It contains no `package.json` import and no version literal such as `0.1.0` | [ ] Pass [ ] Fail |
| 6 | Compare the footer with `frontend/package.json` (criterion 5) | The footer shows `v0.1.0`, the backend's version, and not `v0.0.0` | [ ] Pass [ ] Fail |
| 7 | Run `docker compose stop backend`, then reload `http://localhost:5183/` (criteria 3 and 6) | The footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no gap after it | [ ] Pass [ ] Fail |
| 8 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 9 | Run `npm --prefix frontend test` from the repository root (criterion 4) | The run includes `src/components/AppFooter.test.tsx` and `src/api/version.test.ts`, covering a present version and an absent version (pending, rejected, `null`), and reports 0 failed | [ ] Pass [ ] Fail |
| 10 | In Chrome DevTools, Network, block the request URL `http://localhost:8010/api/version` and reload (criterion 6, failure state) | The footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 11 | Remove the block, set throttling to "Slow 3G", and reload while watching the footer (criterion 6, loading state) | Before the version request completes the footer reads `Task Notes` with nothing after it; once it completes it changes to `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 12 | Set throttling back to "No throttling" | Network behaves normally again | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
