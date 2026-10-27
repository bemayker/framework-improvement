# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- `backend/pyproject.toml` has `version = "0.1.0"`.
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- A browser with DevTools.
- Frontend dependencies installed (`npm --prefix frontend install`) for the criterion 3 steps.

## Test Environment Setup

1. In the repository root `.env`, set `BUILD_COMMIT=0f0e7a668920851ba8199ffa6ae2252197be5956`.
2. Run `docker compose up -d --build`.
3. Wait until http://localhost:8010/api/version answers in a browser tab.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open http://localhost:5183/ | The landing page loads with the notes form and the footer at the bottom | [ ] Pass [ ] Fail |
| 2 | 1 | Read the footer | It reads exactly `Task Notes v0.1.0 (0f0e7a6)`; the commit shows 7 characters, not 12 or 40 | [ ] Pass [ ] Fail |
| 3 | 1 | Open http://localhost:8010/api/version in a new tab | The JSON shows `"commit": "0f0e7a668920"`, whose first 7 characters match the footer | [ ] Pass [ ] Fail |
| 4 | 2 | In DevTools Network, right-click the `/api/version` request, choose "Block request URL", reload | The footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error message | [ ] Pass [ ] Fail |
| 5 | 2 | Unblock the URL, set Network throttling to "Slow 3G", reload | While the request is in flight the footer reads `Task Notes` only | [ ] Pass [ ] Fail |
| 6 | 2 | Wait for the request to complete | The footer reads `Task Notes v0.1.0 (0f0e7a6)` | [ ] Pass [ ] Fail |
| 7 | 2 | Remove the `BUILD_COMMIT` line from `.env`, run `docker compose up -d --build`, reload http://localhost:5183/ | The footer reads `Task Notes v0.1.0` (version alone, no `(unknown)`) | [ ] Pass [ ] Fail |
| 8 | 3 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | 0 failed, with the success-with-commit, pending and failure cases listed | [ ] Pass [ ] Fail |
| 9 | 3 | Run `npm --prefix frontend test -- src/api/version.test.ts src/components/LandingPage.test.tsx` | 0 failed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
