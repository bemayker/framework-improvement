# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Backend running on `http://localhost:8010`, for example `uv run --directory backend uvicorn app.main:app --port 8010`, or through the compose stack.
- Frontend dev server running on `http://localhost:5183`.
- `frontend/package.json` still has `"version": "0.0.0"`, which is how step 5 tells the backend value from the frontend's own.
- Frontend dependencies installed (`npm --prefix frontend install`) for the test steps.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in the browser and note the value | The page shows `{"version":"0.1.0"}` (or whatever `[project].version` in `backend/pyproject.toml` currently says) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 3 | Read the footer | It reads `Task Notes v0.1.0`, the exact value noted in step 1 | [ ] Pass [ ] Fail |
| 4 | Open the developer tools Network tab and reload `http://localhost:5183/` | One `GET` request to `http://localhost:8010/api/version` appears with status 200 and body `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 5 | Compare the footer version with the `version` field of `frontend/package.json` | The footer shows `v0.1.0`, not `v0.0.0` | [ ] Pass [ ] Fail |
| 6 | Stop the backend, change `version = "0.1.0"` to `version = "0.1.1"` in `backend/pyproject.toml`, run `uv sync --directory backend`, start the backend again, and reload `http://localhost:5183/` without restarting or rebuilding the frontend | The footer reads `Task Notes v0.1.1`. Revert the pyproject change and run `uv sync --directory backend` afterwards | [ ] Pass [ ] Fail |
| 7 | Stop the backend and reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap | [ ] Pass [ ] Fail |
| 8 | Start the backend and reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 9 | In the Network tab set throttling to "Slow 3G" and reload | While the `/api/version` request is pending the footer reads `Task Notes` alone, then changes to `Task Notes v0.1.0`; it never reads `Task Notes v`, `undefined` or `unknown` | [ ] Pass [ ] Fail |
| 10 | In the Network tab right-click the `/api/version` request, choose "Block request URL", and reload. Unblock it afterwards | The footer reads `Task Notes` alone | [ ] Pass [ ] Fail |
| 11 | Open `.claude/artifacts/TEST-08/plan.md` and read the Re-Plan Feedback section | The loading and failure choices (name alone in both) are written there | [ ] Pass [ ] Fail |
| 12 | From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` | The run reports no failed test and exits 0; the listed tests include `renders the backend version once /api/version resolves` and `renders the name alone when the version request fails` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
