# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- The stack is up: run `docker compose up -d` from the repository root. The frontend is then on `http://localhost:5183` and the backend on `http://localhost:8010`.
- Frontend dependencies installed (`npm --prefix frontend install`), needed for criterion 4 only.
- The expected version is `[project].version` in `backend/pyproject.toml`, currently `0.1.0`. `frontend/package.json` is `0.0.0`, so the two values differ on purpose. If the backend version is bumped later, read the expected value from `http://localhost:8010/api/version` instead of this script.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The page shows the heading `Task Notes`, the note form and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 2 | Read the footer text | It reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | Resize the window to 375 px wide (browser devtools device toolbar) | The footer is still visible and still reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not from package.json

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `http://localhost:8010/api/version` in a new tab | The browser shows a JSON object whose `version` field is `0.1.0` | [ ] Pass [ ] Fail |
| 5 | Open `frontend/package.json` in the repository | Its `version` field is `0.0.0` | [ ] Pass [ ] Fail |
| 6 | Return to `http://localhost:5183/` and reload | The footer reads `Task Notes v0.1.0`, the backend value, not `v0.0.0` | [ ] Pass [ ] Fail |
| 7 | Open devtools, Network tab, and reload the page | One request to `http://localhost:8010/api/version` with status 200 | [ ] Pass [ ] Fail |
| 8 | In `frontend/src/components/AppFooter.tsx`, search for `0.1.0` and for `package.json` | Neither appears | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer shows `Task Notes` only

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `docker compose stop backend` from the repository root | The backend container stops; `http://localhost:8010/api/version` no longer answers | [ ] Pass [ ] Fail |
| 10 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and the footer line is still present (not blank) | [ ] Pass [ ] Fail |
| 11 | Run `docker compose start backend`, then in devtools Network set throttling to `Slow 3G` and reload | While the version request is pending the footer reads `Task Notes`, and it changes to `Task Notes v0.1.0` once the request completes | [ ] Pass [ ] Fail |
| 12 | Set throttling back to `No throttling` | Throttling is off and the footer reads `Task Notes v0.1.0` after a reload | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths, version present and version absent

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Run `npm --prefix frontend test` from the repository root | `src/components/AppFooter.test.tsx`, `src/api/version.test.ts`, `src/api/notes.test.ts` and `src/components/LandingPage.test.tsx` all run, with 0 failed | [ ] Pass [ ] Fail |
| 14 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a test rendering a resolved backend version, and tests rendering a pending, a rejected and a null version, each asserting the footer text is exactly `Task Notes` | [ ] Pass [ ] Fail |

### Automated browser check (optional)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 15 | With the stack up and `docker compose start backend` done, run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts e2e/tests/TEST-04_page_footer.spec.ts` from the repository root | 0 failed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
