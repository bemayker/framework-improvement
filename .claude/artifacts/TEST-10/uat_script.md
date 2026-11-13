# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- `backend/pyproject.toml` reads `version = "0.1.0"`. If it changes, the expected values below change with it.
- Chrome or Edge with DevTools for steps 6, 7 and 8.
- Frontend dependencies installed (`npm --prefix frontend install`) for steps 11 and 12.

## Test Environment Setup

1. From the repository root run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build`.
2. Wait until `http://localhost:8010/api/version` answers and `http://localhost:5183/` loads.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` in the browser | Body is `{"version": "0.1.0", "commit": "0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | Heading "Task Notes", the note form and the note list are shown | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the footer | Footer reads exactly `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 4 | 1 | Right-click the commit text and choose Inspect | It is a span with `data-testid="app-footer-commit"` containing `0123456`, inside the footer with `data-testid="app-footer"` | [ ] Pass [ ] Fail |
| 5 | 2 | Keep DevTools open on the Network tab | Network tab is visible | [ ] Pass [ ] Fail |
| 6 | 2 | Set throttling to "Slow 3G" and reload `http://localhost:5183/` | While the request is pending the footer reads exactly `Task Notes`, with no `undefined`, no `null` and no error text | [ ] Pass [ ] Fail |
| 7 | 2 | Wait for the request to finish | Footer reads `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 8 | 2 | Set throttling to "No throttling", right-click the `version` request, choose "Block request URL" and reload | Footer reads exactly `Task Notes`, no `undefined`, no error text; the note form still accepts `Buy milk` and lists it after Save | [ ] Pass [ ] Fail |
| 9 | 2 | Unblock the URL. Run `docker compose up -d --build` (BUILD_COMMIT unset) and wait for the backend | `http://localhost:8010/api/version` reads `{"version": "0.1.0", "commit": "unknown"}` | [ ] Pass [ ] Fail |
| 10 | 2 | Reload `http://localhost:5183/` | Footer reads exactly `Task Notes v0.1.0`: no parentheses, no `(unknown)` | [ ] Pass [ ] Fail |
| 11 | 3 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | Output lists `renders the first 7 characters of the commit next to the version`, `never renders undefined or an error while the version is loading` and `never renders undefined or an error when /api/version fails`; 0 failed | [ ] Pass [ ] Fail |
| 12 | 3 | Run `npm --prefix frontend test -- src/api/version.test.ts src/components/LandingPage.test.tsx` | 0 failed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
