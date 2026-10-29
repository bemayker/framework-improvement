# UAT Script: CHORE-07 TEST-10 follow-up (TEST-08 spec tolerates the build commit)

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/CHORE-07-test-10-follow-up` (or `main` once merged); dependencies installed at the root (`npm install`).
- Nothing listening on ports 5183 and 8010.
- `backend/pyproject.toml` has `version = "0.1.0"`. If it was bumped since, substitute the current value for `0.1.0` below.
- A browser to open http://localhost:5183/.

## Steps

### Criterion 1: The TEST-08 spec passes with BUILD_COMMIT set

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | From the repository root run `BUILD_COMMIT=3761feee721597797dfabfd75a08d12e7aea4a23 docker compose up -d --build` | Frontend, backend and db containers are running | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:5183/ in a browser | The footer reads `Task Notes v0.1.0 (3761fee)` | [ ] Pass [ ] Fail |
| 3 | Run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts` | Both tests in that file pass, `0 failed` | [ ] Pass [ ] Fail |

### Criterion 2: The TEST-08 spec passes with BUILD_COMMIT unset

Make sure no `BUILD_COMMIT` is exported in the shell and none is set in a root `.env` file.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `docker compose down`, then `docker compose up -d --build` | Containers are running | [ ] Pass [ ] Fail |
| 5 | Open http://localhost:5183/ | The footer reads `Task Notes v0.1.0`, with no parenthesised commit | [ ] Pass [ ] Fail |
| 6 | Run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts` | Both tests in that file pass, `0 failed` | [ ] Pass [ ] Fail |

### Criterion 3: The first test still verifies the version; the second is unchanged

Not a UI behaviour: verified by reading the spec.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `e2e/tests/TEST-08_footer_app_version.spec.ts` | Line 11 reads `await expect(footer).toContainText(` with the `Task Notes v${backendVersion}` template; line 12 still reads `await expect(page.getByTestId("app-footer-version")).toHaveText(` with `v${backendVersion}` | [ ] Pass [ ] Fail |
| 8 | Run `git diff main -- e2e/tests/TEST-08_footer_app_version.spec.ts` | Exactly one line changed (line 11); the second test, `footer reads exactly Task Notes when /api/version is unreachable`, has no diff | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
