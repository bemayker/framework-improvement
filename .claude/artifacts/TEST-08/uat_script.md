# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Frontend dependencies installed: `npm --prefix frontend install`.
- Frontend dev server running (`npm --prefix frontend run dev`, or the compose stack) and reachable at `http://localhost:5183`.
- `frontend/package.json` declares `"version": "0.0.0"` on the base branch.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Open `http://localhost:5183/` in a browser | The landing page shows the "Task Notes" heading, the note form and the note list | [ ] Pass [ ] Fail |
| 2 | 1 | Scroll to the bottom of the page | A small grey footer line reads `Task Notes v0.0.0` | [ ] Pass [ ] Fail |
| 3 | 2 | Open `frontend/src/components/AppFooter.tsx` | The version is imported from `../../package.json`; no version number such as `0.0.0` is typed in the file | [ ] Pass [ ] Fail |
| 4 | 2 | Edit `frontend/package.json`, set `"version": "0.0.1"`, save | The dev server reloads | [ ] Pass [ ] Fail |
| 5 | 2 | Reload `http://localhost:5183/` | The footer reads `Task Notes v0.0.1` | [ ] Pass [ ] Fail |
| 6 | 2 | Revert `frontend/package.json` to `"version": "0.0.0"` and reload | The footer reads `Task Notes v0.0.0` again | [ ] Pass [ ] Fail |
| 7 | 3 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` (a running build always resolves the version, so the absent path is verified through the component test) | The run reports `0 failed`, including the version-absent tests (null, empty string, whitespace), each asserting the footer text is exactly `Task Notes` | [ ] Pass [ ] Fail |
| 8 | 4 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a test rendering `<AppFooter version="1.2.3" />` expecting `Task Notes v1.2.3`, and tests rendering `version={null}`, `version=""` and `version="   "` expecting exactly `Task Notes` | [ ] Pass [ ] Fail |
| 9 | 4 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/components/LandingPage.test.tsx` | `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
