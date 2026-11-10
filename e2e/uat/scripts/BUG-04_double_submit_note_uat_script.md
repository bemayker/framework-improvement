# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose, the repository checked out locally, Chrome, and nothing else bound to host ports `5183` and `8010`.
- `npm` with the frontend dependencies installed (`npm --prefix frontend install`) for the component test step.
- A local save answers in milliseconds, so this script slows the network down instead of racing it.

## Test Environment Setup

1. From the repository root run `docker compose up -d --build`.
2. Run `docker compose ps` until the `frontend` and `backend` services report running.

## Steps

### Criterion 1: A rapid double submit stores the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in Chrome | The "Task Notes" heading, the "New note" field, the "Save note" button and the note list are visible | [ ] Pass [ ] Fail |
| 2 | Open DevTools, Network tab, and set throttling to `Slow 3G` | The throttling menu reads Slow 3G | [ ] Pass [ ] Fail |
| 3 | Type `Double click check 1` in the "New note" field and double-click "Save note" quickly | The button greys out (disabled) right after the first click and stays so while the request is pending | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | The Network list shows exactly one `POST` to `http://localhost:8010/api/notes` (status 201), the field is empty, the button is enabled again, and the list shows `Double click check 1` once | [ ] Pass [ ] Fail |
| 5 | Edge case: type `Double click check 2`, click "Save note" and immediately press Enter in the field | After the request finishes, one more `POST` (two in total for this walkthrough) and `Double click check 2` appears once | [ ] Pass [ ] Fail |
| 6 | Set throttling back to `No throttling` and reload the page | `Double click check 1` and `Double click check 2` each appear exactly once in the list | [ ] Pass [ ] Fail |

### Criterion 2: After a save finishes, the next submit is accepted

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | With throttling off, type `Buy milk` and click "Save note" | `Buy milk` appears in the list and the field clears | [ ] Pass [ ] Fail |
| 8 | Type `Buy milk` again and click "Save note" | A second `Buy milk` entry appears; the list shows it twice (identical texts are not merged) | [ ] Pass [ ] Fail |
| 9 | In a terminal at the repository root run `docker compose stop backend`, then type `Retry me` and click "Save note" | The message "The note could not be saved. Please try again." appears, the field still reads `Retry me`, and the "Save note" button is enabled | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/notes` answers, then click "Save note" | The error message disappears and `Retry me` appears once in the list | [ ] Pass [ ] Fail |
| 11 | From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/NoteForm.test.tsx` | The run reports `0 failed` (double click, disabled while saving, retry after failure, deliberate second save) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
