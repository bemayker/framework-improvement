# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- Frontend dependencies installed: `npm --prefix frontend install`.
- Stack started from the repository root with a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build`; frontend at `http://localhost:5183`, backend at `http://localhost:8010`.
- `frontend/package.json` declares `"version": "0.0.0"`.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Run `curl -s http://localhost:8010/api/version` | The body contains `"commit": "0123456789ab"` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` in a browser | The landing page shows the "Task Notes" heading, the note form and the note list | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the bottom of the page | The grey footer line reads `Task Notes v0.0.0 (0123456)`: the version first, then the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |
| 4 | 1 | Restart the backend without a commit: `docker compose up -d backend` with `BUILD_COMMIT` unset in your shell, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.0.0 (unknown)`, the backend's own value | [ ] Pass [ ] Fail |
| 5 | 2 | Stop the backend: `docker compose stop backend` | The backend is stopped | [ ] Pass [ ] Fail |
| 6 | 2 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.0.0`; no `undefined`, no `null`, no empty parentheses and no error message, and the rest of the page still renders | [ ] Pass [ ] Fail |
| 7 | 2 | In the browser dev tools Network tab set throttling to "Slow 3G", start the backend with `docker compose start backend`, and reload | While the `/api/version` request is in flight the footer reads `Task Notes v0.0.0`; once it completes it reads `Task Notes v0.0.0 (unknown)` (or the 7-character commit if `BUILD_COMMIT` is set) | [ ] Pass [ ] Fail |
| 8 | 2 | Set throttling back to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |
| 9 | 3 | Open `frontend/src/components/AppFooter.test.tsx` | It mocks `../api/version` and has a success test expecting `Task Notes v1.2.3 (0123456)`, a pending test expecting exactly `Task Notes v1.2.3`, and a failure test expecting exactly `Task Notes v1.2.3` | [ ] Pass [ ] Fail |
| 10 | 3 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts src/api/notes.test.ts src/components/LandingPage.test.tsx` | `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
