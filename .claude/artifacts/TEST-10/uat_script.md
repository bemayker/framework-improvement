# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit`.
- From the repository root, start the stack with the commit set: `BUILD_COMMIT=abc1234def567890abc1234def567890abc12345 docker compose up --build` (frontend on `http://localhost:5183`, backend on `http://localhost:8010`).
- Dependencies installed for criterion 3 (`npm --prefix frontend install`).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open `http://localhost:8010/api/version` in a browser tab | The JSON shows `"version": "0.1.0"` and `"commit": "abc1234def56"` (12 characters) | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:5183/` | The landing page loads with the "Task Notes" heading | [ ] Pass [ ] Fail |
| 1.3 | Scroll to the bottom of the page | The footer reads exactly `Task Notes v0.1.0 (abc1234)`: the version, a space, then the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |

### Criterion 2: While pending or on failure, the footer shows the version alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | On `http://localhost:5183/`, open DevTools Network, set throttling to "Slow 3G" and reload; watch the footer before the `version` request completes | It reads exactly `Task Notes`, then changes to `Task Notes v0.1.0 (abc1234)` once the request finishes; at no point does it show `undefined`, `null` or `()` | [ ] Pass [ ] Fail |
| 2.2 | Set throttling to "No throttling", right-click the `version` request, choose "Block request URL", and reload | The footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown`, error text or `()` | [ ] Pass [ ] Fail |
| 2.3 | Unblock the URL. Run `docker compose down`, then `docker compose up --build` (without the commit). Open `http://localhost:8010/api/version` | The JSON shows `"commit": "unknown"` | [ ] Pass [ ] Fail |
| 2.4 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown` | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed` | [ ] Pass [ ] Fail |
| 3.2 | Open `frontend/src/components/AppFooter.test.tsx` | A test has the mocked `getVersion` resolve with a commit and the footer text exactly `Task Notes v9.9.9 (abc1234)`; a pending test and a rejected test have footer text exactly `Task Notes`; a commit-absent test has footer text exactly `Task Notes v9.9.9` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
