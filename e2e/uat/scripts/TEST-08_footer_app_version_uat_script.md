# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Stack started from the repository root with `docker compose up -d --build`: frontend on http://localhost:5183, backend on http://localhost:8010.
- `backend/pyproject.toml` has `version = "0.1.0"` and `frontend/package.json` has `"version": "0.0.0"`. If either was bumped since, substitute the current values below.
- A browser with DevTools (Network tab).
- Frontend dependencies installed (`npm --prefix frontend install`) for step 14.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:5183/ in a browser | The "Task Notes" heading, the note form and, at the bottom, the footer are shown | [ ] Pass [ ] Fail |
| 2 | Read the footer | It reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | Resize the window to 375px wide | The footer is still visible and still reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open http://localhost:8010/api/version in a browser tab | The page shows a JSON object whose `version` field is `0.1.0` | [ ] Pass [ ] Fail |
| 5 | Open http://localhost:5183/ with the DevTools Network tab open, then reload | A `GET http://localhost:8010/api/version` request with status 200 appears | [ ] Pass [ ] Fail |
| 6 | Read the footer | It reads `Task Notes v0.1.0`, the backend's version, and not `v0.0.0`, the frontend package's version | [ ] Pass [ ] Fail |

### Criterion 3: Loading and failure render without the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | In DevTools Network, set throttling to "Slow 3G" and reload http://localhost:5183/ | While the `/api/version` request is pending the footer reads `Task Notes`, with no `v`, no `undefined`, no `null` and no `unknown`; once it completes it reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 8 | Set throttling back to "No throttling". Run `docker compose stop backend` from the repository root | The command reports the backend container stopped | [ ] Pass [ ] Fail |
| 9 | Reload http://localhost:5183/ | The footer reads exactly `Task Notes`, with no trailing gap, `v`, `undefined`, `null` or `unknown`; the DevTools console may show the failed request | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend`, wait for it to be up, reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run ends with `0 failed`, and the AppFooter test names include a version-present case and a version-absent case | [ ] Pass [ ] Fail |

### Criterion 5: GET /api/version returns the backend's version

Not a UI behaviour; the observable check is the HTTP response.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `curl -s http://localhost:8010/api/version` with the stack up | It prints a JSON object whose `version` field is `0.1.0` | [ ] Pass [ ] Fail |
| 13 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | `0 failed` | [ ] Pass [ ] Fail |

### Rendered end to end

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 14 | From the repository root, run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts e2e/tests/TEST-04_page_footer.spec.ts` | `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
