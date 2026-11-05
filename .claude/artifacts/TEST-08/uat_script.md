# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-08-footer-app-version`.
- From the repository root, `docker compose up --build` has started `db`, `backend` and `frontend` (frontend on `http://localhost:5183`, backend on `http://localhost:8010`).
- Dependencies installed for criterion 4 (`npm --prefix frontend install`).

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open `http://localhost:8010/api/version` in a browser tab | The JSON shows `"version": "0.1.0"` (the `[project].version` in `backend/pyproject.toml`; a `commit` field may also be present once TEST-09 has merged) | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:5183/` | The landing page loads with the "Task Notes" heading | [ ] Pass [ ] Fail |
| 1.3 | Scroll to the bottom of the page | The footer reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not package.json

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Open `frontend/package.json` and `backend/pyproject.toml` | The two versions differ (`0.0.0` and `0.1.0`) | [ ] Pass [ ] Fail |
| 2.2 | Open `http://localhost:5183/` | The footer reads `Task Notes v0.1.0`, the backend's version, not `Task Notes v0.0.0` | [ ] Pass [ ] Fail |
| 2.3 | Open browser DevTools Network tab and reload `http://localhost:5183/` | A GET to `http://localhost:8010/api/version` appears with status 200, and its `version` equals the version in the footer | [ ] Pass [ ] Fail |
| 2.4 | Open `frontend/src/components/AppFooter.tsx` | It imports nothing from `package.json` and contains no version string literal such as `0.1.0` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | On `http://localhost:5183/`, open DevTools Network, right-click the `version` request, choose "Block request URL", and reload | The footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap | [ ] Pass [ ] Fail |
| 3.2 | Unblock the URL, run `docker compose stop backend` in a terminal, and reload `http://localhost:5183/` | The footer again reads exactly `Task Notes`, and the heading and note form still render | [ ] Pass [ ] Fail |
| 3.3 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, and reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed` | [ ] Pass [ ] Fail |
| 4.2 | Open `frontend/src/components/AppFooter.test.tsx` | A test has the mocked `getVersion` resolve and the footer text include the mocked version, and tests have it pending, rejecting, or resolving to `unknown` with footer text exactly `Task Notes` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
