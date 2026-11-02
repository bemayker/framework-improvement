# UAT Script: TEST-04 Page footer with app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-04-page-footer` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5173` (frontend) or `8000` (backend).
- Have `frontend/package.json` open (or `cat` it) so the tester can read the current `version` field — the footer's expected version comes from that field, not from this document. At the time of writing it is `0.0.0`; a later version bump changes the expected text without changing this script.

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
| 3 | Read the footer text | The footer reads "Task Notes v" followed by a version number | [ ] Pass [ ] Fail |
| 4 | Compare the version number in the footer to the `version` field in `frontend/package.json` | The two values match exactly | [ ] Pass [ ] Fail |
| 5 | Open browser dev tools and inspect the footer element | The element is a `<footer>` tag with `data-testid="app-footer"` | [ ] Pass [ ] Fail |
| 6 | With dev tools' accessibility inspector (or a screen reader), inspect the footer | The footer is exposed with the "contentinfo" landmark role | [ ] Pass [ ] Fail |
| 7 | Observe the title and subtitle above the footer | The title "Task Notes" (`data-testid="landing-title"`) and the subtitle "A minimal task-notes app for keeping track of what needs doing." are present and worded exactly as before this feature | [ ] Pass [ ] Fail |
| 8 | Resize the browser window to a mobile width (e.g. 375px) | The footer remains visible, fully readable, and does not overlap or get cut off | [ ] Pass [ ] Fail |
| 9 | In a separate terminal, run `cd frontend && npm test` | Vitest suite passes, including the `AppFooter` and updated `LandingPage` tests | [ ] Pass [ ] Fail |
| 10 | From the repository root, run `npx playwright test e2e/tests/TEST-04_page_footer.spec.ts` | The E2E spec passes, confirming the footer, its version, its landmark role, and the unchanged heading/subtitle | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
