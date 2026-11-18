# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Backend running on `http://localhost:8010` and frontend on `http://localhost:5183`, per `docs/DEVELOPMENT.md`.
- `backend/pyproject.toml` declares `version = "0.1.0"` under `[project]`; `frontend/package.json` declares `"version": "0.0.0"`. The two differ on purpose, so the tester can tell which source the footer uses. If either has changed, substitute the current value below.
- Frontend dependencies installed (`npm --prefix frontend install`).

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading and the note form | [ ] Pass [ ] Fail |
| 3 | Scroll to the bottom of the page | The footer reads exactly `Task Notes v0.1.0` (criterion 1) | [ ] Pass [ ] Fail |
| 4 | Confirm the footer does not read `Task Notes v0.0.0` | The footer shows the backend version, not the `frontend/package.json` version (criterion 2) | [ ] Pass [ ] Fail |
| 5 | Open DevTools, Network tab, reload the page | A `GET http://localhost:8010/api/version` request with status 200 appears (criterion 2) | [ ] Pass [ ] Fail |
| 6 | Stop the backend, change `version = "0.1.0"` to `version = "0.1.1"` in `backend/pyproject.toml`, run `uv sync --directory backend`, start the backend again, and reload the frontend without restarting or rebuilding it | The footer reads `Task Notes v0.1.1` (criterion 2) | [ ] Pass [ ] Fail |
| 7 | Revert `backend/pyproject.toml` to `version = "0.1.0"`, run `uv sync --directory backend`, restart the backend, and reload the page | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 8 | Stop the backend and reload `http://localhost:5183/` | The page loads and the footer reads exactly `Task Notes` (criterion 3) | [ ] Pass [ ] Fail |
| 9 | Read the footer text closely | It contains no `v`, no `undefined`, no `null`, no `unknown`, and no trailing space or gap after `Task Notes`; the page shows no error message (criterion 3) | [ ] Pass [ ] Fail |
| 10 | In DevTools, Network tab, find the version request | `GET http://localhost:8010/api/version` shows as failed (criterion 3) | [ ] Pass [ ] Fail |
| 11 | Start the backend again. In DevTools, Network tab, set throttling to "Slow 3G" and reload the page, watching the footer while the version request is pending | The footer reads `Task Notes` with no placeholder, no `loading` text and no gap (criterion 5) | [ ] Pass [ ] Fail |
| 12 | Wait for the version request to complete | The footer changes to `Task Notes v0.1.0` without the rest of the page re-rendering visibly (criterion 5) | [ ] Pass [ ] Fail |
| 13 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run passes: no failed or errored test and the command exits 0 (criterion 4) | [ ] Pass [ ] Fail |
| 14 | Open `frontend/src/components/AppFooter.test.tsx` | It contains the tests `renders the backend version once the fetch resolves` and `renders the app name without a version when the backend is unreachable` (criterion 4) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
