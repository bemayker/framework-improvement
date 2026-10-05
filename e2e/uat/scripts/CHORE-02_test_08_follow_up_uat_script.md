# UAT Script: CHORE-02 TEST-08 follow-up: known-improvements

## Prerequisites

- From the repository root, `docker compose up --build` is running and the `db`, `backend` and `frontend` services are started.
- Nothing else is bound to host ports `5183`, `8010` or `5442`.
- A browser with dev tools (Network tab) and a checkout of the branch.

## Criterion 1: a hung `/api/version` request resolves the footer to "version unavailable"

| # | Step | Expected result | Result |
|---|------|-----------------|--------|
| 1 | Open `http://localhost:5183` in a browser | The footer at the bottom of the landing page reads `Task Notes v0.1.0` (or whatever `curl -s http://localhost:8010/api/version` reports as `version`) | [ ] Pass [ ] Fail |
| 2 | In a terminal at the repository root, run `docker compose pause backend` | The command prints that `backend` is paused; the port stays published, so connections are accepted but never answered | [ ] Pass [ ] Fail |
| 3 | Open the browser dev tools Network tab, then reload `http://localhost:5183` and watch the footer | For the first moments the footer reads only `Task Notes`, and a `GET /api/version` request is shown as pending | [ ] Pass [ ] Fail |
| 4 | Wait about 5 seconds without touching the page | The footer changes to `Task Notes · version unavailable`, and the `/api/version` request in the Network tab ends as cancelled / failed instead of staying pending | [ ] Pass [ ] Fail |
| 5 | Run `docker compose unpause backend`, then reload `http://localhost:5183` | The footer reads `Task Notes v0.1.0` again within a second (recovery edge case) | [ ] Pass [ ] Fail |
| 6 | Open `frontend/src/api/version.ts` | `VERSION_REQUEST_TIMEOUT_MS` is declared exactly once, with value `5_000`, and is the value passed to `AbortSignal.timeout` in the fetch | [ ] Pass [ ] Fail |

## Criterion 2: TEST-01 and TEST-03 UAT files name the compose ports

| # | Step | Expected result | Result |
|---|------|-----------------|--------|
| 7 | From the repository root, run `git grep -n -e 5173 -e 8000 -e localhost:5432 e2e/uat/scenarios/TEST-01_static_landing_page.feature e2e/uat/scenarios/TEST-03_simple_note_form.feature e2e/uat/scripts/TEST-01_static_landing_page_uat_script.md e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md` | No output | [ ] Pass [ ] Fail |
| 8 | Run `git grep -n -e 5183 -e 8010 -e 5442 e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md` | Matches on the prerequisites line (all three ports), setup step 2 (`5183`), steps 1 and 10 (`http://localhost:5183`) and step 13 (`localhost:5442` in `DATABASE_URL`) | [ ] Pass [ ] Fail |
| 9 | Run `git diff origin/main -- e2e/uat/scenarios/TEST-01_static_landing_page.feature e2e/uat/scenarios/TEST-03_simple_note_form.feature e2e/uat/scripts/TEST-01_static_landing_page_uat_script.md e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md` | Every changed line differs from its original only in a port number | [ ] Pass [ ] Fail |
| 10 | Follow TEST-01 script step 1 as now written: open `http://localhost:5183` | The "Task Notes" landing page loads without errors | [ ] Pass [ ] Fail |
| 11 | Follow TEST-03 script step 13 as now written (with `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`) | The backend pytest suite connects to the compose database and passes | [ ] Pass [ ] Fail |

## Summary

| Criterion | Steps | Pass | Fail |
|-----------|-------|------|------|
| 1. Hung version request resolves to "version unavailable" | 1-6 | | |
| 2. TEST-01 / TEST-03 UAT files name the compose ports | 7-11 | | |

Tester: ______________  Date: ______________  Overall: [ ] Pass [ ] Fail
