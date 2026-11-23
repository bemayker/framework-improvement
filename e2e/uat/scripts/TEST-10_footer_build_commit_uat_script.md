# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Repository checked out on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- Frontend dependencies installed (`npm --prefix frontend install`).
- Database running, and the backend started from the repository root with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` (or `uv run` with that variable exported), listening on `http://localhost:8010`. `docker-compose.yml` passes `BUILD_COMMIT` through to the backend, so each recreate below picks up the value you set on the command.
- Frontend running on `http://localhost:5183`.
- Read `[project].version` in `backend/pyproject.toml` first. This script writes it as `0.1.0` (its value at plan time); use whatever value it holds when you test.
- Chrome, for the DevTools steps in criterion 2.
- This script is the only place the real backend and a real `BUILD_COMMIT` meet the footer: the Playwright spec for this item fulfils `/api/version` with a mocked response, so criterion 1 steps 1.1 to 1.4 are the real-backend check.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open `http://localhost:8010/api/version` in a browser tab | The body is `{"version":"0.1.0","commit":"0123456789ab"}` (the backend truncates to 12 characters) | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:5183/` and scroll to the footer | It reads exactly `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |
| 1.3 | Recreate the backend with `BUILD_COMMIT=abc1234 docker compose up -d backend` and reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0 (abc1234)` | [ ] Pass [ ] Fail |
| 1.4 | Recreate the backend with `BUILD_COMMIT= docker compose up -d backend` (the commit becomes `unknown`) and reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown` | [ ] Pass [ ] Fail |

### Criterion 2: While pending or on failure, the footer shows the version alone

Before this criterion, recreate the backend with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Open `http://localhost:5183/`, open DevTools, Network, set throttling to "Slow 3G", and reload | While the `version` request is pending the footer reads exactly `Task Notes` (no version is known yet, since version and commit come from the same request); once it completes it reads `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 2.2 | In DevTools, Network, right-click the `version` request, choose "Block request URL", and reload | The footer reads exactly `Task Notes` and stays that way; it never shows `undefined`, `null`, `unknown` or an error message | [ ] Pass [ ] Fail |
| 2.3 | Unblock the URL, stop the backend with `docker compose stop backend`, and reload `http://localhost:5183/` | The page loads with the heading and the note form, and the footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run lists `renders the short commit next to the version`, `shows only the app name while the version request is pending` and `shows only the app name when the version request fails` as passing; its summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 3.2 | Run `npm --prefix frontend test -- src/api/version.test.ts src/components/LandingPage.test.tsx` | Its summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
