# UAT Script: TEST-04 Page footer

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-04-page-footer` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5173` (frontend) or `8000` (backend).
- The version shown in the footer comes from the backend at runtime and is verified by `TEST-08_footer_app_version_uat_script.md`, not by this script.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (the `frontend` log shows the Vite dev server listening on port 5173).

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open a browser and navigate to `http://localhost:5173` | Page loads without errors | [ ] Pass [ ] Fail |
| 2 | Scroll to the bottom of the page | A footer is visible below the subtitle | [ ] Pass [ ] Fail |
| 3 | Read the footer text | The footer starts with "Task Notes" (the version, if shown, is verified in the TEST-08 script) | [ ] Pass [ ] Fail |
| 4 | Open browser dev tools and inspect the footer element | The element is a `<footer>` tag with `data-testid="app-footer"` | [ ] Pass [ ] Fail |
| 5 | With dev tools' accessibility inspector (or a screen reader), inspect the footer | The footer is exposed with the "contentinfo" landmark role | [ ] Pass [ ] Fail |
| 6 | Observe the title and subtitle above the footer | The title "Task Notes" (`data-testid="landing-title"`) and the subtitle "A minimal task-notes app for keeping track of what needs doing." are present and worded exactly as before this feature | [ ] Pass [ ] Fail |
| 7 | Resize the browser window to a mobile width (e.g. 375px) | The footer remains visible, fully readable, and does not overlap or get cut off | [ ] Pass [ ] Fail |
| 8 | In a separate terminal, run `cd frontend && npm test` | Vitest suite passes, including the `AppFooter` and updated `LandingPage` tests | [ ] Pass [ ] Fail |
| 9 | From the repository root, run `npx playwright test e2e/tests/TEST-04_page_footer.spec.ts` | The E2E spec passes, confirming the footer, its name, its landmark role, and the unchanged heading/subtitle | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
