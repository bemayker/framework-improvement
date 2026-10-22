# UAT Script: FEAT-6 GET /api/stamp returns a JSON stamp and the frontend shows it

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-6-stamp-endpoint-and-footer` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Node and uv dependencies installed (`frontend` and `backend`), and Playwright browsers installed, for the test-run steps.
- Have `frontend/package.json` open so the tester can read the current `version` field; the footer's expected version comes from it.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started.

## Steps

### Criterion 1: GET /api/stamp answers 200 with {"stamp": "ok", "db": true}

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a browser, open `http://localhost:8010/api/stamp` | The page shows the JSON `{"stamp":"ok","db":true}` | [ ] Pass [ ] Fail |
| 2 | Open the browser developer tools, Network tab, and reload the same URL | The request to `/api/stamp` shows status `200` | [ ] Pass [ ] Fail |
| 3 | Run `docker compose stop db`, then reload `http://localhost:8010/api/stamp` | The page shows `{"stamp":"ok","db":false}` with status `200` (the recorded assumption) | [ ] Pass [ ] Fail |
| 4 | Run `docker compose start db` to restore the database | The database container is running again; reloading the URL shows `{"stamp":"ok","db":true}` | [ ] Pass [ ] Fail |

### Criterion 2: the frontend footer shows 'stamp: ok' once the backend answers

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open `http://localhost:5183/` | The landing page shows the heading `Task Notes` | [ ] Pass [ ] Fail |
| 6 | Scroll to the footer at the bottom of the page | The footer reads `Task Notes v{the version in frontend/package.json} · stamp: ok` | [ ] Pass [ ] Fail |
| 7 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads `Task Notes v{version}` with no stamp text, and the rest of the page still works | [ ] Pass [ ] Fail |
| 8 | Run `docker compose start backend` to restore the backend, then reload the page | The footer reads `stamp: ok` again | [ ] Pass [ ] Fail |
| 9 | Resize the browser window to a mobile width (e.g. 375px) | The footer, including `stamp: ok`, remains visible, readable and not cut off | [ ] Pass [ ] Fail |

### Criterion 3: backend and frontend unit tests cover both

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_stamp_service_unit.py tests/unit/test_main_unit.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 11 | Run `npm --prefix frontend test -- src/api/stamp.test.ts src/components/AppFooter.test.tsx` | The run ends with `0 failed` | [ ] Pass [ ] Fail |

### Criterion 4: one Playwright E2E test checks the footer against the running stack

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | From the repository root, run `npx playwright test e2e/tests/FEAT-6_stamp_endpoint_and_footer.spec.ts` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 13 | Open `e2e/tests/FEAT-6_stamp_endpoint_and_footer.spec.ts` | It navigates to `/` and asserts the `app-footer-stamp` element reads `stamp: ok`, with no mocked network route | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
