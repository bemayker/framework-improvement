# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/BUG-04-double-submit-note` (or `main` once merged).
- Copy `.env.example` to `.env` in the repository root if you have not already (defaults are usable as-is).
- Chrome with DevTools available. The **Network** tab is needed to count requests, and its throttling dropdown set to **Slow 3G** makes the save slow enough to click twice (criterion 1).
- No other process bound to the frontend (`5183`), backend (`8000`) or PostgreSQL (`5432`) ports.

## Test Environment Setup

1. From the repository root run `docker compose up --build`.
2. Wait until `db`, `backend` and `frontend` are started, then open `http://localhost:5183` in Chrome with DevTools on the **Network** tab.
3. Earlier notes may already be in the list; every step below concerns only the note you add.

## Criterion 1: Double activation of "Save note" while in flight stores the note once

Set Network throttling to **Slow 3G** first.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Navigate to `http://localhost:5183` | The "Task Notes" page shows the "New note" field, the "Save note" button and the saved-notes list | [ ] Pass [ ] Fail |
| 1.2 | Type `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 1.3 | Double-click "Save note" quickly | The button greys out (disabled) while the save is pending; the Network tab shows exactly one `POST notes` request | [ ] Pass [ ] Fail |
| 1.4 | Wait for the request to finish | `Double click check 1` appears exactly once in the list, the field is empty, and the button is enabled again | [ ] Pass [ ] Fail |
| 1.5 | Reload the page (Cmd+R / F5) | `Double click check 1` is still listed exactly once | [ ] Pass [ ] Fail |
| 1.6 | Type `Enter key check 1`, then press Enter twice quickly | Exactly one `POST notes` request appears in the Network tab, and `Enter key check 1` appears exactly once in the list | [ ] Pass [ ] Fail |

## Criterion 2: After the in-flight save settles, the form accepts the next save

Network throttling may be switched back to **No throttling**.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Navigate to `/`, type `First note A`, click "Save note" | `First note A` is listed and the button is enabled | [ ] Pass [ ] Fail |
| 2.2 | Type `Second note B`, click "Save note" | `Second note B` is listed below `First note A`; each appears once | [ ] Pass [ ] Fail |
| 2.3 | In a terminal run `docker compose stop backend`, then type `Retry note C` and click "Save note" | The red message "The note could not be saved. Please try again." appears, `Retry note C` stays in the field, and the button is enabled (not stuck greyed out) | [ ] Pass [ ] Fail |
| 2.4 | Run `docker compose start backend`, wait until it answers, then click "Save note" | `Retry note C` is listed exactly once and the error message disappears | [ ] Pass [ ] Fail |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. Double activation stores the note once | 1.1 to 1.6 | [ ] Pass [ ] Fail |
| 2. Form accepts the next save after the save settles | 2.1 to 2.4 | [ ] Pass [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass [ ] Fail

Notes: steps are carried over unchanged from the plan's Manual verification plan; the only additions are prerequisites, checkboxes and this summary. Automated coverage: `e2e/tests/BUG-04_double_submit_note.spec.ts` (criterion 1) and `frontend/src/components/NoteForm.test.tsx` (criteria 1 and 2).
