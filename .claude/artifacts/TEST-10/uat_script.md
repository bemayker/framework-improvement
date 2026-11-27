# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- From the repository root, the stack is running with the backend started with a known commit: `BUILD_COMMIT=3f9c2ab41d0e5b6c7d8e9f001122334455667788 docker compose up --build`. Frontend at http://localhost:5183, backend at http://localhost:8010.
- Chrome with DevTools available (criterion 2).
- Frontend dependencies installed for the test steps (`npm --prefix frontend install`).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:8010/api/version in a browser tab and note the `version` value | The JSON shows `"commit": "3f9c2ab41d0e"` and a `"version"` value, for example `0.1.0` | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:5183/ | The landing page shows the "Task Notes" heading, the note form and a footer at the bottom | [ ] Pass [ ] Fail |
| 3 | Read the footer | It reads `Task Notes v0.1.0 (3f9c2ab)`: the version from step 1, then the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, no undefined or error is shown

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open http://localhost:5183/, open DevTools, Network, set throttling to "Slow 3G", and reload | While `/api/version` is still pending the footer reads exactly `Task Notes`, with no `undefined`, no `null` and no error text | [ ] Pass [ ] Fail |
| 5 | Wait for the request to finish | The footer changes to `Task Notes v0.1.0 (3f9c2ab)` | [ ] Pass [ ] Fail |
| 6 | In DevTools Network, right-click the `version` request, choose "Block request URL", and reload | The footer reads exactly `Task Notes`, with no `undefined`, no parentheses and no error text | [ ] Pass [ ] Fail |
| 7 | Remove the block, restart the backend without BUILD_COMMIT (`docker compose up --build`), and reload | `/api/version` returns `"commit": "unknown"` and the footer reads `Task Notes v0.1.0` with no parentheses (the version alone) | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | From the repository root, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run lists `renders the first 7 characters of the commit next to the version`, `renders exactly Task Notes while the version is loading` and `renders exactly Task Notes when the version request fails`, its summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
