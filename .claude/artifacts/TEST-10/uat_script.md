# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- Copy `.env.example` to `.env` in the repository root if it does not exist.
- Frontend dependencies installed (`npm --prefix frontend install`).
- Note the backend version in `backend/pyproject.toml` (`version = "..."`); it is called V below.

## Test Environment Setup

1. From the repository root, build the backend with a known commit and start the stack:
   ```bash
   docker compose build --build-arg BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 backend
   docker compose up -d
   ```
2. Wait until `db`, `backend` (http://localhost:8010) and `frontend` (http://localhost:5183) are up.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The landing page shows the `Task Notes` heading and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 2 | Read the footer | It reads exactly `Task Notes vV (a1b2c3d)`: the 7 characters `a1b2c3d`, not the 12 `a1b2c3d4e5f6` | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/version` in a second tab | The JSON shows `"commit": "a1b2c3d4e5f6"`, confirming the footer cut it to 7 | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | In devtools Network, right-click the `version` request, choose "Block request URL", then reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text, and no error is shown elsewhere on the page | [ ] Pass [ ] Fail |
| 5 | Unblock the URL, set Network throttling to a custom profile with 10000 ms latency, and reload | While the `version` request is pending the footer reads `Task Notes`; once it completes it reads `Task Notes vV (a1b2c3d)` | [ ] Pass [ ] Fail |
| 6 | Disable throttling. Rebuild the backend without a commit (`docker compose build backend`, then `docker compose up -d`) and reload | The backend reports `"commit": "unknown"` and the footer reads exactly `Task Notes vV`, with no `(unknown)` and no empty parentheses | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports 0 failed | [ ] Pass [ ] Fail |
| 8 | Open `frontend/src/components/AppFooter.test.tsx` | It holds a test each for the success path (footer reads `Task Notes v9.9.9 (a1b2c3d)`), the pending path (never-settling promise, footer reads `Task Notes`) and the failure path (rejected promise, footer reads `Task Notes`) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
