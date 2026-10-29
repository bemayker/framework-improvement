# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- Stack started from the repository root with `BUILD_COMMIT=3761feee721597797dfabfd75a08d12e7aea4a23 docker compose up -d --build`: frontend on http://localhost:5183, backend on http://localhost:8010.
- `backend/pyproject.toml` has `version = "0.1.0"`. If it was bumped since, substitute the current value for `0.1.0` below.
- A browser with DevTools (Network tab).
- Frontend dependencies installed (`npm --prefix frontend install`) for the Criterion 3 steps.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:8010/api/version in a browser tab | The JSON shows `"version": "0.1.0"` and `"commit": "3761feee7215"` | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:5183/ and read the footer at the bottom of the landing page | It reads `Task Notes v0.1.0 (3761fee)`: exactly 7 commit characters, in parentheses, after the version | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | In DevTools Network, right-click the `version` request, choose Block request URL, then reload http://localhost:5183/ | The footer reads `Task Notes` only; no `undefined`, `null`, `unknown`, error message or empty parentheses appear | [ ] Pass [ ] Fail |
| 4 | Unblock the URL, set Network throttling to `Slow 3G`, reload and watch the footer before the `version` request completes | It reads `Task Notes` only, then changes to `Task Notes v0.1.0 (3761fee)` when the request finishes | [ ] Pass [ ] Fail |
| 5 | Set throttling back to "No throttling". Run `docker compose down`, then `docker compose up -d --build` with BUILD_COMMIT unset, and reload http://localhost:5183/ | http://localhost:8010/api/version shows `"commit": "unknown"` and the footer reads `Task Notes v0.1.0`, with no `(unknown)` | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` | `0 failed`, and the listed test names include a success case showing the 7-character commit, a pending case and a failure case | [ ] Pass [ ] Fail |
| 7 | Run `npm --prefix frontend test` | `0 failed` (covers `src/api/version.test.ts` and `src/components/LandingPage.test.tsx` with the new client shape) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
