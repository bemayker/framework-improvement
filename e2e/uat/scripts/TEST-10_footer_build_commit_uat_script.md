# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- `backend/pyproject.toml` declares version `0.1.0`.
- Chrome or Edge, for the DevTools network blocking and throttling steps.
- Frontend dependencies installed (`npm --prefix frontend install`) for the component test steps.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=0123456789abcdef docker compose up -d --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` in a browser tab | The page shows `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading and, at the bottom, a footer | [ ] Pass [ ] Fail |
| 3 | 1 | Read the footer text | It reads exactly `Task Notes v0.1.0 (0123456)`: seven commit characters, in parentheses, after the version | [ ] Pass [ ] Fail |
| 4 | 2 | Open DevTools, Network tab, right-click the `version` request and choose "Block request URL", then reload `http://localhost:5183/` | The request shows as blocked | [ ] Pass [ ] Fail |
| 5 | 2 | Read the footer | It reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text | [ ] Pass [ ] Fail |
| 6 | 2 | Remove the block, set Network throttling to "Slow 3G" and reload; read the footer while the `version` request is still pending | It reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 7 | 2 | Wait for the request to finish | The footer reads `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 8 | 3 | From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` | The run passes: no failed test and the command exits 0 | [ ] Pass [ ] Fail |
| 9 | 3 | In the output, find `shows the first 7 characters of the backend commit next to the version`, `shows only the app name while the version request is pending` and `renders without a version when the version request fails` | All three are listed as passed | [ ] Pass [ ] Fail |
| 10 | Edge | Stop the stack, start it without the variable (`docker compose up -d --build`), open `http://localhost:8010/api/version` | The body reads `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 11 | Edge | Reload `http://localhost:5183/` and read the footer | It reads exactly `Task Notes v0.1.0`, with no `(unknown)` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
